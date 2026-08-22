import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import fs from 'fs';
import crypto from 'crypto';

function rawTraceServerPlugin() {
  return {
    name: 'raw-trace-server-plugin',
    configureServer(server: any) {
      // 1. GET /api/raw-traces-info: Returns live path, SHA256, lineCount, pointCount, lineIds
      server.middlewares.use('/api/raw-traces-info', (_req: any, res: any) => {
        try {
          const rootPath = resolve(__dirname, 'v3_raw_traces_manual.json');
          const content = fs.readFileSync(rootPath, 'utf8');
          const hash = crypto.createHash('sha256').update(content).digest('hex');
          const data = JSON.parse(content.replace(/^\uFEFF/, ''));

          let pointCount = 0;
          const lineIds: string[] = [];
          data.forEach((l: any) => {
            lineIds.push(l.id);
            if (Array.isArray(l.points)) pointCount += l.points.length;
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            absolutePath: rootPath,
            sha256: hash,
            lineCount: data.length,
            pointCount,
            lineIds,
            lines: data,
          }));
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // 2. POST /api/save-raw-traces: Direct Save to disk
      server.middlewares.use('/api/save-raw-traces', (req: any, res: any) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
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

              console.log(`[API] ✓ Successfully saved ${data.length} lines directly to disk!`);
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
  plugins: [tailwindcss(), react(), rawTraceServerPlugin()],
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
