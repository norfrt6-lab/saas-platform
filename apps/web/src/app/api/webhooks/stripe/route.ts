import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import Stripe from "stripe";
import { stripe } from "@saas/billing";
import { db } from "@saas/db";
import { teams, processedWebhooks } from "@saas/db/schema";
import { eq } from "drizzle-orm";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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

  await db
    .update(teams)
    .set({
      plan: plan as "free" | "pro" | "enterprise",
      billingStatus: "active",
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamId));
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const teamId = subscription.metadata?.teamId;
  if (!teamId) return;

  const status = subscription.cancel_at_period_end ? "canceling" : "active";

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
  const customerId = invoice.customer as string;

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

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
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
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
