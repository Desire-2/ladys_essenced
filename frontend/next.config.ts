import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`
      }
    ];
  },
  // Suppress deprecation warnings from dependencies
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Suppress util._extend deprecation warning in browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        util: false,
      };
    }
    return config;
  },
  // Enable experimental features to reduce warnings
  experimental: {
    esmExternals: 'loose',
  },
  /* config options here */
};

export default nextConfig;
