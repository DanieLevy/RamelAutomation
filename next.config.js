/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // API routes configuration is handled automatically by Next.js
  // Server Actions are enabled by default in Next.js 14+
  
  // Remove standalone output for Netlify - it interferes with Functions
  // output: 'export', // Don't use export either as it disables API routes
  
  // Ensure trailing slash consistency
  trailingSlash: false,
}

module.exports = nextConfig 