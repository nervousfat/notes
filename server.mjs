import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be 1–65535');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
const publicFiles = new Set(['index.html', 'app.js', 'core.js', 'base.css', 'style.css']);
const server = http.createServer(async (req, res) => {
  const send = (code, message) => { res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end(message); };
  if (!['GET', 'HEAD'].includes(req.method)) return send(405, 'Method not allowed');
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const name = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (!publicFiles.has(name)) return send(404, 'Not found');
    const target = await realpath(path.join(root, name));
    if (path.dirname(target).toLowerCase() !== root.toLowerCase()) return send(404, 'Not found');
    if (!(await stat(target)).isFile()) return send(404, 'Not found');
    const body = await readFile(target);
    res.writeHead(200, {
      'Content-Type': types[path.extname(target)] || 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) {
    send(error instanceof URIError ? 400 : 404, 'Unable to serve this path');
  }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log('Open http://127.0.0.1:' + port));
