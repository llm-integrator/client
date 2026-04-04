import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rootPort = env.VITE_PROXY_ROOT_PORT ?? '3000';
  const rootTarget = `http://127.0.0.1:${rootPort}`;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: rootTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, '') || '/',
        },
      },
    },
  };
});
