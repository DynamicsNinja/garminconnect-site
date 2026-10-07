import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("brand assets", () => {
  it("ships both wordmarks and the social image", () => {
    for (const f of ["title-light.svg", "title-dark.svg"]) {
      expect(readFileSync(`public/brand/${f}`, "utf8")).toContain("<svg");
    }
    expect(readFileSync("public/brand/social-preview.png").subarray(1, 4).toString()).toBe("PNG");
  });
  it("uses the brand gradient for primary actions", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(css).toMatch(/--accent:\s*#0969DA/i);
    expect(css).toMatch(/--accent-2:\s*#0A8F7F/i);
    expect(css).toMatch(/\.btn-primary\s*\{[^}]*linear-gradient\(90deg,\s*var\(--accent\),\s*var\(--accent-2\)\)/);
  });
});
