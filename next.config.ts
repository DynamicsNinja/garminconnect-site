import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // The docs pipeline reads these packages' files from node_modules at build time.
  outputFileTracingIncludes: {
    "/docs/**": ["./node_modules/garminconnect-js/**/*.md", "./node_modules/@dynamicsninja/garminconnect-mcp/README.md"],
  },
};

export default nextConfig;
