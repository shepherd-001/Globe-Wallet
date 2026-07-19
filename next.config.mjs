import { validateEnvironment } from './lib/env.mjs'
import createNextIntlPlugin from 'next-intl/plugin'

validateEnvironment()

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ['@stellar/stellar-sdk', '@noble/hashes', '@noble/ed25519', '@noble/curves', '@scure/base'],
}

export default withNextIntl(nextConfig)
