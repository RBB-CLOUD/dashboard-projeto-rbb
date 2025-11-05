const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  let body;
  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    body = JSON.parse(Buffer.concat(chunks).toString());
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { agente, tipo, payload, prioridade = 5 } = body;

  if (!agente || !tipo || !payload) {
    return res.status(400).json({ 
      error: 'Missing required fields: agente, tipo, payload' 
    });
  }

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

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json({ 
    success: true,
    tarefa: data 
  });
};
