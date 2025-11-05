// api/RBB_AgenteDashboard.ts
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { shouldDryRun, requireFields } from "./tools/guard";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

interface DashboardPayload {
  action: "edit" | "backup" | "restore";
  filePath: string;
  oldString?: string;
  newString?: string;
  backupId?: string;
}

export async function executar(tarefa: any) {
  const { payload }: { payload: DashboardPayload } = tarefa;
  requireFields(payload, ["action", "filePath"]);
  const dry = shouldDryRun(payload);

  try {
    if (payload.action === "edit" && dry) {
      await supabase
        .from("agentes_execucoes")
        .insert({
          tarefa_id: tarefa.id,
          agente: "RBB_AgenteDashboard",
          status: "ok",
          resultado: "Prévia de edição (dry-run)",
          meta: { filePath: payload.filePath },
        });
      return { success: true, preview: true };
    }

    if (payload.action === "edit") await editarArquivo(tarefa.id, payload);
    else if (payload.action === "backup") await fazerBackup(tarefa.id, payload);
    else if (payload.action === "restore")
      await restaurarBackup(tarefa.id, payload);
    else throw new Error(`Ação desconhecida: ${payload.action}`);

    await supabase.from("agentes_execucoes").insert({
      tarefa_id: tarefa.id,
      agente: "RBB_AgenteDashboard",
      status: "ok",
      resultado: `Ação ${payload.action} executada`,
      meta: { filePath: payload.filePath, dry },
    });
    return { success: true, action: payload.action };
  } catch (err: any) {
    await supabase
      .from("agentes_execucoes")
      .insert({
        tarefa_id: tarefa.id,
        agente: "RBB_AgenteDashboard",
        status: "erro",
        resultado: err.message,
        meta: { error: err.message },
      });
    throw err;
  }
}

// editarArquivo / fazerBackup / restaurarBackup — mantenha iguais aos seus
