import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/** Default root app port (matches server `ROOT_PORT` / Nest default). */
const DEFAULT_ROOT_SERVICE_PORT = '3000';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = (env.VITE_AP_URL ?? '/api').trim() || '/api';
  const rootTarget = `http://127.0.0.1:${DEFAULT_ROOT_SERVICE_PORT}`;

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
