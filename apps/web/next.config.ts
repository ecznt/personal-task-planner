import type { NextConfig } from 'next';
import { z } from 'zod';

const webEnvironmentSchema = z.object({
  API_INTERNAL_ORIGIN: z.string().url().default('http://127.0.0.1:3001'),
  NEXT_PUBLIC_API_BASE_PATH: z.string().startsWith('/').default('/api/v1'),
});

const environment = webEnvironmentSchema.parse(process.env);

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: `${environment.NEXT_PUBLIC_API_BASE_PATH}/:path*`,
        destination: `${environment.API_INTERNAL_ORIGIN}${environment.NEXT_PUBLIC_API_BASE_PATH}/:path*`,
      },
    ];
  },
};

export default nextConfig;
