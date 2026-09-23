import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
    ],
    /* Same-origin /api/shop/media and /uploads paths use the default loader. */
  },
};

export default nextConfig;
