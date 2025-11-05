const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const { repositorio, branch = 'main', pasta_destino = '' } = JSON.parse(body);

      if (!repositorio) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Repositório obrigatório (formato: usuario/repo)' 
        }));
        return;
      }

      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'GITHUB_TOKEN não configurado' 
        }));
        return;
      }

      const github = new Octokit({ auth: token });
      
      // Parse repositório
      const [owner, repo] = repositorio.split('/');
      if (!owner || !repo) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Formato inválido. Use: usuario/repo' 
        }));
        return;
      }

      // Verifica se repo existe
      const repoInfo = await github.repos.get({ owner, repo });
      
      // Define pasta local de destino
      const baseDir = path.join(process.cwd(), 'github_downloads');
      const repoDir = path.join(baseDir, repo);
      
      // Cria diretório se não existir
      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
      }
      
      // Remove diretório antigo se existir
      if (fs.existsSync(repoDir)) {
        await execAsync(`rm -rf ${repoDir}`);
      }

      // Clone do repositório
      const cloneUrl = repoInfo.data.clone_url;
      
      // Usa token para clone privado se necessário
      const cloneUrlWithToken = cloneUrl.replace(
        'https://',
        `https://x-access-token:${token}@`
      );

      console.log(`📥 Clonando ${owner}/${repo} (branch: ${branch})...`);
      
      await execAsync(
        `git clone -b ${branch} --depth 1 ${cloneUrlWithToken} ${repoDir}`,
        { cwd: baseDir }
      );

      // Se especificou pasta_destino, verifica se existe
      let finalPath = repoDir;
      let pastaTexto = '(raiz)';
      if (pasta_destino) {
        const sourcePath = path.join(repoDir, pasta_destino);
        if (!fs.existsSync(sourcePath)) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: `Pasta '${pasta_destino}' não encontrada no repositório`
          }));
          return;
        }
        finalPath = sourcePath;
        pastaTexto = pasta_destino;
      }

      // Lista arquivos baixados
      const { stdout: filesList } = await execAsync(`find . -type f | head -20`, {
        cwd: finalPath
      });

      const arquivos = filesList.split('\n').filter(f => f.trim());

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        mensagem: `✅ Código baixado com sucesso!`,
        repositorio: `${owner}/${repo}`,
        branch: branch,
        pasta_local: finalPath,
        pasta_destino: pastaTexto,
        arquivos_exemplo: arquivos.slice(0, 10),
        total_arquivos: arquivos.length,
        url_repo: repoInfo.data.html_url
      }));

    } catch (error) {
      console.error('❌ Erro no PULL:', error);
      
      let mensagemErro = error.message;
      if (error.message.includes('not found')) {
        mensagemErro = 'Repositório não encontrado ou sem permissão';
      } else if (error.message.includes('branch')) {
        mensagemErro = `Branch não encontrada`;
      }

      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: mensagemErro,
        detalhes: error.message
      }));
    }
  });
};
