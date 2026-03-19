import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/billing/stripe";

// Idempotency: track processed event IDs (use Redis/DB in production)
const processedEvents = new Set<string>();

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
): Promise<void> {
  const { tenantId } = subscription.metadata;
  const plan = (subscription.metadata.plan ?? "free") as "free" | "pro" | "enterprise";
  const status = subscription.status;

  console.log(`Subscription updated: tenant=${tenantId} plan=${plan} status=${status}`);
  // In production: update tenant plan in DB
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const { tenantId, userId } = session.metadata ?? {};
  if (!tenantId || !userId) return;

  const customerId = session.customer as string;
  console.log(`Checkout completed: tenant=${tenantId} customer=${customerId}`);
  // In production: store stripeCustomerId on tenant record
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
): Promise<void> {
  const subscription = invoice.subscription as string;
  console.log(`Payment failed for subscription: ${subscription}`);
  // In production: trigger dunning flow
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency check
  if (processedEvents.has(event.id)) {
    return NextResponse.json({ received: true, duplicate: true });
  }
  processedEvents.add(event.id);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error processing event ${event.id}:`, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
