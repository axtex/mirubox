import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/watchlist",
        destination: "/tracker",
        permanent: true,
      },
      {
        source: "/watchlist/:path*",
        destination: "/tracker/:path*",
        permanent: true,
      },
      {
        source: "/archive",
        destination: "/tracker",
        permanent: true,
      },
      {
        source: "/archive/:path*",
        destination: "/tracker/:path*",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s4.anilist.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s1.anilist.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
