/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Allow LAN access during development
  allowedDevOrigins: [
    '192.168.1.5',
  ],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
      {
        protocol: 'https',
        hostname: 'supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.storage',
        pathname: '/storage/v1/object/**',
      },
    ],
  },

  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;