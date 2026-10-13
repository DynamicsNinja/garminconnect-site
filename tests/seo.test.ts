import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { getDocPages } from "@/lib/docs/registry";
import { methods } from "@/lib/reference";
import { breadcrumbs, clip, describeHtml, pageMeta, plainText } from "@/lib/seo";

const BASE = "https://garmin.ficdev.xyz";

describe("seo helpers", () => {
  it("plainText strips tags, entities, markdown emphasis and em dashes", () => {
    expect(plainText("<b>Get</b> `deviceId` &amp; **all** — now&#39;s")).toBe("Get deviceId & all, now's");
  });
  it("plainText leaves no space before punctuation after a link", () => {
    expect(plainText('follows <a href="x">Keep a Changelog</a>, and')).toBe("follows Keep a Changelog, and");
  });
  it("clip keeps short text and cuts long text at a word", () => {
    expect(clip("short")).toBe("short");
    const out = clip("word ".repeat(60));
    expect(out.length).toBeLessThanOrEqual(160);
    expect(out.endsWith("word…")).toBe(true);
  });
  it("describeHtml skips badge rows and short lines", () => {
    expect(describeHtml('<p><img src="x"></p><p>Hi</p><p>A TypeScript client for Garmin Connect with typed methods.</p>'))
      .toBe("A TypeScript client for Garmin Connect with typed methods.");
    expect(describeHtml("<p>tiny</p>")).toBeUndefined();
  });
  it("pageMeta sets a canonical and keeps the social image", () => {
    const m = pageMeta({ title: "T", description: "D", path: "/docs" });
    expect(m.alternates?.canonical).toBe("/docs");
    expect(m.openGraph).toMatchObject({ url: "/docs", images: ["/brand/social-preview.png"] });
  });
  it("breadcrumbs uses absolute URLs", () => {
    expect(breadcrumbs([{ name: "Docs", path: "/docs" }]).itemListElement[0]!.item).toBe(`${BASE}/docs`);
  });
  it("every docs page gets its own description", async () => {
    const pages = [...(await getDocPages()).values()];
    const missing = pages.filter((p) => !p.description).map((p) => p.route);
    expect(missing).toEqual([]);
    const descs = pages.map((p) => p.description);
    expect(new Set(descs).size).toBe(descs.length);
  }, 60_000);
});

describe("robots and sitemap", () => {
  it("robots allows everything and points at the sitemap", () => {
    const r = robots();
    expect(r.rules).toEqual({ userAgent: "*", allow: "/" });
    expect(r.sitemap).toBe(`${BASE}/sitemap.xml`);
  });
  it("sitemap lists every static route once, on the production origin", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
    for (const p of ["", "/claude", "/privacy", "/demo", "/docs", "/docs/reference"]) expect(urls).toContain(`${BASE}${p}`);
    for (const route of (await getDocPages()).keys()) expect(urls).toContain(`${BASE}${route}`);
    for (const m of methods()) expect(urls).toContain(`${BASE}/docs/reference/${m.name}`);
    expect(urls.every((u) => u.startsWith(`${BASE}`))).toBe(true);
  }, 60_000);
});
