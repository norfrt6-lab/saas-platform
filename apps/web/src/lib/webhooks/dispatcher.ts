import crypto from "crypto";
import { db } from "@saas/db/client";
import { webhookEndpoints, webhookDeliveries } from "@saas/db/schema/webhooks";
import { eq, and } from "drizzle-orm";

export type WebhookEvent =
  | "project.created"
  | "project.updated"
  | "project.deleted"
  | "member.invited"
  | "member.joined"
  | "member.removed"
  | "subscription.created"
  | "subscription.updated"
  | "subscription.canceled";

interface WebhookPayload {
  id: string;
  event: WebhookEvent;
  teamId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

function signPayload(payload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

async function deliverWebhook(
  deliveryId: string,
  url: string,
  secret: string,
  payload: WebhookPayload
): Promise<void> {
  const body = JSON.stringify(payload);
  const signature = signPayload(body, secret);

  let responseStatus: number | null = null;
  let responseBody: string | null = null;
  let success = false;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": `sha256=${signature}`,
        "X-Webhook-Id": payload.id,
        "X-Webhook-Event": payload.event,
        "X-Webhook-Timestamp": payload.timestamp,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    responseStatus = res.status;
    responseBody = await res.text().catch(() => null) ?? "";
    success = res.ok;
  } catch {
    // network error — will retry
  }

  await db
    .update(webhookDeliveries)
    .set({
      status: success ? "success" : "failed",
      responseStatus,
      responseBody,
      attemptCount: db.$count(webhookDeliveries, eq(webhookDeliveries.id, deliveryId)),
      deliveredAt: success ? new Date() : null,
      nextRetryAt: success ? null : new Date(Date.now() + 60_000),
    })
    .where(eq(webhookDeliveries.id, deliveryId));
}

export async function dispatchWebhookEvent(
  teamId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  const endpoints = await db
    .select()
    .from(webhookEndpoints)
    .where(
      and(
        eq(webhookEndpoints.teamId, teamId),
        eq(webhookEndpoints.status, "active")
      )
    );

  const activeEndpoints = endpoints.filter((ep) =>
    ep.events.length === 0 || ep.events.includes(event)
  );

  if (activeEndpoints.length === 0) return;

  const payload: WebhookPayload = {
    id: crypto.randomUUID(),
    event,
    teamId,
    data,
    timestamp: new Date().toISOString(),
  };

  await Promise.allSettled(
    activeEndpoints.map(async (endpoint) => {
      const [delivery] = await db
        .insert(webhookDeliveries)
        .values({
          endpointId: endpoint.id,
          event,
          payload,
          status: "pending",
        })
        .returning();

      await deliverWebhook(delivery.id, endpoint.url, endpoint.secret, payload);
    })
  );
}
