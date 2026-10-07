import Link from "next/link";
import { CopyUrl } from "@/components/CopyUrl";
import { methods } from "@/lib/reference";
import styles from "./page.module.css";

export default function Home() {
  const count = methods().length;
  return (
    <div className="container">
      <section className={styles.hero}>
        <h1>Garmin Connect for Claude and for your code</h1>
        <p>Ask Claude about your sleep, training and workouts, or build with a zero-dependency TypeScript client.</p>
      </section>
      <div className={styles.doors}>
        <section className={`${styles.card} ${styles.primary}`} aria-labelledby="door-claude">
          <h2 id="door-claude">Use it in Claude <span className={styles.badge}>no install</span></h2>
          <CopyUrl url="https://garmin.ficdev.xyz/mcp" />
          <p className={styles.steps}>1 Add custom connector · 2 Sign in to Garmin · 3 Ask</p>
          <Link href="/claude" className={`btn btn-primary ${styles.cta}`}>Set it up</Link>
        </section>
        <section className={styles.card} aria-labelledby="door-build">
          <h2 id="door-build">Build with it</h2>
          <pre><code>npm i garminconnect-js</code></pre>
          <p className={styles.meta}>{count} methods · TypeScript · Node 18+</p>
          <Link href="/docs" className={`btn btn-ghost ${styles.cta}`}>Read the docs</Link>
        </section>
      </div>
      <div className={styles.tiles}>
        <Link href="/claude#ask" className={styles.tile}><strong>What can I ask?</strong><span>Example prompts for sleep, training, workouts and body data.</span></Link>
        <Link href="/docs/workouts" className={styles.tile}><strong>Workout builder</strong><span>Describe a session once and get a valid Garmin workout.</span></Link>
        <Link href="/demo" className={styles.tile}><strong>Live demo</strong><span>Try the client against sample data, right in your browser.</span></Link>
      </div>
    </div>
  );
}
