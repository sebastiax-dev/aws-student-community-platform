import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
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
