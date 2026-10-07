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
import { resolveLink, type LinkContext, type LinkTarget } from "./links";

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
      if (attr && typeof value === "string" && value) {
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
    .use(rehypeSlug).use(rewrite)
    .use(rehypeShiki, { themes: { light: "github-light", dark: "github-dark" }, defaultColor: false })
    .use(rehypeStringify)
    .process(markdown.replace(/<!--[\s\S]*?-->/g, ""));
  return { html: String(file), headings, links };
}
