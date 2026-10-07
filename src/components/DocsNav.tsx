import { getDocPages } from "@/lib/docs/registry";
import { NavLink } from "@/components/NavLink";
import styles from "@/app/docs/docs.module.css";

const GUIDES: [string, string][] = [
  ["/docs", "Getting started"],
  ["/docs/authentication", "Authentication"],
  ["/docs/examples", "Code examples"],
  ["/docs/workouts", "Building workouts"],
  ["/docs/self-host", "Run it yourself"],
];

export async function DocsNav() {
  const pages = await getDocPages();
  const api = [...pages.values()].filter((p) => p.route.startsWith("/docs/api/"));
  return (
    <details className={`docs-menu ${styles.menu}`}>
      <summary>Docs menu</summary>
      <nav aria-label="Documentation" className={styles.nav}>
        <p className={styles.navHead}>Guides</p>
        <ul>{GUIDES.map(([h, t]) => <li key={h}><NavLink href={h}>{t}</NavLink></li>)}</ul>
        <p className={styles.navHead}>API</p>
        <ul>
          <li><NavLink href="/docs/api">API by category</NavLink></li>
          {api.map((p) => <li key={p.route}><NavLink href={p.route}>{p.title}</NavLink></li>)}
        </ul>
        <p className={styles.navHead}>Reference</p>
        <ul><li><NavLink href="/docs/reference">All methods</NavLink></li></ul>
        <ul className={styles.navLast}><li><NavLink href="/docs/changelog">Changelog</NavLink></li></ul>
      </nav>
    </details>
  );
}
