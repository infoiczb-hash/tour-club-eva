const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });
// сразу после этой строки добавь:
process.env.NODE_ENV = 'test';

const sharedConfig = {
  testEnvironment: 'node',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['@swc/jest', {}],
  },
  testEnvironmentOptions: {
    env: {
      NODE_ENV: 'test',
    },
  },
};

const customJestConfig = {
  projects: [
    {
      ...sharedConfig,
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.test.ts'],
    },
    {
      ...sharedConfig,
      displayName: 'integration',
  testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
  setupFiles: ['<rootDir>/jest.env.ts'],       // до импортов
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    },
  ],
};

module.exports = createJestConfig(customJestConfig);