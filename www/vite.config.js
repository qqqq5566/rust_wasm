import { defineConfig } from 'vite';
import { resolve } from 'path';

const tools = [
  'image',
  'hash',
  'qrcode',
  'base64',
  'url-encode',
  'uuid',
  'color',
  'password',
];

// 构建多入口：首页 + 8 个工具页
const entries = {
  main: resolve(__dirname, 'index.html'),
};
tools.forEach((t) => {
  entries[t] = resolve(__dirname, `tools/${t}.html`);
});

export default defineConfig({
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'esnext',
    rollupOptions: { input: entries },
  },
  optimizeDeps: {
    exclude: ['./src/wasm'],
  },
});
