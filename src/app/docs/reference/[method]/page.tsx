import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { method, methods } from "@/lib/reference";
import styles from "../../docs.module.css";

export const dynamicParams = false;
export const dynamic = "force-static";

export function generateStaticParams() {
  return methods().map((m) => ({ method: m.name }));
}

export async function generateMetadata({ params }: PageProps<"/docs/reference/[method]">): Promise<Metadata> {
  return { title: (await params).method };
}

export default async function MethodPage({ params }: PageProps<"/docs/reference/[method]">) {
  const m = method((await params).method);
  if (!m) notFound();
  return (
    <div>
      <p className={styles.crumbs}><Link href="/docs/reference">Back to all methods</Link></p>
      <h1 className={`mono ${styles.title}`}>{m.name}</h1>
      <p>
        <span className={`${styles.tag} tag-safety`}>{m.safety}</span>
        {m.connectPlus && <span className={styles.tag}>Connect+</span>}
      </p>
      <p>{m.description}</p>
      <pre className={`mono ${styles.sig}`}><code>{m.signature}</code></pre>
      {m.params.length > 0 && (
        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>Parameter</th><th>Type</th><th>Optional</th><th>Description</th></tr></thead>
            <tbody>
              {m.params.map((p) => (
                <tr key={p.name}>
                  <td className="mono">{p.name}</td><td className="mono">{p.type}</td>
                  <td>{p.optional ? "yes" : "no"}</td><td>{p.description ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p>In Claude this is the <code>{m.toolName}</code> tool.</p>
      {m.categoryRoute && <p><Link href={m.categoryRoute}>Guide: {m.category}</Link></p>}
    </div>
  );
}
