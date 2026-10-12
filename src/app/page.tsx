import Link from "next/link";
import { codeToHtml } from "shiki";
import { methods } from "@/lib/reference";
import { AskPreview } from "@/components/home/AskPreview";
import { HeroSwitch } from "@/components/home/HeroSwitch";
import "./docs/shiki.css";
import styles from "./page.module.css";

const STEPS = [
  { title: "Add a custom connector", body: "In Claude, open Settings, then Connectors, and paste the URL above." },
  { title: "Sign in to Garmin", body: "A Garmin window opens. Sign in, with a code if Garmin asks for one." },
  { title: "Ask", body: "Ask about your sleep, training or workouts. The connector works in the phone app too." },
];

// Tool names are the connector's own, so people see what Claude will call.
const ASK = [
  { topic: "Sleep and recovery", items: [
    { q: "How did I sleep this week compared with last week?", tools: ["get_sleep_data"] },
    { q: "What has my HRV done over the last month?", tools: ["get_hrv_data_range"] },
  ] },
  { topic: "Training", items: [
    { q: "Am I ready to train hard today?", tools: ["get_training_readiness"] },
    { q: "What do my race predictions look like?", tools: ["get_race_predictions"] },
  ] },
  { topic: "Workouts", items: [
    { q: "Build 6×400 m at 4:10/km with 2-minute recoveries and schedule it for Thursday", tools: ["create_workout", "schedule_workout"] },
  ] },
  { topic: "Body", items: [
    { q: "Log 72.4 kg for this morning", tools: ["add_weigh_in"] },
    { q: "Show my weight and resting heart rate for the past 90 days", tools: ["get_weigh_ins", "get_rhr_daily"] },
  ] },
];

const SAMPLE = `import { Garmin, GarminClient } from "garminconnect-js";

const client = new GarminClient();
await client.login(email, password);

const garmin = new Garmin(client);
const sleep = await garmin.getSleepData(date);
const hrv = await garmin.getHrvData(date);`;

export default async function Home() {
  const count = methods().length;
  const code = await codeToHtml(SAMPLE, { lang: "ts", themes: { light: "github-light", dark: "github-dark" }, defaultColor: false });
  return (
    <>
      <HeroSwitch count={count} code={code}><AskPreview bare /></HeroSwitch>

      <section className={`container ${styles.section}`} aria-labelledby="steps">
        <h2 id="steps">Set up in three steps</h2>
        <ol className={styles.steps}>
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className={styles.num} aria-hidden="true">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
        <p className={styles.more}>Using Claude Code or another MCP client? <Link href="/claude?app=code">See the setup for each app</Link>.</p>
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="ask">
        <div className={styles.sectionHead}>
          <h2 id="ask">What you can ask</h2>
          <p>Plain questions work. Claude picks the right Garmin tools and shows you which ones it used.</p>
        </div>
        <div className={styles.ask}>
          {ASK.map((g) => (
            <div key={g.topic} className={styles.askGroup}>
              <h3>{g.topic}</h3>
              <ul>
                {g.items.map((it) => (
                  <li key={it.q}>
                    <q>{it.q}</q>
                    <span className={styles.tools}>{it.tools.map((t) => <code key={t}>{t}</code>)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className={styles.more}><Link href="/claude#ask">More things to ask</Link></p>
      </section>

      <section id="build" className={styles.build} aria-labelledby="build-title">
        <div className={`container ${styles.buildInner}`}>
          <div className={styles.buildCopy}>
            <h2 id="build-title">Build with it</h2>
            <p>
              The same data, in your own code. A typed TypeScript client for Garmin Connect with no runtime
              dependencies, plus a workout builder that turns a short description into a valid Garmin workout.
            </p>
            <dl className={styles.facts}>
              <div><dt>{count}</dt><dd>methods</dd></div>
              <div><dt>0</dt><dd>dependencies</dd></div>
              <div><dt>18+</dt><dd>Node.js</dd></div>
            </dl>
            <pre className={styles.install}><code>npm i garminconnect-js</code></pre>
            <div className={styles.actions}>
              <Link href="/docs" className="btn btn-primary">Read the docs</Link>
              <Link href="/demo" className="btn btn-ghost">Try the live demo</Link>
            </div>
            <ul className={styles.links}>
              <li><Link href="/docs/reference">Method reference</Link></li>
              <li><Link href="/docs/workouts">Workout builder</Link></li>
              <li><Link href="/docs/self-host">Run the connector yourself</Link></li>
            </ul>
          </div>
          {/* code is highlighted at build time from the constant above */}
          <div className={styles.code} dangerouslySetInnerHTML={{ __html: code }} />
        </div>
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="privacy-title">
        <div className={styles.sectionHead}>
          <h2 id="privacy-title">Your data stays yours</h2>
          <p>Everything is open source, so you can check these against the code.</p>
        </div>
        <ul className={styles.privacy}>
          <li><h3>Your password isn&apos;t kept</h3><p>It goes to Garmin once, when you sign in, and is never stored.</p></li>
          <li><h3>Your data isn&apos;t kept</h3><p>Garmin data passes straight through to Claude. The server doesn&apos;t save it.</p></li>
          <li><h3>Unused connections expire</h3><p>The one record per connection is deleted after 35 days without use.</p></li>
        </ul>
        <p className={styles.more}><Link href="/privacy">Read the privacy page</Link></p>
      </section>
    </>
  );
}
