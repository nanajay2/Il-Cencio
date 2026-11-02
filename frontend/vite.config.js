import { defineConfig } from 'vite';
import react       from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { appendFileSync } from 'node:fs';
import { join }           from 'node:path';
import pkg         from './package.json' with { type: 'json' };

// Il browser aggiorna il service worker solo se sw.js cambia di almeno un byte.
// Timbrandolo a ogni build, ogni deploy lo fa installare: prende il controllo e
// main.jsx ricarica l'app, anche per chi ha la PWA già installata.
function stampServiceWorker() {
  return {
    name: 'stamp-service-worker',
    apply: 'build',
    writeBundle(options) {
      appendFileSync(join(options.dir, 'sw.js'), `\n// build ${pkg.version} ${Date.now()}\n`);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), stampServiceWorker()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    proxy: { '/api': 'http://localhost:3001' },
  },
});
