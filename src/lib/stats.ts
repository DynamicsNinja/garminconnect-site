/** The hosted connector's public usage counts, as /mcp/stats.json serves them (garminconnect mcp/src/http/stats.ts). */
export interface Stats {
  generatedAt: string;
  users: number;
  connections: number;
  active: { day: number; week: number; month: number };
  clients: { name: string; users: number }[];
  daily: { day: string; users: number; connections: number; active7d: number }[];
}

export const STATS_URL = process.env.STATS_URL ?? "https://garmin.ficdev.xyz/mcp/stats.json";

/** null when the MCP server can't be reached or answers with something else; the page shows that state instead of failing. */
export async function fetchStats(url = STATS_URL): Promise<Stats | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 300 }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const s = (await res.json()) as Stats;
    return typeof s.users === "number" && Array.isArray(s.daily) && Array.isArray(s.clients) ? s : null;
  } catch {
    return null;
  }
}

const MILESTONES = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

/** The next round number of people above `users`, and how far along the way from the previous one we are (0..1). */
export function nextMilestone(users: number): { target: number; from: number; progress: number } {
  const target = MILESTONES.find((m) => m > users) ?? Math.ceil((users + 1) / 10000) * 10000;
  const from = [...MILESTONES].reverse().find((m) => m <= users && m < target) ?? 0;
  return { target, from, progress: (users - from) / (target - from) };
}

/** The busiest day by people connected; the latest one wins a tie, since that's the record being set. */
export function busiestDay(daily: Stats["daily"]): Stats["daily"][number] | undefined {
  return daily.reduce<Stats["daily"][number] | undefined>((best, d) => (!best || d.users >= best.users ? d : best), undefined);
}

/** "Oct 14" from "2026-10-14", without the server's time zone shifting the day. */
export const dayLabel = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
