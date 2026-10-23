"use client";

import { useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { dayLabel, type Stats } from "@/lib/stats";
import styles from "./stats.module.css";

const METRICS = [
  { id: "users", label: "People", noun: "people connected" },
  { id: "connections", label: "Connections", noun: "connections" },
  { id: "active7d", label: "Active this week", noun: "people active in the 7 days before" },
  { id: "joined", label: "New", noun: "new people joined" },
] as const;
type Metric = (typeof METRICS)[number]["id"];
type Day = Stats["daily"][number];
const value = (d: Day, metric: Metric) => d[metric] ?? 0;

// The viewBox width sets the text size, so phones get a narrower one and the labels stay legible.
const NARROW = "(max-width: 640px)";
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(NARROW);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
const H = 240;
const PAD = { top: 16, right: 16, bottom: 28, left: 36 };

/** Round ticks from 0 that cover max, at most four of them. */
function ticks(max: number): number[] {
  const raw = Math.max(max, 1) / 3;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = Math.max(1, [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw);
  const out: number[] = [];
  for (let t = 0; t <= Math.ceil(max / step) * step + 1e-9; t += step) out.push(t);
  return out.length > 1 ? out : [0, step];
}

export function TrendChart({ daily }: { daily: Stats["daily"] }) {
  const [metric, setMetric] = useState<Metric>("users");
  const [active, setActive] = useState<number | null>(null);
  const narrow = useSyncExternalStore(subscribe, () => window.matchMedia(NARROW).matches, () => false);
  const W = narrow ? 380 : 1000;
  const hasJoined = daily.some((d) => d.joined !== undefined);
  const metrics = METRICS.filter((x) => x.id !== "joined" || hasJoined);
  const m = metrics.find((x) => x.id === metric) ?? metrics[0]!;

  if (daily.length < 2) {
    return <p className={styles.muted}>The trend starts {daily[0] ? `on ${dayLabel(daily[0].day)}` : "with the first daily count"}. Come back tomorrow for a line.</p>;
  }

  const values = daily.map((d) => value(d, m.id));
  const yTicks = ticks(Math.max(...values));
  const top = yTicks[yTicks.length - 1]!;
  const x = (i: number) => PAD.left + (i * (W - PAD.left - PAD.right)) / (daily.length - 1);
  const y = (v: number) => PAD.top + (H - PAD.top - PAD.bottom) * (1 - v / top);
  const line = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const area = `${line}L${x(daily.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`;
  const every = Math.ceil(daily.length / (narrow ? 3 : 7));
  const shown = active ?? daily.length - 1;
  const point = daily[shown]!;

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setActive(Math.min(daily.length - 1, Math.max(0, shown + (e.key === "ArrowRight" ? 1 : -1))));
  };

  return (
    <div>
      <div className={styles.metrics} role="group" aria-label="Show">
        {metrics.map((x) => (
          <button key={x.id} type="button" aria-pressed={x.id === m.id} onClick={() => setMetric(x.id)}>{x.label}</button>
        ))}
      </div>
      <p className={styles.readout} aria-live="polite">
        <b>{value(point, m.id).toLocaleString("en-US")}</b> {m.noun} on {dayLabel(point.day)}
      </p>
      <svg
        className={styles.trend}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${m.label} per day, from ${values[0]} on ${dayLabel(daily[0]!.day)} to ${values[values.length - 1]} on ${dayLabel(point.day)}. Use the arrow keys to step through days.`}
        tabIndex={0}
        onKeyDown={onKey}
        onBlur={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          const i = Math.round(((px - PAD.left) / (W - PAD.left - PAD.right)) * (daily.length - 1));
          setActive(Math.min(daily.length - 1, Math.max(0, i)));
        }}
      >
        <defs>
          <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g aria-hidden="true" className={styles.axis}>
          {yTicks.map((t, i) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className={i ? styles.grid : styles.baseline} />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end">{t}</text>
            </g>
          ))}
          {daily.map((d, i) => (i % every === 0 || i === daily.length - 1) && (i === daily.length - 1 || daily.length - 1 - i >= every / 2) ? (
            <text key={d.day} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === daily.length - 1 ? "end" : "middle"}>{dayLabel(d.day)}</text>
          ) : null)}
        </g>
        <path d={area} fill="url(#trend-fill)" />
        <path key={m.id} d={line} className={styles.line} pathLength={1} />
        <line x1={x(shown)} x2={x(shown)} y1={PAD.top} y2={y(0)} className={styles.crosshair} />
        <circle cx={x(shown)} cy={y(value(point, m.id))} r={5} className={styles.dot} />
      </svg>
      <details className={styles.table}>
        <summary>Show as a table</summary>
        <table>
          <thead><tr><th>Day</th><th>People</th><th>Connections</th><th>Active this week</th>{hasJoined && <th>New</th>}</tr></thead>
          <tbody>
            {[...daily].reverse().map((d) => (
              <tr key={d.day}><td>{dayLabel(d.day)}</td><td>{d.users}</td><td>{d.connections}</td><td>{d.active7d}</td>{hasJoined && <td>{d.joined ?? 0}</td>}</tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
