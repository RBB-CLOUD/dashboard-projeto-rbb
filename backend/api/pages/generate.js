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

  const { pathName, html } = body;

  if (!pathName || !html) {
    return res.status(400).json({ 
      error: 'Missing required fields: pathName, html' 
    });
  }

  const { data, error } = await supabase
    .from('paginas_geradas')
    .upsert({
      path_name: pathName,
      html
    }, {
      onConflict: 'path_name'
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ 
    success: true,
    page: data,
    url: `/pages/${pathName}`
  });
};
