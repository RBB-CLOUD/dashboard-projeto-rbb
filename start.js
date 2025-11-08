/**
 * Inicia servidor HTTP + Orquestrador de agentes
 */

const { spawn } = require('child_process');

console.log('🚀 Iniciando RBB Cloud System...\n');

// 1. Servidor HTTP (Dashboard)
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: process.env
});

// 2. Orquestrador de Agentes
const worker = spawn('npx', ['tsx', 'index.ts'], {
  stdio: 'inherit',
  env: process.env
});

// Handlers de erro
server.on('error', (err) => {
  console.error('❌ Erro no servidor:', err);
  process.exit(1);
});

worker.on('error', (err) => {
  console.error('❌ Erro no worker:', err);
  process.exit(1);
});

// Cleanup ao encerrar
process.on('SIGTERM', () => {
  console.log('\n🛑 Encerrando sistema...');
  server.kill();
  worker.kill();
  process.exit(0);
});
