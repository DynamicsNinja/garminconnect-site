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
  searchOptions: { boost: { title: 3, section: 2 }, prefix: true, fuzzy: 0.2 },
};
