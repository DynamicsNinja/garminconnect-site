import { posix } from "node:path";

export interface LinkTarget { route: string; anchor?: string }
export interface LinkContext { version: string; routeForFile(repoPath: string, anchor?: string): string | null;
  /** True when a link from `repoPath` to `route` should lose its #anchor (the target page has no such heading). */
  dropAnchor?(repoPath: string, route: string): boolean;
}

const safeDecode = (s: string): string => { try { return decodeURIComponent(s); } catch { return s; } };

/** Rewrites every URL candidate of a srcset, keeping the descriptors. */
export function rewriteSrcset(value: string, fromRepoPath: string, ctx: LinkContext): string {
  return value.split(",").map((c) => c.trim()).filter(Boolean).map((c) => {
    const [url = "", ...desc] = c.split(/\s+/);
    return [resolveLink(url, fromRepoPath, ctx, "img").route, ...desc].join(" ");
  }).join(", ");
}

const REPO = "DynamicsNinja/garminconnect-js";

export function resolveLink(href: string, fromRepoPath: string, ctx: LinkContext, kind: "a" | "img"): LinkTarget {
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) return { route: href };
  const hashAt = href.indexOf("#");
  const anchor = hashAt >= 0 ? safeDecode(href.slice(hashAt + 1)) || undefined : undefined;
  let rest = hashAt >= 0 ? href.slice(0, hashAt) : href;
  const q = rest.indexOf("?");
  if (q >= 0) rest = rest.slice(0, q);
  rest = safeDecode(rest);
  const withAnchor = (t: LinkTarget): LinkTarget => (anchor ? { ...t, anchor } : t);

  let file: string;
  if (rest === "") file = fromRepoPath;
  else {
    file = posix.normalize(posix.join(posix.dirname(fromRepoPath), rest));
    if (file === ".." || file.startsWith("../") || posix.isAbsolute(file)) throw new Error(`link escapes the repo: ${href} (from ${fromRepoPath})`);
  }
  if (kind === "img") return { route: `https://raw.githubusercontent.com/${REPO}/v${ctx.version}/${file}` };
  const route = ctx.routeForFile(file, anchor);
  if (route) return ctx.dropAnchor?.(file, route) ? { route } : withAnchor({ route });
  const kindPath = posix.extname(file) ? "blob" : "tree";
  return { route: `https://github.com/${REPO}/${kindPath}/v${ctx.version}/${file}${anchor ? `#${anchor}` : ""}` };
}
