import type { NextConfig } from "next";

// No script-src: a nonce would make every docs page dynamic. These cover framing, base/form hijacking and plugins.
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// The Docker image is built on a Raspberry Pi with 8 GB shared by ~35 containers; three static
// generation workers there ran it out of memory and took the host down (2026-10-12). The Dockerfile
// sets NEXT_BUILD_CPUS=1; local builds leave it unset and keep Next's default.
const buildCpus = Number(process.env.NEXT_BUILD_CPUS) || undefined;

const nextConfig: NextConfig = {
  output: "standalone",
  ...(buildCpus && { experimental: { cpus: buildCpus } }),
  poweredByHeader: false,
  agentRules: false,
  outputFileTracingRoot: import.meta.dirname,
  turbopack: { root: import.meta.dirname },
  // The docs pipeline reads these packages' files from node_modules at build time.
  outputFileTracingIncludes: {
    "/docs/**": ["./node_modules/garminconnect-js/**/*.md", "./node_modules/@dynamicsninja/garminconnect-mcp/README.md"],
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  // The demo used to live at the site root; keep its old links working. `/?signin` (an empty
  // query value, which `has` never matches) is redirected in src/proxy.ts.
  async redirects() {
    return [
      { source: "/", has: [{ type: "query", key: "days" }], destination: "/demo?days=:days", permanent: false },
    ];
  },
};

export default nextConfig;
