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
});
