import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
  typescript: true,
});

export const PLANS = {
  free: { priceId: null, name: "Free", monthlyLimit: 3 },
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? "price_pro",
    name: "Pro",
    monthlyLimit: 50,
  },
  enterprise: {
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? "price_enterprise",
    name: "Enterprise",
    monthlyLimit: Infinity,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

interface CreateCheckoutSessionParams {
  tenantId: string;
  userId: string;
  userEmail: string;
  plan: Exclude<PlanKey, "free">;
  successUrl: string;
  cancelUrl: string;
  stripeCustomerId?: string;
}

export async function createCheckoutSession({
  tenantId,
  userId,
  userEmail,
  plan,
  successUrl,
  cancelUrl,
  stripeCustomerId,
}: CreateCheckoutSessionParams): Promise<string> {
  const planConfig = PLANS[plan];

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    customer_email: stripeCustomerId ? undefined : userEmail,
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: { tenantId, userId, plan },
    subscription_data: {
      metadata: { tenantId, userId },
    },
    allow_promotion_codes: true,
    billing_address_collection: "auto",
  });

  if (!session.url) throw new Error("Stripe did not return a session URL");
  return session.url;
}

export async function createCustomerPortalSession(
  stripeCustomerId: string,
  returnUrl: string,
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });
  return session.url;
}
