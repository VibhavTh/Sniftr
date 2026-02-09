import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for S3 + CloudFront deployment
  output: 'export',

  // Required for S3 static hosting (creates /page/index.html instead of /page.html)
  trailingSlash: true,

  // Required for static export (Next.js Image optimization needs a server)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
