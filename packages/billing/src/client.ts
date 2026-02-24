import Stripe from "stripe";

let _stripe: Stripe | undefined;

function getStripe(): Stripe {
  if (_stripe) return _stripe;

  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const instance = getStripe();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
