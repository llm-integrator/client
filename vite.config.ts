import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = '/api';
  const rootTarget = env.VITE_API_URL;

  const proxy =
    apiBase.startsWith('/') && apiBase.length > 1
      ? {
          [apiBase]: {
            target: rootTarget,
            changeOrigin: true,
            rewrite: (p: string) => {
              const rest = p.slice(apiBase.length) || '/';
              return rest.startsWith('/') ? rest : `/${rest}`;
            },
          },
        }
      : undefined;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      ...(proxy ? { proxy } : {}),
    },
  };
});
