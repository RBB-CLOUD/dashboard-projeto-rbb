import { processar } from './backend/api/RBB_Orquestrador';

// Loop que processa tarefas
setInterval(async () => {
  await processar();
}, 5000);

// Primeira execução
processar();
