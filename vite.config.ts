import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function blockOpenInEditorPlugin(): Plugin {
  return {
    name: 'block-open-in-editor',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/__open-in-editor')) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'text/plain');
          res.end('Forbidden: /__open-in-editor is disabled.');
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), blockOpenInEditorPlugin()],
  base: './',
  server: {
    host: '127.0.0.1',
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
