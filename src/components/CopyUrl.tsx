"use client";
import { useEffect, useRef, useState } from "react";
import { copyText } from "@/lib/copy";
import styles from "./CopyUrl.module.css";

export function CopyUrl({ url }: { url: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
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
    setStatus(result === "copied" ? "Copied" : "Selected: press Ctrl/⌘ C");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus(""), 2000);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <input ref={input} className={`${styles.input} mono`} readOnly value={url} aria-label="Connector URL" onFocus={(e) => e.currentTarget.select()} />
        <button type="button" className="btn btn-ghost" onClick={onCopy}>Copy</button>
      </div>
      <span className={styles.status} aria-live="polite">{status}</span>
    </div>
  );
}
