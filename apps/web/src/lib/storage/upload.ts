import { z } from "zod";

export const uploadConfigSchema = z.object({
  bucket: z.string(),
  region: z.string().default("us-east-1"),
  endpoint: z.string().url().optional(),
  accessKeyId: z.string(),
  secretAccessKey: z.string(),
  maxFileSizeBytes: z.number().default(10 * 1024 * 1024), // 10 MB
  allowedMimeTypes: z.array(z.string()).default(["image/*", "application/pdf"]),
});

export type UploadConfig = z.infer<typeof uploadConfigSchema>;

export interface PresignedUploadUrl {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresAt: Date;
  fields: Record<string, string>;
}

export interface UploadedFile {
  key: string;
  bucket: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  tenantId: string;
  userId: string;
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 200);
}

function buildObjectKey(tenantId: string, userId: string, filename: string): string {
  const date = new Date().toISOString().split("T")[0];
  const rand = Math.random().toString(36).slice(2, 8);
  return `tenants/${tenantId}/users/${userId}/${date}/${rand}-${sanitizeFilename(filename)}`;
}

export async function generatePresignedUploadUrl(
  config: UploadConfig,
  opts: {
    tenantId: string;
    userId: string;
    filename: string;
    mimeType: string;
    fileSize: number;
  }
): Promise<PresignedUploadUrl> {
  const { tenantId, userId, filename, mimeType, fileSize } = opts;

  if (fileSize > config.maxFileSizeBytes) {
    throw new Error(`File size ${fileSize} exceeds maximum allowed ${config.maxFileSizeBytes}`);
  }

  const mimeAllowed = config.allowedMimeTypes.some((pattern) => {
    if (pattern.endsWith("/*")) {
      return mimeType.startsWith(pattern.slice(0, -2));
    }
    return pattern === mimeType;
  });

  if (!mimeAllowed) {
    throw new Error(`MIME type ${mimeType} is not allowed`);
  }

  const key = buildObjectKey(tenantId, userId, filename);
  const baseUrl = config.endpoint ?? `https://${config.bucket}.s3.${config.region}.amazonaws.com`;
  const expiresAt = new Date(Date.now() + 15 * 60_000); // 15 minutes

  // In a real implementation, sign the URL using AWS SDK v3:
  // const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  // const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  const uploadUrl = `${baseUrl}/${key}?X-Amz-Expires=900`;
  const publicUrl = `${baseUrl}/${key}`;

  return {
    uploadUrl,
    publicUrl,
    key,
    expiresAt,
    fields: {
      "Content-Type": mimeType,
      "x-amz-meta-tenant-id": tenantId,
      "x-amz-meta-user-id": userId,
    },
  };
}

export async function deleteUploadedFile(
  config: UploadConfig,
  key: string
): Promise<void> {
  const baseUrl = config.endpoint ?? `https://${config.bucket}.s3.${config.region}.amazonaws.com`;
  // In production: use AWS SDK DeleteObjectCommand
  console.info(`[s3] Deleting ${baseUrl}/${key}`);
}

export function getPublicUrl(config: UploadConfig, key: string): string {
  const baseUrl = config.endpoint ?? `https://${config.bucket}.s3.${config.region}.amazonaws.com`;
  return `${baseUrl}/${key}`;
}
