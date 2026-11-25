import { defineConfig } from 'vite';
export default defineConfig({
  optimizeDeps: { entries: ['index.html'] },
  server: { host: '0.0.0.0', allowedHosts: true, proxy: { '/api': { target:'http://127.0.0.1:3001', changeOrigin:false }, '/media': { target:'http://127.0.0.1:3001', changeOrigin:false } }, watch: { ignored: ['**/.agents/**', '**/.claude/**', '**/agent/skills/**', '**/.cms-data/**'] } },
  preview: { host: '0.0.0.0', allowedHosts: true },
});
