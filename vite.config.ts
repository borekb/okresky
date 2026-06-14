import { fileURLToPath, URL } from 'node:url';

import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [nitro(), viteTsConfigPaths({ projects: ['./tsconfig.json'] }), tanstackStart(), viteReact()],
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 3000,
  },
});
