import { describe, expect, it, vi } from "vitest";
import { copyText } from "@/lib/copy";

describe("copyText", () => {
  it("uses the clipboard when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    expect(await copyText("u", { clipboard: { writeText }, select: vi.fn() })).toBe("copied");
    expect(writeText).toHaveBeenCalledWith("u");
  });
  it("falls back to selecting the text", async () => {
    const select = vi.fn();
    expect(await copyText("u", { select })).toBe("selected");
    expect(await copyText("u", { clipboard: { writeText: () => Promise.reject(new Error("denied")) }, select })).toBe("selected");
    expect(select).toHaveBeenCalledTimes(2);
  });
});
