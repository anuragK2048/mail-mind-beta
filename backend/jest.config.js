module.exports = {
  preset: "ts-jest", // Use ts-jest to transpile TypeScript files for Jest
  testEnvironment: "node", // Specify that we are testing in a Node.js environment
  testMatch: [
    "**/tests/integration/**/*.test.ts", // Look for test files in this directory
    "**/tests/unit/**/*.test.ts",
  ],
  setupFilesAfterEnv: ["./tests/setup.ts"], // A file to run before your tests
  moduleNameMapper: {
    // Helps Jest resolve module aliases if you use them (e.g., '@/*' -> 'src/*')
    // Example:
    // '^@/(.*)$': '<rootDir>/src/$1',
  },
  // If your app doesn't exit cleanly after tests, this can help:
  forceExit: true,
};
