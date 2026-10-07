export interface CopyDeps {
  clipboard?: { writeText(t: string): Promise<void> };
  select(): void;
}

/** Copy to the clipboard; if that is unavailable or refused, select the text so the user can copy it. */
export async function copyText(text: string, deps: CopyDeps): Promise<"copied" | "selected"> {
  if (deps.clipboard) {
    try {
      await deps.clipboard.writeText(text);
      return "copied";
    } catch {
      // fall through to selection
    }
  }
  deps.select();
  return "selected";
}
