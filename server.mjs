import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { onRequestPost } from './functions/api/chat.js';
const root = dirname(fileURLToPath(import.meta.url));
try { process.loadEnvFile(resolve(root, '.env')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path === '/api/chat' && req.method === 'POST') {
      let body = ''; let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 96000) { res.writeHead(413); res.end(); return; }
        body += chunk;
      }
      const response = await onRequestPost({ request: new Request('http://localhost/api/chat', { method: 'POST', body }), env: process.env });
      res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(await response.text()); return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    // Serve only public website assets; never expose source, env or server files.
    const relative = path === '/' ? 'index.html' : path.slice(1);
    if (!['index.html', 'style.css', 'script.js', 'data.js', 'favicon.svg'].includes(relative) && !/^(assets|data)\/[\w .\-\/]+$/.test(relative)) { res.writeHead(404); res.end(); return; }
    if (relative.split('/').some(part => part.startsWith('.'))) { res.writeHead(404); res.end(); return; }
    const content = await readFile(resolve(root, relative));
    res.writeHead(200, { 'content-type': mime[extname(relative)] || 'application/octet-stream', 'x-content-type-options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(Number(process.env.PORT || 4174), '127.0.0.1', () => {
  console.log(`TCG: http://localhost:${server.address().port} (${process.env.GEMINI_API_KEY ? 'Gemini configured' : 'demo mode; add GEMINI_API_KEY to .env'})`);
});
