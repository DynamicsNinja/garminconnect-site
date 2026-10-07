"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "../docs.module.css";
import { MethodTable, type RefRow } from "./MethodTable";

export type { RefRow };
const SAFETY = ["read", "write", "destructive"];
type Filters = { category: string; safety: string; plus: boolean; q: string };

export function ReferenceTable({ rows, categories }: { rows: RefRow[]; categories: string[] }) {
  // The URL seeds the filters once; after that local state is the source of truth, so typing never
  // waits on a navigation (a router.replace per keystroke dropped characters and moved the caret).
  const sp = useSearchParams();
  const [f, setF] = useState<Filters>(() => ({
    category: sp.get("category") ?? "",
    safety: sp.get("safety") ?? "",
    plus: sp.get("connectplus") === "1",
    q: sp.get("q") ?? "",
  }));

  const update = (patch: Partial<Filters>) => {
    const next = { ...f, ...patch };
    setF(next);
    // replaceState: Next keeps useSearchParams in sync without a server round-trip.
    const url = new URL(window.location.href);
    const params: [string, string][] = [["category", next.category], ["safety", next.safety], ["connectplus", next.plus ? "1" : ""], ["q", next.q]];
    for (const [k, v] of params) { if (v) url.searchParams.set(k, v); else url.searchParams.delete(k); }
    window.history.replaceState(window.history.state, "", url);
  };

  const { category, safety, plus, q } = f;
  const needle = q.trim().toLowerCase();
  const shown = rows.filter((r) =>
    (!category || r.category === category) && (!safety || r.safety === safety) && (!plus || r.connectPlus) &&
    (!needle || r.name.toLowerCase().includes(needle) || r.description.toLowerCase().includes(needle)));

  const chip = (label: string, on: boolean, click: () => void) => (
    <button key={label} type="button" className={styles.chip} aria-pressed={on} onClick={click}>{label}</button>
  );
  return (
    <div>
      <div className={styles.chips} role="group" aria-label="Category">
        <span className={styles.chipLabel}>Category</span>
        {chip("all", !category, () => update({ category: "" }))}
        {categories.map((c) => chip(c, category === c, () => update({ category: category === c ? "" : c })))}
      </div>
      <div className={styles.chips} role="group" aria-label="Safety">
        <span className={styles.chipLabel}>Safety</span>
        {SAFETY.map((s) => chip(s, safety === s, () => update({ safety: safety === s ? "" : s })))}
        {chip("Connect+", plus, () => update({ plus: !plus }))}
      </div>
      <input className={styles.filter} aria-label="Filter methods" placeholder="Filter methods…" value={q}
        onChange={(e) => update({ q: e.target.value })} />
      <MethodTable shown={shown} total={rows.length} />
    </div>
  );
}
