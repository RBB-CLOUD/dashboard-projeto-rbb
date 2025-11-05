// == AGENTE: RBB_AgenteLogs ==
import { createClient } from "@supabase/supabase-js";
export const AGENTE_NOME = "RBB_AgenteLogs";
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

type Level = "info" | "warn" | "error";
export async function executar(tarefa: any) {
  const { payload } = tarefa; // { level, message, meta }
  const level: Level = payload?.level || "info";
  const message = payload?.message || "log";
  await supabase
    .from("logs_agentes")
    .insert({ agente: AGENTE_NOME, level, message, meta: payload?.meta || {} });
  return { success: true };
}
// uso: crie tarefa com agente=RBB_AgenteLogs tipo="log" payload={level:"info",message:"ok"}
