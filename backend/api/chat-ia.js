const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mensagem, historico = [], imagem } = req.body;

  if (!mensagem && !imagem) {
    return res.status(400).json({ error: 'Mensagem ou imagem obrigatória' });
  }

  try {
    const mensagens = [
      {
        role: 'system',
        content: `Você é o Arquiteto IA do sistema RBB (Radio Business Brasil) - MODO CONVERSAÇÃO APENAS.

⚠️ REGRAS CRÍTICAS:
- Você está em MODO SOMENTE CONVERSA
- NÃO pode executar código
- NÃO pode criar tarefas
- NÃO pode modificar o sistema
- APENAS converse, responda perguntas e forneça orientações

Você é um assistente IA especializado em:
- Orientar sobre soluções de software
- Explicar código em Python, Node.js e Java
- Ajudar com HTML/CSS/JavaScript
- Dar dicas sobre emails e GitHub
- Análise de dados e processos

IMPORTANTE:
- Responda em português BR
- Seja direto e objetivo
- Forneça exemplos de código quando apropriado
- Explique de forma clara
- Se o usuário pedir para executar algo, explique que você está em modo conversa apenas
- Oriente o usuário a usar os botões de ação do dashboard para executar tarefas

Capacidades do sistema RBB (que você pode EXPLICAR, mas NÃO executar):
1. RBB_AgenteAnalista (Claude) - Code review
2. RBB_AgenteGitHub - Push para GitHub
3. RBB_AgenteExecutor - Executa código
4. RBB_AgentePaginas - Gera páginas HTML
5. RBB_AgenteEmail - Envia emails

Você está aqui para CONVERSAR e ORIENTAR, não para executar ações.`
      },
      ...historico.map(msg => ({
        role: msg.tipo === 'user' ? 'user' : 'assistant',
        content: msg.texto
      }))
    ];

    // ⭐ ADICIONA MENSAGEM COM IMAGEM SE HOUVER
    if (imagem && imagem.base64) {
      mensagens.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: mensagem || 'O que você vê nesta imagem? Me ajude a entender o que o usuário quer.'
          },
          {
            type: 'image_url',
            image_url: {
              url: imagem.base64
            }
          }
        ]
      });
    } else {
      mensagens.push({
        role: 'user',
        content: mensagem
      });
    }

    // ⭐ USA GPT-4 VISION SE TIVER IMAGEM
    const modelo = imagem ? 'gpt-4o' : 'gpt-4o-mini';

    const completion = await openai.chat.completions.create({
      model: modelo,
      messages: mensagens,
      temperature: 0.7,
      max_tokens: imagem ? 1500 : 1000
    });

    const resposta = completion.choices[0].message.content;

    res.status(200).json({
      success: true,
      resposta: resposta,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao chamar OpenAI:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
