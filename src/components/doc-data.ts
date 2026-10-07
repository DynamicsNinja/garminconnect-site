import { methods } from "@/lib/reference";

export const hasH1 = (html: string): boolean => /<h1[\s>]/i.test(html);

/** Methods whose guide page is `route`, in manifest order. */
export function methodsForRoute(route: string): string[] {
  return methods().filter((m) => m.categoryRoute === route).map((m) => m.name);
}

/** Every guide route that has methods, with the method names. */
export function methodsByRoute(): { route: string; names: string[] }[] {
  const map = new Map<string, string[]>();
  for (const m of methods()) if (m.categoryRoute) (map.get(m.categoryRoute) ?? map.set(m.categoryRoute, []).get(m.categoryRoute)!).push(m.name);
  return [...map].map(([route, names]) => ({ route, names }));
}
