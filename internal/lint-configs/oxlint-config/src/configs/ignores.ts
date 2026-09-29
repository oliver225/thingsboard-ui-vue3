import type { OxlintConfig } from 'oxlint';

const ignores: OxlintConfig = {
  ignorePatterns: [
    '**/dist/**',
    '**/node_modules/**',
    'docs/**',
    '**/*.json',
    '**/*.md',
    '**/*.svg',
    '**/*.yaml',
    '**/*.yml',
  ],
};

export { ignores };
