import { defineConfig } from 'vitest/config';

// eslint-disable-next-line import/no-default-export -- Vitest requires a default-exported config
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['json', 'html', 'text'],
      reportsDirectory: './coverage',
      include: ['src/**/*.js'],
      exclude: [
        'src/**/*.spec.js',
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
