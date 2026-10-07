import { NextResponse, type NextRequest } from "next/server";

// The demo used to live at the site root, and its sign-in link was `/?signin` (no value).
// next.config `redirects` can't match it: a `has` query item never matches an empty value, so
// `/?signin` would fall through to the landing page. `/?days=N` is redirected in next.config.ts.
export function proxy(request: NextRequest) {
  if (request.nextUrl.searchParams.has("signin")) {
    return NextResponse.redirect(new URL("/demo?signin", request.url), 307);
  }
  return NextResponse.next();
}

export const config = { matcher: "/" };
