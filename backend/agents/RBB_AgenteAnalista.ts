// api/RBB_AgenteAnalista.ts
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { shouldDryRun } from "./tools/guard";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function executar(tarefa: any) {
  const { payload } = tarefa;
  const { tipo, codigo, descricao } = payload;
  const dry = shouldDryRun(payload);

  try {
    await log("info", `🔍 Claude Analista iniciando: ${tipo} (dryRun=${dry})`);
    let resultado;

    switch (tipo) {
      case "code_review":
        resultado = await fazerCodeReview(codigo, descricao);
        break;
      case "debug":
        resultado = await debugarCodigo(codigo, descricao);
        break;
      case "otimizar":
        resultado = await otimizarCodigo(codigo, descricao);
        break;
      case "explicar":
        resultado = await explicarCodigo(codigo);
        break;
      default:
        throw new Error(`Tipo não suportado: ${tipo}`);
    }

    await supabase.from("agentes_execucoes").insert({
      tarefa_id: tarefa.id,
      agente: "RBB_AgenteAnalista",
      status: "ok",
      resultado: `Análise completa: ${tipo}`,
      meta: { tipo, resultado, dry },
    });
    await log("info", "✅ Claude concluiu a análise!");
    return { success: true, resultado };
  } catch (err: any) {
    await log("error", `❌ Erro no analista: ${err.message}`);
    await supabase.from("agentes_execucoes").insert({
      tarefa_id: tarefa.id,
      agente: "RBB_AgenteAnalista",
      status: "erro",
      resultado: err.message,
      meta: { error: err.message },
    });
    throw err;
  }
}

// … funcoes fazerCodeReview/debugar/otimizar/explicar (iguais às suas) …

async function log(level: string, message: string) {
  try {
    await supabase
      .from("logs_agentes")
      .insert({ agente: "RBB_AgenteAnalista", level, message, meta: {} });
  } catch {}
}
