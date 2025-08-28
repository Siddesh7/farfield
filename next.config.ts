import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "farfield.shop",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.ngrok.io",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.ngrok-free.app",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "imagedelivery.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.farcaster.xyz",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "farcaster.xyz",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ipfs.io",
        port: "",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "gateway.pinata.cloud",
        port: "",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "warpcast.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "abs.twimg.com",
        port: "",
        pathname: "/**",
      },
      // Catch-all for HTTPS images (be more restrictive in production)
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/miniapp",
        destination: "https://farcaster.xyz/miniapps/9OlQm7ZO9S_M/farfield",
        permanent: true,
      },
    ];
  },
  // async headers() {
  //   return [
  //     {
  //       source: "/:path*",
  //       headers: [
  //         {
  //           key: "Content-Security-Policy",
  //           value: `
  //             default-src 'self';
  //             script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://*.farcaster.xyz;
  //             style-src 'self' 'unsafe-inline';
  //             img-src 'self' data: blob: https:;
  //             font-src 'self' data:;
  //             object-src 'none';
  //             base-uri 'self';
  //             form-action 'self';
  //             frame-ancestors 'self' https://*.farcaster.xyz https://*.warpcast.com https://warpcast.com;
  //             child-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org;
  //             frame-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org https://challenges.cloudflare.com;
  //             connect-src 'self' https://auth.privy.io wss://relay.walletconnect.com wss://relay.walletconnect.org wss://www.walletlink.org https://*.rpc.privy.systems https://explorer-api.walletconnect.com https://*.farcaster.xyz;
  //             worker-src 'self';
  //             manifest-src 'self'
  //           `
  //             .replace(/\s+/g, " ")
  //             .trim(),
  //         },
  //       ],
  //     },
  //   ];
  // },
};

export default nextConfig;
