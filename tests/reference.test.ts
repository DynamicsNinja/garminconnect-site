import { describe, expect, it } from "vitest";
import { GARMIN_METHODS } from "garminconnect-js/manifest";
import { methods, method, toolName, typeOf, categories } from "@/lib/reference";

describe("reference", () => {
  it("has a row for every manifest method", () => {
    expect(methods().map((m) => m.name).sort()).toEqual(GARMIN_METHODS.map((m) => m.name).sort());
  });
  it("names tools exactly like the MCP server", () => {
    expect(toolName("getSleepData")).toBe("get_sleep_data");
    expect(toolName("getSpo2Data")).toBe("get_spo2_data");
    expect(toolName("setActivityExerciseSets")).toBe("set_activity_exercise_sets");
  });
  it("describes parameters and signatures", () => {
    const m = method("getSleepData")!;
    expect(m.safety).toBe("read");
    expect(m.params[0]).toMatchObject({ name: "cdate", optional: false });
    expect(m.signature).toMatch(/^getSleepData\(cdate/);
    expect(typeOf({ type: "string" })).toBe("string");
    expect(typeOf({ anyOf: [{ type: "string" }, { type: "number" }] })).toBe("string | number");
    expect(typeOf({ type: "array", items: { type: "string" } })).toBe("string[]");
    expect(typeOf({ enum: ["kg", "lbs"] })).toBe('"kg" | "lbs"');
    expect(typeOf({})).toBe("unknown");
  });
  it("handles methods with no params", () => {
    expect(method("getUserProfile")!.signature).toBe("getUserProfile()");
  });
  it("flags Connect+ and links categories to a guide when one exists", () => {
    expect(methods().some((m) => m.connectPlus)).toBe(true);
    expect(method("getSleepData")!.categoryRoute).toBe("/docs/api/wellness");
    expect(categories().reduce((n, c) => n + c.count, 0)).toBe(GARMIN_METHODS.length);
  });
  it("handles array-valued JSON schema types", () => {
    expect(typeOf({ type: ["integer", "string"] })).toBe("number | string");
    expect(typeOf({ type: ["number", "integer"] })).toBe("number");
  });
  it("renders file params as Blob", () => {
    expect(method("importActivity")!.params.find((p) => p.name === "file")!.type).toBe("Blob");
  });
  it("takes Connect+ from the manifest", () => {
    const expected = GARMIN_METHODS.filter((m) => (m as { requiresConnectPlus?: boolean }).requiresConnectPlus === true).map((m) => m.name).sort();
    expect(methods().filter((m) => m.connectPlus).map((m) => m.name).sort()).toEqual(expected);
    expect(expected).toContain("logFood");
  });
  it("leaves no param typed unknown", () => {
    // No exceptions today: file params are Blob, everything else has a concrete schema.
    const unknown = methods().flatMap((m) => m.params.filter((p) => p.type === "unknown").map((p) => `${m.name}.${p.name}`));
    expect(unknown).toEqual([]);
  });
});
