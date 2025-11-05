const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Buscar páginas criadas
    const { data: paginas } = await supabase
      .from('paginas_geradas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    // 2. Buscar tarefas concluídas
    const { data: tarefas } = await supabase
      .from('agentes_tarefas')
      .select('*')
      .eq('status', 'concluido')
      .order('created_at', { ascending: false })
      .limit(50);

    // 3. Buscar execuções
    const { data: execucoes } = await supabase
      .from('agentes_execucoes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    // 4. Organizar recursos por tipo
    const recursos = {
      paginas: (paginas || []).map(p => ({
        tipo: 'pagina',
        nome: p.titulo || p.path_name,
        caminho: `/pages/${p.path_name}`,
        url: `https://${req.headers.host}/pages/${p.path_name}`,
        descricao: p.descricao || 'Página HTML',
        criado_em: p.created_at,
        id: p.id
      })),
      
      tarefas_concluidas: (tarefas || []).map(t => ({
        tipo: 'tarefa',
        agente: t.agente,
        tipo_tarefa: t.tipo,
        descricao: t.mensagem_inicial,
        resultado: t.resultado,
        criado_em: t.created_at,
        id: t.id
      })),

      execucoes: (execucoes || []).map(e => ({
        tipo: 'execucao',
        agente: e.agente,
        status: e.status,
        resultado: e.resultado,
        criado_em: e.created_at,
        id: e.id
      }))
    };

    // 5. Estatísticas
    const stats = {
      total_paginas: (paginas || []).length,
      total_tarefas: (tarefas || []).length,
      total_execucoes: (execucoes || []).length
    };

    return res.status(200).json({
      success: true,
      recursos,
      stats
    });

  } catch (error) {
    console.error('Erro ao listar recursos:', error);
    return res.status(500).json({ 
      error: 'Erro ao buscar recursos',
      details: error.message 
    });
  }
};
