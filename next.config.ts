import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "7mb",
    },
  },
  images: {
    remotePatterns: [
      {
        hostname: "xxulvvszfijaeeqvrxwy.supabase.co",
        pathname: "/storage/v1/object/public/events/**",
        protocol: "https",
      },
    ],
  },
  poweredByHeader: false,
};

export default nextConfig;
