import type { Metadata } from "next";
import { getDocPage } from "@/lib/docs/registry";
import { DocArticle } from "@/components/DocArticle";

export const dynamic = "force-static";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDocPage("/docs/api")).title };
}

export default async function ApiIndex() {
  return <DocArticle page={await getDocPage("/docs/api")} />;
}
