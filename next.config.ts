import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Supabase Storage sends no-cache; let browsers keep photos for a week
    // instead so a revisit doesn't redownload them (site is live ~1 week).
    minimumCacheTTL: 604800,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zqsrakftmkmiijcwbpdr.supabase.co',
        pathname: '/storage/v1/object/public/photos/**',
      },
    ],
  },
};

export default nextConfig;
