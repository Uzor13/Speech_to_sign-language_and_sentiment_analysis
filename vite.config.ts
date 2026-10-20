import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Workers are ES modules, so the Whisper worker can use plain imports.
  worker: { format: 'es' },

  optimizeDeps: {
    include: [
      // Ships only a prebuilt webpack UMD bundle (no ESM, no "exports" field),
      // so Vite must pre-bundle it for the CJS interop to work.
      'vader-sentiment',
      // Pre-bundled at startup rather than on first use: optimising something
      // this large mid-session triggers a full page reload, which kills the
      // worker that asked for it.
      '@huggingface/transformers',
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: { provider: 'v8' },
  },
});
