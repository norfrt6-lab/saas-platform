// IPv4 + CIDR matching (RFC 4632) — zero-dependency
// Supports single IPs (e.g. 203.0.113.42) and CIDR ranges (e.g. 203.0.113.0/24)

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;

  let result = 0;
  for (const part of parts) {
    const n = parseInt(part, 10);
    if (isNaN(n) || n < 0 || n > 255) return null;
    result = (result << 8) | n;
  }
  return result >>> 0; // force unsigned
}

export function isIpInRange(ip: string, rangeOrIp: string): boolean {
  const targetInt = ipv4ToInt(ip);
  if (targetInt === null) return false;

  // CIDR range
  if (rangeOrIp.includes("/")) {
    const [network, maskStr] = rangeOrIp.split("/");
    const mask = parseInt(maskStr, 10);
    if (isNaN(mask) || mask < 0 || mask > 32) return false;

    const networkInt = ipv4ToInt(network);
    if (networkInt === null) return false;

    if (mask === 0) return true;
    const shift = 32 - mask;
    return (targetInt >>> shift) === (networkInt >>> shift);
  }

  // Exact match
  return targetInt === ipv4ToInt(rangeOrIp);
}

export function isIpAllowed(ip: string, allowlist: string[]): boolean {
  if (allowlist.length === 0) return true; // empty = no restriction
  return allowlist.some((entry) => isIpInRange(ip, entry.trim()));
}

export function validateCidr(entry: string): boolean {
  const clean = entry.trim();
  if (!clean) return false;

  if (clean.includes("/")) {
    const [network, maskStr] = clean.split("/");
    const mask = parseInt(maskStr, 10);
    return ipv4ToInt(network) !== null && !isNaN(mask) && mask >= 0 && mask <= 32;
  }
  return ipv4ToInt(clean) !== null;
}
