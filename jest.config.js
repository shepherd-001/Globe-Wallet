const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  coverageProvider: 'v8',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/', '<rootDir>/tests/e2e/'],
  collectCoverageFrom: [
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'app/api/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    'lib/fixtures/factory.ts': {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    'lib/transaction-utils.ts': {
      branches: 60,
      functions: 85,
      lines: 80,
      statements: 80,
    },
    'hooks/useTransactions.ts': {
      branches: 50,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    'lib/services/fiat.service.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    'lib/services/wallet.service.ts': {
      branches: 85,
      functions: 80,
      lines: 85,
      statements: 85,
    },
    'app/api/transactions/route.ts': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    'app/api/wallet/balances/route.ts': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    'app/api/wallet/transactions/route.ts': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    'app/api/wallet/send/route.ts': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    'app/api/rates/route.ts': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    'lib/off-ramp-utils.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    'hooks/useOffRamp.ts': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
}

module.exports = createJestConfig(customJestConfig)