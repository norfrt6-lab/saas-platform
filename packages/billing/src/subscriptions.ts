import { stripe } from "./client";
import type { Plan } from "./plans";

const PRICE_IDS: Record<Exclude<Plan, "free">, { monthly: string; yearly: string }> = {
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "price_pro_monthly",
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "price_pro_yearly",
  },
  enterprise: {
    monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID ?? "price_enterprise_monthly",
    yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID ?? "price_enterprise_yearly",
  },
};

export async function createCheckoutSession(params: {
  teamId: string;
  customerId: string;
  plan: Exclude<Plan, "free">;
  interval: "monthly" | "yearly";
  successUrl: string;
  cancelUrl: string;
}) {
  const priceId = PRICE_IDS[params.plan][params.interval];

  const session = await stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      teamId: params.teamId,
      plan: params.plan,
    },
    subscription_data: {
      metadata: {
        teamId: params.teamId,
        plan: params.plan,
      },
    },
    allow_promotion_codes: true,
  });

  return session;
}

export async function createCustomerPortalSession(params: {
  customerId: string;
  returnUrl: string;
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });

  return session;
}

export async function createCustomer(params: {
  email: string;
  name: string;
  teamId: string;
}) {
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      teamId: params.teamId,
    },
  });

  return customer;
}

export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

export async function resumeSubscription(subscriptionId: string) {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

export async function getSubscription(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId);
}

export async function getInvoices(customerId: string, limit = 10) {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  });

  return invoices.data;
}

export async function getUpcomingInvoice(customerId: string) {
  try {
    return await stripe.invoices.retrieveUpcoming({
      customer: customerId,
    });
  } catch {
    return null;
  }
}
