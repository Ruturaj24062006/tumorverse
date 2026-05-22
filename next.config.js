/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Handle vtk.js module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      'vtk.js': 'vtk.js',
    }

    // Add fallback for vtk.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    }

    return config
  },
  // Use webpack instead of Turbopack for this project
  turbopack: {},
  // Proxy /volume/* requests to the backend API server
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/volume/:path*',
          destination: 'http://127.0.0.1:8000/volume/:path*',
        },
      ],
    }
  },
}

module.exports = nextConfig
