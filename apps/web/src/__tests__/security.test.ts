import { describe, it, expect } from "vitest";
import {
  generateCsrfToken,
  secureCompare,
  sanitizeHtml,
  getCSP,
  SECURITY_HEADERS,
} from "../lib/security";

describe("security", () => {
  describe("generateCsrfToken", () => {
    it("should generate a hex string", () => {
      const token = generateCsrfToken();
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it("should generate 64-character tokens (32 bytes)", () => {
      const token = generateCsrfToken();
      expect(token).toHaveLength(64);
    });

    it("should generate unique tokens", () => {
      const tokens = new Set(Array.from({ length: 100 }, generateCsrfToken));
      expect(tokens.size).toBe(100);
    });
  });

  describe("secureCompare", () => {
    it("should return true for matching strings", () => {
      expect(secureCompare("hello", "hello")).toBe(true);
    });

    it("should return false for non-matching strings", () => {
      expect(secureCompare("hello", "world")).toBe(false);
    });

    it("should return false for different lengths", () => {
      expect(secureCompare("hello", "hi")).toBe(false);
    });
  });

  describe("sanitizeHtml", () => {
    it("should escape HTML tags", () => {
      expect(sanitizeHtml("<script>alert('xss')</script>")).toBe(
        "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;",
      );
    });

    it("should escape ampersands", () => {
      expect(sanitizeHtml("a & b")).toBe("a &amp; b");
    });

    it("should escape quotes", () => {
      expect(sanitizeHtml('"hello"')).toBe("&quot;hello&quot;");
    });

    it("should not modify safe text", () => {
      expect(sanitizeHtml("Hello World")).toBe("Hello World");
    });
  });

  describe("getCSP", () => {
    it("should include default-src", () => {
      expect(getCSP()).toContain("default-src 'self'");
    });

    it("should allow Stripe connections", () => {
      const csp = getCSP();
      expect(csp).toContain("api.stripe.com");
      expect(csp).toContain("js.stripe.com");
    });

    it("should block object embedding", () => {
      expect(getCSP()).toContain("object-src 'none'");
    });
  });

  describe("SECURITY_HEADERS", () => {
    it("should include X-Frame-Options", () => {
      expect(SECURITY_HEADERS["X-Frame-Options"]).toBe("DENY");
    });

    it("should include HSTS", () => {
      expect(SECURITY_HEADERS["Strict-Transport-Security"]).toContain(
        "max-age=31536000",
      );
    });

    it("should include Permissions-Policy", () => {
      expect(SECURITY_HEADERS["Permissions-Policy"]).toContain("camera=()");
    });
  });
});
