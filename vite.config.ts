import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      server: {
        host: '0.0.0.0',
        port: 5000,
        strictPort: true,
        allowedHosts: ['3a8d5be4-d01c-43a1-9e47-e2f6b3dd128e-00-l45ndw5z2ebj.pike.replit.dev', 'localhost', '0.0.0.0'],
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        hmr: false
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
