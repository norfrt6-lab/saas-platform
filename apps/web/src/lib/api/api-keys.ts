import crypto from "crypto";

import { PLAN_LIMITS, type Plan } from "@saas/billing/plans";
import { db } from "@saas/db";
import { apiKeys } from "@saas/db/schema";
import { createChildLogger } from "@saas/logger";
import { and, count, eq } from "drizzle-orm";

import { BadRequestError } from "./errors";

const log = createChildLogger({ module: "api-keys" });

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

function generateApiKey(): string {
  const prefix = "sk_live_";
  const random = crypto.randomBytes(32).toString("base64url");
  return `${prefix}${random}`;
}

const MAX_API_KEYS_DEFAULT = 50;

export async function createApiKey(params: {
  teamId: string;
  name: string;
  scopes: string[];
  createdBy: string;
  teamPlan?: Plan;
  expiresAt?: Date;
}) {
  // Rate limit: check how many keys this team already has
  const [keyCount] = await db
    .select({ count: count() })
    .from(apiKeys)
    .where(
      and(eq(apiKeys.teamId, params.teamId), eq(apiKeys.isActive, true)),
    );

  const maxKeys = params.teamPlan
    ? PLAN_LIMITS[params.teamPlan].maxApiKeys
    : MAX_API_KEYS_DEFAULT;

  if ((keyCount?.count ?? 0) >= maxKeys) {
    throw new BadRequestError(
      `API key limit reached (${maxKeys}). Upgrade your plan for more keys.`,
    );
  }

  const plainKey = generateApiKey();
  const hashedKey = hashKey(plainKey);

  const [apiKey] = await db
    .insert(apiKeys)
    .values({
      teamId: params.teamId,
      name: params.name,
      hashedKey,
      prefix: plainKey.slice(0, 12),
      scopes: params.scopes,
      createdBy: params.createdBy,
      expiresAt: params.expiresAt ?? null,
    })
    .returning();

  return {
    ...apiKey,
    key: plainKey,
  };
}

/**
 * Debounce threshold for lastUsedAt updates.
 * Only writes to DB if the last recorded usage is older than this.
 */
const LAST_USED_DEBOUNCE_MS = 5 * 60 * 1000; // 5 minutes

export async function validateApiKey(key: string) {
  const hashed = hashKey(key);

  const [apiKey] = await db
    .select()
    .from(apiKeys)
    .where(
      and(eq(apiKeys.hashedKey, hashed), eq(apiKeys.isActive, true)),
    )
    .limit(1);

  if (!apiKey) return null;

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    await db
      .update(apiKeys)
      .set({ isActive: false })
      .where(eq(apiKeys.id, apiKey.id));
    return null;
  }

  // Debounced lastUsedAt update: skip write if updated recently
  const shouldUpdate =
    !apiKey.lastUsedAt ||
    Date.now() - apiKey.lastUsedAt.getTime() > LAST_USED_DEBOUNCE_MS;

  if (shouldUpdate) {
    // Fire-and-forget: don't block the request on this write
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKey.id))
      .then(() => {})
      .catch((err) => log.warn({ err, keyId: apiKey.id }, "Failed to update lastUsedAt"));
  }

  return apiKey;
}

export async function listApiKeys(teamId: string) {
  return db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      prefix: apiKeys.prefix,
      scopes: apiKeys.scopes,
      isActive: apiKeys.isActive,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.teamId, teamId))
    .orderBy(apiKeys.createdAt);
}

export async function revokeApiKey(keyId: string, teamId: string) {
  const [key] = await db
    .update(apiKeys)
    .set({ isActive: false })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.teamId, teamId)))
    .returning();

  return key;
}

export async function deleteApiKey(keyId: string, teamId: string) {
  await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.teamId, teamId)));
}
