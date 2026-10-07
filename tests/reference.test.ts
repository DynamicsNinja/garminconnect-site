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
});
