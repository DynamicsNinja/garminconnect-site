import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { busiestDay, dayLabel, fetchStats, nextMilestone, type Stats } from "@/lib/stats";
import { TrendChart } from "./TrendChart";
import styles from "./stats.module.css";

export const revalidate = 300;

export function generateMetadata(): Metadata {
  return pageMeta({ title: "Usage stats", description: "How many people use the hosted Garmin connector for Claude, per day and per app. Counts only, updated every 5 minutes.", path: "/stats" });
}

const fmt = (n: number) => n.toLocaleString("en-US");
const plural = (n: number, one: string, many = `${one}s`) => `${fmt(n)} ${n === 1 ? one : many}`;

/** Three activity rings, like a watch face: today on the outside, this month innermost, each a share of everyone connected. */
function Rings({ s }: { s: Stats }) {
  const rings = [
    { r: 104, value: s.active.day, label: "active today", cls: styles.ringDay },
    { r: 82, value: s.active.week, label: "active this week", cls: styles.ringWeek },
    { r: 60, value: s.active.month, label: "active this month", cls: styles.ringMonth },
  ];
  return (
    <div className={styles.face}>
      <svg viewBox="0 0 240 240" aria-hidden="true">
        {rings.map((g, i) => {
          const share = s.users ? Math.min(1, g.value / s.users) : 0;
          return (
            <g key={g.r} className={g.cls}>
              <circle cx="120" cy="120" r={g.r} className={styles.track} />
              <circle
                cx="120" cy="120" r={g.r} pathLength={100}
                className={styles.arc}
                style={{ "--share": share * 100, "--delay": `${i * 140}ms` } as CSSProperties}
              />
            </g>
          );
        })}
      </svg>
      <div className={styles.center}>
        <b>{fmt(s.users)}</b>
        <span>{s.users === 1 ? "person" : "people"}</span>
      </div>
      <ul className={styles.legend}>
        {rings.map((g) => (
          <li key={g.r} className={g.cls}><b>{fmt(g.value)}</b> {g.label}</li>
        ))}
      </ul>
    </div>
  );
}

function Unavailable() {
  return (
    <div className="container">
      <header className={styles.head}>
        <h1>Usage stats</h1>
        <p>The counts couldn&apos;t be loaded just now. They refresh every 5 minutes, so try again shortly, or read them straight from the <a href="/mcp/stats">connector&apos;s stats page</a>.</p>
      </header>
    </div>
  );
}

export default async function StatsPage() {
  const s = await fetchStats();
  if (!s) return <Unavailable />;
  const goal = nextMilestone(s.users);
  const best = busiestDay(s.daily);
  const perPerson = s.users ? s.connections / s.users : 0;
  const topClient = Math.max(1, ...s.clients.map((c) => c.users));

  return (
    <div className="container">
      <section className={styles.hero}>
        <header className={styles.head}>
          <h1>Who&apos;s asking Claude about their training</h1>
          <p>
            {s.users ? `${plural(s.users, "person", "people")} use the hosted Garmin connector, ${fmt(s.active.day)} of them today.` : "No one is connected yet. Be the first."}{" "}
            Counts only, no names or ids.
          </p>
          <Link href="/claude" className="btn btn-primary">{s.users ? "Join them" : "Connect Claude"}</Link>
        </header>
        <Rings s={s} />
      </section>

      <section className={styles.facts} aria-label="Highlights">
        <div>
          <h2>Next milestone</h2>
          <p><b>{plural(goal.target - s.users, "more person", "more people")}</b> to reach {fmt(goal.target)}.</p>
          <div className={styles.lap} role="progressbar" aria-label={`Progress to ${fmt(goal.target)} people`} aria-valuemin={goal.from} aria-valuemax={goal.target} aria-valuenow={s.users}>
            <span style={{ "--p": goal.progress } as CSSProperties} />
          </div>
        </div>
        <div>
          <h2>Busiest day</h2>
          <p>{best ? <><b>{dayLabel(best.day)}</b>, with {plural(best.users, "person", "people")} connected.</> : "Still warming up."}</p>
        </div>
        <div>
          <h2>Connections per person</h2>
          <p><b>{perPerson.toFixed(1)}</b> on average, {plural(s.connections, "connection")} in all. One per app someone has connected.</p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="trend">
        <h2 id="trend">Every day so far</h2>
        <TrendChart daily={s.daily} />
      </section>

      <section className={styles.section} aria-labelledby="apps">
        <h2 id="apps">Which apps people use</h2>
        {s.clients.length ? (
          <ul className={styles.bars}>
            {s.clients.map((c) => (
              <li key={c.name}>
                <span className={styles.barName}>{c.name}</span>
                <span className={styles.bar} style={{ "--w": c.users / topClient } as CSSProperties} />
                <span className={styles.barValue}>{fmt(c.users)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.muted}>No one is connected yet.</p>
        )}
        <p className={styles.note}>An app is named once at least three people use it; the rest are counted as Other.</p>
      </section>

      <p className={styles.note}>
        A connection unused for 35 days is removed, so these are people active in the last 35 days. Updated every 5 minutes, last at{" "}
        {s.generatedAt.slice(11, 16)} UTC. Also as <a href="/mcp/stats.json">JSON</a>; see <Link href="/privacy">what&apos;s counted</Link>.
      </p>
    </div>
  );
}
