import { describe, expect, it } from "vitest";
import { getDocPages } from "@/lib/docs/registry";
import { renderMarkdown } from "@/lib/docs/render";

const PICTO = /[\p{Extended_Pictographic}\uFE0F\u200D\u20E3]/u;
const outsideCode = (html: string) => html.replace(/<pre[\s\S]*?<\/pre>/g, "").replace(/<code[\s\S]*?<\/code>/g, "").replace(/<[^>]+>/g, "");

describe("emoji removal", { timeout: 60_000 }, () => {
  it("leaves no emoji in rendered docs text and keeps anchors", async () => {
    const pages = await getDocPages();
    for (const p of pages.values()) {
      expect(PICTO.test(outsideCode(p.html)), p.route).toBe(false);
      for (const h of p.headings) expect(PICTO.test(h.text), `${p.route} ${h.text}`).toBe(false);
    }
    const docs = pages.get("/docs")!;
    expect(docs.html).toContain('id="-installation--setup"');
    expect(docs.headings.map((h) => h.text)).toContain("Installation & setup");
  });
  it("strips headings and body but not inline code", async () => {
    const r = await renderMarkdown("## \u{1F4E6} Setup\n\n\u2705 ok `\u{1F642} code`", "README.md", { version: "1.0.0", routeForFile: () => null });
    expect(r.headings[0]!.text).toBe("Setup");
    expect(r.html).toContain(">Setup</h2>");
    expect(r.html).toContain("<p>ok <code>\u{1F642} code</code></p>");
  });
});