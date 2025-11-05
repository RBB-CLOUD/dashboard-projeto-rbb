const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  try {
    const { data, error } = await supabase
      .from('agentes_tarefas')
      .select('status');

    if (error) throw error;

    const stats = {
      fila: 0,
      processando: 0,
      concluido: 0,
      erro: 0
    };

    data.forEach(task => {
      const status = task.status.trim();
      if (stats.hasOwnProperty(status)) {
        stats[status]++;
      }
    });

    return res.status(200).json(stats);
  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ error: err.message });
  }
};
