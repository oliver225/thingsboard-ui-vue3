import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            // ThingsBoard REST API 默认前缀即为 /api，故不再 rewrite 去掉前缀
            rewrite: (path) => path,
            // ThingsBoard 后端地址，请按实际环境修改
            target: 'http://localhost:8080',
            ws: true,
          },
        },
      },
    },
  };
});
