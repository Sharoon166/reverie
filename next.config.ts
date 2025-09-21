import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fra.cloud.appwrite.io",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    serverActions:{
      bodySizeLimit: "10mb"
    }
  }
};

export default nextConfig;
