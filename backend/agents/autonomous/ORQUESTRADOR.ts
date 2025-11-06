/**
 * 🎼 ORQUESTRADOR AUTÔNOMO v2.0
 * Integrado com sistema RBB via Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TarefaCompleta {
  tipo: 'site' | 'app' | 'landing' | 'feature' | 'content';
  descricao: string;
  requisitos?: string[];
  contexto?: string;
}

export async function executar(tarefa: any): Promise<any> {
  const { descricao, tipo, requisitos, contexto } = tarefa.payload;
  
  const tarefaCompleta: TarefaCompleta = {
    tipo: tipo || 'site',
    descricao,
    requisitos,
    contexto
  };
  
  try {
    const resultado = await executarTarefaCompleta(tarefaCompleta);
    return {
      success: true,
      ...resultado
    };
  } catch (error: any) {
    throw new Error(`Erro no Orquestrador: ${error.message}`);
  }
}

/**
 * Cria tarefa no Supabase para processamento
 */
async function criarTarefa(
  agente: string,
  tipo: string,
  payload: any,
  prioridade: number = 10
): Promise<number> {
  const { data, error } = await supabase
    .from('agentes_tarefas')
    .insert({
      agente,
      tipo,
      payload,
      prioridade,
      status: 'fila'
    })
    .select()
    .single();
    
  if (error) throw new Error(`Erro ao criar tarefa: ${error.message}`);
  
  console.log(`✅ Tarefa #${data.id} criada: ${agente}/${tipo}`);
  return data.id;
}

/**
 * Executa tarefa completa coordenando múltiplos agentes
 */
async function executarTarefaCompleta(tarefa: TarefaCompleta): Promise<{
  sucesso: boolean;
  tarefas_criadas: number[];
  mensagem: string;
}> {
  const tarefas_ids: number[] = [];
  
  try {
    console.log(`🎼 Orquestrando: ${tarefa.tipo}`);
    
    // ETAPA 1: Planejamento (Arquiteto Autônomo - Claude)
    const id_arquiteto = await criarTarefa(
      'ARQUITETO_AUTONOMO',
      'arquitetura_autonoma',
      {
        instrucao: tarefa.descricao,
        contexto: tarefa.contexto,
        requisitos: tarefa.requisitos,
        tipo_operacao: 'nova'
      },
      100
    );
    tarefas_ids.push(id_arquiteto);
    
    // Aguarda arquitetura (polling simples)
    await aguardarConclusao(id_arquiteto, 30000);
    const arquitetura = await obterResultado(id_arquiteto);
    
    // ETAPA 2: Criação (Executor ou Content Creator - GPT-4o-mini)
    if (tarefa.tipo === 'landing' || tarefa.tipo === 'content') {
      const id_content = await criarTarefa(
        'CONTENT_CREATOR',
        'criar_landing',
        {
          especificacao: tarefa.descricao,
          arquitetura: arquitetura,
          estilo: 'moderno_profissional'
        },
        90
      );
      tarefas_ids.push(id_content);
    } else {
      const id_executor = await criarTarefa(
        'EXECUTOR_AUTONOMO',
        'criar_codigo',
        {
          especificacao: tarefa.descricao,
          arquitetura: arquitetura
        },
        90
      );
      tarefas_ids.push(id_executor);
    }
    
    // ETAPA 3: Deploy (Deploy Master - sem IA)
    const id_deploy = await criarTarefa(
      'DEPLOY_MASTER',
      'preparar_deploy',
      {
        projeto: tarefa.descricao,
        tarefas_anteriores: tarefas_ids
      },
      80
    );
    tarefas_ids.push(id_deploy);
    
    return {
      sucesso: true,
      tarefas_criadas: tarefas_ids,
      mensagem: `🎉 ${tarefas_ids.length} tarefas criadas e em processamento`
    };
    
  } catch (error: any) {
    return {
      sucesso: false,
      tarefas_criadas: tarefas_ids,
      mensagem: `❌ Erro: ${error.message}`
    };
  }
}

/**
 * Aguarda conclusão de tarefa
 */
async function aguardarConclusao(
  tarefaId: number, 
  timeout: number = 30000
): Promise<void> {
  const inicio = Date.now();
  
  while (Date.now() - inicio < timeout) {
    const { data } = await supabase
      .from('agentes_tarefas')
      .select('status')
      .eq('id', tarefaId)
      .single();
      
    if (data?.status === 'concluido') return;
    if (data?.status === 'erro') throw new Error(`Tarefa ${tarefaId} falhou`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error(`Timeout aguardando tarefa ${tarefaId}`);
}

/**
 * Obtém resultado de tarefa concluída
 */
async function obterResultado(tarefaId: number): Promise<any> {
  const { data } = await supabase
    .from('agentes_tarefas')
    .select('resultado')
    .eq('id', tarefaId)
    .single();
    
  return data?.resultado ? JSON.parse(data.resultado) : null;
}

export default { executar };
