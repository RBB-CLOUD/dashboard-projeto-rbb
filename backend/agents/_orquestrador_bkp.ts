import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
    timeout: 60000,
  },
  global: {
    headers: { "x-client-info": "rbb-orquestrador" },
  },
});

console.log("🛰️ Orquestrador RBB iniciado...");
console.log("📡 Conectando ao canal public:agentes_tarefas...");

const canal = supabase
  .channel("public:agentes_tarefas")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "agentes_tarefas" },
    async (payload) => {
      console.log("🚀 Nova tarefa detectada via Realtime:", payload.new);

      try {
        const tick = await fetch(process.env.REPLIT_TICK_URL || "http://localhost:3000/api/tick", { 
          method: "POST" 
        });
        console.log("✅ Tick disparado com sucesso:", tick.status);
      } catch (err: any) {
        console.error("❌ Erro ao disparar tick:", err.message);
      }
    }
  )
  .subscribe((status) => {
    console.log("📡 Status do canal:", status);
    if (status === "SUBSCRIBED") {
      console.log("✅ Orquestrador ATIVO e aguardando tarefas...");
    }
  });

setInterval(() => console.log("💓 Orquestrador rodando..."), 30000);
