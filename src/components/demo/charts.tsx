"use client";

import { useId, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";
import { formatHours, shortDate } from "@/lib/demo/sleep";
import styles from "./charts.module.css";

// Dependency-free SVG charts. Geometry lives in a viewBox that scales to the card width, so the
// viewBox width sets the text size: a wide card gets a wider viewBox, a phone a narrower one.
const W = 640;
const WIDE_W = 1280;
const NARROW_W = 340;
const H = 200;
const PAD = { top: 12, right: 44, bottom: 24, left: 36 };
const PLOT_H = H - PAD.top - PAD.bottom;

const NARROW = "(max-width: 760px)";
function useChartWidth(wide: boolean | undefined): number {
  const narrow = useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(NARROW);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
  return narrow ? NARROW_W : wide ? WIDE_W : W;
}

/** Formatters live here, not in props: a Server Component cannot pass functions to a Client one. */
export type Unit = "score" | "hours" | "ms" | "bpm" | "steps" | "level";
const FORMAT: Record<Unit, (v: number | null) => string> = {
  score: (v) => (v === null ? "-" : String(Math.round(v))),
  hours: formatHours,
  ms: (v) => (v === null ? "-" : `${Math.round(v)} ms`),
  bpm: (v) => (v === null ? "-" : `${Math.round(v)} bpm`),
  steps: (v) => (v === null ? "-" : Math.round(v).toLocaleString("en")),
  level: (v) => (v === null ? "-" : String(Math.round(v))),
};

/** Clean round ticks covering min..max. Columns start at 0; lines start at a round floor below their minimum. */
function ticks(max: number, min = 0): number[] {
  const raw = Math.max(max - min, 1e-9) / 3;
  const pow = 10 ** Math.floor(Math.log10(raw || 1));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  const floor = Math.floor(min / step) * step;
  const top = Math.max(floor + step, Math.ceil(max / step) * step);
  const out: number[] = [];
  for (let t = floor; t <= top + 1e-9; t += step) out.push(Math.round(t * 100) / 100);
  return out;
}

function Axes({ yTicks, labels, w }: { yTicks: number[]; labels: [number, string][]; w: number }) {
  const y = scaleY(yTicks);
  return (
    <g className={styles.axis} aria-hidden="true">
      {yTicks.map((t, i) => (
        <g key={t}>
          <line x1={PAD.left} x2={w - PAD.right} y1={y(t)} y2={y(t)} className={i === 0 ? styles.baseline : styles.grid} />
          <text x={PAD.left - 6} y={y(t)} dy="0.32em" textAnchor="end">
            {t}
          </text>
        </g>
      ))}
      {labels.map(([x, text]) => (
        <text key={`${x}-${text}`} x={x} y={H - 6} textAnchor="middle">
          {text}
        </text>
      ))}
    </g>
  );
}

const scaleY = (yTicks: number[]) => {
  const lo = yTicks[0]!;
  const hi = yTicks[yTicks.length - 1]!;
  return (v: number) => PAD.top + PLOT_H - ((v - lo) / (hi - lo || 1)) * PLOT_H;
};

/** Every ~n-th date label, so they never collide. */
function dateLabels(dates: string[], xAt: (i: number) => number, w: number): [number, string][] {
  const count = w === NARROW_W ? 4 : w === WIDE_W ? 12 : 6;
  const every = Math.max(1, Math.ceil(dates.length / count));
  return dates.flatMap((d, i) => (i % every === 0 || i === dates.length - 1 ? [[xAt(i), shortDate(d)] as [number, string]] : []))
    .filter((l, i, all) => i === all.length - 1 || all[all.length - 1]![0] - l[0] > 40);
}

/**
 * One tab stop per chart: focus it, then the arrow keys (and Home / End) step through the days and
 * the tooltip, a live region, reads each one out. Pointer hover drives the same state.
 */
function useDayNav(title: string, count: number) {
  const [hover, setHover] = useState<number | null>(null);
  const onKeyDown = (e: KeyboardEvent) => {
    const cur = hover ?? count - 1;
    const next = e.key === "ArrowRight" ? cur + 1 : e.key === "ArrowLeft" ? cur - 1 : e.key === "Home" ? 0 : e.key === "End" ? count - 1 : null;
    if (next === null) return;
    e.preventDefault();
    setHover(Math.max(0, Math.min(count - 1, next)));
  };
  const plot = {
    className: styles.plot,
    tabIndex: 0,
    role: "group",
    "aria-label": `${title}. Use the left and right arrow keys to read each day.`,
    onKeyDown,
    onFocus: () => setHover((h) => h ?? count - 1),
    onBlur: () => setHover(null),
  };
  return { hover, setHover, plot };
}

/** Keep the tooltip inside the card: centre it on the point, or anchor it to the side near an edge. */
function tipStyle(x: number, w: number): CSSProperties {
  const frac = x / w;
  const transform = frac > 0.7 ? "translateX(calc(-100% - 10px))" : frac < 0.3 ? "translateX(10px)" : "translateX(-50%)";
  return { left: `${frac * 100}%`, transform };
}

function Tooltip({ x, w, children }: { x: number; w: number; children: React.ReactNode }) {
  return <div className={styles.tooltip} style={tipStyle(x, w)}>{children}</div>;
}

function DataTable({ caption, dates, columns }: { caption: string; dates: string[]; columns: { name: string; values: (number | null)[]; format: (v: number | null) => string }[] }) {
  return (
    <details className={styles.table}>
      <summary>Show table</summary>
      <table>
        <caption className={styles.srOnly}>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            {columns.map((c) => (
              <th scope="col" key={c.name}>{c.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dates.map((d, i) => (
            <tr key={d}>
              <td>{shortDate(d)}</td>
              {columns.map((c) => (
                <td key={c.name}>{c.format(c.values[i] ?? null)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/** Transparent per-day hit areas for the pointer. Keyboard users get the same days via useDayNav. */
function HitAreas({ dates, slot, onHover }: { dates: string[]; slot: number; onHover: (i: number | null) => void }) {
  return (
    <>
      {dates.map((d, i) => (
        <rect key={d} x={PAD.left + slot * i} y={PAD.top} width={slot} height={PLOT_H} fill="transparent" onPointerEnter={() => onHover(i)} onPointerLeave={() => onHover(null)} />
      ))}
    </>
  );
}

export function ColumnChart(props: {
  title: string;
  dates: string[];
  values: (number | null)[];
  unit: Unit;
  yMax?: number;
  /** A per-day target drawn as a stepped line, such as the step goal. */
  goal?: { name: string; values: (number | null)[] };
  wide?: boolean;
}) {
  const { title, dates, values, goal } = props;
  const format = FORMAT[props.unit];
  const { hover, setHover, plot } = useDayNav(title, dates.length);
  const w = useChartWidth(props.wide);
  const present = [...values, ...(goal?.values ?? [])].filter((v): v is number => v !== null);
  const yTicks = ticks(props.yMax ?? Math.max(1, ...present));
  const y = scaleY(yTicks);
  const slot = (w - PAD.left - PAD.right) / Math.max(1, dates.length);
  const barW = Math.min(24, Math.max(2, slot - 2));
  const xAt = (i: number) => PAD.left + slot * i + slot / 2;
  // No end label on columns: at 30+ bars it collides with the neighbouring bar, and the stat
  // figures above already show the latest value. The tooltip and table carry every value.

  return (
    <figure className={props.wide ? `${styles.card} ${styles.wide}` : styles.card}>
      <figcaption className={styles.title}>{title}</figcaption>
      {goal && (
        <ul className={styles.legend}>
          <li><span className={`${styles.key} ${styles.keyBar}`} aria-hidden="true" />Goal met</li>
          <li><span className={`${styles.key} ${styles.keyBarMuted}`} aria-hidden="true" />Below goal</li>
          <li><span className={`${styles.key} ${styles.keyGoal}`} aria-hidden="true" />{goal.name}</li>
        </ul>
      )}
      <div {...plot}>
        <svg viewBox={`0 0 ${w} ${H}`} role="img" aria-label={`${title}, column chart`}>
          <Axes yTicks={yTicks} w={w} labels={dateLabels(dates, xAt, w)} />
          {values.map((v, i) => {
            if (v === null) return null;
            const top = y(v);
            const h = PAD.top + PLOT_H - top;
            const r = Math.min(4, barW / 2, h);
            const x = xAt(i) - barW / 2;
            // Rounded data-end, square at the baseline.
            const d = `M${x},${top + h} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${top + h} Z`;
            const met = goal?.values[i] != null && v >= goal.values[i]!;
            return <path key={dates[i]} d={d} className={`${styles.bar} ${goal ? (met ? styles.barMet : styles.barMuted) : ""} ${hover === i ? styles.barHover : ""}`} />;
          })}
          {goal && (
            <path
              className={styles.goal}
              d={goal.values.map((g, i) => (g === null ? "" : `${i === 0 || goal.values[i - 1] === null ? "M" : "L"}${PAD.left + slot * i},${y(g)} H${PAD.left + slot * (i + 1)}`)).join(" ")}
            />
          )}
          <HitAreas dates={dates} slot={slot} onHover={setHover} />
        </svg>
        <div aria-live="polite" className={styles.live}>
          {hover !== null && (
            <Tooltip x={xAt(hover)} w={w}>
              <span>{shortDate(dates[hover]!)}</span>
              <strong>{format(values[hover] ?? null)}</strong>
              {goal && goal.values[hover] != null && <span>{goal.name} {format(goal.values[hover]!)}</span>}
            </Tooltip>
          )}
        </div>
      </div>
      <DataTable caption={title} dates={dates} columns={[{ name: title, values, format }, ...(goal ? [{ name: goal.name, values: goal.values, format }] : [])]} />
    </figure>
  );
}

export function LineChart(props: {
  title: string;
  dates: string[];
  series: { name: string; values: (number | null)[]; tone: "primary" | "secondary" }[];
  unit: Unit;
  wide?: boolean;
}) {
  const { title, dates, series } = props;
  const format = FORMAT[props.unit];
  const { hover, setHover, plot } = useDayNav(title, dates.length);
  const clipId = useId();
  const w = useChartWidth(props.wide);
  const all = series.flatMap((s) => s.values).filter((v): v is number => v !== null);
  // Lines start near their data, not at 0: resting HR of 52 to 57 would otherwise be a flat line.
  const lo = all.length ? Math.min(...all) : 0;
  const hi = all.length ? Math.max(...all) : 1;
  const yTicks = ticks(hi, Math.max(0, lo - (hi - lo) * 0.25));
  const y = scaleY(yTicks);
  const plotW = w - PAD.left - PAD.right;
  const step = plotW / Math.max(1, dates.length - 1);
  const xAt = (i: number) => PAD.left + step * i;

  const pathFor = (values: (number | null)[]) => {
    let d = "";
    let pen = false;
    values.forEach((v, i) => {
      if (v === null) {
        pen = false;
        return;
      }
      d += `${pen ? "L" : "M"}${xAt(i).toFixed(1)},${y(v).toFixed(1)} `;
      pen = true;
    });
    return d;
  };

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - box.left) / box.width;
    setHover(Math.max(0, Math.min(dates.length - 1, Math.round(frac * (dates.length - 1)))));
  };

  return (
    <figure className={props.wide ? `${styles.card} ${styles.wide}` : styles.card}>
      <figcaption className={styles.title}>{title}</figcaption>
      <ul className={styles.legend}>
        {series.map((s) => (
          <li key={s.name}>
            <span className={`${styles.key} ${styles[s.tone]}`} aria-hidden="true" />
            {s.name}
          </li>
        ))}
      </ul>
      <div {...plot}>
        <svg viewBox={`0 0 ${w} ${H}`} role="img" aria-label={`${title}, line chart`}>
          <clipPath id={clipId}>
            <rect x={PAD.left} y={0} width={plotW + 8} height={H} />
          </clipPath>
          <Axes yTicks={yTicks} w={w} labels={dateLabels(dates, xAt, w)} />
          {hover !== null && (
            <line className={styles.crosshair} x1={xAt(hover)} x2={xAt(hover)} y1={PAD.top} y2={PAD.top + PLOT_H} />
          )}
          <g clipPath={`url(#${clipId})`}>
            {series.map((s) => (
              <path key={s.name} d={pathFor(s.values)} className={`${styles.line} ${styles[s.tone]}`} />
            ))}
          </g>
          {series.map((s, si) => {
            const i = s.values.findLastIndex((v) => v !== null);
            if (i < 0) return null;
            const labelY = y(s.values[i]!);
            // End labels that would collide are dropped, not nudged apart: a nudged label detaches
            // from its line. The legend and tooltip still carry that series.
            const collides = series.slice(0, si).some((p) => {
              const j = p.values.findLastIndex((v) => v !== null);
              return j >= 0 && Math.abs(y(p.values[j]!) - labelY) < 14;
            });
            return (
              <g key={s.name}>
                <circle cx={xAt(i)} cy={labelY} r={4} className={`${styles.dot} ${styles[s.tone]}`} />
                {!collides && (
                  <text className={styles.endLabel} x={xAt(i) + 8} y={labelY} dy="0.32em">
                    {format(s.values[i]!)}
                  </text>
                )}
              </g>
            );
          })}
          {hover !== null &&
            series.map((s) =>
              s.values[hover] == null ? null : (
                <circle key={s.name} cx={xAt(hover)} cy={y(s.values[hover]!)} r={4} className={`${styles.dot} ${styles[s.tone]}`} />
              ),
            )}
          <rect x={PAD.left} y={PAD.top} width={plotW} height={PLOT_H} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
        </svg>
        <div aria-live="polite" className={styles.live}>
          {hover !== null && (
            <Tooltip x={xAt(hover)} w={w}>
              <span>{shortDate(dates[hover]!)}</span>
              {series.map((s) => (
                <span key={s.name} className={styles.tipRow}>
                  <span className={`${styles.key} ${styles[s.tone]}`} aria-hidden="true" />
                  <strong>{format(s.values[hover] ?? null)}</strong> {s.name}
                </span>
              ))}
            </Tooltip>
          )}
        </div>
      </div>
      <DataTable caption={title} dates={dates} columns={series.map((s) => ({ name: s.name, values: s.values, format }))} />
    </figure>
  );
}

/**
 * Columns made of stacked segments, such as sleep stages. With `floating`, the first series is a
 * transparent spacer, so each column spans a low-to-high range (Body Battery).
 */
export function StackedColumnChart(props: {
  title: string;
  dates: string[];
  series: { name: string; values: (number | null)[]; color: string }[];
  unit: Unit;
  yMax?: number;
  floating?: boolean;
}) {
  const { title, dates, series } = props;
  const format = FORMAT[props.unit];
  const { hover, setHover, plot } = useDayNav(title, dates.length);
  const w = useChartWidth(false);
  const totals = dates.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0));
  const yTicks = ticks(props.yMax ?? Math.max(1, ...totals));
  const yMax = yTicks[yTicks.length - 1]!;
  const slot = (w - PAD.left - PAD.right) / Math.max(1, dates.length);
  const barW = Math.min(24, Math.max(2, slot - 2));
  const xAt = (i: number) => PAD.left + slot * i + slot / 2;
  const h = (v: number) => (v / yMax) * PLOT_H;
  const shown = props.floating ? series.slice(1) : series;
  const tip = (i: number) =>
    props.floating
      ? [{ name: "Range", text: `${format(series[0]!.values[i] ?? null)} to ${format(totals[i] || null)}`, color: shown[0]!.color }]
      : shown.map((s) => ({ name: s.name, text: format(s.values[i] ?? null), color: s.color }));

  return (
    <figure className={styles.card}>
      <figcaption className={styles.title}>{title}</figcaption>
      <ul className={styles.legend}>
        {shown.map((s) => (
          <li key={s.name}><span className={`${styles.key} ${styles.keyBox}`} style={{ background: s.color }} aria-hidden="true" />{s.name}</li>
        ))}
      </ul>
      <div {...plot}>
        <svg viewBox={`0 0 ${w} ${H}`} role="img" aria-label={`${title}, stacked column chart`}>
          <Axes yTicks={yTicks} w={w} labels={dateLabels(dates, xAt, w)} />
          {dates.map((d, i) => {
            let base = PAD.top + PLOT_H;
            return (
              <g key={d} opacity={hover === null || hover === i ? 1 : 0.55}>
                {series.map((s, si) => {
                  const v = s.values[i];
                  if (v == null || v <= 0) return null;
                  const hh = h(v);
                  base -= hh;
                  if (props.floating && si === 0) return null;
                  return <rect key={s.name} x={xAt(i) - barW / 2} y={base} width={barW} height={Math.max(hh - (barW > 6 ? 1 : 0), 0.5)} rx={Math.min(2, barW / 4)} fill={s.color} />;
                })}
              </g>
            );
          })}
          <HitAreas dates={dates} slot={slot} onHover={setHover} />
        </svg>
        <div aria-live="polite" className={styles.live}>
          {hover !== null && (
            <Tooltip x={xAt(hover)} w={w}>
              <span>{shortDate(dates[hover]!)}</span>
              {tip(hover).map((t) => (
                <span key={t.name} className={styles.tipRow}>
                  <span className={`${styles.key} ${styles.keyBox}`} style={{ background: t.color }} aria-hidden="true" />
                  <strong>{t.text}</strong> {t.name}
                </span>
              ))}
            </Tooltip>
          )}
        </div>
      </div>
      <DataTable
        caption={title}
        dates={dates}
        columns={props.floating
          ? [{ name: "Low", values: series[0]!.values, format }, { name: "High", values: totals.map((t) => t || null), format }]
          : shown.map((s) => ({ name: s.name, values: s.values, format }))}
      />
    </figure>
  );
}
