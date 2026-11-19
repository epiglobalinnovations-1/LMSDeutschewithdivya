import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const { computeStreak } = await import("./student");

describe("computeStreak", () => {
  const today = new Date("2026-11-19T10:00:00Z");

  it("is zero with no activity", () => {
    expect(computeStreak([], today)).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    expect(computeStreak(["2026-11-19", "2026-11-18", "2026-11-17", "2026-11-15"], today)).toBe(3);
  });

  it("keeps yesterday's streak alive until today is over", () => {
    expect(computeStreak(["2026-11-18", "2026-11-17"], today)).toBe(2);
  });

  it("breaks after a missed day", () => {
    expect(computeStreak(["2026-11-17", "2026-11-16"], today)).toBe(0);
  });
});
