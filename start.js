// dashboard-projeto-rbb/start.js

const { spawn } = require('child_process');

console.log('🚀 Iniciando RBB Cloud System...\n');

const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: process.env
});

const worker = spawn('npx', ['tsx', 'src/index.ts'], {
  stdio: 'inherit',
  env: process.env
});

server.on('error', (err) => {
  console.error('❌ Erro no servidor:', err);
  process.exit(1);
});

worker.on('error', (err) => {
  console.error('❌ Erro no worker:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Encerrando sistema...');
  server.kill();
  worker.kill();
  process.exit(0);
});
