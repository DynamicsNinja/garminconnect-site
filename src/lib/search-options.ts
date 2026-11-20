export interface SearchDoc {
  id: string;
  route: string;
  title: string;
  section?: string;
  text: string;
  kind: "guide" | "method";
}

export const SEARCH_OPTIONS = {
  fields: ["title", "section", "text"],
  storeFields: ["route", "title", "section", "kind"],
  searchOptions: {
    boost: { title: 3, section: 2 },
    prefix: true,
    fuzzy: 0.2,
    // A query that is exactly a method name lands on its reference page. Without this, the
    // method's section on its category API page scores within a hair of it, and which one wins
    // flips with each release of the library's docs.
    boostDocument: (_id: unknown, term: string, stored?: Record<string, unknown>) =>
      stored?.kind === "method" && String(stored.title).toLowerCase() === term ? 2 : 1,
  },
};
