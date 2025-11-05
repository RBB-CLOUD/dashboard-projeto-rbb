const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  let pathName = req.url.split('/').pop();
  
  // ⭐ TENTA COM E SEM BARRA INICIAL
  console.log('🔍 Buscando página:', pathName);
  
  let { data, error } = await supabase
    .from('paginas_geradas')
    .select('*')
    .eq('path_name', pathName)
    .single();
  
  // Se não encontrou, tenta com barra inicial
  if (error && !pathName.startsWith('/')) {
    console.log('🔄 Tentando com barra inicial: /', pathName);
    const resultado = await supabase
      .from('paginas_geradas')
      .select('*')
      .eq('path_name', '/' + pathName)
      .single();
    
    data = resultado.data;
    error = resultado.error;
  }

  console.log('📊 Resultado:', { encontrou: !!data, erro: error?.message });
  
  if (error || !data) {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>404 - Página não encontrada</title>
          <style>
            body {
              font-family: system-ui;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div>
            <h1>404</h1>
            <p>Página "${pathName}" não encontrada</p>
          </div>
        </body>
      </html>
    `);
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(data.html);
};
