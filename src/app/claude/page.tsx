import type { Metadata } from "next";
import Link from "next/link";
import { CopyUrl } from "@/components/CopyUrl";
import { ClaudeTabs } from "./ClaudeTabs";
import { TABS, type TabId } from "./tabs";
import styles from "./claude.module.css";

const URL_ = "https://garmin.ficdev.xyz/mcp";

export function generateMetadata(): Metadata {
  return { title: "Use Garmin in Claude", description: "Add the Garmin connector to Claude on the web, phone, desktop or Claude Code. Free, no install." };
}

const webSteps = (
  <ol>
    <li>In claude.ai: Settings → Connectors → Add custom connector. Name it &ldquo;Garmin&rdquo; and paste the URL above.</li>
    <li>A Garmin sign-in window opens. Sign in, with a code if Garmin asks.</li>
    <li>Ask something. The Claude phone app picks up the connector from your account automatically.</li>
  </ol>
);

const panels: Record<TabId, React.ReactNode> = {
  web: webSteps,
  desktop: (
    <>
      {webSteps}
      <p>Claude Desktop uses your account&apos;s connectors, so the steps are the same. Prefer it to run on your computer? <Link href="/docs/self-host">Use the Desktop Extension</Link>.</p>
    </>
  ),
  code: (
    <>
      <p>Add the server:</p>
      <pre><code>claude mcp add --transport http garmin {URL_}</code></pre>
      <p>Then run <code>/mcp</code> inside Claude Code to sign in.</p>
    </>
  ),
  other: <p>Add a streamable-HTTP MCP server with this URL; your client opens the Garmin sign-in when it first connects.</p>,
};

const ASK = [
  { title: "Sleep & recovery", prompts: ["How did I sleep this week compared with last week?", "What has my HRV done over the last month?"] },
  { title: "Training", prompts: ["Am I ready to train hard today?", "What is my training status, and what do my race predictions look like?"] },
  { title: "Workouts", prompts: ["Build 6×400 m at 4:10/km with 2-minute recoveries and schedule it for Thursday", "Make a 45-minute strength session for legs and add it to my workouts"] },
  { title: "Body & health", prompts: ["Log 72.4 kg for this morning", "Show my weight and resting heart rate trend for the past 90 days"] },
];

const FAQ = [
  ["Is it official?", "No, it isn't affiliated with Garmin."],
  ["Does it cost anything?", "It's free."],
  ["Can Claude change my data?", "Some tools write, such as creating workouts or logging weight. Claude asks before destructive ones."],
  ["Why does sign-in take a few seconds?", "Garmin's sign-in takes several steps."],
  ["Does it work with two-factor?", "Yes."],
];

export default async function ClaudePage({ searchParams }: PageProps<"/claude">) {
  const raw = (await searchParams).app;
  const v = Array.isArray(raw) ? raw[0] : raw;
  const initial = TABS.find((t) => t.id === v)?.id ?? "web";
  return (
    <div className="container">
      <header className={styles.head}>
        <h1>Use your Garmin data in Claude</h1>
        <p>Free · no install · web, phone and desktop</p>
        <div><CopyUrl url={URL_} /></div>
      </header>
      <ClaudeTabs initial={initial} panels={panels} />

      <section id="ask" className={styles.section}>
        <h2>Things to ask</h2>
        <div className={styles.groups}>
          {ASK.map((g) => (
            <div key={g.title} className={styles.group}>
              <h3>{g.title}</h3>
              <ul>{g.prompts.map((p) => <li key={p}>&ldquo;{p}&rdquo;</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      <section id="privacy" className={styles.section}>
        <h2>What&apos;s stored</h2>
        <ul>
          <li>Your password goes to Garmin once and is never stored.</li>
          <li>Your Garmin session lives encrypted inside the connection token your Claude account keeps.</li>
          <li>The server keeps one row per connection: a random id, a scrambled reference to your Garmin account, the app&apos;s name, and timestamps. It&apos;s deleted after 35 days unused.</li>
        </ul>
        <p>Read the full <Link href="/privacy">privacy policy</Link>.</p>
      </section>

      <section id="disconnect" className={styles.section}>
        <h2>Disconnect</h2>
        <p>Remove the connector in Claude, or tick &ldquo;Disconnect my other Garmin connections&rdquo; next time you sign in.</p>
      </section>

      <section id="faq" className={`${styles.section} ${styles.faq}`}>
        <h2>FAQ</h2>
        {FAQ.map(([q, a]) => (
          <details key={q}><summary>{q}</summary><p>{a}</p></details>
        ))}
      </section>
    </div>
  );
}
