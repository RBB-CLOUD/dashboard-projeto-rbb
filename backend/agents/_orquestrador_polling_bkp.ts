import { processar } from "./RBB_Orquestrador";

console.log("🛰️ Orquestrador RBB iniciado (modo POLLING)...");
console.log("✅ Verificando tarefas a cada 5 segundos...\n");

// Processa tarefas a cada 5 segundos
setInterval(async () => {
  try {
    await processar();
  } catch (err: any) {
    console.error("❌ Erro no orquestrador:", err.message);
  }
}, 5000);

// Heartbeat a cada 30 segundos
setInterval(() => {
  console.log("💓 Orquestrador rodando...");
}, 30000);
