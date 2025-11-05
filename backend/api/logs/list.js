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
      .from('logs_agentes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;

    return res.status(200).json(data || []);
  } catch (err) {
    console.error('List logs error:', err);
    return res.status(500).json({ error: err.message });
  }
};
