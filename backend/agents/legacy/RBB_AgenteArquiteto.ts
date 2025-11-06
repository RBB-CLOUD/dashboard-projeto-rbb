// api/RBB_AgenteArquiteto.ts
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import * as MemoriaContexto from "./RBB_MemoriaContexto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function executar(tarefa: any) {
  const { payload } = tarefa;
  const { instrucao, contexto = {} } = payload;

  try {
    await log("info", `🏗️ Arquiteto iniciando: ${instrucao}`);
    const plano = await gerarPlano(instrucao, contexto);
    await log("info", `📋 Plano gerado: ${plano.resumo}`);

    const resultados: any[] = [];
    for (const passo of plano.passos) {
      const r = await executarPasso(passo);
      resultados.push(r);
      await log("info", `✅ Passo: ${passo.descricao}`);
    }

    const validacao = await validarResultados(resultados);
    if (!validacao.sucesso) {
      await log("warn", "⚠️ Problemas detectados. Corrigindo...");
      await corrigirProblemas(validacao.problemas);
    }

    await supabase.from("agentes_execucoes").insert({
      tarefa_id: tarefa.id,
      agente: "RBB_AgenteArquiteto",
      status: "ok",
      resultado: `Arquitetura completa: ${plano.resumo}`,
      meta: { plano, resultados, validacao },
    });

    const mensagem_chat = gerarMensagemChat(plano, resultados, validacao);
    return { success: true, plano, resultados, validacao, mensagem_chat };
  } catch (err: any) {
    await log("error", `❌ Erro no arquiteto: ${err.message}`);
    await supabase.from("agentes_execucoes").insert({
      tarefa_id: tarefa.id,
      agente: "RBB_AgenteArquiteto",
      status: "erro",
      resultado: err.message,
      meta: { error: err.message },
    });
    throw err;
  }
}

async function gerarPlano(instrucao: string, contexto: any) {
  const contextoCompleto = await MemoriaContexto.buscarContexto({
    limite_historico: 10,
  });
  const memoriaFormatada =
    MemoriaContexto.formatarContextoParaPrompt(contextoCompleto);

  const prompt = `${memoriaFormatada}

INSTRUÇÃO ATUAL DO USUÁRIO: ${instrucao}

Você tem AUTONOMIA CONTROLADA no RBB.
Regras de segurança:
- Sempre SIMULAR primeiro (dry-run).
- Só executar produção se houver a frase "Confirmo execução" ou autorização explícita do proprietário.

Retorne JSON:
{
  "resumo": "...",
  "passos": [
    {
      "tipo": "executar_codigo|gerar_pagina|enviar_email|resposta_direta",
      "descricao": "...",
      "agente": "RBB_AgenteExecutor|RBB_AgentePaginas|RBB_AgenteEmail|nenhum",
      "payload": { ... },
      "confirmed": false
    }
  ]
}
REGRAS: payloads completos; código/HTML completos; padrões seguros. Retorne APENAS JSON.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const content = response.choices[0].message.content || "{}";
  return JSON.parse(content.replace(/```json\n?/g, "").replace(/```\n?/g, ""));
}

async function executarPasso(passo: any) {
  const { agente, payload, tipo } = passo;
  if (tipo === "resposta_direta")
    return { success: true, mensagem: payload?.mensagem };

  if (!payload || Object.keys(payload).length === 0)
    throw new Error(`Payload vazio para ${tipo}`);
  if (tipo === "executar_codigo" && !payload.linguagem)
    throw new Error(`Campo 'linguagem' obrigatório`);
  if (tipo === "gerar_pagina" && !payload.path_name && !payload.pathName)
    throw new Error(`Campo 'path_name' obrigatório`);
  if (tipo === "enviar_email" && !payload.to)
    throw new Error(`Campo 'to' obrigatório`);

  const confirmed = !!passo.confirmed;
  const payloadComFlags = { ...payload, dry_run: !confirmed, confirmed };

  const { error } = await supabase.from("agentes_tarefas").insert({
    agente,
    tipo,
    payload: payloadComFlags,
    status: "fila",
    prioridade: confirmed ? 10 : 5,
  });
  if (error) throw new Error(`Erro ao criar tarefa: ${error.message}`);

  await new Promise((r) => setTimeout(r, 8000));
  return { passo: passo.descricao, status: "executado" };
}

// validarResultados, corrigirProblemas, gerarMensagemChat — iguais aos seus

async function log(level: string, message: string) {
  try {
    await supabase
      .from("logs_agentes")
      .insert({ agente: "RBB_AgenteArquiteto", level, message, meta: {} });
  } catch {}
}
