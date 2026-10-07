import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDocPages } from "@/lib/docs/registry";
import { DocArticle } from "@/components/DocArticle";

export const dynamicParams = false;
export const dynamic = "force-static";

export async function generateStaticParams() {
  return [...(await getDocPages()).keys()]
    .map((r) => /^\/docs\/([^/]+)$/.exec(r)?.[1])
    .filter((s): s is string => !!s && s !== "api" && s !== "reference")
    .map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/docs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: (await getDocPages()).get(`/docs/${slug}`)?.title };
}

export default async function DocPageRoute({ params }: PageProps<"/docs/[slug]">) {
  const { slug } = await params;
  const page = (await getDocPages()).get(`/docs/${slug}`);
  if (!page) notFound();
  return <DocArticle page={page} />;
}
