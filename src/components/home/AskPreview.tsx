import styles from "./AskPreview.module.css";

// Illustrative week of sleep, in minutes per stage. The answer text below is computed from it.
const NIGHTS = [
  { day: "Mon", deep: 82, light: 220, rem: 95, awake: 18 },
  { day: "Tue", deep: 74, light: 205, rem: 88, awake: 25 },
  { day: "Wed", deep: 96, light: 230, rem: 104, awake: 12 },
  { day: "Thu", deep: 68, light: 198, rem: 80, awake: 30 },
  { day: "Fri", deep: 90, light: 240, rem: 110, awake: 15 },
  { day: "Sat", deep: 105, light: 252, rem: 118, awake: 10 },
  { day: "Sun", deep: 92, light: 236, rem: 101, awake: 14 },
];
const STAGES = [
  { key: "deep", label: "Deep", color: "var(--accent)" },
  { key: "light", label: "Light", color: "var(--z1)" },
  { key: "rem", label: "REM", color: "var(--accent-2)" },
  { key: "awake", label: "Awake", color: "var(--z4)" },
] as const;

const W = 320, H = 132, TOP = 4, AXIS = 18, MAX = 9 * 60;
const slot = W / NIGHTS.length, bar = 22;
const y = (min: number) => (min / MAX) * (H - TOP - AXIS);

export function AskPreview() {
  return (
    <figure className={styles.panel} aria-label="Example: asking Claude about your sleep">
      <div className={styles.user}>
        <p>How did I sleep this week compared with last week?</p>
      </div>
      <div className={styles.answer}>
        <p className={styles.tool}><span className={styles.dot} aria-hidden="true" /> Used <code>get_sleep_data</code> for 14 nights</p>
        <p>
          You averaged <strong>6 h 52 min</strong> asleep, 21 minutes more than last week. Deep sleep peaked
          on Saturday at 1 h 45 min. Thursday was the short one at 5 h 46 min, right after your interval session.
        </p>
        <svg className={styles.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Sleep stages per night, Monday to Sunday">
          {[3, 6, 9].map((h) => (
            <line key={h} x1="0" x2={W} y1={H - AXIS - y(h * 60)} y2={H - AXIS - y(h * 60)} className={styles.grid} />
          ))}
          {NIGHTS.map((n, i) => {
            let base = H - AXIS;
            return (
              <g key={n.day}>
                <g className={styles.bar} style={{ animationDelay: `${300 + i * 70}ms` }}>
                  {STAGES.map((s) => {
                    const h = y(n[s.key]);
                    base -= h;
                    return <rect key={s.key} x={i * slot + (slot - bar) / 2} y={base} width={bar} height={Math.max(h - 1.5, 0)} rx="2" fill={s.color} />;
                  })}
                </g>
                <text x={i * slot + slot / 2} y={H - 4} textAnchor="middle" className={styles.day}>{n.day}</text>
              </g>
            );
          })}
        </svg>
        <ul className={styles.legend}>
          {STAGES.map((s) => (
            <li key={s.key}><span style={{ background: s.color }} aria-hidden="true" />{s.label}</li>
          ))}
        </ul>
      </div>
      <figcaption className={styles.caption}>Example conversation with sample data</figcaption>
    </figure>
  );
}
