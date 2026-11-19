import { describe, expect, it } from "vitest";
import { applyReview, categoriesOf, emptyProgress, formatInterval, previewIntervals, retrievability, type ProgressFields } from "./fsrs";

const t0 = new Date("2026-11-19T08:00:00Z");
const later = (p: ProgressFields) => new Date(p.due_at);

describe("FSRS scheduling", () => {
  it("a new word rated Good enters learning and comes back within minutes", () => {
    const { next, log } = applyReview(null, "good", t0);
    expect(log.state_before).toBe("new");
    expect(next.state).toBe("learning");
    expect(next.reps).toBe(1);
    const mins = (later(next).getTime() - t0.getTime()) / 60000;
    expect(mins).toBeGreaterThan(0);
    expect(mins).toBeLessThanOrEqual(15);
  });

  it("Easy on a new word graduates straight to review with a multi-day interval", () => {
    const { next } = applyReview(null, "easy", t0);
    expect(next.state).toBe("review");
    expect(next.scheduled_days).toBeGreaterThanOrEqual(1);
  });

  it("intervals grow with successful reviews", () => {
    let p = applyReview(null, "good", t0).next;
    let now = later(p);
    p = applyReview(p, "good", now).next; // finishes learning steps
    expect(p.state).toBe("review");
    const first = p.scheduled_days;
    now = later(p);
    p = applyReview(p, "good", now).next;
    expect(p.scheduled_days).toBeGreaterThan(first);
    expect(p.correct_count).toBe(3);
    expect(p.incorrect_count).toBe(0);
  });

  it("forgetting a review card counts a lapse and sends it to relearning", () => {
    let p = applyReview(null, "easy", t0).next;
    const now = later(p);
    const before = p.stability;
    p = applyReview(p, "again", now).next;
    expect(p.state).toBe("relearning");
    expect(p.lapses).toBe(1);
    expect(p.incorrect_count).toBe(1);
    expect(p.stability).toBeLessThan(before);
  });

  it("Again is always scheduled sooner than Easy", () => {
    const p = applyReview(null, "good", t0).next;
    const now = later(p);
    const again = applyReview(p, "again", now).next;
    const easy = applyReview(p, "easy", now).next;
    expect(new Date(again.due_at).getTime()).toBeLessThan(new Date(easy.due_at).getTime());
  });

  it("retrievability starts near 1 and decays over time", () => {
    const p = applyReview(null, "easy", t0).next;
    const soon = retrievability(p, new Date(t0.getTime() + 60_000));
    const far = retrievability(p, new Date(t0.getTime() + 60 * 86_400_000));
    expect(soon).toBeGreaterThan(0.95);
    expect(far).toBeLessThan(soon);
    expect(retrievability(emptyProgress(t0), t0)).toBe(0);
  });

  it("previews a label for every rating", () => {
    const labels = previewIntervals(null, t0);
    expect(Object.keys(labels)).toEqual(["again", "hard", "good", "easy"]);
    expect(labels.again).toMatch(/min/);
  });
});

describe("categories", () => {
  it("classifies new, learning, due, difficult and mastered", () => {
    expect(categoriesOf(null, t0)).toEqual(["new"]);
    const learning = applyReview(null, "good", t0).next;
    expect(categoriesOf(learning, t0)).toEqual(["learning"]);
    expect(categoriesOf(learning, later(learning))).toEqual(["learning", "due"]);

    const difficult: ProgressFields = { ...learning, state: "review", difficulty: 8.2, lapses: 1, stability: 3 };
    expect(categoriesOf(difficult, t0)).toContain("difficult");

    const mastered: ProgressFields = { ...learning, state: "review", difficulty: 4, stability: 40, due_at: "2027-01-01T00:00:00Z" };
    expect(categoriesOf(mastered, t0)).toEqual(["mastered"]);
  });
});

describe("formatInterval", () => {
  it("formats minutes, hours, days, months and years", () => {
    expect(formatInterval(30_000)).toBe("1 min");
    expect(formatInterval(10 * 60_000)).toBe("10 min");
    expect(formatInterval(5 * 3_600_000)).toBe("5 h");
    expect(formatInterval(3 * 86_400_000)).toBe("3 d");
    expect(formatInterval(90 * 86_400_000)).toBe("3 mo");
    expect(formatInterval(500 * 86_400_000)).toBe("1.4 y");
  });
});
