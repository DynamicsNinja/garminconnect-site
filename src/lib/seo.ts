import type { Metadata } from "next";
import { SITE_URL } from "./site";

const MAX = 160;
const EM_DASH = new RegExp(`\\s*${String.fromCharCode(0x2014)}\\s*`, "g");
const OG_IMAGE = "/brand/social-preview.png";

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Tag-free, entity-decoded, single-spaced text, without markdown emphasis or em dashes. */
export function plainText(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e: string) =>
      e[0] === "#" ? String.fromCodePoint(parseInt(e.slice(e[1] === "x" ? 2 : 1), e[1] === "x" ? 16 : 10)) : ENTITIES[e] ?? m)
    .replace(/\*\*|__|`/g, "")
    .replace(EM_DASH, ", ")
    .replace(/\s+/g, " ")
    .replace(/ ([,.;:!?])/g, "$1")
    .trim();
}

/** Cuts at a word boundary so the result fits a search snippet. */
export function clip(s: string, max = MAX): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:.(-]+$/, "") + "…";
}

/** The first real paragraph of rendered docs HTML, as a meta description. Skips badge rows and one-liners. */
export function describeHtml(html: string): string | undefined {
  for (const m of html.matchAll(/<p>([\s\S]*?)<\/p>/g)) {
    const text = plainText(m[1]!);
    if (text.length >= 40) return clip(text);
  }
  return undefined;
}

/** Per-page title, description and canonical. Open Graph is rebuilt in full because Next replaces it, not merges it. */
export function pageMeta({ title, description, path }: { title?: string; description?: string; path: string }): Metadata {
  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    alternates: { canonical: path },
    openGraph: { ...(title ? { title } : {}), ...(description ? { description } : {}), url: path, images: [OG_IMAGE] },
  };
}

export const absolute = (path: string) => `${SITE_URL}${path === "/" ? "" : path}`;

export function breadcrumbs(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, item: absolute(t.path) })),
  };
}
