import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',

  // Disable Turbopack for dev to avoid manifest issues
  devIndicators: false,

  // Increase HTTP server timeout for long-running API calls (like OpenAI GPT-5)
  httpAgentOptions: {
    keepAlive: true,
  },

  // Increase body size limit for file uploads (PPTX files can be large)
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },

  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "supabase.workbots.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.brandfetch.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "xapi.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "logo.clearbit.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "svgl.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.brandfetch.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "resend.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "xapi.com",
        pathname: "/**",
      },
    ],
  },

  // Preserve trailing slashes for FastAPI backend compatibility
  trailingSlash: false,
  skipTrailingSlashRedirect: true,

  // Note: Slides API proxying is now handled by src/proxy.ts with extended timeout support
  // for long-running routes like slide-to-html (OpenAI GPT-5 calls can take several minutes)
};

export default nextConfig;
