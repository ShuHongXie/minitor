import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { vitePluginUploadSourcemap, vitePluginReplaceVersion } from './src/plugin';

// https://vite.dev/config/
export default defineConfig({
  build: {
    //打包后文件目录
    outDir: 'dist',
    //css代码分割
    cssCodeSplit: true,
    minify: false,
    sourcemap: 'hidden',
  },
  resolve: {
    conditions: ['development', 'browser', 'import', 'module', 'default'],
    alias: {
      '@minitrack/vue': path.resolve(__dirname, '../../packages/vue/src/index.ts'),
      '@minitrack/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
    },
  },
  plugins: [
    vue(),
    vitePluginReplaceVersion(),
    vitePluginUploadSourcemap({
      appId: 'dd505c46-1370-42ac-b712-f4cb0b68fd50',
      uploadUrl: 'http://localhost:3000/sourcemap/upload',
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
