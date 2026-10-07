import { Suspense } from "react";
import type { Metadata } from "next";
import { categories, methods } from "@/lib/reference";
import { libVersion } from "@/lib/docs/sources";
import { ReferenceTable } from "./ReferenceTable";

export const dynamic = "force-static";
export const metadata: Metadata = { title: "Method reference" };

export default function ReferencePage() {
  const rows = methods().map((m) => ({
    name: m.name, category: m.category, description: m.description, safety: m.safety, connectPlus: m.connectPlus,
  }));
  return (
    <div>
      <h1>Method reference</h1>
      <p>{rows.length} methods · garminconnect-js {libVersion()}</p>
      <Suspense fallback={<p>Loading methods…</p>}>
        <ReferenceTable rows={rows} categories={categories().map((c) => c.name)} />
      </Suspense>
    </div>
  );
}
