module.exports = {
  clearMocks: true,
  collectCoverageFrom: ['<rootDir>/../src/**/*.ts'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  rootDir: '.',
  setupFiles: ['<rootDir>/setup-environment.cjs'],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/unit/**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }],
  },
};
