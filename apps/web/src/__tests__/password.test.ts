import {
  checkPasswordStrength,
  isPasswordStrong,
} from "@saas/auth/password";
import { describe, it, expect } from "vitest";

describe("checkPasswordStrength", () => {
  describe("score calculation", () => {
    it("should return score 0 for very short passwords", () => {
      const result = checkPasswordStrength("abc");
      expect(result.score).toBe(0);
    });

    it("should award a point for 8+ characters", () => {
      const result = checkPasswordStrength("abcdefgh");
      expect(result.score).toBeGreaterThanOrEqual(1);
    });

    it("should award a point for 12+ characters", () => {
      const result = checkPasswordStrength("abcdefghijkl");
      expect(result.score).toBeGreaterThanOrEqual(2);
    });

    it("should award a point for mixed case", () => {
      const result = checkPasswordStrength("Abcdefgh");
      expect(result.score).toBeGreaterThanOrEqual(2);
    });

    it("should award a point for digits", () => {
      const result = checkPasswordStrength("Abcdefg1");
      expect(result.score).toBeGreaterThanOrEqual(3);
    });

    it("should award a point for special characters", () => {
      const result = checkPasswordStrength("Abcdefg1!");
      expect(result.score).toBeGreaterThanOrEqual(4);
    });

    it("should reach maximum score 5 for a strong 12+ char password", () => {
      const result = checkPasswordStrength("MyP@ssw0rd123");
      expect(result.score).toBe(5);
    });

    it("should not exceed score 5", () => {
      const result = checkPasswordStrength("VeryLongP@ssw0rd!123");
      expect(result.score).toBeLessThanOrEqual(5);
    });
  });

  describe("common password detection", () => {
    it("should set score to 0 for common passwords", () => {
      const result = checkPasswordStrength("password1");
      expect(result.score).toBe(0);
      expect(result.feedback[0]).toBe("This password is too common");
    });

    it("should detect common passwords case-insensitively", () => {
      const result = checkPasswordStrength("PASSWORD1");
      expect(result.score).toBe(0);
    });

    it("should not flag uncommon passwords", () => {
      const result = checkPasswordStrength("xK9#mQ2$vL");
      expect(result.feedback).not.toContain("This password is too common");
    });
  });

  describe("feedback messages", () => {
    it("should suggest length when under 8 chars", () => {
      const result = checkPasswordStrength("short");
      expect(result.feedback).toContain("Use at least 8 characters");
    });

    it("should not suggest length for 8+ char passwords", () => {
      const result = checkPasswordStrength("longpassword");
      expect(result.feedback).not.toContain("Use at least 8 characters");
    });

    it("should suggest uppercase when missing", () => {
      const result = checkPasswordStrength("alllowercase");
      expect(result.feedback).toContain("Add an uppercase letter");
    });

    it("should suggest lowercase when missing", () => {
      const result = checkPasswordStrength("ALLUPPERCASE");
      expect(result.feedback).toContain("Add a lowercase letter");
    });

    it("should suggest numbers when missing", () => {
      const result = checkPasswordStrength("NoNumbers!");
      expect(result.feedback).toContain("Add a number");
    });

    it("should suggest special chars when missing", () => {
      const result = checkPasswordStrength("NoSpecial1");
      expect(result.feedback).toContain("Add a special character");
    });

    it("should return empty feedback for a fully strong password", () => {
      const result = checkPasswordStrength("MyStr0ng!Pass");
      expect(result.feedback).toHaveLength(0);
    });
  });
});

describe("isPasswordStrong", () => {
  it("should return true for score >= 3", () => {
    expect(isPasswordStrong("Abcdefg1")).toBe(true);
  });

  it("should return false for weak passwords", () => {
    expect(isPasswordStrong("weak")).toBe(false);
  });

  it("should return false for common passwords even if they look strong", () => {
    expect(isPasswordStrong("password1")).toBe(false);
  });
});
