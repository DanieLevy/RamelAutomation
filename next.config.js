const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/mytor\.co\.il\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'barbershop-api',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
      },
    },
    {
      urlPattern: /\/api\/check-appointments/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 2 * 60, // 2 minutes
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
  ],
});

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

module.exports = withPWA(nextConfig); 