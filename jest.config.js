const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });

process.env.NODE_ENV = 'test';

const sharedConfig = {
  testEnvironment: 'node',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['@swc/jest', {}],
  },
};

const customJestConfig = {
  projects: [
    {
      ...sharedConfig,
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.test.ts'],
      setupFiles: ['<rootDir>/jest.env.ts'],
    },
    {
      ...sharedConfig,
      displayName: 'integration',
      testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
      setupFiles: ['<rootDir>/jest.env.ts'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    },
  ],
};

// СТАЛО: принудительно ставим наш маппер первым
module.exports = async () => {
  const config = await createJestConfig(customJestConfig)();
  config.projects = config.projects.map((project) => ({
    ...project,
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
      ...project.moduleNameMapper,
    },
  }));
  return config;
};