// jest.config.js
module.exports = {
  verbose: true,
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  // This tells Jest to show console logs during tests
  silent: false,
  // Show individual test results
  // Setup files run before tests
  // Don't clear console output between tests
  clearMocks: true,
  resetMocks: false,
  restoreMocks: false
};