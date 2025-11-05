const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;

function handleApiRequest(req, res) {
  const apiPath = req.url.split('?')[0].replace('/api/', '');
  const apiFile = path.join(__dirname, 'backend', 'api', `${apiPath}.js`);
  
  console.log(`📡 API Request: ${req.method} ${req.url} -> ${apiFile}`);
  
  if (fs.existsSync(apiFile)) {
    delete require.cache[require.resolve(apiFile)];
    const handler = require(apiFile);
    req.method = req.method || 'GET';
    if (handler.default) {
      handler.default(req, res);
    } else {
      handler(req, res);
    }
  } else {
    console.log(`❌ API file not found: ${apiFile}`);
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
  }
}

const server = http.createServer((req, res) => {
  // ⭐ CORS - Permitir requisições da Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
  
  // Responder OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
    return res;
  };
  res.send = (data) => {
    res.end(data);
    return res;
  };
  
  if (req.url.startsWith('/api/')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch (e) {
        req.body = {};
      }
      handleApiRequest(req, res);
    });
    return;
  }
  
  if (req.url.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, req.url);
    
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('404 Not Found');
        return;
      }
      
      const ext = path.extname(filePath);
      const contentType = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml'
      }[ext] || 'image/jpeg';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
    return;
  }
  
  if (req.url.startsWith('/pages/')) {
    const handler = require('./backend/api/pages/view.js');
    handler(req, res);
  } else {
    let filePath = path.join(__dirname, 'dist', req.url === '/' ? 'index.html' : req.url);
    
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
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando em http://0.0.0.0:${PORT}`);
  console.log(`📡 API: http://0.0.0.0:${PORT}/api/health`);
});
