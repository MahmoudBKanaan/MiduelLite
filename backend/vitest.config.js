import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // Integration tests share one PostgreSQL; run files sequentially
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
  },
});
