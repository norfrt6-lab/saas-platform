import { createHash, randomBytes } from "crypto";
import { getTenantContext } from "@/lib/tenant/context";

export type ApiKeyScope =
  | "projects:read"
  | "projects:write"
  | "teams:read"
  | "teams:write"
  | "billing:read"
  | "audit:read";

export interface ApiKey {
  id: string;
  tenantId: string;
  name: string;
  prefix: string;
  hashedKey: string;
  scopes: ApiKeyScope[];
  createdBy: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface CreateApiKeyResult {
  apiKey: ApiKey;
  plaintext: string; // Only returned once at creation
}

const apiKeyStore = new Map<string, ApiKey>();

const KEY_PREFIX = "sk_live_";
const KEY_BYTES = 32;

function generateApiKey(): { plaintext: string; prefix: string; hashed: string } {
  const raw = randomBytes(KEY_BYTES).toString("hex");
  const plaintext = `${KEY_PREFIX}${raw}`;
  const prefix = plaintext.slice(0, KEY_PREFIX.length + 8);
  const hashed = createHash("sha256").update(plaintext).digest("hex");
  return { plaintext, prefix, hashed };
}

export async function createApiKey(
  name: string,
  scopes: ApiKeyScope[],
  expiresInDays?: number,
): Promise<CreateApiKeyResult> {
  const { tenantId, userId } = getTenantContext();
  const { plaintext, prefix, hashed } = generateApiKey();

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86400000)
    : null;

  const apiKey: ApiKey = {
    id: crypto.randomUUID(),
    tenantId,
    name,
    prefix,
    hashedKey: hashed,
    scopes,
    createdBy: userId,
    lastUsedAt: null,
    expiresAt,
    revokedAt: null,
    createdAt: new Date(),
  };

  apiKeyStore.set(apiKey.id, apiKey);
  return { apiKey, plaintext };
}

export async function verifyApiKey(
  plaintext: string,
): Promise<ApiKey | null> {
  const hashed = createHash("sha256").update(plaintext).digest("hex");
  const key = Array.from(apiKeyStore.values()).find((k) => k.hashedKey === hashed);
  if (!key || key.revokedAt) return null;
  if (key.expiresAt && key.expiresAt < new Date()) return null;

  apiKeyStore.set(key.id, { ...key, lastUsedAt: new Date() });
  return key;
}

export async function revokeApiKey(keyId: string): Promise<void> {
  const { tenantId } = getTenantContext();
  const key = apiKeyStore.get(keyId);
  if (!key || key.tenantId !== tenantId) throw new Error("API key not found");
  apiKeyStore.set(keyId, { ...key, revokedAt: new Date() });
}

export async function listApiKeys(): Promise<ApiKey[]> {
  const { tenantId } = getTenantContext();
  return Array.from(apiKeyStore.values()).filter(
    (k) => k.tenantId === tenantId && !k.revokedAt,
  );
}
