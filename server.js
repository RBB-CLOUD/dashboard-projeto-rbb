const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;

// --- Função auxiliar para servir arquivos estáticos ---
function serveStaticFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath);
    const contentType = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    }[ext] || 'text/plain';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

// --- API Handler (mantido igual) ---
function handleApiRequest(req, res) {
  const apiPath = req.url.split('?')[0].replace('/api/', '');
  const apiFile = path.join(__dirname, 'backend', 'api', `${apiPath}.js`);
  console.log(`📡 API Request: ${req.method} ${req.url} -> ${apiFile}`);

  if (fs.existsSync(apiFile)) {
    delete require.cache[require.resolve(apiFile)];
    const handler = require(apiFile);
    req.method = req.method || 'GET';
    if (handler.default) handler.default(req, res);
    else handler(req, res);
  } else {
    console.log(`❌ API file not found: ${apiFile}`);
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
  }
}

// --- Servidor Principal ---
const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

  // --- Rotas ---
  if (req.url.startsWith('/api/')) {
    let body = '';
    req.on('data', chunk => (body += chunk.toString()));
    req.on('end', () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch {
        req.body = {};
      }
      handleApiRequest(req, res);
    });
    return;
  }

  // Uploads
  if (req.url.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, req.url);
    return serveStaticFile(filePath, res);
  }

  // Páginas geradas
  if (req.url.startsWith('/pages/')) {
    const handler = require('./backend/api/pages/view.js');
    return handler(req, res);
  }

  // --- Rotas principais (corrige a tela branca) ---
  const dashboardPath = path.join(__dirname, 'site', 'dashboard.html');
  if (req.url === '/' || req.url === '/dashboard' || req.url === '/site/dashboard.html') {
    return serveStaticFile(dashboardPath, res);
  }

  // Demais arquivos estáticos
  const filePath = path.join(__dirname, 'site', req.url);
  if (fs.existsSync(filePath)) return serveStaticFile(filePath, res);

  res.writeHead(404);
  res.end('404 Not Found');
});

// --- Inicialização ---
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando em http://0.0.0.0:${PORT}`);
});
