const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

function apiRequest(method, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body ? JSON.parse(body) : {});
        } else {
          reject(new Error(`API Error ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('🗑️  Limpando projetos antigos na Vercel...\n');

  try {
    // Listar projetos
    const response = await apiRequest('GET', '/v9/projects');
    const projects = response.projects || [];

    console.log(`📦 Projetos encontrados: ${projects.length}\n`);

    // Excluir projetos que não são o painel-controle-rbb
    for (const project of projects) {
      if (project.name !== 'painel-controle-rbb') {
        console.log(`🗑️  Deletando: ${project.name}...`);
        try {
          await apiRequest('DELETE', `/v9/projects/${project.id}`);
          console.log(`  ✅ ${project.name} deletado\n`);
        } catch (err) {
          console.log(`  ⚠️  Não foi possível deletar ${project.name}: ${err.message}\n`);
        }
      } else {
        console.log(`✅ Mantendo: ${project.name} (Painel de Controle)\n`);
      }
    }

    console.log('════════════════════════════════════════');
    console.log('✅ LIMPEZA CONCLUÍDA!');
    console.log('════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

main();
