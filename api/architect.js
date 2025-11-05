import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mensagem } = req.body;

  if (!mensagem) {
    return res.status(400).json({ error: 'Mensagem obrigatória' });
  }

  try {
    // Enfileira tarefa para o orquestrador processar
    const { data, error } = await supabase
      .from('agentes_tarefas')
      .insert({
        agente: 'RBB_AgenteArquiteto',
        tipo: 'architect_task',
        payload: { mensagem },
        status: 'pendente',
        mensagem_inicial: mensagem
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao enfileirar tarefa:', error);
      return res.status(500).json({ 
        error: 'Erro ao processar solicitação',
        details: error.message 
      });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Tarefa enfileirada com sucesso',
      taskId: data.id
    });

  } catch (error) {
    console.error('Erro no handler:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
}
