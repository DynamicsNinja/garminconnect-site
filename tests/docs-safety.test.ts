import { describe, expect, it } from "vitest";
import { assertSafeHtml, renderMarkdown } from "@/lib/docs/render";
import type { LinkContext } from "@/lib/docs/links";
import { getDocPages } from "@/lib/docs/registry";

const ctx: LinkContext = { version: "9.9.9", routeForFile: () => null };
const render = async (md: string) => (await renderMarkdown(md, "README.md", ctx)).html;

// The first render loads Shiki, which is slow while the other suites run in parallel.
describe("assertSafeHtml", { timeout: 60_000 }, () => {
  it("rejects a script tag, naming the route", async () => {
    const html = await render("# Hi\n\n<script>alert(1)</script>\n");
    expect(() => assertSafeHtml(html, "/docs/evil")).toThrow(/\/docs\/evil.*<script/);
  });
  it("rejects an inline event handler", async () => {
    const html = await render('<img src="x.png" onerror="alert(1)">\n');
    expect(() => assertSafeHtml(html, "/docs/evil")).toThrow(/\/docs\/evil.*on\[a-z\]\+=|\/docs\/evil.*event handler/);
  });
  it("rejects a javascript: URL", async () => {
    const html = await render("[click](javascript:alert(1))\n\n<a href=\"JavaScript:alert(1)\">x</a>\n");
    expect(() => assertSafeHtml(html, "/docs/evil")).toThrow(/\/docs\/evil.*javascript:/);
  });
  it("accepts docs that only mention these things in text and code", async () => {
    const md = "Use `<script>` and `onClick={go}` and `javascript:void(0)`.\n\n```tsx\n<button onClick={go} />\nconst onDone = 1; // javascript: label\n```\n\n<a href=\"https://x.y/\">ok</a> one=1 online=2\n";
    const html = await render(md);
    expect(() => assertSafeHtml(html, "/docs/fine")).not.toThrow();
  });
  it("passes every real docs page (the registry runs it at build time)", async () => {
    for (const [route, page] of await getDocPages()) expect(() => assertSafeHtml(page.html, route)).not.toThrow();
  });
});
