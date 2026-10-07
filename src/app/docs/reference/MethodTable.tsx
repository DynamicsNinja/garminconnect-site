import Link from "next/link";
import styles from "../docs.module.css";

export interface RefRow { name: string; category: string; description: string; safety: string; connectPlus: boolean }

/** The count line and the table. Shared by the filterable table and its no-JS fallback. */
export function MethodTable({ shown, total }: { shown: RefRow[]; total: number }) {
  return (
    <>
      <p aria-live="polite">{shown.length} of {total} shown</p>
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
    </>
  );
}
