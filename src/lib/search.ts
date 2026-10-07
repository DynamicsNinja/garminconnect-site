import "server-only";
import { getDocPages } from "@/lib/docs/registry";
import { methods } from "@/lib/reference";
import { SEARCH_OPTIONS, type SearchDoc } from "./search-options";

export { SEARCH_OPTIONS };
export type { SearchDoc };

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " };

function plain(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#?\w+);/g, (m, e: string) => ENTITIES[e] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

const HEADING = /<h([23])\b[^>]*?(?:\sid="([^"]*)")?[^>]*>([\s\S]*?)<\/h\1>/g;

export async function buildSearchDocs(): Promise<SearchDoc[]> {
  const docs: SearchDoc[] = [];
  const ids = new Set<string>();
  const push = (d: Omit<SearchDoc, "id">) => {
    let id = d.route, n = 2;
    while (ids.has(id)) id = `${d.route}~${n++}`;
    ids.add(id);
    docs.push({ id, ...d });
  };
  for (const page of (await getDocPages()).values()) {
    const marks = [...page.html.matchAll(HEADING)].map((m) => ({
      start: m.index!, end: m.index! + m[0].length, id: m[2], text: plain(m[3]!),
    }));
    const intro = plain(page.html.slice(0, marks[0]?.start ?? page.html.length)).slice(0, 600);
    if (intro) push({ route: page.route, title: page.title, text: intro, kind: "guide" });
    marks.forEach((m, i) => {
      const body = plain(page.html.slice(m.end, marks[i + 1]?.start ?? page.html.length)).slice(0, 600);
      push({ route: m.id ? `${page.route}#${m.id}` : page.route, title: page.title, section: m.text, text: body, kind: "guide" });
    });
  }
  for (const m of methods()) {
    push({ route: `/docs/reference/${m.name}`, title: m.name, text: `${m.description} ${m.category} ${m.toolName}`, kind: "method" });
  }
  return docs;
}
