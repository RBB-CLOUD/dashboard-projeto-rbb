const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const { command } = req.body;

    if (!command || command.trim() === '') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Command is required' }));
      return;
    }

    const blockedCommands = ['rm -rf /', 'mkfs', 'dd if=', ':(){:|:&};:', 'fork bomb'];
    const isBlocked = blockedCommands.some(blocked => 
      command.toLowerCase().includes(blocked.toLowerCase())
    );

    if (isBlocked) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Comando bloqueado por segurança',
        output: '',
        exitCode: 1
      }));
      return;
    }

    const startTime = Date.now();
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: process.cwd(),
        timeout: 30000,
        maxBuffer: 1024 * 1024
      });

      const duration = Date.now() - startTime;
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        output: stdout || stderr || 'Command executed successfully (no output)',
        exitCode: 0,
        duration: duration
      }));

    } catch (error) {
      const duration = Date.now() - startTime;
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        output: error.stdout || error.stderr || error.message,
        exitCode: error.code || 1,
        duration: duration
      }));
    }

  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Failed to parse request',
      message: error.message 
    }));
  }
};
