import preset from '../../jest.preset.js';

export default {
  ...preset,
  displayName: 'dashboard',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/apps/dashboard',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
        useESM: true,
      },
    ],
  },
  // Ensure we don't ignore tslib anymore so it can be transformed
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$|@angular|@nx|zone\\.js|tslib)',
  ],
  moduleNameMapper: {
    '^@angular/core/testing$':
      '<rootDir>/../../node_modules/@angular/core/fesm2022/testing.mjs',
    '^@angular/platform-browser-dynamic/testing$':
      '<rootDir>/../../node_modules/@angular/platform-browser-dynamic/fesm2022/testing.mjs',
    // ✅ REMOVE the tslib mapping line entirely
  },
};
