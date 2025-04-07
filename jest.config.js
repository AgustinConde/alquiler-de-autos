module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/config/di.js',
    '!src/cli/**',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov'],
  setupFilesAfterEnv: ['./jest.setup.js'],
};
