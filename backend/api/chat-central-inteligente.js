const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mensagem, historico = [], imagem } = req.body;

  console.log('📥 Chat Central recebeu:', {
    mensagem,
    temImagem: !!imagem,
    imagemDetalhes: imagem ? {
      nome: imagem.nome,
      tipo: imagem.tipo,
      temUrl: !!imagem.url,
      temBase64: !!imagem.base64
    } : null
  });

  if (!mensagem && !imagem) {
    return res.status(400).json({ error: 'Mensagem ou imagem obrigatória' });
  }

  try {
    // ⭐ BUSCAR HISTÓRICO REAL DO BANCO
    const { data: tarefasAnteriores } = await supabase
      .from('agentes_tarefas')
      .select('mensagem_inicial, resposta, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // ⭐ BUSCAR RECURSOS CRIADOS
    const { data: paginasCriadas } = await supabase
      .from('paginas_geradas')
      .select('titulo, path_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    // Construir histórico de memória
    let contextoMemoria = '\n📜 MEMÓRIA DAS CONVERSAS ANTERIORES:\n';
    if (tarefasAnteriores && tarefasAnteriores.length > 0) {
      tarefasAnteriores.slice(0, 5).reverse().forEach(t => {
        if (t.mensagem_inicial) contextoMemoria += `Usuário: ${t.mensagem_inicial}\n`;
        if (t.resposta) contextoMemoria += `Você: ${t.resposta}\n`;
      });
    }

    if (paginasCriadas && paginasCriadas.length > 0) {
      contextoMemoria += '\n🛠️ PÁGINAS QUE VOCÊ JÁ CRIOU:\n';
      paginasCriadas.forEach(p => {
        contextoMemoria += `- ${p.titulo} (${p.path_name})\n`;
      });
    }

    // Sistema que CONVERSA e ALINHA antes de executar
    const sistemPrompt = `Você é o Arquiteto IA do RBB. Você funciona EXATAMENTE como um desenvolvedor expert conversaria com o proprietário.

${contextoMemoria}

VOCÊ TEM MEMÓRIA DAS CONVERSAS ACIMA! Use esse contexto para entender pedidos de ajuste/correção.

COMPORTAMENTO:
1. Conversa normalmente, de forma amigável
2. Quando o usuário pede algo, você PERGUNTA detalhes primeiro
3. Só executa quando tiver TODOS os detalhes necessários
4. Nunca presume - sempre confirma

RECURSOS DISPONÍVEIS:
- Criar páginas web completas
- Executar código Python/Node.js/Java
- Enviar emails
- Push para GitHub
- Code review com Claude

LINGUAGENS INSTALADAS:
- Node.js v20.19.3
- Python 3.11.13
- Java 19.0.2

IMPORTANTE: Você CONVERSA DIRETAMENTE com o usuário. Seja natural, direto e útil.

FORMATO DE RESPOSTA:

Para CONVERSA NORMAL, retorne JSON:
{
  "tipo": "conversa",
  "resposta": "sua resposta aqui"
}

Para PEDIDO DE AÇÃO que PRECISA de mais detalhes, retorne JSON:
{
  "tipo": "conversa",
  "resposta": "sua pergunta para alinhar detalhes"
}

Para EXECUTAR (quando já tem TODOS os detalhes), retorne JSON:
{
  "tipo": "executar",
  "agente": "RBB_AgentePaginas|RBB_AgenteExecutor|etc",
  "tipo_tarefa": "gerar_pagina|executar_codigo|etc",
  "payload": { /* payload completo */ },
  "mensagem": "Confirmação do que vai fazer"
}

EXEMPLOS:

Usuário: "oi"
Você: {"tipo": "conversa", "resposta": "Oi! Como posso ajudar você hoje?"}

Usuário: "crie uma página"
Você: {"tipo": "conversa", "resposta": "Claro! Qual página você quer criar? Me diga o caminho (ex: /contato, /sobre) e o conteúdo que deve ter."}

Usuário: "página /contato com formulário"
Você: {"tipo": "executar", "agente": "RBB_AgentePaginas", "tipo_tarefa": "gerar_pagina", "payload": {"pathName": "/contato", "descricao": "Página de contato com formulário de nome, email, mensagem. Design moderno roxo/rosa."}, "mensagem": "Vou criar a página /contato com formulário profissional. Processando..."}

Retorne APENAS o JSON, sem markdown.`;

    const messages = [
      { role: 'system', content: sistemPrompt },
      ...historico.slice(-8).map(h => ({
        role: h.tipo === 'user' ? 'user' : 'assistant',
        content: h.texto
      }))
    ];

    // ⭐ ADICIONA MENSAGEM DO USUÁRIO COM IMAGEM SE HOUVER
    if (imagem && (imagem.url || imagem.base64)) {
      // Usa URL pública se disponível, senão usa base64
      const imageUrl = imagem.url 
        ? `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}${imagem.url}`
        : imagem.base64;
      
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: mensagem || 'O que você vê nesta imagem? Descreva detalhadamente para eu poder criar exatamente o que o usuário quer.'
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl
            }
          }
        ]
      });
    } else {
      messages.push({ role: 'user', content: mensagem });
    }

    // ⭐ USA GPT-4 VISION SE TIVER IMAGEM, SENÃO USA GPT-4O-MINI
    const modelo = imagem ? 'gpt-4o' : 'gpt-4o-mini';

    const resposta = await openai.chat.completions.create({
      model: modelo,
      messages: messages,
      temperature: 0.5,
      max_tokens: imagem ? 1500 : 800
    });

    const conteudo = resposta.choices[0].message.content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // ⭐ Tenta parsear como JSON, se falhar trata como texto puro
    let resultado;
    try {
      resultado = JSON.parse(conteudo);
    } catch (e) {
      // Se não é JSON, trata como resposta de conversa
      console.log('⚠️ Resposta não é JSON, tratando como texto puro');
      return res.json({
        tipo: 'conversa',
        resposta: conteudo,
        execucao: false
      });
    }

    // Se é conversa, retorna direto
    if (resultado.tipo === 'conversa') {
      return res.json({
        tipo: 'conversa',
        resposta: resultado.resposta,
        execucao: false
      });
    }

    // Se vai executar, cria tarefa
    if (resultado.tipo === 'executar') {
      const { data: novaTarefa, error: tarefaErro } = await supabase
        .from('agentes_tarefas')
        .insert({
          agente: resultado.agente,
          tipo: resultado.tipo_tarefa,
          payload: resultado.payload,
          status: 'fila',
          prioridade: 100
        })
        .select()
        .single();

      if (tarefaErro || !novaTarefa) {
        console.error('❌ Erro ao criar tarefa:', tarefaErro);
        return res.json({
          tipo: 'conversa',
          resposta: '❌ Erro ao criar tarefa. Tente novamente.',
          execucao: false
        });
      }

      return res.json({
        tipo: 'tarefa_criada',
        tarefa_id: novaTarefa.id,
        resposta: `✅ ${resultado.mensagem}`,
        execucao: true
      });
    }

    // Fallback
    return res.json({
      tipo: 'conversa',
      resposta: 'Desculpe, não entendi. Pode reformular?',
      execucao: false
    });

  } catch (error) {
    console.error('❌ Erro no chat:', error);
    res.status(500).json({
      tipo: 'erro',
      error: error.message
    });
  }
}
