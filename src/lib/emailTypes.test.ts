import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  sanitizeEmail,
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
} from "./emailTypes";

describe("isValidEmail", () => {
  it("accepts a standard email address", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
  });

  it("accepts email with subdomain", () => {
    expect(isValidEmail("user@mail.example.com")).toBe(true);
  });

  it("accepts email with plus tag", () => {
    expect(isValidEmail("user+tag@example.com")).toBe(true);
  });

  it("rejects email without @", () => {
    expect(isValidEmail("userexample.com")).toBe(false);
  });

  it("rejects email without domain", () => {
    expect(isValidEmail("user@")).toBe(false);
  });

  it("rejects email without TLD", () => {
    expect(isValidEmail("user@domain")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidEmail("")).toBe(false);
  });

  it("rejects string with spaces", () => {
    expect(isValidEmail("user @example.com")).toBe(false);
  });

  it("rejects string with multiple @", () => {
    expect(isValidEmail("a@b@c.com")).toBe(false);
  });
});

describe("sanitizeEmail", () => {
  it("lowercases an email address", () => {
    expect(sanitizeEmail("User@Example.COM")).toBe("user@example.com");
  });

  it("trims leading and trailing whitespace", () => {
    expect(sanitizeEmail("  user@example.com  ")).toBe("user@example.com");
  });

  it("lowercases and trims together", () => {
    expect(sanitizeEmail("  HELLO@WORLD.COM  ")).toBe("hello@world.com");
  });

  it("leaves already-clean email unchanged", () => {
    expect(sanitizeEmail("clean@example.com")).toBe("clean@example.com");
  });
});

describe("generateUnsubscribeToken / verifyUnsubscribeToken", () => {
  it("generates a non-empty base64 string", () => {
    const token = generateUnsubscribeToken("sub-1", "user@example.com");
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
    // base64 characters only
    expect(token).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it("verifyUnsubscribeToken returns true for a valid token", () => {
    const id = "sub-abc";
    const email = "test@example.com";
    const token = generateUnsubscribeToken(id, email);
    expect(verifyUnsubscribeToken(token, id, email)).toBe(true);
  });

  it("verifyUnsubscribeToken returns false when subscriber id does not match", () => {
    const token = generateUnsubscribeToken("sub-abc", "test@example.com");
    expect(verifyUnsubscribeToken(token, "sub-xyz", "test@example.com")).toBe(false);
  });

  it("verifyUnsubscribeToken returns false when email does not match", () => {
    const token = generateUnsubscribeToken("sub-abc", "test@example.com");
    expect(verifyUnsubscribeToken(token, "sub-abc", "other@example.com")).toBe(false);
  });

  it("verifyUnsubscribeToken returns false for a garbage token", () => {
    expect(verifyUnsubscribeToken("not-a-valid-token!!!", "sub-abc", "test@example.com")).toBe(false);
  });

  it("generates different tokens for different inputs", () => {
    const t1 = generateUnsubscribeToken("sub-1", "a@b.com");
    const t2 = generateUnsubscribeToken("sub-2", "a@b.com");
    expect(t1).not.toBe(t2);
  });
});
