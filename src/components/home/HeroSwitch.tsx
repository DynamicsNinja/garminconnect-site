"use client";
import Link from "next/link";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import { CopyUrl } from "@/components/CopyUrl";
import styles from "@/app/page.module.css";

type Side = "claude" | "code";
const SIDES: { id: Side; label: string }[] = [
  { id: "claude", label: "In Claude" },
  { id: "code", label: "In your code" },
];

/**
 * Two versions of one slot, layered in the same grid cell. The slot keeps the size of the larger
 * version, so switching sides changes the words and never the layout. The inactive version is
 * hidden from assistive tech and can't be focused.
 */
function Swap({ side, claude, code, className }: { side: Side; claude: ReactNode; code: ReactNode; className?: string }) {
  return (
    <span className={`${styles.swap} ${className ?? ""}`}>
      <span data-layer="claude" data-on={side === "claude"} aria-hidden={side !== "claude"} inert={side !== "claude"}>{claude}</span>
      <span data-layer="code" data-on={side === "code"} aria-hidden={side !== "code"} inert={side !== "code"}>{code}</span>
    </span>
  );
}

/**
 * The landing hero: the same Garmin data, in Claude or in your own code. One layout serves both
 * sides; the field, buttons and preview card stay put while their contents crossfade. The Claude
 * preview comes in as `children` (a Server Component), the highlighted code sample as HTML.
 */
export function HeroSwitch({ count, code, children }: { count: number; code: string; children: ReactNode }) {
  const [side, setSideState] = useState<Side>("claude");
  const [touched, setTouched] = useState(false);
  const setSide = (next: Side) => {
    setTouched(true);
    setSideState(next);
  };

  function onKey(e: KeyboardEvent) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next = side === "claude" ? "code" : "claude";
    setSide(next);
    document.getElementById(`hero-tab-${next}`)?.focus();
  }

  return (
    <section className={`container ${styles.switchHero}`} data-touched={touched}>
      <div role="tablist" aria-label="Use your Garmin data" className={styles.switch} data-side={side}>
        {SIDES.map((s) => (
          <button
            key={s.id}
            id={`hero-tab-${s.id}`}
            type="button"
            role="tab"
            aria-selected={side === s.id}
            aria-controls="hero-panel"
            tabIndex={side === s.id ? 0 : -1}
            onClick={() => setSide(s.id)}
            onKeyDown={onKey}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div id="hero-panel" role="tabpanel" aria-labelledby={`hero-tab-${side}`} className={styles.hero} data-side={side}>
        <div className={styles.heroCopy}>
          <h1>
            <Swap side={side} className={styles.swapHead} claude="Ask Claude about your training" code="Your Garmin data in your code" />
          </h1>
          <p className={styles.lead}>
            <Swap
              side={side}
              claude="Connect your Garmin account to Claude in about a minute. Claude reads your sleep, HRV, training status and workouts, and can build and schedule new sessions for your watch."
              code={`A typed TypeScript client for Garmin Connect: ${count} methods, no runtime dependencies, and a workout builder that turns a short description into a valid Garmin workout.`}
            />
          </p>
          <div className={styles.connect}>
            <Swap
              side={side}
              className={styles.urlLabel}
              claude={<label htmlFor="connector-url">Connector URL</label>}
              code={<label htmlFor="install-command">Install</label>}
            />
            {/* Two fields with the same box in the same place: only the text inside changes. */}
            <Swap
              side={side}
              className={styles.swapBlock}
              claude={<CopyUrl url="https://garmin.ficdev.xyz/mcp" id="connector-url" />}
              code={<CopyUrl url="npm i garminconnect-js" id="install-command" label="Install command" />}
            />
          </div>
          <div className={styles.actions}>
            {/* The slot carries the button's look and the width of its longer label, so the
                button itself never fades or resizes; only the label and link change. */}
            <Swap
              side={side}
              className={`btn btn-primary ${styles.slot}`}
              claude={<Link href="/claude">Set it up</Link>}
              code={<Link href="/docs">Read the docs</Link>}
            />
            <Swap
              side={side}
              className={`btn btn-ghost ${styles.slot}`}
              claude={<Link href="/claude#ask">See what you can ask</Link>}
              code={<Link href="/demo">Try the live demo</Link>}
            />
          </div>
          <p className={styles.note}>
            <Swap side={side} claude="Free. Works on claude.ai, the phone apps and Claude Desktop." code="Node.js 18 or later. Free and open source." />
          </p>
        </div>

        {/* One card position for both previews; both layers stretch to the same size. */}
        <div className={styles.cards}>
          <div className={styles.cardLayer} data-layer="claude" data-on={side === "claude"} aria-hidden={side !== "claude"} inert={side !== "claude"}>
            {children}
          </div>
          <div className={styles.cardLayer} data-layer="code" data-on={side === "code"} aria-hidden={side !== "code"} inert={side !== "code"}>
            <figure className={styles.codeCard} aria-label="Example: reading sleep and HRV with garminconnect-js">
              {/* highlighted at build time from a constant in HomePage */}
              <div className={styles.code} dangerouslySetInnerHTML={{ __html: code }} />
              <figcaption>Example: read last night&apos;s sleep and HRV</figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
