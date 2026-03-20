import { z } from "zod";
import crypto from "crypto";

// TOTP implementation following RFC 6238
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Buffer): string {
  let result = "";
  let bits = 0;
  let value = 0;
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) result += BASE32_CHARS[(value << (5 - bits)) & 31];
  return result;
}

function base32Decode(input: string): Buffer {
  const normalized = input.toUpperCase().replace(/=+$/, "");
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of normalized) {
    const idx = BASE32_CHARS.indexOf(char);
    if (idx === -1) throw new Error(`Invalid base32 character: ${char}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function hotp(secret: Buffer, counter: bigint): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(counter);
  const hmac = crypto.createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[19]! & 0xf;
  const code =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);
  return String(code % 1_000_000).padStart(6, "0");
}

export function generateSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

export function generateTotpCode(secret: string, timestepSeconds = 30): string {
  const counter = BigInt(Math.floor(Date.now() / 1000 / timestepSeconds));
  return hotp(base32Decode(secret), counter);
}

export function verifyTotpCode(
  secret: string,
  code: string,
  windowSteps = 1,
  timestepSeconds = 30
): boolean {
  const normalized = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;
  const counter = BigInt(Math.floor(Date.now() / 1000 / timestepSeconds));
  for (let delta = -windowSteps; delta <= windowSteps; delta++) {
    if (hotp(base32Decode(secret), counter + BigInt(delta)) === normalized) {
      return true;
    }
  }
  return false;
}

export interface TotpSetupResult {
  secret: string;
  otpauthUrl: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export function setupTotp(accountName: string, issuer: string): TotpSetupResult {
  const secret = generateSecret();
  const encoded = encodeURIComponent;
  const otpauthUrl = `otpauth://totp/${encoded(issuer)}:${encoded(accountName)}?secret=${secret}&issuer=${encoded(issuer)}&algorithm=SHA1&digits=6&period=30`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(otpauthUrl)}&size=200x200`;

  const backupCodes = Array.from({ length: 10 }, () =>
    crypto.randomBytes(5).toString("hex").toUpperCase()
  );

  return { secret, otpauthUrl, qrCodeUrl, backupCodes };
}

export const totpVerifySchema = z.object({
  userId: z.string().cuid(),
  code: z.string().length(6).regex(/^\d{6}$/),
});

export type TotpVerifyInput = z.infer<typeof totpVerifySchema>;
