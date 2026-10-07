import type { Metadata } from "next";
import { getDocPage } from "@/lib/docs/registry";
import { DocArticle } from "@/components/DocArticle";

export const dynamic = "force-static";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDocPage("/docs")).title };
}

export default async function DocsHome() {
  return <DocArticle page={await getDocPage("/docs")} />;
}
