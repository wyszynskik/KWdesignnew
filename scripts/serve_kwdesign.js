const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8787;
const BASE = path.resolve(__dirname, '..');

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.webp': 'image/webp',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
};

http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  // strip /KWdesignnew prefix
  url = url.replace(/^\/KWdesignnew/, '');
  if (!url || url === '/') url = '/index.html';
  const file = path.join(BASE, url.replace(/\//g, path.sep));

  fs.readFile(file, (err, data) => {
    if (err && !path.extname(file)) {
      // Cloudflare Pages "clean URLs": /portfolio -> portfolio.html
      fs.readFile(file + '.html', (err2, data2) => {
        if (err2) { res.writeHead(404); res.end('404'); return; }
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(data2);
      });
      return;
    }
    if (err) { res.writeHead(404); res.end('404'); return; }
    const ext = path.extname(file);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => console.log('READY:' + PORT));
