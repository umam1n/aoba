import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  transpilePackages: ['@aoba/ui'],
  allowedDevOrigins: ['untelevised-rich-nonchaotically.ngrok-free.dev'],
};

export default nextConfig;
