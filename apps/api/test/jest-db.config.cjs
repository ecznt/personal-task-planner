module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  rootDir: '.',
  setupFiles: ['<rootDir>/setup-environment.cjs'],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/db/**/*.spec.ts'],
  testTimeout: 120000,
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }],
  },
};
