/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // API routes configuration is handled automatically by Next.js
  // Server Actions are enabled by default in Next.js 14+
  
  // Optimize for Netlify deployment
  output: 'standalone',
}

module.exports = nextConfig 