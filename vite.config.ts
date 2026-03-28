import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.VITE_ADMIN_ACCESS_PASSWORD': JSON.stringify(env.VITE_ADMIN_ACCESS_PASSWORD),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    server: {
      hmr: process.env.DISABLE_HMR === 'true' ? false : {
        port: 0,
      },
    },
  };
});
