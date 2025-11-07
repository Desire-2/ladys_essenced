/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Reduce hydration mismatches
    // NOTE: disable optimizeCss in development to avoid CSS preloading warnings
    // (some dev servers may emit preload tags that are not used immediately).
    optimizeCss: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5001/api/:path*', // Proxy to Backend on port 5001
      },
    ];
  },
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;