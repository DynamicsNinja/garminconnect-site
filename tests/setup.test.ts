import "server-only";
import { expect, it } from "vitest";

it("loads server-only via the test alias", () => {
  expect(true).toBe(true);
});
