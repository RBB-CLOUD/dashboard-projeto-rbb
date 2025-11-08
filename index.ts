/**
 * 🎯 RBB CLOUD - Backend Worker
 * Orquestrador de Agentes Autônomos
 */

import { processar } from './backend/api/RBB_Orquestrador';

async function init() {
  console.log('🛰️ RBB Cloud Worker iniciando...');
  console.log('📍 Conectado ao Supabase');
  console.log('✅ Verificando tarefas a cada 5s...\n');
  
  // Processar tarefas a cada 5 segundos
  const tick = () =>
    processar().catch((e) =>
      console.error('❌ Erro no orquestrador:', e.message)
    );
  
  // Intervalo com jitter para evitar colisões
  setInterval(tick, 5000 + Math.floor(Math.random() * 500));
  
  // Heartbeat
  setInterval(
    () => console.log('💓 Orquestrador ativo...'),
    30000
  );
  
  // Primeira execução
  await tick();
}

// Iniciar
init().catch(console.error);
