import { Toc } from "@/components/Toc";
import styles from "@/app/docs/docs.module.css";
import type { DocPage } from "@/lib/docs/registry";

export function DocArticle({ page }: { page: DocPage }) {
  return (
    <div className={styles.body}>
      {/* html is rendered from trusted repo sources at build time */}
      <article className="prose" dangerouslySetInnerHTML={{ __html: page.html }} />
      <Toc headings={page.headings} />
    </div>
  );
}
