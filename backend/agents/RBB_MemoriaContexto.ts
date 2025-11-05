// == AGENTE: RBB_MemoriaContexto ==
import { createClient } from "@supabase/supabase-js";
export const AGENTE_NOME = "RBB_MemoriaContexto";
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

export interface ContextoAgente {
  historico_tarefas: any[];
  recursos_criados: RecursoCriado[];
  capacidades: Capacidades;
  conversas_anteriores: string[];
}
export interface RecursoCriado {
  tipo: "pagina" | "rota" | "codigo" | "email" | "arquivo";
  nome: string;
  caminho?: string;
  url?: string;
  descricao: string;
  criado_em: string;
  tarefa_id: number;
}
export interface Capacidades {
  linguagens: string[];
  agentes_disponiveis: string[];
  endpoints_api: string[];
  recursos: string[];
}

export async function buscarContexto(params?: {
  usuario_id?: string;
  limite_historico?: number;
}): Promise<ContextoAgente> {
  const { usuario_id, limite_historico = 10 } = params || {};
  let q = supabase
    .from("agentes_tarefas")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limite_historico);
  if (usuario_id) q = q.eq("usuario_id", usuario_id);
  const { data: tarefas = [] } = await q;
  const { data: paginas = [] } = await supabase
    .from("paginas_geradas")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  const recursos_criados: RecursoCriado[] = paginas.map((p: any) => ({
    tipo: "pagina",
    nome: p.titulo || p.path_name,
    caminho: `/pages/${p.path_name}`,
    url: `/${p.path_name}`,
    descricao: p.descricao || "Página HTML gerada",
    criado_em: p.created_at,
    tarefa_id: p.tarefa_id,
  }));
  const conversas_anteriores: string[] = [];
  tarefas.forEach((t: any) => {
    if (t.mensagem_inicial)
      conversas_anteriores.push(`Usuário: ${t.mensagem_inicial}`);
    if (t.resposta) conversas_anteriores.push(`Agente: ${t.resposta}`);
  });
  const capacidades: Capacidades = {
    linguagens: ["Python 3.11", "Node.js 20", "Java 19", "TypeScript 5"],
    agentes_disponiveis: [
      "RBB_AgenteArquiteto",
      "RBB_AgenteAnalista",
      "RBB_AgenteExecutor",
      "RBB_AgentePaginas",
      "RBB_AgenteEmail",
      "RBB_AgenteGitHub",
      "RBB_AgenteLogs",
      "RBB_AgenteDashboard",
    ],
    endpoints_api: ["POST /api/tokens/create", "POST /api/tokens/revoke"],
    recursos: ["Supabase", "OpenAI", "Anthropic", "GitHub", "Resend"],
  };
  return {
    historico_tarefas: tarefas,
    recursos_criados,
    capacidades,
    conversas_anteriores,
  };
}

export function formatarContextoParaPrompt(ctx: ContextoAgente): string {
  let out = `CONTEXTO E MEMÓRIA DO SISTEMA:\n\n`;
  if (ctx.conversas_anteriores.length) {
    out += `📜 HISTÓRICO (últimas ${ctx.conversas_anteriores.length}):\n`;
    ctx.conversas_anteriores.slice(-6).forEach((m) => (out += m + "\n"));
    out += "\n";
  }
  if (ctx.recursos_criados.length) {
    out += `🛠️ RECURSOS:\n`;
    ctx.recursos_criados
      .slice(0, 10)
      .forEach(
        (r) =>
          (out += `- ${r.tipo.toUpperCase()}: ${r.nome}${r.caminho ? ` (${r.caminho})` : ""}\n`),
      );
    out += "\n";
  }
  out += `💪 CAPACIDADES:\n- Linguagens: ${ctx.capacidades.linguagens.join(", ")}\n- Agentes: ${ctx.capacidades.agentes_disponiveis.join(", ")}\n- Endpoints: ${ctx.capacidades.endpoints_api.join(", ")}\n\n`;
  out += `IMPORTANTE:\n- Você TEM memória do que está acima\n- Você PODE criar rotas/páginas/execuções previstas\n- Sempre simule antes\n\n`;
  return out;
}

export async function registrarRecursoCriado(recurso: RecursoCriado) {
  await supabase
    .from("logs_agentes")
    .insert({
      agente: AGENTE_NOME,
      level: "info",
      message: `Recurso criado: ${recurso.tipo} - ${recurso.nome}`,
      meta: recurso,
    });
}
