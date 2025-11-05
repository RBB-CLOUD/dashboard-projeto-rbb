// api/orquestrador_polling.ts
import { processar } from "./RBB_Orquestrador";
import { selfCheck } from "./tools/self_check";

async function init() {
  console.log("🛰️ Orquestrador RBB iniciado (modo POLLING)...");
  await selfCheck();
  console.log("✅ Verificando tarefas a cada 5s...\n");

  const tick = () =>
    processar().catch((e) =>
      console.error("❌ Erro no orquestrador:", e.message),
    );
  setInterval(tick, 5000 + Math.floor(Math.random() * 500));
  setInterval(() => console.log("💓 Orquestrador rodando..."), 30000);
}

init();
