import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// In dev, run the Vercel handlers in ../api inside Vite, against the
// Firestore emulator. Production runs the same files as Vercel functions.
function apiDev() {
  return {
    name: 'apbites-api-dev',
    configureServer(server) {
      process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
      process.env.FIREBASE_PROJECT_ID ||= 'demo-apbites';
      server.middlewares.use('/api', async (req, res, next) => {
        const name = (req.url || '').split('?')[0].replace(/^\/+|\/+$/g, '');
        if (!/^[a-z0-9-]+$/.test(name)) return next();
        const file = path.join(root, 'api', `${name}.js`);
        let mod;
        try {
          mod = await server.ssrLoadModule(file);
        } catch {
          return next();
        }
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (obj) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); return res; };
        try {
          await mod.default(req, res);
        } catch (e) {
          server.config.logger.error(e.stack || String(e));
          if (!res.headersSent) res.status(500).json({ error: { code: 'internal', message: 'Dev handler crashed' } });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiDev()],
  server: {
    host: true,
    fs: { allow: ['..'] },
  },
  ssr: {
    external: ['firebase-admin'],
  },
});
