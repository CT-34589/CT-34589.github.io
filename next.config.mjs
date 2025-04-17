/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath: process.env.NODE_ENV === 'production' ? '/game-stats-tracker' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/game-stats-tracker/' : '',
}

export default nextConfig
