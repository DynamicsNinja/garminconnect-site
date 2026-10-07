import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { getDocPages } from "@/lib/docs/registry";
import { methods } from "@/lib/reference";

const BASE = "https://garmin.ficdev.xyz";

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
