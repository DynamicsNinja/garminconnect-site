import Link from "next/link";
import type { Metadata } from "next";
import styles from "./not-found.module.css";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className={`container ${styles.wrap}`}>
      <p className={styles.code}>404</p>
      <h1>Page not found</h1>
      <p className={styles.lead}>That page doesn&apos;t exist, or it moved when the docs were reorganised.</p>
      <nav aria-label="Where to next" className={styles.links}>
        <Link href="/" className="btn btn-primary">Home</Link>
        <Link href="/docs" className="btn btn-ghost">Docs</Link>
        <Link href="/claude" className="btn btn-ghost">Use it in Claude</Link>
      </nav>
    </div>
  );
}
