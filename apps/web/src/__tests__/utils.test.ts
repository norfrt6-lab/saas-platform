import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatRelativeTime,
  formatCurrency,
  slugify,
  absoluteUrl,
  truncate,
  capitalize,
} from "../lib/utils";

describe("utils", () => {
  describe("formatDate", () => {
    it("should format a date string", () => {
      const result = formatDate("2024-01-15");
      expect(result).toContain("Jan");
      expect(result).toContain("15");
      expect(result).toContain("2024");
    });

    it("should format a Date object", () => {
      const result = formatDate(new Date(2024, 5, 20));
      expect(result).toContain("Jun");
      expect(result).toContain("20");
    });

    it("should accept custom options", () => {
      const result = formatDate("2024-01-15", { month: "long" });
      expect(result).toContain("January");
    });
  });

  describe("formatCurrency", () => {
    it("should format USD by default", () => {
      const result = formatCurrency(29.99);
      expect(result).toBe("$29.99");
    });

    it("should format whole numbers without decimals", () => {
      const result = formatCurrency(100);
      expect(result).toBe("$100");
    });

    it("should support other currencies", () => {
      const result = formatCurrency(100, "EUR");
      expect(result).toContain("€");
    });
  });

  describe("slugify", () => {
    it("should convert text to a URL-friendly slug", () => {
      expect(slugify("Hello World")).toBe("hello-world");
    });

    it("should remove special characters", () => {
      expect(slugify("Hello, World! @2024")).toBe("hello-world-2024");
    });

    it("should handle multiple spaces", () => {
      expect(slugify("hello   world")).toBe("hello-world");
    });

    it("should trim hyphens", () => {
      expect(slugify("  hello world  ")).toBe("hello-world");
    });

    it("should handle underscores", () => {
      expect(slugify("hello_world")).toBe("hello-world");
    });
  });

  describe("absoluteUrl", () => {
    it("should prepend the base URL", () => {
      const url = absoluteUrl("/dashboard");
      expect(url).toMatch(/https?:\/\/.+\/dashboard/);
    });

    it("should handle paths without leading slash", () => {
      const url = absoluteUrl("dashboard");
      expect(url).toMatch(/https?:\/\/.+\/dashboard/);
    });
  });

  describe("truncate", () => {
    it("should not truncate short strings", () => {
      expect(truncate("hello", 10)).toBe("hello");
    });

    it("should truncate long strings with ellipsis", () => {
      expect(truncate("hello world", 8)).toBe("hello...");
    });

    it("should handle exact length", () => {
      expect(truncate("hello", 5)).toBe("hello");
    });
  });

  describe("capitalize", () => {
    it("should capitalize the first letter", () => {
      expect(capitalize("hello")).toBe("Hello");
    });

    it("should handle empty string", () => {
      expect(capitalize("")).toBe("");
    });

    it("should not change already capitalized", () => {
      expect(capitalize("Hello")).toBe("Hello");
    });
  });
});
