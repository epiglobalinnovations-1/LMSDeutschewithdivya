import { describe, expect, it } from "vitest";
import { registerSchema, safeNext } from "./auth";
import { profileSchema } from "./profile";

describe("registerSchema", () => {
  const valid = {
    fullName: "Priya Sharma",
    email: "Priya@Example.com ",
    password: "Deutsch2026",
    confirmPassword: "Deutsch2026",
    acceptTerms: "on",
  };

  it("accepts a valid registration and normalises the email", () => {
    const r = registerSchema.safeParse(valid);
    expect(r.success).toBe(true);
    expect(r.data?.email).toBe("priya@example.com");
  });

  it("rejects weak passwords and mismatches", () => {
    expect(registerSchema.safeParse({ ...valid, password: "short", confirmPassword: "short" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: "onlyletters", confirmPassword: "onlyletters" }).success).toBe(false);
    const mismatch = registerSchema.safeParse({ ...valid, confirmPassword: "Deutsch2027" });
    expect(mismatch.error?.issues[0].path).toEqual(["confirmPassword"]);
  });

  it("requires accepting the terms", () => {
    expect(registerSchema.safeParse({ ...valid, acceptTerms: undefined }).success).toBe(false);
  });
});

describe("safeNext", () => {
  it("allows same-site paths only", () => {
    expect(safeNext("/app/settings")).toBe("/app/settings");
    expect(safeNext("https://evil.example")).toBe("/app");
    expect(safeNext("//evil.example")).toBe("/app");
    expect(safeNext("/\\evil.example")).toBe("/app");
    expect(safeNext(null)).toBe("/app");
  });
});

describe("profileSchema", () => {
  it("only accepts the allowed daily targets", () => {
    const base = { fullName: "Priya Sharma", currentLevel: "A1", studyDirection: "de_en" };
    expect(profileSchema.safeParse({ ...base, dailyNewWords: "15" }).success).toBe(true);
    expect(profileSchema.safeParse({ ...base, dailyNewWords: "12" }).success).toBe(false);
  });
});
