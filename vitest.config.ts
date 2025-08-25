import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/config': resolve(__dirname, './src/config'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/schemas': resolve(__dirname, './src/schemas'),
      '@/logic': resolve(__dirname, './src/logic'),
      '@/routes': resolve(__dirname, './src/routes'),
    },
  },
});
