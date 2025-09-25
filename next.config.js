/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is enabled by default in Next.js 14
  experimental: {
    // Optimize build performance
    optimizePackageImports: ['@google/generative-ai'],
  },
  // Reduce bundle size
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Build optimizations
  swcMinify: true,
  compress: true,
  // Increase build timeout
  staticPageGenerationTimeout: 1000,
}

module.exports = nextConfig