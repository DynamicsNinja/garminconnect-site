import type { SleepDailyEntry } from "garminconnect-js";

/** One night, flattened from `getSleepDaily`'s `{ calendarDate, values: {...} }` rows. */
export interface Night {
  date: string;
  score: number | null;
  hours: number | null;
  /** Hours in each stage. */
  deep: number | null;
  light: number | null;
  rem: number | null;
  awake: number | null;
  hrv: number | null;
  hrv7d: number | null;
  restingHr: number | null;
}

export const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const toHours = (seconds: number | null) => (seconds === null ? null : Math.round((seconds / 3600) * 100) / 100);

/**
 * `getSleepDaily` returns one row per night with the numbers under `values`. The field names below
 * were read off a real account; the library types this row loosely because Garmin documents none
 * of it.
 */
export function toNights(rows: SleepDailyEntry[]): Night[] {
  return rows
    .filter((r): r is SleepDailyEntry & { calendarDate: string } => typeof r.calendarDate === "string")
    .map((r) => {
      const v = (r["values"] ?? {}) as Record<string, unknown>;
      const seconds = num(v["totalSleepTimeInSeconds"]);
      return {
        date: r.calendarDate,
        score: num(v["sleepScore"]),
        hours: seconds === null ? null : Math.round((seconds / 3600) * 10) / 10,
        deep: toHours(num(v["deepTime"])),
        light: toHours(num(v["lightTime"])),
        rem: toHours(num(v["remTime"])),
        awake: toHours(num(v["awakeTime"])),
        hrv: num(v["avgOvernightHrv"]),
        hrv7d: num(v["hrv7dAverage"]),
        restingHr: num(v["restingHeartRate"]),
      };
    });
}

/**
 * `YYYY-MM-DD` for today and `days - 1` days before it, computed in UTC. Garmin's calendar dates are
 * the wearer's local day, so just after local midnight east of UTC "today" is still yesterday here.
 */
export function range(days: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end.getTime() - (days - 1) * 86_400_000);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function formatHours(h: number | null): string {
  if (h === null) return "-";
  const total = Math.round(h * 60);
  if (total < 60) return `${total}m`;
  return `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, "0")}m`;
}

export function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" });
}
