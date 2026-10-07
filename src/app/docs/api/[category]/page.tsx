import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDocPages } from "@/lib/docs/registry";
import { DocArticle } from "@/components/DocArticle";

export const dynamicParams = false;
export const dynamic = "force-static";

export async function generateStaticParams() {
  return [...(await getDocPages()).keys()]
    .map((r) => /^\/docs\/api\/([^/]+)$/.exec(r)?.[1])
    .filter((c): c is string => !!c)
    .map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps<"/docs/api/[category]">): Promise<Metadata> {
  const { category } = await params;
  return { title: (await getDocPages()).get(`/docs/api/${category}`)?.title };
}

export default async function ApiCategory({ params }: PageProps<"/docs/api/[category]">) {
  const { category } = await params;
  const page = (await getDocPages()).get(`/docs/api/${category}`);
  if (!page) notFound();
  return <DocArticle page={page} />;
}
