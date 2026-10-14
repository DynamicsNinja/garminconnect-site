import { describe, expect, it } from "vitest";
import { busiestDay, dayLabel, nextMilestone } from "@/lib/stats";

describe("nextMilestone", () => {
  it("aims for the next round number", () => {
    expect(nextMilestone(0)).toEqual({ target: 5, from: 0, progress: 0 });
    expect(nextMilestone(3)).toMatchObject({ target: 5, from: 0 });
    expect(nextMilestone(5)).toMatchObject({ target: 10, from: 5, progress: 0 });
    expect(nextMilestone(40)).toMatchObject({ target: 50, from: 25, progress: 0.6 });
  });
  it("keeps going past the list", () => {
    expect(nextMilestone(12345).target).toBe(20000);
  });
});

describe("busiestDay", () => {
  it("picks the most people, latest on a tie", () => {
    const d = (day: string, users: number) => ({ day, users, connections: 0, active7d: 0 });
    expect(busiestDay([d("2026-10-12", 2), d("2026-10-13", 1), d("2026-10-14", 2)])?.day).toBe("2026-10-14");
    expect(busiestDay([])).toBeUndefined();
  });
});

describe("dayLabel", () => {
  it("formats the day as given", () => {
    expect(dayLabel("2026-10-14")).toBe("Oct 14");
  });
});
