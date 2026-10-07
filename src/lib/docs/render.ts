import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeShiki from "@shikijs/rehype";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Element, Root } from "hast";
import { resolveLink, rewriteSrcset, type LinkContext, type LinkTarget } from "./links";

const EMOJI = /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F|[\uFE0F\u200D\u20E3]/gu;

/** Removes emoji from text outside code and pre. Runs after rehype-slug, so the GitHub ids keep their emoji. */
export function stripEmoji() {
  return (tree: Root) => {
    const walk = (parent: Root | Element) => {
      if (parent.type === "element" && (parent.tagName === "pre" || parent.tagName === "code")) return;
      parent.children.forEach((c, i) => {
        if (c.type === "element") return walk(c);
        if (c.type !== "text") return;
        EMOJI.lastIndex = 0;
        if (!EMOJI.test(c.value)) return;
        EMOJI.lastIndex = 0;
        let v = c.value.replace(EMOJI, "").replace(/[ \t]{2,}/g, " ");
        if (i === 0) v = v.trimStart();
        if (i === parent.children.length - 1) v = v.trimEnd();
        c.value = v;
      });
    };
    walk(tree);
  };
}

export interface Rendered { html: string; headings: { depth: number; id: string; text: string }[]; links: LinkTarget[] }

const textOf = (n: Element): string => n.children.map((c) => (c.type === "text" ? c.value : c.type === "element" ? textOf(c) : "")).join("");

// The input is trusted: it is the docs of our own pinned npm packages, so raw HTML is allowed.
export async function renderMarkdown(markdown: string, fromRepoPath: string, ctx: LinkContext): Promise<Rendered> {
  const headings: Rendered["headings"] = [];
  const links: LinkTarget[] = [];
  const rewrite = () => (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (/^h[1-4]$/.test(node.tagName) && typeof node.properties.id === "string") {
        headings.push({ depth: Number(node.tagName[1]), id: node.properties.id, text: textOf(node).trim() });
      }
      const attr = node.tagName === "a" ? "href" : node.tagName === "img" || node.tagName === "source" ? (node.tagName === "img" ? "src" : "srcSet") : null;
      const value = attr ? node.properties[attr] : undefined;
      if (attr === "srcSet" && typeof value === "string" && value) {
        node.properties[attr] = rewriteSrcset(value, fromRepoPath, ctx);
        for (const part of String(node.properties[attr]).split(",")) links.push({ route: part.trim().split(/\s+/)[0]! });
      } else if (attr && typeof value === "string" && value) {
        const target = resolveLink(value, fromRepoPath, ctx, node.tagName === "a" ? "a" : "img");
        links.push(target);
        node.properties[attr] = target.anchor ? `${target.route}#${target.anchor}` : target.route;
        if (node.tagName === "a" && /^https?:/.test(target.route)) { node.properties.rel = ["noopener", "noreferrer"]; }
      }
    });
  };
  const file = await unified()
    .use(remarkParse).use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true }).use(rehypeRaw)
    .use(rehypeSlug).use(stripEmoji).use(rewrite)
    .use(rehypeShiki, { themes: { light: "github-light", dark: "github-dark" }, defaultColor: false })
    .use(rehypeStringify)
    .process(markdown.replace(/<!--[\s\S]*?-->/g, ""));
  return { html: String(file), headings, links };
}

/**
 * Build-time guard. The docs are trusted input, but they are rendered with raw HTML allowed and the
 * site sends no script-src CSP, so a script, an inline handler or a javascript: URL arriving with a
 * docs update must fail the build instead of shipping. Checks real tags only: in text and code `<` is
 * escaped, so `<script>` in a code sample is `&lt;script>` and never matches.
 */
export function assertSafeHtml(html: string, route: string): void {
  const problems = new Set<string>();
  for (const [tag] of html.matchAll(/<[a-zA-Z][^>]*>/g)) {
    if (/^<script\b/i.test(tag)) problems.add("<script");
    if (/\son[a-z]+\s*=/i.test(tag)) problems.add("an on[a-z]+= event handler");
    if (/=\s*["']?\s*javascript:/i.test(tag)) problems.add("a javascript: URL");
  }
  if (problems.size) throw new Error(`Unsafe HTML in docs page ${route}: ${[...problems].join(", ")}`);
}
