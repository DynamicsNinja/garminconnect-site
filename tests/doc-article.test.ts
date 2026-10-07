import { describe, expect, it } from "vitest";
import { getDocPages } from "@/lib/docs/registry";
import { hasH1, methodsByRoute, methodsForRoute } from "@/components/doc-data";

describe("doc article data", () => {
  it("links the wellness page to its methods", () => {
    expect(methodsForRoute("/docs/api/wellness")).toContain("getSleepData");
    expect(methodsByRoute().find((g) => g.route === "/docs/api/wellness")?.names).toContain("getSleepData");
  });
  it("detects an existing h1, and README pages lack one", async () => {
    expect(hasH1("<h1 id=x>T</h1>")).toBe(true);
    expect(hasH1("<h2>T</h2>")).toBe(false);
    const pages = await getDocPages();
    for (const r of ["/docs", "/docs/authentication", "/docs/examples"]) expect(hasH1(pages.get(r)!.html)).toBe(false);
  }, 60_000);
});
