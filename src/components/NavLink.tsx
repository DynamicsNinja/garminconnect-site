"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const path = usePathname().replace(/\/$/, "") || "/";
  return <Link href={href} aria-current={path === href || (href === "/docs/reference" && path.startsWith(href + "/")) ? "page" : undefined}>{children}</Link>;
}
