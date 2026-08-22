import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import fs from 'fs';

function directSavePlugin() {
  return {
    name: 'direct-save-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/save-raw-traces', (req: any, res: any) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const formatted = JSON.stringify(data, null, 2);
              const rootPath = resolve(__dirname, 'v3_raw_traces_manual.json');
              const srcPath = resolve(__dirname, 'src/data/v3_raw_traces_manual.json');
              const pubPath = resolve(__dirname, 'public/v3_raw_traces_manual.json');

              fs.writeFileSync(rootPath, formatted, 'utf8');
              fs.writeFileSync(srcPath, formatted, 'utf8');
              fs.writeFileSync(pubPath, formatted, 'utf8');

              console.log(`[API] ✓ Successfully saved ${data.length} raw lines directly to disk!`);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Saved successfully to disk!' }));
            } catch (err: any) {
              console.error('[API] Error saving raw traces:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), react(), directSavePlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        annotate: resolve(__dirname, 'annotate.html'),
        annotate_junctions: resolve(__dirname, 'annotate_junctions.html'),
      },
    },
  },
});
