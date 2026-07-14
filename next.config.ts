import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: __dirname,
  // Permite acesso LAN ao servidor de desenvolvimento (tablet no estande)
  allowedDevOrigins: [
    '192.168.210.91',   // IP atual do tablet
    '192.168.210.*',    // Toda a subnet local
    '192.168.*.*',      // Qualquer IP LAN classe C
  ],
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  turbopack: {},
};

export default withPWA(nextConfig);
