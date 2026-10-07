import styles from "@/app/docs/docs.module.css";

export function Toc({ headings }: { headings: { depth: number; id: string; text: string }[] }) {
  const items = headings.filter((h) => h.depth === 2 || h.depth === 3);
  if (items.length === 0) return <aside className={styles.tocSlot} />;
  return (
    <aside className={styles.tocSlot}>
      <nav aria-label="On this page" className={styles.toc}>
        <p className={styles.tocTitle}>On this page</p>
        <ul>
          {items.map((h) => (
            <li key={h.id} className={h.depth === 3 ? styles.tocSub : undefined}>
              <a href={`#${h.id}`}>{h.text}</a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
