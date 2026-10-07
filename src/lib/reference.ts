import "server-only";
import { GARMIN_METHODS } from "garminconnect-js/manifest";
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
  if (Array.isArray(schema.type)) {
    return [...new Set((schema.type as string[]).map((t) => typeOf({ type: t })))].join(" | ");
  }
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

const fileTexts = new Map<string, string>();
function mentions(file: string, name: string): boolean {
  let text = fileTexts.get(file);
  if (text === undefined) fileTexts.set(file, (text = readSource(file).text));
  return text.includes(`garmin.${name}(`) || text.includes(`
## ${name}
`) || text.includes(`
### ${name}
`);
}

function routeFor(name: string, category: string): string | null {
  const files = apiCategoryFiles();
  const own = `docs/api/${category}.md`;
  const ordered = files.includes(own) ? [own, ...files.filter((f) => f !== own)] : files;
  const hit = ordered.find((f) => mentions(f, name));
  return hit ? "/" + hit.replace(/\.md$/, "") : null;
}

let cache: MethodRow[] | undefined;
export function methods(): MethodRow[] {
  cache ??= [...GARMIN_METHODS]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((m) => {
      const params = m.params.map((p) => {
        const s = p.schema as Schema;
        return { name: p.name, type: p.role === "file" ? "Blob" : typeOf(s), optional: p.optional, ...(typeof s.description === "string" ? { description: s.description } : {}) };
      });
      return {
        name: m.name,
        toolName: toolName(m.name),
        category: m.category,
        categoryRoute: routeFor(m.name, m.category),
        description: m.description,
        safety: m.safety,
        connectPlus: (m as { requiresConnectPlus?: boolean }).requiresConnectPlus === true,
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
