/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.mux.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'ghi1kcb6knkec3zk.public.blob.vercel-storage.com',
        pathname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
