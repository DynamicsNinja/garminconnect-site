import type { Activity, BodyBatteryEntry, DailyStepsEntry } from "garminconnect-js";
import { num } from "./sleep";

/** One calendar day of activity and energy, from `getDailySteps` and `getBodyBattery`. */
export interface Day {
  date: string;
  steps: number | null;
  stepGoal: number | null;
  km: number | null;
  /** Body Battery's highest and lowest level that day. */
  bbHigh: number | null;
  bbLow: number | null;
}

/** One workout, flattened from `getActivitiesByDate`. Field names were read off a real account. */
export interface Workout {
  id: number;
  name: string;
  type: string;
  start: string;
  km: number | null;
  seconds: number | null;
  avgHr: number | null;
  calories: number | null;
  /** Aerobic training effect, 0 to 5. */
  effect: number | null;
  load: number | null;
  /** Seconds in heart-rate zones 1 to 5. */
  zones: number[];
}

/** Every `YYYY-MM-DD` from start to end inclusive (UTC). */
export function datesBetween(start: string, end: string): string[] {
  const out: string[] = [];
  for (let t = Date.parse(`${start}T00:00:00Z`); t <= Date.parse(`${end}T00:00:00Z`); t += 86_400_000) out.push(new Date(t).toISOString().slice(0, 10));
  return out;
}

export function toDays(dates: string[], steps: DailyStepsEntry[] | null, battery: BodyBatteryEntry[] | null): Day[] {
  const s = new Map((steps ?? []).map((r) => [r.calendarDate, r]));
  const b = new Map((battery ?? []).map((r) => [r.date, r]));
  return dates.map((date) => {
    const st = s.get(date);
    const levels = ((b.get(date)?.["bodyBatteryValuesArray"] ?? []) as unknown[])
      .map((pair) => (Array.isArray(pair) ? num(pair[1]) : null))
      .filter((v): v is number => v !== null);
    const meters = num(st?.["totalDistance"]);
    return {
      date,
      steps: num(st?.totalSteps),
      stepGoal: num(st?.stepGoal),
      km: meters === null ? null : Math.round(meters / 100) / 10,
      bbHigh: levels.length ? Math.max(...levels) : null,
      bbLow: levels.length ? Math.min(...levels) : null,
    };
  });
}

export function toWorkouts(rows: Activity[] | null): Workout[] {
  return (rows ?? [])
    .map((a) => {
      const meters = num(a.distance);
      const type = (a.activityType?.["typeKey"] as string | undefined) ?? "other";
      return {
        id: a.activityId,
        name: a.activityName ?? type,
        type,
        start: a.startTimeLocal ?? "",
        km: meters ? Math.round(meters / 10) / 100 : null,
        seconds: num(a.duration),
        avgHr: num(a["averageHR"]),
        calories: num(a["calories"]),
        effect: num(a["aerobicTrainingEffect"]),
        load: num(a["activityTrainingLoad"]),
        zones: [1, 2, 3, 4, 5].map((z) => num(a[`hrTimeInZone_${z}`]) ?? 0),
      };
    })
    .sort((x, y) => y.start.localeCompare(x.start));
}

/** Mean of the non-null values, or null. */
export function mean(values: (number | null)[]): number | null {
  const v = values.filter((x): x is number => x !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "-";
  const total = Math.round(seconds / 60); // round once, so 3599 s is "1h 00m", never "60 min"
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m} min`;
}

const LABELS: Record<string, string> = {
  running: "Run", trail_running: "Trail run", treadmill_running: "Treadmill run", cycling: "Ride", road_biking: "Ride",
  mountain_biking: "Mountain bike", indoor_cycling: "Indoor ride", lap_swimming: "Pool swim", open_water_swimming: "Open-water swim",
  strength_training: "Strength", walking: "Walk", hiking: "Hike", yoga: "Yoga",
};
export const activityLabel = (type: string) => LABELS[type] ?? type.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

/**
 * Split start..end into windows of at most `size` days. `getBodyBattery` sends the whole range in
 * one request, and Garmin answers 90 days with HTTP 400 (30 works; checked 2026-10-12).
 */
export function windows(start: string, end: string, size = 28): [string, string][] {
  const dates = datesBetween(start, end);
  const out: [string, string][] = [];
  for (let i = 0; i < dates.length; i += size) out.push([dates[i]!, dates[Math.min(i + size, dates.length) - 1]!]);
  return out;
}
