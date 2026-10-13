import Link from "next/link";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { connection } from "next/server";
import { GarminAuthError } from "garminconnect-js";
import { logout } from "@/app/demo/actions";
import { ColumnChart, LineChart, StackedColumnChart } from "@/components/demo/charts";
import { LoginForm } from "@/components/demo/LoginForm";
import { activityLabel, datesBetween, formatDuration, mean, toDays, toWorkouts, windows, type Day, type Workout } from "@/lib/demo/dashboard";
import { demoDays, demoNights, demoWorkouts } from "@/lib/demo/demo";
import { getGarmin } from "@/lib/demo/garmin";
import { MODE } from "@/lib/demo/mode";
import { formatHours, range, shortDate, toNights, type Night } from "@/lib/demo/sleep";
import styles from "./page.module.css";

export const metadata: Metadata = pageMeta({
  title: "Live demo",
  description: "Sleep, HRV, training and activity data from Garmin Connect, charted with the garminconnect-js TypeScript client. Explore sample data or sign in to see your own.",
  path: "/demo",
});

const RANGES = [7, 30, 90] as const;
const ZONES = ["var(--z1)", "var(--z2)", "var(--z3)", "var(--z4)", "var(--z5)"];

/** An extra panel failing (an endpoint Garmin changed, a timeout) hides that panel, not the page. */
const optional = <T,>(p: Promise<T>): Promise<T | null> =>
  p.catch((e) => {
    if (e instanceof GarminAuthError) throw e;
    return null;
  });

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; signin?: string }>;
}) {
  await connection(); // always render per request: this page reads live account data
  const params = await searchParams;
  const garmin = await getGarmin();
  // Local mode has nothing to show until you connect. Public mode shows demo data to visitors who
  // haven't signed in, and the sign-in form when they ask for it.
  if (!garmin && (MODE === "local" || (MODE === "public" && params.signin !== undefined))) {
    return <div className={styles.scope}><LoginForm mode={MODE} /></div>;
  }

  const requested = Number(params.days);
  const days = RANGES.find((r) => r === requested) ?? 30;
  const { start, end } = range(days);
  const dates = datesBetween(start, end);

  let rawNights: Night[];
  let dayRows: Day[];
  let workouts: Workout[];
  let name: string;
  if (!garmin) {
    [rawNights, dayRows, workouts, name] = [demoNights(start, end), demoDays(start, end), demoWorkouts(start, end), "Sample data"];
  } else {
    try {
      const [sleep, fullName, steps, battery, activities] = await Promise.all([
        optional(garmin.getSleepDaily(start, end).then(toNights)),
        optional(garmin.fullName()),
        optional(garmin.getDailySteps(start, end)),
        optional(Promise.all(windows(start, end).map(([a, b]) => garmin.getBodyBattery(a, b))).then((parts) => parts.flat())),
        optional(garmin.getActivitiesByDate(start, end)),
      ]);
      [rawNights, dayRows, workouts, name] = [sleep ?? [], toDays(dates, steps, battery), toWorkouts(activities), fullName || "Your Garmin data"];
    } catch (e) {
      if (e instanceof GarminAuthError) {
        return (
          <div className={styles.scope}>
            <LoginForm mode={MODE} notice="Your Garmin session has expired. Sign in again to reconnect." />
          </div>
        );
      }
      throw e;
    }
  }

  // Line every series up on the same calendar, so a missing night is a gap rather than a shift.
  const byDate = new Map(rawNights.map((n) => [n.date, n]));
  const empty = { score: null, hours: null, deep: null, light: null, rem: null, awake: null, hrv: null, hrv7d: null, restingHr: null };
  const nights = dates.map((date) => byDate.get(date) ?? { date, ...empty });
  const last = nights.findLast((n) => n.score !== null || n.hours !== null);
  // Today is still in progress, so the step and Body Battery figures use the last full day.
  const fullDays = dayRows.filter((d) => d.date !== end);
  const yesterday = fullDays.findLast((d) => d.steps !== null || d.bbHigh !== null);
  const has = (pick: (n: Night) => number | null) => nights.some((n) => pick(n) !== null);
  const hasStages = has((n) => n.deep) || has((n) => n.light) || has((n) => n.rem);
  const hasSleep = has((n) => n.score) || has((n) => n.hours) || hasStages || has((n) => n.hrv) || has((n) => n.restingHr);
  const hasDays = dayRows.some((d) => d.steps !== null || d.bbHigh !== null);
  const avg = (pick: (n: Night) => number | null) => mean(nights.map(pick));

  const zoneTotals = [0, 1, 2, 3, 4].map((z) => workouts.reduce((s, w) => s + (w.zones[z] ?? 0), 0));
  const zoneSum = zoneTotals.reduce((a, b) => a + b, 0);
  const totalKm = workouts.reduce((s, w) => s + (w.km ?? 0), 0);
  const totalTime = workouts.reduce((s, w) => s + (w.seconds ?? 0), 0);
  const totalLoad = workouts.reduce((s, w) => s + (w.load ?? 0), 0);

  return (
    <div className={styles.scope}>
      <div className={`container ${styles.main}`}>
        <header className={styles.header}>
          <div>
            <p className={styles.siteNote}>
              Built with garminconnect-js. <Link href="/claude">Prefer to ask Claude about it?</Link>
            </p>
            <h1>Your last {days} days</h1>
            <p className={styles.sub}>{name}, {shortDate(start)} to {shortDate(end)}</p>
          </div>
          <div className={styles.controls}>
            <nav className={styles.ranges} aria-label="Date range">
              {RANGES.map((r) => (
                <Link key={r} href={`/demo?days=${r}`} aria-current={r === days ? "page" : undefined}>
                  {r} days
                </Link>
              ))}
            </nav>
            {garmin && (
              <form action={logout}>
                <button className={styles.ghost}>{MODE === "public" ? "Sign out" : "Disconnect"}</button>
              </form>
            )}
          </div>
        </header>

        {!garmin && MODE === "public" && (
          <div className={styles.demo}>
            <p>
              <strong>This is sample data.</strong> Sign in with your Garmin account to see your own. Your
              password goes to Garmin only and is never stored; your session stays in your browser.
            </p>
            <Link href="/demo?signin" className="btn btn-primary">Sign in with Garmin</Link>
          </div>
        )}
        {!garmin && MODE === "demo" && (
          <p className={styles.demo}>
            <strong>This is sample data.</strong> To chart your own, start from the{" "}
            <a href="https://github.com/DynamicsNinja/garminconnect-nextjs-starter">template</a>; it runs
            locally and signs in to your own Garmin account.
          </p>
        )}

        {!hasSleep && !hasDays && workouts.length === 0 ? (
          <p className={styles.empty}>
            No data between {start} and {end}. Wear your watch, sync it in Garmin Connect, then reload.
          </p>
        ) : (
          <>
            <section className={styles.stats} aria-label="Latest values compared with the range average">
              <Stat label="Sleep score" value={last?.score ?? null} avg={avg((n) => n.score)} days={days} />
              <Stat label="Sleep" value={last?.hours ?? null} avg={avg((n) => n.hours)} days={days} format={formatHours} />
              <Stat label="Overnight HRV" value={last?.hrv ?? null} avg={avg((n) => n.hrv)} days={days} unit="ms" />
              <Stat label="Resting heart rate" value={last?.restingHr ?? null} avg={avg((n) => n.restingHr)} days={days} unit="bpm" />
              <Stat label="Steps yesterday" value={yesterday?.steps ?? null} avg={mean(fullDays.map((d) => d.steps))} days={days} format={(v) => (v === null ? "-" : Math.round(v).toLocaleString("en"))} />
              <Stat label="Body Battery peak yesterday" value={yesterday?.bbHigh ?? null} avg={mean(fullDays.map((d) => d.bbHigh))} days={days} />
            </section>

            {hasSleep && (
              <section className={styles.section} aria-labelledby="sleep">
                <h2 id="sleep">Sleep</h2>
                <div className={styles.charts}>
                  {hasStages && <StackedColumnChart
                    title="Sleep stages"
                    dates={dates}
                    unit="hours"
                    series={[
                      { name: "Deep", values: nights.map((n) => n.deep), color: "var(--accent)" },
                      { name: "Light", values: nights.map((n) => n.light), color: "var(--z1)" },
                      { name: "REM", values: nights.map((n) => n.rem), color: "var(--accent-2)" },
                      { name: "Awake", values: nights.map((n) => n.awake), color: "var(--z4)" },
                    ]}
                  />}
                  {has((n) => n.score) && <ColumnChart title="Sleep score" dates={dates} values={nights.map((n) => n.score)} yMax={100} unit="score" />}
                </div>
              </section>
            )}

            {(hasSleep || hasDays) && (
              <section className={styles.section} aria-labelledby="recovery">
                <h2 id="recovery">Recovery</h2>
                <div className={styles.charts}>
                  {has((n) => n.hrv) && (
                    <LineChart
                      title="Overnight HRV"
                      dates={dates}
                      series={[
                        { name: "Nightly average", values: nights.map((n) => n.hrv), tone: "primary" },
                        { name: "7-day average", values: nights.map((n) => n.hrv7d), tone: "secondary" },
                      ]}
                      unit="ms"
                      wide
                    />
                  )}
                  {has((n) => n.restingHr) && (
                    <LineChart title="Resting heart rate" dates={dates} series={[{ name: "Resting heart rate", values: nights.map((n) => n.restingHr), tone: "primary" }]} unit="bpm" />
                  )}
                  {dayRows.some((d) => d.bbHigh !== null) && (
                    <StackedColumnChart
                      title="Body Battery, daily low to high"
                      dates={dates}
                      unit="level"
                      yMax={100}
                      floating
                      series={[
                        { name: "Low", values: dayRows.map((d) => d.bbLow), color: "transparent" },
                        { name: "Daily range", values: dayRows.map((d) => (d.bbHigh === null || d.bbLow === null ? null : d.bbHigh - d.bbLow)), color: "var(--z2)" },
                      ]}
                    />
                  )}
                </div>
              </section>
            )}

            {(dayRows.some((d) => d.steps !== null) || workouts.length > 0) && (
              <section className={styles.section} aria-labelledby="activity">
                <h2 id="activity">Activity</h2>
                <div className={styles.charts}>
                  {dayRows.some((d) => d.steps !== null) && (
                    <ColumnChart
                      title="Steps"
                      dates={dates}
                      values={dayRows.map((d) => d.steps)}
                      unit="steps"
                      goal={{ name: "Step goal", values: dayRows.map((d) => d.stepGoal) }}
                      wide
                    />
                  )}
                </div>

                {workouts.length > 0 && (
                  <div className={styles.training}>
                    <dl className={styles.totals}>
                      <div><dt>Workouts</dt><dd>{workouts.length}</dd></div>
                      <div><dt>Distance, all sports</dt><dd>{Math.round(totalKm)}<small> km</small></dd></div>
                      <div><dt>Time</dt><dd>{formatDuration(totalTime)}</dd></div>
                      <div><dt>Training load</dt><dd>{Math.round(totalLoad)}</dd></div>
                    </dl>
                    {zoneSum > 0 && (
                      <figure className={styles.zones}>
                        <figcaption>Time in heart-rate zones</figcaption>
                        <div className={styles.zoneBar} role="img" aria-label={zoneTotals.map((t, z) => `Zone ${z + 1}: ${formatDuration(t)}`).join(", ")}>
                          {zoneTotals.map((t, z) => t > 0 && <span key={z} style={{ flexGrow: t, background: ZONES[z] }} />)}
                        </div>
                        <ul>
                          {zoneTotals.map((t, z) => (
                            <li key={z}><span style={{ background: ZONES[z] }} aria-hidden="true" />Zone {z + 1} <strong>{formatDuration(t)}</strong></li>
                          ))}
                        </ul>
                      </figure>
                    )}
                  </div>
                )}

                {workouts.length > 0 && (
                  <div className={styles.workouts}>
                    <h3>Workouts</h3>
                    <ol>
                      {workouts.slice(0, 12).map((w) => <WorkoutRow key={w.id} w={w} />)}
                    </ol>
                    {workouts.length > 12 && (
                      <details>
                        <summary>Show all {workouts.length} workouts</summary>
                        <ol>{workouts.slice(12).map((w) => <WorkoutRow key={w.id} w={w} />)}</ol>
                      </details>
                    )}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Stat(props: { label: string; value: number | null; avg: number | null; days: number; unit?: string; format?: (v: number | null) => string }) {
  const fmt = props.format ?? ((v: number | null) => (v === null ? "-" : String(Math.round(v))));
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{props.label}</span>
      <span className={styles.statValue}>
        {fmt(props.value)}
        {props.value !== null && props.unit && <small> {props.unit}</small>}
      </span>
      {props.avg !== null && <span className={styles.statAvg}>{props.days}-day average {fmt(props.avg)}{props.unit ? ` ${props.unit}` : ""}</span>}
    </div>
  );
}

function WorkoutRow({ w }: { w: Workout }) {
  const total = w.zones.reduce((a, b) => a + b, 0);
  return (
    <li className={styles.workout}>
      <div className={styles.wHead}>
        {activityLabel(w.type) !== w.name && <span className={styles.wType}>{activityLabel(w.type)}</span>}
        <strong className={styles.wName}>{w.name}</strong>
        <span className={styles.wDate}>{w.start ? shortDate(w.start.slice(0, 10)) : ""}</span>
      </div>
      <dl className={styles.wStats}>
        {w.km !== null && <div><dt>Distance, all sports</dt><dd>{w.km.toFixed(1)} km</dd></div>}
        <div><dt>Time</dt><dd>{formatDuration(w.seconds)}</dd></div>
        {w.avgHr !== null && <div><dt>Avg HR</dt><dd>{Math.round(w.avgHr)} bpm</dd></div>}
        {w.effect !== null && <div><dt>Aerobic effect</dt><dd>{w.effect.toFixed(1)}</dd></div>}
        {w.calories !== null && <div><dt>Calories</dt><dd>{Math.round(w.calories)}</dd></div>}
      </dl>
      {total > 0 && (
        <div className={styles.wZones} role="img" aria-label={`Heart-rate zones: ${w.zones.map((t, z) => `zone ${z + 1} ${formatDuration(t)}`).join(", ")}`}>
          {w.zones.map((t, z) => t > 0 && <span key={z} style={{ flexGrow: t, background: ZONES[z] }} />)}
        </div>
      )}
    </li>
  );
}
