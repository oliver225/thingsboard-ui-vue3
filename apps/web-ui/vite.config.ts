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
          // OAuth2 保留原始域名和端口；必须在通用 /api 代理之前匹配。
          '^/(?:api/noauth/oauth2Clients|oauth2/authorization/|login/oauth2/code/)':
            {
              target: env.VITE_TB_TARGET || 'http://localhost:8080',
              xfwd: true,
            },
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
