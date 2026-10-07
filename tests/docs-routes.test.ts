import { describe, expect, it } from "vitest";
import { getDocPages } from "@/lib/docs/registry";
import { methods } from "@/lib/reference";
import { generateStaticParams as slugParams } from "@/app/docs/[slug]/page";
import { generateStaticParams as categoryParams } from "@/app/docs/api/[category]/page";
import { generateStaticParams as methodParams } from "@/app/docs/reference/[method]/page";

describe("docs routes", () => {
  it("statically generate every doc page and every method", async () => {
    const pages = [...(await getDocPages()).keys()];
    const slugs = (await slugParams()).map((p) => `/docs/${p.slug}`);
    const cats = (await categoryParams()).map((p) => `/docs/api/${p.category}`);
    for (const r of pages.filter((r) => r !== "/docs" && r !== "/docs/api")) expect([...slugs, ...cats]).toContain(r);
    expect((await methodParams()).length).toBe(methods().length);
  }, 60_000);
});
