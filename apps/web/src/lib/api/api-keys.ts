import crypto from "crypto";
import { db } from "@saas/db";
import { apiKeys } from "@saas/db/schema";
import { eq, and } from "drizzle-orm";

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

function generateApiKey(): string {
  const prefix = "sk_live_";
  const random = crypto.randomBytes(32).toString("base64url");
  return `${prefix}${random}`;
}

export async function createApiKey(params: {
  teamId: string;
  name: string;
  scopes: string[];
  createdBy: string;
  expiresAt?: Date;
}) {
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

  // Return the plain key only once
  return {
    ...apiKey,
    key: plainKey,
  };
}

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

  // Update last used timestamp
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id));

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
