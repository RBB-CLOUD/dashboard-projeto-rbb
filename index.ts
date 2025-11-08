/**
 * 🎯 RBB CLOUD - Redirecionador para Orquestrador
 */
import { processar } from './backend/agents/RBB_Orquestrador'

processar().catch((e) => {
  console.error('Erro ao iniciar orquestrador:', e)
})
