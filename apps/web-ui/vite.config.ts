import process from 'node:process';

import { defineConfig } from '@vben/vite-config';

import { loadEnv } from 'vite';
export default defineConfig(async (config) => {
  const env = loadEnv(config?.mode || 'development', process.cwd(), '');
  return {
    application: {},
    vite: {
      build: { target: 'es2020' },
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            target: env.VITE_TB_TARGET || 'http://localhost:8080',
            ws: true,
          },
        },
      },
    },
  };
});
