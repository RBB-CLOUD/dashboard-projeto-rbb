import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verifica se coluna existe
    const { data: colunas } = await supabase
      .from('agentes_tarefas')
      .select('*')
      .limit(1);

    const temResultado = colunas && colunas[0] && 'resultado' in colunas[0];
    
    if (temResultado) {
      return res.json({ 
        status: 'ok',
        message: 'Coluna resultado já existe!' 
      });
    }

    return res.json({
      status: 'precisa_executar_sql',
      message: 'Execute no Supabase Dashboard SQL Editor:',
      sql: [
        'ALTER TABLE agentes_tarefas ADD COLUMN IF NOT EXISTS resultado TEXT;',
        'ALTER TABLE agentes_tarefas ADD COLUMN IF NOT EXISTS meta JSONB;'
      ]
    });
    
  } catch (err) {
    return res.status(500).json({ 
      error: err.message,
      hint: 'Execute SQL manualmente no Supabase Dashboard'
    });
  }
}
