/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    typedRoutes: false,
  },
  // Webpack config to handle Node.js compatibility
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Set DNS resolver to prefer IPv4
      config.resolve.fallback = {
        ...config.resolve.fallback,
        dns: false,
        net: false,
        tls: false,
      }
    }
    
    // Exclude WEBSITE directory from build (it's a separate Next.js project)
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules/**', '**/WEBSITE/**'],
    }
    
    return config
  },
}

module.exports = nextConfig

