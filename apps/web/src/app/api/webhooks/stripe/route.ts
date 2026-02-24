import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import Stripe from "stripe";
import { stripe } from "@saas/billing";
import { db } from "@saas/db";
import { teams, processedWebhooks } from "@saas/db/schema";
import { eq } from "drizzle-orm";
import { createChildLogger } from "@saas/logger";

const log = createChildLogger({ module: "stripe-webhook" });

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const VALID_PLANS = new Set(["free", "pro", "enterprise"] as const);

function isValidPlan(plan: string): plan is "free" | "pro" | "enterprise" {
  return VALID_PLANS.has(plan as "free" | "pro" | "enterprise");
}

async function isProcessed(eventId: string): Promise<boolean> {
  const [existing] = await db
    .select()
    .from(processedWebhooks)
    .where(eq(processedWebhooks.stripeEventId, eventId))
    .limit(1);

  return !!existing;
}

async function markProcessed(eventId: string, eventType: string) {
  await db.insert(processedWebhooks).values({
    stripeEventId: eventId,
    eventType,
  });
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const teamId = session.metadata?.teamId;
  const plan = session.metadata?.plan;

  if (!teamId || !plan) return;

  if (!isValidPlan(plan)) {
    log.error({ plan, teamId }, "Invalid plan in Stripe metadata");
    return;
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  await db
    .update(teams)
    .set({
      plan,
      billingStatus: "active",
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamId));
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const teamId = subscription.metadata?.teamId;
  if (!teamId) return;

  const status = subscription.cancel_at_period_end ? "canceled" : "active";

  await db
    .update(teams)
    .set({
      billingStatus: status,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamId));
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const teamId = subscription.metadata?.teamId;
  if (!teamId) return;

  await db
    .update(teams)
    .set({
      plan: "free",
      billingStatus: "canceled",
      stripeSubscriptionId: null,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamId));
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) return;

  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  if (!team) return;

  await db
    .update(teams)
    .set({
      billingStatus: "past_due",
      updatedAt: new Date(),
    })
    .where(eq(teams.id, team.id));
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: !webhookSecret ? "Webhook secret not configured" : "Missing signature" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 },
    );
  }

  // Idempotency check
  if (await isProcessed(event.id)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutComplete(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
        );
        break;
    }

    await markProcessed(event.id, event.type);
  } catch (error) {
    log.error({ err: error, eventId: event.id, eventType: event.type }, "Webhook handler error");
    return NextResponse.json(
      { error: "Handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
