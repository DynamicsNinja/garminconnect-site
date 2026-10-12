import type { Day, Workout } from "./dashboard";
import { datesBetween } from "./dashboard";
import type { Night } from "./sleep";

/**
 * Synthetic data for visitors and `GARMIN_DEMO=1`: try the dashboard, or take screenshots, without
 * an account and without anyone's real health data. Deterministic, so screenshots are repeatable.
 */
const random = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const r1 = (v: number) => Math.round(v * 10) / 10;
const r2 = (v: number) => Math.round(v * 100) / 100;

export function demoNights(start: string, end: string): Night[] {
  const rand = random(7);
  let hrv7: number | null = null;
  return datesBetween(start, end).map((date, i) => {
    const hours = r1(6.4 + Math.sin(i / 3) * 0.6 + rand() * 1.2);
    const hrv = Math.round(52 + Math.sin(i / 5) * 6 + (rand() - 0.5) * 12);
    hrv7 = hrv7 === null ? hrv : r1((hrv7 * 6 + hrv) / 7);
    const deep = r2(hours * (0.15 + rand() * 0.07));
    const rem = r2(hours * (0.2 + rand() * 0.06));
    return {
      date,
      score: Math.min(98, Math.round(58 + (hours - 6) * 12 + rand() * 10)),
      hours,
      deep,
      rem,
      light: r2(hours - deep - rem),
      awake: r2(0.1 + rand() * 0.4),
      hrv,
      hrv7d: hrv7,
      restingHr: Math.round(52 + rand() * 5),
    };
  });
}

export function demoDays(start: string, end: string): Day[] {
  const rand = random(11);
  return datesBetween(start, end).map((date, i) => {
    const steps = Math.round(6500 + Math.sin(i / 2.3) * 2200 + rand() * 4500);
    const high = Math.min(100, Math.round(62 + rand() * 36));
    return { date, steps, stepGoal: 8000, km: r1(steps * 0.00078), bbHigh: high, bbLow: Math.max(5, Math.round(high - 40 - rand() * 35)) };
  });
}

const PLAN = [
  { type: "running", name: "Easy run", km: 8, pace: 330, hr: 138, zones: [0.15, 0.7, 0.15, 0, 0] },
  { type: "strength_training", name: "Strength", km: 0, minutes: 45, hr: 108, zones: [0.6, 0.35, 0.05, 0, 0] },
  { type: "running", name: "Intervals 6×800 m", km: 9.5, pace: 300, hr: 156, zones: [0.1, 0.3, 0.25, 0.25, 0.1] },
  { type: "road_biking", name: "Endurance ride", km: 42, pace: 105, hr: 132, zones: [0.2, 0.6, 0.2, 0, 0] },
  { type: "running", name: "Long run", km: 16, pace: 340, hr: 142, zones: [0.1, 0.6, 0.3, 0, 0] },
];

export function demoWorkouts(start: string, end: string): Workout[] {
  const rand = random(23);
  const out: Workout[] = [];
  datesBetween(start, end).forEach((date, i) => {
    if (i % 7 === 2 || i % 7 === 6) return; // two rest days a week
    const p = PLAN[out.length % PLAN.length]!;
    const km = p.km ? r1(p.km * (0.9 + rand() * 0.2)) : null;
    const seconds = Math.round(km ? km * p.pace! : p.minutes! * 60);
    out.push({
      id: 1000 + i,
      name: p.name,
      type: p.type,
      start: `${date} ${String(6 + Math.round(rand() * 12)).padStart(2, "0")}:${String(Math.round(rand() * 59)).padStart(2, "0")}:00`,
      km,
      seconds,
      avgHr: Math.round(p.hr + (rand() - 0.5) * 8),
      calories: Math.round(seconds / 60 * (8 + rand() * 4)),
      effect: r1(Math.min(5, 2 + p.zones[3]! * 6 + p.zones[2]! * 3 + rand() * 0.8)),
      load: Math.round(seconds / 60 * (0.8 + p.zones[3]! * 3 + p.zones[4]! * 5)),
      zones: p.zones.map((z) => Math.round(z * seconds)),
    });
  });
  return out.reverse();
}
