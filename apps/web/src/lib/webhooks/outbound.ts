import { z } from "zod";
import crypto from "crypto";

export const webhookEndpointSchema = z.object({
  id: z.string().cuid(),
  tenantId: z.string().cuid(),
  url: z.string().url(),
  secret: z.string().min(16),
  events: z.array(z.string()),
  enabled: z.boolean().default(true),
  createdAt: z.date(),
});

export type WebhookEndpoint = z.infer<typeof webhookEndpointSchema>;

export interface WebhookPayload {
  id: string;
  event: string;
  tenantId: string;
  createdAt: string;
  data: unknown;
}

export interface DeliveryResult {
  success: boolean;
  statusCode?: number;
  error?: string;
  durationMs: number;
  attempt: number;
}

const RETRY_DELAYS_MS = [0, 5_000, 30_000, 300_000, 1_800_000]; // 0s, 5s, 30s, 5m, 30m

function signPayload(secret: string, body: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("hex");
}

export async function deliverWebhook(
  endpoint: WebhookEndpoint,
  payload: WebhookPayload,
  maxAttempts = 5
): Promise<DeliveryResult[]> {
  if (!endpoint.enabled) return [];
  if (!endpoint.events.includes(payload.event) && !endpoint.events.includes("*")) return [];

  const body = JSON.stringify(payload);
  const signature = signPayload(endpoint.secret, body);
  const results: DeliveryResult[] = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const delayMs = RETRY_DELAYS_MS[attempt - 1] ?? 1_800_000;

    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }

    const startedAt = Date.now();
    try {
      const res = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": `sha256=${signature}`,
          "X-Webhook-Event": payload.event,
          "X-Webhook-Delivery": payload.id,
          "User-Agent": "SaaS-Platform-Webhooks/1.0",
        },
        body,
        signal: AbortSignal.timeout(30_000),
      });

      const result: DeliveryResult = {
        success: res.ok,
        statusCode: res.status,
        durationMs: Date.now() - startedAt,
        attempt,
      };
      results.push(result);

      if (res.ok) break;

      const isRetryable = res.status >= 500 || res.status === 429;
      if (!isRetryable) break;
    } catch (err) {
      results.push({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        durationMs: Date.now() - startedAt,
        attempt,
      });
    }
  }

  return results;
}

export function verifyWebhookSignature(secret: string, body: string, signature: string): boolean {
  const expected = `sha256=${signPayload(secret, body)}`;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function buildWebhookPayload(
  event: string,
  tenantId: string,
  data: unknown
): WebhookPayload {
  return {
    id: crypto.randomUUID(),
    event,
    tenantId,
    createdAt: new Date().toISOString(),
    data,
  };
}
