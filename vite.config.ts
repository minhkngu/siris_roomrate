import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createLarkReader } from './server/lark-base.mjs';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, __dirname, ''), ...process.env };
  const shared = env.LARK_CONFIG_DIRECTORY
    ? loadEnv(mode, path.resolve(__dirname, env.LARK_CONFIG_DIRECTORY), '') : {};
  const getShortTermData = createLarkReader({
    appId: env.LARK_APP_ID || shared.LARK_APP_ID,
    appSecret: env.LARK_APP_SECRET || shared.LARK_APP_SECRET,
    baseToken: env.LARK_BASE_TOKEN,
  });
  return {
  plugins: [react(), tailwindcss(), {
    name: 'local-short-term-data',
    configureServer(server) {
      server.middlewares.use('/api/short-term', async (request, response) => {
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('Content-Type', 'application/json');
        if (request.method !== 'GET') {
          response.statusCode = 405;
          response.setHeader('Allow', 'GET');
          response.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        try {
          response.end(JSON.stringify(await getShortTermData()));
        } catch (error) {
          console.error('Cannot read Siris Web from Lark Base:', error.message);
          response.statusCode = 502;
          response.end(JSON.stringify({ error: 'Không đọc được Lark Base. Kiểm tra cấu hình ứng dụng Lark và quyền đọc Siris Web.' }));
        }
      });
    },
  }],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'lucide': ['lucide-react'],
        },
      },
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
  },
  };
});
