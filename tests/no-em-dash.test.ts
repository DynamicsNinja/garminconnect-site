import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const EM_DASH = "—";
const SRC = join(__dirname, "..", "src");

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));

describe("no em dashes", () => {
  it("keeps U+2014 out of src/", () => {
    const hits: string[] = [];
    for (const file of walk(SRC)) {
      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .forEach((line, i) => {
          if (line.includes(EM_DASH)) hits.push(`${file.slice(SRC.length - 3)}:${i + 1}`);
        });
    }
    expect(hits, `em dash found at:\n${hits.join("\n")}`).toEqual([]);
  });
});
