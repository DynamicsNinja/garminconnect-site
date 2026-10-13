import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { getDocPage } from "@/lib/docs/registry";
import { DocArticle } from "@/components/DocArticle";

export const dynamic = "force-static";

export async function generateMetadata(): Promise<Metadata> {
  const p = await getDocPage("/docs");
  return pageMeta({ title: p.title, description: p.description, path: p.route });
}

export default async function DocsHome() {
  return <DocArticle page={await getDocPage("/docs")} />;
}
