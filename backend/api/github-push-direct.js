const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

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
      const { pasta_local, repositorio, branch, mensagem_commit, pasta_destino } = JSON.parse(body);

      if (!pasta_local || !repositorio || !branch || !mensagem_commit) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Campos obrigatórios: pasta_local, repositorio, branch, mensagem_commit' 
        }));
        return;
      }

      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'GITHUB_TOKEN não configurado' 
        }));
        return;
      }

      const pastaLocalCompleta = path.join(process.cwd(), pasta_local);
      
      const exists = await fs.access(pastaLocalCompleta).then(() => true).catch(() => false);
      if (!exists) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: `Pasta não encontrada: ${pasta_local}` 
        }));
        return;
      }

      const tempDir = path.join(process.cwd(), '.temp_git', Date.now().toString());
      await fs.mkdir(tempDir, { recursive: true });

      try {
        const repoUrl = `https://${token}@github.com/${repositorio}.git`;
        
        await execAsync(`git clone --depth 1 --branch ${branch} ${repoUrl} ${tempDir}`, {
          env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
        });

        const destino = pasta_destino || path.basename(pasta_local);
        const destinoCompleto = path.join(tempDir, destino);

        await fs.mkdir(path.dirname(destinoCompleto), { recursive: true });
        await execAsync(`cp -r ${pastaLocalCompleta}/* ${destinoCompleto}/ 2>/dev/null || true`);

        await execAsync('git config user.email "rbb@replit.dev"', { cwd: tempDir });
        await execAsync('git config user.name "Radio Business Brasil"', { cwd: tempDir });
        
        await execAsync('git add .', { cwd: tempDir });
        
        try {
          await execAsync(`git commit -m "${mensagem_commit}"`, { cwd: tempDir });
        } catch (error) {
          if (error.message.includes('nothing to commit')) {
            await fs.rm(tempDir, { recursive: true, force: true });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              success: true, 
              message: 'Nenhuma alteração para commitar' 
            }));
            return;
          }
          throw error;
        }

        await execAsync(`git push origin ${branch}`, { cwd: tempDir });

        await fs.rm(tempDir, { recursive: true, force: true });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          message: `✅ Push concluído! ${repositorio}/${branch}`,
          repo: repositorio,
          branch: branch
        }));

      } catch (error) {
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: error.message 
        }));
      }

    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        error: 'Failed to parse request: ' + error.message 
      }));
    }
  });
};
