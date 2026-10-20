import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets Docker ship only the traced runtime files (see Dockerfile).
  output: "standalone",
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
    proxyClientMaxBodySize: "20mb",
  },
};

export default nextConfig;
