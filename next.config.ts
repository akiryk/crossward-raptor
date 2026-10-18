import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Expose original Flight headers to the scoped play HTML-prefetch handler.
  skipProxyUrlNormalize: true,
};

export default nextConfig;
