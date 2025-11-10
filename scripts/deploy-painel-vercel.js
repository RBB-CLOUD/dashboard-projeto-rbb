const https = require('https');

const VERCEL_TOKEN = https://console.radiobusinessbrasil.com.br;
const PROJECT_NAME = 'painel-controle-rbb';
const GITHUB_REPO = 'lhsmorais-art/painel-controle-rbb';

function apiRequest(method, path, data = null) {
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
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`API Error ${res.statusCode}: ${json.error?.message || body}`));
          }
        } catch (e) {
          reject(new Error(`Parse Error: ${body}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  console.log('🚀 Deploy do Painel de Controle RBB na Vercel\n');

  try {
    // 1. Criar projeto na Vercel
    console.log('📦 Criando projeto na Vercel...');
    const projectData = {
      name: PROJECT_NAME,
      framework: null, // Static site
      gitRepository: {
        type: 'github',
        repo: GITHUB_REPO
      },
      buildCommand: null,
      devCommand: null,
      installCommand: null,
      outputDirectory: 'dist',
      rootDirectory: null
    };

    const project = await apiRequest('POST', '/v11/projects', projectData);
    console.log(`✅ Projeto criado: ${project.name}`);
    console.log(`🔗 ID: ${project.id}\n`);

    // 2. Configurar variáveis de ambiente
    console.log('🔐 Configurando variáveis de ambiente...');
    const envVars = [
      {
        key: 'SUPABASE_URL',
        value: process.env.SUPABASE_URL,
        target: ['production', 'preview'],
        type: 'encrypted'
      },
      {
        key: 'SUPABASE_ANON_KEY',
        value: process.env.SUPABASE_ANON_KEY,
        target: ['production', 'preview'],
        type: 'encrypted'
      },
      {
        key: 'RESEND_API_KEY',
        value: process.env.RESEND_API_KEY,
        target: ['production', 'preview'],
        type: 'encrypted'
      }
    ];

    for (const env of envVars) {
      await apiRequest('POST', `/v10/projects/${project.id}/env`, env);
      console.log(`  ✓ ${env.key}`);
    }

    console.log('');

    // 3. Fazer primeiro deploy
    console.log('🚀 Iniciando deploy...');
    const deployment = await apiRequest('POST', '/v13/deployments', {
      name: PROJECT_NAME,
      gitSource: {
        type: 'github',
        ref: 'main',
        repoId: project.link.repoId
      },
      target: 'production',
      projectSettings: {
        outputDirectory: 'dist'
      }
    });

    console.log(`✅ Deploy iniciado!`);
    console.log(`📍 URL: https://${deployment.url}`);
    console.log(`🎯 Production URL: https://${PROJECT_NAME}.vercel.app\n`);

    console.log('════════════════════════════════════════');
    console.log('✅ DEPLOY CONCLUÍDO COM SUCESSO!');
    console.log('════════════════════════════════════════');
    console.log(`\n📦 Projeto: ${project.name}`);
    console.log(`🔗 URL: https://${PROJECT_NAME}.vercel.app`);
    console.log(`📂 Repo: https://github.com/${GITHUB_REPO}`);
    console.log('\n💡 Próximos deploys serão automáticos a cada push!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

main();
