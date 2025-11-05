// api/RBB_AgenteComandoGeral.ts
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { isOwner, shouldDryRun } from "./tools/guard";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function executar(tarefa: any) {
  const { payload } = tarefa;
  const { comando, parametros, instrucao_proprietario } = payload;
  const dry = shouldDryRun(payload);
  const ownerOverride = isOwner({
    ownerName: payload?.owner_name,
    ownerPass: payload?.owner_pass,
    text: instrucao_proprietario,
  });

  if (instrucao_proprietario)
    return await executarComandoProprietario(instrucao_proprietario, tarefa);

  switch (comando) {
    case "criar_tarefas_multiplas":
      return await criarTarefasMultiplas(parametros);
    case "pausar_processamento":
      return await pausarProcessamento(parametros);
    case "retomar_processamento":
      return await retomarProcessamento(parametros);
    case "limpar_fila":
      return await limparFila(parametros);
    case "estatisticas":
      return await obterEstatisticas();
    case "mudar_modelo_gpt":
      return await mudarModeloGPT(parametros);
    case "ver_modelo_atual":
      return await verModeloAtual();
    default:
      break;
  }

  // Planejamento seguro
  const fs = await import("fs/promises");
  const path = await import("path");
  const configPath = path.join(process.cwd(), "config", "openai.json");
  const config = JSON.parse(await fs.readFile(configPath, "utf-8"));

  const prompt = `Você é o sistema de execução DO PROPRIETÁRIO com autonomia controlada.
Regras:
- SIMULE primeiro (dry-run=true).
- Só execução real com "Confirmo execução" ou credenciais do proprietário.
- Não invente dados sensíveis.

Retorne JSON:
{
  "acao": "executar_codigo|gerar_pagina|enviar_email|resposta_direta|multiplas_tarefas",
  "agente": "RBB_AgenteExecutor|RBB_AgentePaginas|RBB_AgenteEmail|nenhum|multiplos",
  "payload": {},
  "confirmed": false,
  "resposta_imediata": "..."
}`;
  const response = await openai.chat.completions.create({
    model: config.model,
    messages: [{ role: "user", content: prompt }],
    temperature: config.temperature || 0.3,
    max_tokens: config.max_tokens || 2000,
  });

  const content = response.choices[0].message.content || "{}";
  const plano = JSON.parse(
    content.replace(/```json\n?/g, "").replace(/```\n?/g, ""),
  );

  if (plano.acao === "multiplas_tarefas") {
    if (Array.isArray(plano.payload?.tarefas))
      await criarTarefasMultiplas(plano.payload);
  } else if (plano.acao !== "resposta_direta") {
    await supabase.from("agentes_tarefas").insert({
      agente: plano.agente,
      tipo: plano.acao,
      payload: {
        ...plano.payload,
        dry_run: !(plano.confirmed || ownerOverride),
        confirmed: !!(plano.confirmed || ownerOverride),
      },
      status: "fila",
      prioridade: plano.confirmed || ownerOverride ? 100 : 50,
    });
  }

  await supabase
    .from("agentes_tarefas")
    .update({
      status: "concluido",
      resultado: JSON.stringify({
        mensagem_chat: plano.resposta_imediata,
        plano_executado: plano,
      }),
    })
    .eq("id", tarefa.id);

  return { success: true, mensagem_chat: plano.resposta_imediata, plano };
}

// manter as funções executarComandoProprietario/criarTarefasMultiplas/pausar/retomar/limpar/estatisticas/mudarModelo/verModelo (iguais às suas)
