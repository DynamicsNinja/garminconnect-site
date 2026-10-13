import Link from "next/link";
import { Toc } from "@/components/Toc";
import { hasH1, methodsByRoute, methodsForRoute } from "@/components/doc-data";
import styles from "@/app/docs/docs.module.css";
import type { DocPage } from "@/lib/docs/registry";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbs } from "@/lib/seo";

function MethodList({ names }: { names: string[] }) {
  return (
    <ul className={styles.methodList}>
      {names.map((n) => <li key={n}><Link href={`/docs/reference/${n}`} className="mono">{n}</Link></li>)}
    </ul>
  );
}

function trail(page: DocPage) {
  if (page.route === "/docs") return null;
  return [
    { name: "Docs", path: "/docs" },
    ...(page.route.startsWith("/docs/api/") ? [{ name: "API by category", path: "/docs/api" }] : []),
    { name: page.title, path: page.route },
  ];
}

export function DocArticle({ page }: { page: DocPage }) {
  const own = methodsForRoute(page.route);
  const groups = page.route === "/docs/api" ? methodsByRoute() : [];
  const crumbs = trail(page);
  return (
    <div className={styles.body}>
      {crumbs && <JsonLd data={breadcrumbs(crumbs)} />}
      <div className={styles.main}>
        {!hasH1(page.html) && <h1 className={styles.pageTitle}>{page.title}</h1>}
        {/* html is rendered from trusted repo sources at build time */}
        <article className="prose" dangerouslySetInnerHTML={{ __html: page.html }} />
        {own.length > 0 && (
          <section className="prose" aria-labelledby="methods-in-category">
            <h2 id="methods-in-category">Methods in this category</h2>
            <MethodList names={own} />
          </section>
        )}
        {groups.length > 0 && (
          <section className="prose" aria-labelledby="methods-by-category">
            <h2 id="methods-by-category">Methods by category</h2>
            {groups.map((g) => (
              <div key={g.route}>
                <h3><Link href={g.route}>{g.route.split("/").pop()}</Link> ({g.names.length})</h3>
                <MethodList names={g.names} />
              </div>
            ))}
          </section>
        )}
      </div>
      <Toc headings={page.headings} />
    </div>
  );
}
