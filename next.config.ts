import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    // Reduce compiler memory when running the Webpack development server.
    webpackMemoryOptimizations: true,
  },
};

export default nextConfig;
