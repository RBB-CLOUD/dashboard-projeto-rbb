/**
 * 🎯 RBB CLOUD - Backend Worker
 * Orquestrador de Agentes Autônomos
 */

import { processar } from './backend/agents/RBB_Orquestrador';

async function init() {
  console.log('🛰️ RBB Cloud Worker iniciando...');
  console.log('📍 Conectado ao Supabase');
  console.log('✅ Verificando tarefas a cada 5s...\n');
  
  const tick = () =>
    processar().catch((e) =>
      console.error('❌ Erro no orquestrador:', e.message)
    );
  
  setInterval(tick, 5000 + Math.floor(Math.random() * 500));
  
  setInterval(
    () => console.log('💓 Orquestrador ativo...'),
    30000
  );
  
  await tick();
}

init().catch(console.error);
