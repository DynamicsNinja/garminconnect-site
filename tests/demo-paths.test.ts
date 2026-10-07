import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const files = ["src/app/demo/page.tsx", "src/app/demo/actions.ts", "src/components/demo/LoginForm.tsx"];

describe("demo paths", () => {
  it("never sends people to the site root by mistake", () => {
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      expect(src, f).not.toMatch(/redirect\("\/"\)/);
      expect(src, f).not.toMatch(/href="\/(\?[^"]*)?"/);
      expect(src, f).not.toMatch(/from "@\/lib\/(?!demo\/)(cookie-token-store|demo|garmin|mode|rate-limit|seal|sleep)"/);
    }
  });
  it("links the privacy note to the site privacy page", () => {
    expect(readFileSync("src/components/demo/LoginForm.tsx", "utf8")).toContain('href="/privacy"');
  });
  it("describes this site, not the starter, and leaves the footer to the site layout", () => {
    const form = readFileSync("src/components/demo/LoginForm.tsx", "utf8");
    expect(form).not.toContain("This site runs the open-source");
    expect(form).toContain("This demo is part of garmin.ficdev.xyz and runs the open-source");
    const page = readFileSync("src/app/demo/page.tsx", "utf8");
    expect(page).not.toMatch(/<footer/);
    expect(page).toMatch(/metadata: Metadata = \{ title: "Live demo" \}/);
  });
});
