import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.yusufstar.com",
      },
    ],
  },
};

export default nextConfig;
