import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: { entries: ['index.html'] },
  server: { host: '0.0.0.0', allowedHosts: true, watch: { ignored: ['**/.agents/**', '**/.claude/**', '**/agent/skills/**'] } },
  preview: { host: '0.0.0.0', allowedHosts: true },
});
