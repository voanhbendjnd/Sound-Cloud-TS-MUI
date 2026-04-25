/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  swcMinify: true,
  modularizeImports: {
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
  },
  images: {
          remotePatterns: [
              {
                  protocol: 'https',
                  hostname: 'res.cloudinary.com',
                  port: '',
                  pathname: '/**',
              },
              {
                  protocol: 'https',
                  hostname: 'avatars.githubusercontent.com',
                  port: '',
                  pathname: '/**',
              },
              {
                  protocol: 'https',
                  hostname: 'lh3.googleusercontent.com',
                  port: '',
                  pathname: '/**',
              },
          ],
      },
  // Server-side rendering only - no static generation
  trailingSlash: false,
  // Disable static generation completely
  generateEtags: false,
};

module.exports = nextConfig;
