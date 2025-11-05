const fs = require('fs/promises');
const path = require('path');

module.exports = async function handler(req, res) {
  const configPath = path.join(process.cwd(), 'config', 'openai.json');

  try {
    if (req.method === 'GET') {
      // Retorna modelo atual
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
      return res.status(200).json(config);
    }

    if (req.method === 'POST') {
      // Altera modelo
      const { modelo } = req.body;

      const modelosValidos = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];
      if (!modelosValidos.includes(modelo)) {
        return res.status(400).json({ 
          error: `Modelo inválido. Use: ${modelosValidos.join(', ')}` 
        });
      }

      // Lê config atual
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
      const modeloAnterior = config.model;

      // Atualiza
      config.model = modelo;

      // Salva
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));

      console.log(`✅ Modelo GPT alterado: ${modeloAnterior} → ${modelo}`);

      return res.status(200).json({
        success: true,
        modelo_anterior: modeloAnterior,
        modelo_novo: modelo,
        mensagem: `Modelo alterado para ${modelo}`
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('❌ Erro ao gerenciar modelo GPT:', error);
    return res.status(500).json({ error: error.message });
  }
}
