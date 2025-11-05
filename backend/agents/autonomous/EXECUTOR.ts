/**
 * 💻 EXECUTOR AUTÔNOMO
 * Agente de criação e execução de código
 * Versão: 2.0 - Autonomous
 */

interface ExecutorConfig {
  model: string;
  apiKey: string;
  maxTokens: number;
}

interface CodeOutput {
  arquivos: Array<{
    caminho: string;
    conteudo: string;
    descricao: string;
  }>;
  comandos: string[];
  testes: string[];
  proximosPassos: string[];
}

export class ExecutorAutonomo {
  private config: ExecutorConfig;
  
  constructor(config: ExecutorConfig) {
    this.config = config;
  }

  private getSystemPrompt(): string {
    return `Você é o EXECUTOR, um agente autônomo especializado em:

## SUAS CAPACIDADES:
- Criar código completo e funcional
- Desenvolver páginas HTML/CSS/JS/React
- Construir APIs e backends
- Escrever testes automatizados
- Otimizar performance
- Seguir best practices

## TECNOLOGIAS DOMINADAS:
- Frontend: HTML, CSS, JavaScript, TypeScript, React, Next.js, Tailwind
- Backend: Node.js, Express, Python, FastAPI
- Database: PostgreSQL, Supabase, MongoDB
- APIs: REST, GraphQL, WebSockets
- Deploy: Vercel, Netlify, Railway

## MODO DE OPERAÇÃO:
1. Receba especificação clara
2. Crie código COMPLETO e FUNCIONAL
3. Inclua comentários explicativos
4. Garanta código limpo e organizado
5. Forneça instruções de execução

## FORMATO DE RESPOSTA:
Sempre responda em JSON:
{
  "arquivos": [
    {
      "caminho": "pasta/arquivo.ext",
      "conteudo": "código completo aqui",
      "descricao": "o que este arquivo faz"
    }
  ],
  "comandos": ["npm install", "npm run dev"],
  "testes": ["como testar cada funcionalidade"],
  "proximosPassos": ["próximas ações recomendadas"]
}

## PRINCÍPIOS DE CÓDIGO:
- Código limpo e legível
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple, Stupid)
- Segurança em primeiro lugar
- Performance otimizada
- Comentários quando necessário

## IMPORTANTE:
- SEMPRE forneça código COMPLETO, não exemplos
- NUNCA use placeholders como "// adicione aqui"
- TODO código deve ser pronto para produção
- Inclua tratamento de erros
- Valide inputs do usuário

Você não sugere, você CRIA. Não explica teoria, você EXECUTA.`;
  }

  async criar(especificacao: string, contexto?: string): Promise<CodeOutput> {
    const prompt = contexto 
      ? `CONTEXTO:\n${contexto}\n\nESPECIFICAÇÃO:\n${especificacao}`
      : especificacao;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        system: this.getSystemPrompt(),
        messages: [{
          role: 'user',
          content: `Crie o código completo para:\n\n${prompt}`
        }]
      })
    });

    const data = await response.json();
    const content = data.content[0].text;
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Falha ao gerar código estruturado');
  }

  async otimizar(codigoAtual: string, objetivo: string): Promise<CodeOutput> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        system: this.getSystemPrompt(),
        messages: [{
          role: 'user',
          content: `CÓDIGO ATUAL:\n\`\`\`\n${codigoAtual}\n\`\`\`\n\nOBJETIVO: ${objetivo}\n\nOtimize e melhore este código.`
        }]
      })
    });

    const data = await response.json();
    const content = data.content[0].text;
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Falha ao otimizar código');
  }

  async corrigirBug(codigo: string, erro: string): Promise<CodeOutput> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        system: this.getSystemPrompt(),
        messages: [{
          role: 'user',
          content: `CÓDIGO COM BUG:\n\`\`\`\n${codigo}\n\`\`\`\n\nERRO:\n${erro}\n\nIdentifique e corrija o bug.`
        }]
      })
    });

    const data = await response.json();
    const content = data.content[0].text;
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Falha ao corrigir bug');
  }
}

export default ExecutorAutonomo;
