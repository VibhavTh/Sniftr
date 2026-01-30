import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from any source (fragrance catalog has many brand domains, some HTTP)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};
export default nextConfig;
