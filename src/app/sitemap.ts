import type { MetadataRoute } from "next";
import { getDocPages } from "@/lib/docs/registry";
import { methods } from "@/lib/reference";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = new Set(["", "/claude", "/privacy", "/demo", "/docs", "/docs/reference"]);
  for (const route of (await getDocPages()).keys()) routes.add(route);
  for (const m of methods()) routes.add(`/docs/reference/${m.name}`);
  return [...routes].map((r) => ({ url: `${SITE_URL}${r}` }));
}
