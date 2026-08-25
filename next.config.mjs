/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Turbopack for faster dev HMR (Next.js 16)
  turbopack: {},
  // Explicitly transpile the LWC packages so they don't need a separate CJS build
  transpilePackages: [
    '@opencoredev/loginwithchatgpt-react',
    '@opencoredev/loginwithchatgpt-ai',
    '@opencoredev/loginwithchatgpt-server',
    '@opencoredev/loginwithchatgpt-core',
  ],
  // Reduce cold-start work
  experimental: {
    optimizePackageImports: ['lucide-react', '@xyflow/react'],
  },
}

export default nextConfig
