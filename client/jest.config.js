/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEach: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "\\.(css|less|scss)$": "<rootDir>/__mocks__/styleMock.js",
  },
  transform: {
    "^.+\\.(t|j)sx?$": ["ts-jest", { tsconfig: "tsconfig.json", jsx: "react-jsx" }],
  },
  testMatch: ["<rootDir>/__tests__/**/*.test.(ts|tsx)"],
};
