// api/RBB_Orquestrador.ts
import { createClient } from "@supabase/supabase-js";
import * as ArquitetoAutonomo from "./autonomous/ARQUITETO";
import * as ExecutorAutonomo from "./autonomous/EXECUTOR";
import * as ContentCreator from "./autonomous/CONTENT_CREATOR";
import * as DeployMaster from "./autonomous/DEPLOY_MASTER";
import * as OrquestradorAutonomo from "./autonomous/ORQUESTRADOR";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const AGENTES: Record<string, any> = {
  ARQUITETO_AUTONOMO: ArquitetoAutonomo,
  EXECUTOR_AUTONOMO: ExecutorAutonomo,
  CONTENT_CREATOR: ContentCreator,
  DEPLOY_MASTER: DeployMaster,
  ORQUESTRADOR_AUTONOMO: OrquestradorAutonomo,
};

export async function processar() {
  const { data: tarefas, error } = await supabase
    .from("agentes_tarefas")
    .select("*")
    .eq("status", "fila")
    .order("prioridade", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(10);
  
  if (error) {
    console.log("❌ Erro ao buscar tarefas:", error);
    return;
  }
  
  if (!tarefas || tarefas.length === 0) {
    console.log(`🚀 Processando ${0} tarefa(s)...`);
    return;
  }
  
  console.log(`🚀 Processando ${tarefas.length} tarefa(s)...`);
  
  for (const tarefa of tarefas) {
    await supabase
      .from("agentes_tarefas")
      .update({ status: "processando" })
      .eq("id", tarefa.id);
      
    const agente = AGENTES[tarefa.agente];
    
    if (!agente) {
      const errorDetails = {
        message: `Agente não encontrado: ${tarefa.agente}`,
        tarefa_id: tarefa.id,
        agentes_disponiveis: Object.keys(AGENTES),
      };
      
      await supabase
        .from("agentes_tarefas")
        .update({
          status: "erro",
          resultado: JSON.stringify({ error: errorDetails }),
        })
        .eq("id", tarefa.id);
        
      await supabase
        .from("logs_agentes")
        .insert({
          agente: "RBB_Orquestrador",
          level: "error",
          message: `Agente não encontrado: ${tarefa.agente}`,
          meta: errorDetails,
        });
        
      continue;
    }
    
    try {
      const preview = tarefa.payload?.dry_run === true ? "[DRY-RUN]" : "";
      console.log(
        `▶️ ${preview} ${tarefa.agente}:${tarefa.tipo} #${tarefa.id}`,
      );
      
      const resultado = await agente.executar(tarefa);
      
      await supabase
        .from("agentes_tarefas")
        .update({
          status: "concluido",
          resultado:
            typeof resultado === "string"
              ? resultado
              : JSON.stringify(resultado),
        })
        .eq("id", tarefa.id);
        
    } catch (err: any) {
      const errorDetails = {
        message: err.message,
        stack: err.stack,
        tarefa_id: tarefa.id,
        agente: tarefa.agente,
        tipo: tarefa.tipo,
      };
      
      await supabase
        .from("agentes_tarefas")
        .update({
          status: "erro",
          resultado: JSON.stringify({ error: errorDetails }),
        })
        .eq("id", tarefa.id);
        
      await supabase
        .from("logs_agentes")
        .insert({
          agente: tarefa.agente,
          level: "error",
          message: `Erro na tarefa ${tarefa.id}: ${err.message}`,
          meta: errorDetails,
        });
    }
  }
}
