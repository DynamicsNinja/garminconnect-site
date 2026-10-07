import { describe, expect, it } from "vitest";
import { normalizeHeading, splitReadme, README_PAGES } from "@/lib/docs/readme";
import { resolveLink, type LinkContext } from "@/lib/docs/links";
import { getDocPages, checkLinks } from "@/lib/docs/registry";
import { apiCategoryFiles, libVersion, readSource } from "@/lib/docs/sources";

const ctx: LinkContext = {
  version: "9.9.9",
  routeForFile: (p, a) => (p === "WORKOUTS.md" ? "/docs/workouts" : p === "docs/api/gear.md" ? "/docs/api/gear" : p === "README.md" && a === "-authentication" ? "/docs/authentication" : null),
};

describe("readme", () => {
  it("normalizes emoji headings", () => {
    expect(normalizeHeading("📦 Installation & setup")).toBe("Installation & setup");
    expect(normalizeHeading("ℹ️ About")).toBe("About");
  });
  it("finds every section the site needs in the pinned README", () => {
    const sections = splitReadme(readSource("README.md").text);
    for (const page of README_PAGES) for (const s of page.sections) expect(sections.has(s), s).toBe(true);
  });
});

describe("links", () => {
  it("maps rendered files to routes and the rest to GitHub at the tag", () => {
    expect(resolveLink("../../WORKOUTS.md", "docs/api/gear.md", ctx, "a")).toEqual({ route: "/docs/workouts" });
    expect(resolveLink("gear.md", "docs/api/README.md", ctx, "a")).toEqual({ route: "/docs/api/gear" });
    expect(resolveLink("../../README.md#-authentication", "docs/api/gear.md", ctx, "a")).toEqual({ route: "/docs/authentication", anchor: "-authentication" });
    expect(resolveLink("AGENTS.md", "README.md", ctx, "a")).toEqual({ route: "https://github.com/DynamicsNinja/garminconnect-js/blob/v9.9.9/AGENTS.md" });
    expect(resolveLink("examples", "README.md", ctx, "a")).toEqual({ route: "https://github.com/DynamicsNinja/garminconnect-js/tree/v9.9.9/examples" });
    expect(resolveLink("docs/assets/title-light.svg", "README.md", ctx, "img")).toEqual({ route: "https://raw.githubusercontent.com/DynamicsNinja/garminconnect-js/v9.9.9/docs/assets/title-light.svg" });
    expect(resolveLink("https://x.y/z", "README.md", ctx, "a")).toEqual({ route: "https://x.y/z" });
    expect(() => resolveLink("../../../etc/passwd", "docs/api/gear.md", ctx, "a")).toThrow(/escapes/);
  });
});

describe("registry", { timeout: 60_000 }, () => {
  it("renders every page with no broken internal link or anchor", async () => {
    const pages = await getDocPages();
    expect([...pages.keys()]).toEqual(expect.arrayContaining(["/docs", "/docs/authentication", "/docs/examples", "/docs/workouts", "/docs/api", "/docs/self-host", "/docs/changelog"]));
    for (const f of apiCategoryFiles()) expect(pages.has(`/docs/api/${f.slice("docs/api/".length, -3)}`)).toBe(true);
    const { getAllLinks } = await import("@/lib/docs/registry");
    expect(checkLinks(pages, await getAllLinks())).toEqual([]);
  });
  it("uses the pinned library version", () => {
    expect(libVersion()).toBe("0.9.0");
  });
  it("highlights code at build time and keeps GitHub anchors", async () => {
    const page = (await getDocPages()).get("/docs")!;
    expect(page.html).toContain('id="-installation--setup"');
    expect(page.html).toMatch(/<pre class="shiki/);
  });
});
