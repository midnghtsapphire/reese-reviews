import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("returns a single class string unchanged", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("merges multiple class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes (truthy)", () => {
    expect(cn("base", true && "active")).toBe("base active");
  });

  it("omits falsy conditional classes", () => {
    expect(cn("base", false && "hidden")).toBe("base");
  });

  it("merges conflicting Tailwind classes — last wins", () => {
    // tailwind-merge resolves padding conflicts
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("merges conflicting text-color classes", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles undefined and null gracefully", () => {
    expect(cn("base", undefined, null as unknown as string)).toBe("base");
  });

  it("handles empty string input", () => {
    expect(cn("")).toBe("");
  });

  it("handles no arguments", () => {
    expect(cn()).toBe("");
  });

  it("combines object syntax with string syntax", () => {
    expect(cn("foo", { bar: true, baz: false })).toBe("foo bar");
  });

  it("handles array input", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });
});
