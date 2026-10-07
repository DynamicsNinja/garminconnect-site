import "server-only";
import { GARMIN_METHODS } from "garminconnect-js/manifest";
import { CONNECT_PLUS_METHODS } from "garminconnect-js";
import { apiCategoryFiles, readSource } from "@/lib/docs/sources";

export interface MethodRow {
  name: string;
  toolName: string;
  category: string;
  categoryRoute: string | null;
  description: string;
  safety: "read" | "write" | "destructive";
  connectPlus: boolean;
  signature: string;
  params: { name: string; type: string; optional: boolean; description?: string }[];
}

type Schema = Record<string, unknown>;

export const toolName = (m: string): string => m.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());

export function typeOf(schema: Schema): string {
  const alts = (schema.anyOf ?? schema.oneOf) as Schema[] | undefined;
  if (Array.isArray(alts)) return alts.map(typeOf).join(" | ");
  if (Array.isArray(schema.enum)) return schema.enum.map((v) => JSON.stringify(v)).join(" | ");
  if (schema.format === "date-time") return "string (ISO date-time)";
  switch (schema.type) {
    case "string":
    case "number":
    case "boolean":
      return schema.type;
    case "integer":
      return "number";
    case "array":
      return `${schema.items ? wrap(typeOf(schema.items as Schema)) : "unknown"}[]`;
    case "object":
      return "object";
    default:
      return "unknown";
  }
}

const wrap = (t: string): string => (t.includes(" ") ? `(${t})` : t);

let routes: Map<string, string> | undefined;
function routeFor(name: string): string | null {
  if (!routes) {
    routes = new Map();
    for (const file of apiCategoryFiles()) {
      const { text } = readSource(file);
      const route = "/" + file.replace(/\.md$/, "");
      for (const m of GARMIN_METHODS) {
        if (!routes.has(m.name) && (text.includes(`garmin.${m.name}(`) || text.includes(`
## ${m.name}
`) || text.includes(`
### ${m.name}
`))) routes.set(m.name, route);
      }
    }
  }
  return routes.get(name) ?? null;
}

let cache: MethodRow[] | undefined;
export function methods(): MethodRow[] {
  cache ??= [...GARMIN_METHODS]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((m) => {
      const params = m.params.map((p) => {
        const s = p.schema as Schema;
        return { name: p.name, type: typeOf(s), optional: p.optional, ...(typeof s.description === "string" ? { description: s.description } : {}) };
      });
      return {
        name: m.name,
        toolName: toolName(m.name),
        category: m.category,
        categoryRoute: routeFor(m.name),
        description: m.description,
        safety: m.safety,
        connectPlus: (CONNECT_PLUS_METHODS as readonly string[]).includes(m.name),
        signature: `${m.name}(${params.map((p) => p.name + (p.optional ? "?" : "")).join(", ")})`,
        params,
      };
    });
  return cache;
}

export const method = (name: string): MethodRow | undefined => methods().find((m) => m.name === name);

export function categories(): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const m of methods()) counts.set(m.category, (counts.get(m.category) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
}
