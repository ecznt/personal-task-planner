import type { NextConfig } from 'next';
import { z } from 'zod';

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_API_BASE_PATH: z.string().startsWith('/').default('/api/v1'),
});

publicEnvironmentSchema.parse(process.env);

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
