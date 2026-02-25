import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockConstructEvent = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();

function chainable(resolvedValue: unknown = []) {
  const chain: Record<string, unknown> = {};
  const proxy = new Proxy(chain, {
    get(_t, prop: string) {
      if (prop === "then") return (r: (v: unknown) => void) => r(resolvedValue);
      if (!chain[prop]) chain[prop] = vi.fn().mockReturnValue(proxy);
      return chain[prop];
    },
  });
  return proxy;
}

vi.mock("@saas/billing", () => ({
  stripe: {
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
  },
}));
vi.mock("@saas/db", () => ({
  db: {
    get select() { return mockSelect; },
    get insert() { return mockInsert; },
    get update() { return mockUpdate; },
  },
}));
vi.mock("@saas/db/schema", () => ({
  processedWebhooks: { eventId: "processedWebhooks.eventId" },
  teams: {
    id: "teams.id",
    stripeCustomerId: "teams.stripeCustomerId",
  },
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ type: "eq", a, b })),
}));
vi.mock("@saas/logger", () => ({
  createChildLogger: vi.fn(() => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  })),
}));

// The route captures process.env.STRIPE_WEBHOOK_SECRET at module scope.
// vi.hoisted runs before imports, so we set it here.
vi.hoisted(() => {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
});

import { POST } from "../../app/api/webhooks/stripe/route";

describe("Stripe Webhook Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue(chainable([]));
    mockInsert.mockReturnValue(chainable());
    mockUpdate.mockReturnValue(chainable());
  });

  function createWebhookRequest(body = "{}") {
    return new NextRequest("http://localhost:3000/api/webhooks/stripe", {
      method: "POST",
      body,
      headers: { "stripe-signature": "sig_test" },
    });
  }

  it("should return 400 when signature is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/webhooks/stripe", {
      method: "POST",
      body: "{}",
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid signature", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const response = await POST(createWebhookRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid signature");
  });

  it("should return duplicate for already processed events", async () => {
    mockConstructEvent.mockReturnValue({ id: "evt_1", type: "test" });
    mockSelect.mockReturnValue(chainable([{ eventId: "evt_1" }]));

    const response = await POST(createWebhookRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.duplicate).toBe(true);
  });

  it("should process checkout.session.completed", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_checkout",
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { teamId: "team1", plan: "pro" },
          customer: "cus_123",
          subscription: "sub_123",
        },
      },
    });

    const response = await POST(createWebhookRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalled();
  });

  it("should process customer.subscription.deleted", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_deleted",
      type: "customer.subscription.deleted",
      data: {
        object: { metadata: { teamId: "team1" } },
      },
    });

    const response = await POST(createWebhookRequest());
    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("should handle handler errors gracefully", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_error",
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { teamId: "team1", plan: "pro" },
          customer: "cus_123",
          subscription: "sub_123",
        },
      },
    });
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockRejectedValue(new Error("DB error")),
      }),
    });

    const response = await POST(createWebhookRequest());
    expect(response.status).toBe(500);
  });
});
