import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'

function fileUploadPlugin() {
  return {
    name: 'file-upload-plugin',
    configureServer(server: any) {
      server.middlewares.use('/upload-file', (req: any, res: any) => {
        if (req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', (chunk: Buffer) => chunks.push(chunk));
          req.on('end', () => {
            try {
              const buffer = Buffer.concat(chunks);
              const rawName = (req.headers['x-filename'] as string) || '';
              const originalName = rawName ? decodeURIComponent(rawName) : `document_${Date.now()}.pdf`;
              const safeName = `${Date.now()}_${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
              const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
              if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
              }
              fs.writeFileSync(path.join(uploadsDir, safeName), buffer);
              console.log(`[Upload Plugin] File saved to public/uploads/${safeName} (${buffer.length} bytes)`);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, url: `/uploads/${safeName}`, name: originalName, size: buffer.length }));
            } catch (err: any) {
              console.error('[Upload Plugin Error]:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'File save failed' }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end('Method Not Allowed');
        }
      });
    }
  };
}

function backendServerPlugin() {
  return {
    name: 'backend-server-plugin',
    configureServer() {
      fetch('http://localhost:3001/api/health')
        .catch(() => {
          console.log('[Dev Server] Starting backend OTP server on port 3001...');
          const child = spawn('node', ['server/index.js'], {
            stdio: 'inherit',
            shell: true
          });
          child.on('error', (err: any) => console.warn('[Backend Notice]:', err.message));
          process.on('exit', () => child.kill());
        });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    fileUploadPlugin(),
    backendServerPlugin()
  ],
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})



