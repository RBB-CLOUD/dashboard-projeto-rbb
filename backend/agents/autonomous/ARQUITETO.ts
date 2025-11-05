/**
 * 🏗️ ARQUITETO AUTÔNOMO
 * Agente de planejamento e arquitetura de software
 * Versão: 2.0 - Autonomous
 */

interface ArquitetoConfig {
  model: string;
  apiKey: string;
  maxTokens: number;
}

interface ProjectAnalysis {
  objetivo: string;
  tecnologias: string[];
  estrutura: string;
  passos: string[];
  consideracoes: string[];
}

export class ArquitetoAutonomo {
  private config: ArquitetoConfig;
  
  constructor(config: ArquitetoConfig) {
    this.config = config;
  }

  private getSystemPrompt(): string {
    return `Você é o ARQUITETO, um agente autônomo especializado em:

## SUAS CAPACIDADES:
- Análise profunda de requisitos de software
- Design de arquiteturas escaláveis
- Seleção de tecnologias adequadas
- Planejamento de estrutura de pastas
- Definição de fluxos de dados
- Documentação técnica clara

## MODO DE OPERAÇÃO:
1. Analise requisitos com profundidade
2. Considere trade-offs (performance, custo, manutenção)
3. Proponha arquitetura modular e escalável
4. Documente decisões técnicas
5. Sugira próximos passos claros

## FORMATO DE RESPOSTA:
Sempre responda em JSON estruturado com:
{
  "objetivo": "resumo do que será construído",
  "tecnologias": ["lista", "de", "tecnologias"],
  "estrutura": "estrutura de pastas detalhada",
  "passos": ["passo 1", "passo 2", "..."],
  "consideracoes": ["pontos importantes"]
}

## PRINCÍPIOS:
- Prefira simplicidade sobre complexidade
- Escolha tecnologias maduras e bem documentadas
- Pense em manutenibilidade futura
- Considere custos operacionais
- Priorize segurança

Seja direto, técnico e objetivo. Não há espaço para incerteza.`;
  }

  async analisar(descricaoProjeto: string): Promise<ProjectAnalysis> {
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
          content: `Analise este projeto e crie uma arquitetura completa:\n\n${descricaoProjeto}`
        }]
      })
    });

    const data = await response.json();
    const content = data.content[0].text;
    
    // Extrair JSON da resposta
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Falha ao extrair análise estruturada');
  }

  async refinar(analiseInicial: ProjectAnalysis, feedback: string): Promise<ProjectAnalysis> {
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
        messages: [
          {
            role: 'user',
            content: `Análise inicial:\n${JSON.stringify(analiseInicial, null, 2)}`
          },
          {
            role: 'assistant',
            content: 'Análise recebida. Pronto para refinar.'
          },
          {
            role: 'user',
            content: `Refine a análise considerando: ${feedback}`
          }
        ]
      })
    });

    const data = await response.json();
    const content = data.content[0].text;
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Falha ao refinar análise');
  }
}

// Uso
export default ArquitetoAutonomo;
