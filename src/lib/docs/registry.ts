import "server-only";
import GithubSlugger from "github-slugger";
import { README_PAGES, README_REDIRECTS, splitReadme, normalizeHeading } from "./readme";
import { apiCategoryFiles, libVersion, readSource } from "./sources";
import { renderMarkdown, type Rendered } from "./render";
import type { LinkContext, LinkTarget } from "./links";

export interface DocPage { route: string; title: string; html: string; headings: Rendered["headings"]; sourceRepoPath: string }

let cache: Promise<{ pages: Map<string, DocPage>; links: Map<string, LinkTarget[]> }> | null = null;

function readmeAnchorRoutes(readme: string): Map<string, string | null> {
  // Every README heading's GitHub slug → the route its level-2 section landed on (null = GitHub).
  const slugger = new GithubSlugger();
  const map = new Map<string, string | null>();
  let section: string | null = null;
  let inFence = false;
  for (const line of readme.split(/\r?\n/)) {
    if (/^```/.test(line)) inFence = !inFence;
    const m = !inFence && /^(#{1,6}) (.+)$/.exec(line);
    if (!m) continue;
    const text = m[2]!.replace(/<a [^>]*><\/a>/g, "");
    if (m[1] === "##") section = normalizeHeading(text);
    const page = README_PAGES.find((p) => section && (p.sections as readonly string[]).includes(section));
    map.set(slugger.slug(text), page?.route ?? (section ? README_REDIRECTS[section] ?? null : null));
    for (const id of [...m[2]!.matchAll(/<a id="([^"]+)"><\/a>/g)].map((x) => x[1]!)) map.set(id, page?.route ?? null);
  }
  return map;
}

async function build() {
  const version = libVersion();
  const readme = readSource("README.md").text;
  const anchors = readmeAnchorRoutes(readme);
  const routeForFile: LinkContext["routeForFile"] = (p, a) => {
    if (p === "README.md") return a ? anchors.get(a) ?? null : "/docs";
    if (p === "WORKOUTS.md") return "/docs/workouts";
    if (p === "CHANGELOG.md") return "/docs/changelog";
    if (p === "docs/api/README.md") return "/docs/api";
    if (/^docs\/api\/[\w-]+\.md$/.test(p)) return `/docs/api/${p.slice(9, -3)}`;
    if (p === "mcp/README.md") return "/docs/self-host";
    return null;
  };
  const redirected = new Set(Object.values(README_REDIRECTS));
  const dropAnchor = (p: string, route: string) => p === "README.md" && redirected.has(route);
  const ctx: LinkContext = { version, routeForFile, dropAnchor };
  const pages = new Map<string, DocPage>();
  const links = new Map<string, LinkTarget[]>();
  const add = async (route: string, title: string, md: string, repoPath: string) => {
    const r = await renderMarkdown(md, repoPath, ctx);
    pages.set(route, { route, title, html: r.html, headings: r.headings, sourceRepoPath: repoPath });
    links.set(route, r.links);
  };
  const sections = splitReadme(readme);
  for (const p of README_PAGES) {
    const missing = p.sections.filter((s) => !sections.has(s));
    if (missing.length) throw new Error(`README section(s) missing for ${p.route}: ${missing.join(", ")}`);
    await add(p.route, p.title, p.sections.map((s) => sections.get(s)!).join("\n\n"), "README.md");
  }
  await add("/docs/workouts", "Building workouts", readSource("WORKOUTS.md").text, "WORKOUTS.md");
  await add("/docs/api", "API by category", readSource("docs/api/README.md").text, "docs/api/README.md");
  for (const f of apiCategoryFiles()) {
    const md = readSource(f).text;
    await add(`/docs/api/${f.slice(9, -3)}`, /^# (.+)$/m.exec(md)?.[1] ?? f, md, f);
  }
  await add("/docs/self-host", "Run it yourself", readSource("mcp/README.md").text, "mcp/README.md");
  await add("/docs/changelog", "Changelog", readSource("CHANGELOG.md").text, "CHANGELOG.md");
  const problems = checkLinks(pages, links);
  if (problems.length) throw new Error(`Broken docs links:\n${problems.join("\n")}`);
  return { pages, links };
}

function load() {
  // A rejected build must not stay cached, so `next dev` recovers once the docs are fixed.
  return (cache ??= build().catch((e: unknown) => { cache = null; throw e; }));
}
export function getDocPages() { return load().then((x) => x.pages); }
export function getAllLinks() { return load().then((x) => x.links); }
export async function getDocPage(route: string): Promise<DocPage> {
  const page = (await getDocPages()).get(route);
  if (!page) throw new Error(`No doc page ${route}`);
  return page;
}

export function checkLinks(pages: Map<string, DocPage>, links: Map<string, LinkTarget[]>): string[] {
  const problems: string[] = [];
  const known = new Set(["/docs/reference", "/claude", "/demo", "/privacy", "/"]);
  for (const [from, list] of links) for (const l of list) {
    if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(l.route) || known.has(l.route)) continue;
    const page = pages.get(l.route);
    if (!page) { problems.push(`${from} → ${l.route} (no such page)`); continue; }
    if (l.anchor && !page.headings.some((h) => h.id === l.anchor) && !page.html.includes(`id="${l.anchor}"`) && !page.html.includes(`name="${l.anchor}"`)) {
      problems.push(`${from} → ${l.route}#${l.anchor} (no such anchor)`);
    }
  }
  return problems;
}
