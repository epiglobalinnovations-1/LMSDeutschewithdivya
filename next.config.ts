import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  // Cache Components is off: pages that read the session are rendered per
  // request, marketing pages are statically prerendered. Revisit in Phase 7.
  cacheComponents: false,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    // Canonical host is the apex domain; www redirects permanently.
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.deutschewithdivya.com" }],
        destination: "https://deutschewithdivya.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
