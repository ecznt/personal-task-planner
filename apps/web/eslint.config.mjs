import { nextConfig } from '@planner/eslint-config/next';

export default [
  {
    ignores: ['public/**'],
  },
  ...nextConfig,
];