import { describe, expect, it } from "vitest";
import MiniSearch from "minisearch";
import { buildSearchDocs, SEARCH_OPTIONS } from "@/lib/search";

describe("search", () => {
  it("indexes guides by section and every method", async () => {
    const docs = await buildSearchDocs();
    expect(docs.filter((d) => d.kind === "method").length).toBeGreaterThan(150);
    const ms = new MiniSearch(SEARCH_OPTIONS);
    ms.addAll(docs);
    expect(ms.search("sleep")[0]).toBeDefined();
    expect(ms.search("getSleepData")[0]?.route).toBe("/docs/reference/getSleepData");
    expect(ms.search("MFA").some((r) => String(r.route).startsWith("/docs/authentication"))).toBe(true);
    expect(new Set(docs.map((d) => d.id)).size).toBe(docs.length);
  }, 60_000);
});
