export const README_PAGES = [
  { route: "/docs", title: "Getting started", sections: ["About", "Installation & setup"] },
  { route: "/docs/authentication", title: "Authentication", sections: ["Authentication"] },
  { route: "/docs/examples", title: "Code examples", sections: ["Code examples"] },
] as const satisfies readonly { route: string; title: string; sections: readonly string[] }[];

/** Sections whose anchors go to a site page other than a README page. */
export const README_REDIRECTS: Record<string, string> = { "API coverage": "/docs/reference", "Building workouts": "/docs/workouts", "Use it from Claude": "/claude" };

export function normalizeHeading(text: string): string {
  // \p{Extended_Pictographic} covers emoji such as ℹ (U+2139), which is otherwise a LETTER (category Ll).
  return text.replace(/<[^>]+>/g, "").replace(/[\p{Extended_Pictographic}️‍]/gu, "").replace(/\s+/g, " ").trim();
}

/** Level-2 sections of the README, keyed by normalized title; each value starts with its own heading line. */
export function splitReadme(markdown: string): Map<string, string> {
  const out = new Map<string, string>();
  const lines = markdown.split(/\r?\n/);
  let title: string | null = null;
  let buf: string[] = [];
  let inFence = false;
  const flush = () => { if (title) out.set(title, buf.join("\n")); };
  for (const line of lines) {
    if (/^```/.test(line)) inFence = !inFence;
    const m = !inFence && /^## (.+)$/.exec(line);
    if (m) { flush(); title = normalizeHeading(m[1]!); buf = [line]; } else if (title) buf.push(line);
  }
  flush();
  return out;
}
