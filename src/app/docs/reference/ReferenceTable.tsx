"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "../docs.module.css";

export interface RefRow { name: string; category: string; description: string; safety: string; connectPlus: boolean }
const SAFETY = ["read", "write", "destructive"];

export function ReferenceTable({ rows, categories }: { rows: RefRow[]; categories: string[] }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const category = sp.get("category") ?? "";
  const safety = sp.get("safety") ?? "";
  const plus = sp.get("connectplus") === "1";
  const q = sp.get("q") ?? "";

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value); else next.delete(key);
    const s = next.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };
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
        {chip("all", !category, () => set("category", null))}
        {categories.map((c) => chip(c, category === c, () => set("category", category === c ? null : c)))}
      </div>
      <div className={styles.chips} role="group" aria-label="Safety">
        <span className={styles.chipLabel}>Safety</span>
        {SAFETY.map((s) => chip(s, safety === s, () => set("safety", safety === s ? null : s)))}
        {chip("Connect+", plus, () => set("connectplus", plus ? null : "1"))}
      </div>
      <input className={styles.filter} aria-label="Filter methods" placeholder="Filter methods…" value={q}
        onChange={(e) => set("q", e.target.value || null)} />
      <p aria-live="polite">{shown.length} of {rows.length} shown</p>
      <div className={styles.tableWrap}>
        <table>
          <thead><tr><th>Method</th><th>Description</th><th>Tags</th></tr></thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.name}>
                <td><Link href={`/docs/reference/${r.name}`} className="mono">{r.name}</Link></td>
                <td>{r.description}</td>
                <td>
                  <span className={`${styles.tag} tag-safety`}>{r.safety}</span>
                  {r.connectPlus && <span className={styles.tag}>Connect+</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
