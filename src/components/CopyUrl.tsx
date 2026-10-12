"use client";
import { useEffect, useRef, useState } from "react";
import { copyText } from "@/lib/copy";
import styles from "./CopyUrl.module.css";

/** A read-only value with a Copy button: the connector URL, or a command such as `npm i`. */
export function CopyUrl({ url, id, label = "Connector URL" }: { url: string; id?: string; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"" | "copied" | "selected">("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function onCopy() {
    const result = await copyText(url, {
      clipboard: typeof navigator !== "undefined" ? navigator.clipboard : undefined,
      select: () => {
        input.current?.focus();
        input.current?.select();
      },
    });
    setStatus(result);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus(""), 2000);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <input ref={input} id={id} className={`${styles.input} mono`} readOnly value={url} aria-label={label} onFocus={(e) => e.currentTarget.select()} />
        {/* Feedback shows in the button itself. All three labels share one grid cell, so the button
            keeps the width of the widest and nothing around it moves. */}
        <button type="button" className={styles.button} onClick={onCopy} data-status={status || "idle"} aria-label="Copy">
          <span className={styles.label} data-for="idle">Copy</span>
          <span className={styles.label} data-for="copied" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Copied
          </span>
          <span className={styles.label} data-for="selected" aria-hidden="true">Selected</span>
        </button>
      </div>
      <span className={styles.srOnly} aria-live="polite">
        {status === "copied" ? "Copied" : status === "selected" ? "Selected: press Ctrl/⌘ C to copy" : ""}
      </span>
    </div>
  );
}
