import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const experimentsDir = path.resolve(__dirname, 'experiments');
  const experimentInputs: Record<string, string> = {
    main: path.resolve(__dirname, 'index.html'),
  };

  if (fs.existsSync(experimentsDir)) {
    fs.readdirSync(experimentsDir).forEach((file) => {
      if (file.endsWith('.html')) {
        const key = file.replace(/\.html$/, '').replace(/[^a-zA-Z0-9_]/g, '_');
        experimentInputs[key] = path.resolve(experimentsDir, file);
      }
    });
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: experimentInputs,
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
