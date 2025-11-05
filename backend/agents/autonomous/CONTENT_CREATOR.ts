/**
 * 🎨 CONTENT_CREATOR AUTÔNOMO
 * Agente de criação de conteúdo e marketing
 * Versão: 2.0 - Autonomous
 */

interface ContentConfig {
  model: string;
  apiKey: string;
  maxTokens: number;
}

interface ContentOutput {
  tipo: 'landing-page' | 'email' | 'post' | 'article' | 'ad';
  titulo: string;
  conteudo: string;
  html?: string;
  metadata: {
    palavrasChave: string[];
    cta: string;
    tom: string;
    publicoAlvo: string;
  };
  variacoes?: string[];
  proximasAcoes: string[];
}

export class ContentCreatorAutonomo {
  private config: ContentConfig;
  
  constructor(config: ContentConfig) {
    this.config = config;
  }

  private getSystemPrompt(): string {
    return `Você é o CONTENT_CREATOR, um agente autônomo especializado em:

## SUAS CAPACIDADES:
- Landing pages de alta conversão
- Email marketing persuasivo
- Posts para redes sociais engajadores
- Artigos SEO-otimizados
- Copy para anúncios (Google Ads, Facebook Ads)
- Scripts de vídeo e áudio
- Conteúdo para blogs

## FRAMEWORKS DOMINADOS:
- AIDA (Atenção, Interesse, Desejo, Ação)
- PAS (Problem, Agitate, Solution)
- FAB (Features, Advantages, Benefits)
- Storytelling narrativo
- SEO on-page
- Persuasão ética

## MODO DE OPERAÇÃO:
1. Entenda o produto/serviço profundamente
2. Identifique público-alvo e dores
3. Crie headline magnética
4. Desenvolva copy persuasivo
5. Inclua CTAs estratégicos
6. Otimize para conversão

## FORMATO DE RESPOSTA:
{
  "tipo": "landing-page",
  "titulo": "título impactante",
  "conteudo": "texto completo em markdown",
  "html": "<html>código completo se aplicável</html>",
  "metadata": {
    "palavrasChave": ["seo", "keywords"],
    "cta": "Call to Action principal",
    "tom": "profissional/casual/urgente",
    "publicoAlvo": "descrição do público"
  },
  "variacoes": ["variação A", "variação B"],
  "proximasAcoes": ["testar A/B", "criar email sequência"]
}

## PRINCÍPIOS DE COPY:
- Clareza acima de criatividade
- Benefícios antes de features
- Prova social e credibilidade
- Urgência e escassez éticas
- Linguagem do público-alvo
- CTAs claros e diretos

## PARA LANDING PAGES:
- Hero section impactante
- Proposta de valor clara
- Benefícios específicos
- Prova social (depoimentos)
- FAQ antecipando objeções
- CTA múltiplo e visível

## PARA EMAILS:
- Subject line irresistível
- Preview text otimizado
- Personalização
- Storytelling + valor
- CTA único e claro
- Mobile-first

## PARA POSTS SOCIAIS:
- Hook nos primeiros 3 segundos
- Formato nativo da plataforma
- Engajamento > venda direta
- Hashtags estratégicas
- CTA conversacional

Você não cria conteúdo genérico. Você cria CONVERSÃO.`;
  }

  async criarLandingPage(produto: string, publicoAlvo: string, beneficios: string[]): Promise<ContentOutput> {
    const prompt = `
PRODUTO: ${produto}
PÚBLICO-ALVO: ${publicoAlvo}
BENEFÍCIOS PRINCIPAIS:
${beneficios.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Crie uma landing page completa de alta conversão com HTML/CSS inline.
    `;

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
          content: prompt
        }]
      })
    });

    const data = await response.json();
    const content = data.content[0].text;
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Falha ao criar landing page');
  }

  async criarEmailMarketing(assunto: string, objetivo: string, contexto: string): Promise<ContentOutput> {
    const prompt = `
ASSUNTO: ${assunto}
OBJETIVO: ${objetivo}
CONTEXTO: ${contexto}

Crie um email marketing completo com HTML responsivo.
    `;

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
          content: prompt
        }]
      })
    });

    const data = await response.json();
    const content = data.content[0].text;
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Falha ao criar email');
  }

  async criarPostSocial(plataforma: 'instagram' | 'linkedin' | 'twitter' | 'facebook', tema: string): Promise<ContentOutput> {
    const prompt = `
PLATAFORMA: ${plataforma}
TEMA: ${tema}

Crie um post otimizado para ${plataforma} com hook forte e alto engajamento.
    `;

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
          content: prompt
        }]
      })
    });

    const data = await response.json();
    const content = data.content[0].text;
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Falha ao criar post social');
  }

  async otimizarSEO(conteudo: string, palavrasChave: string[]): Promise<ContentOutput> {
    const prompt = `
CONTEÚDO ATUAL:
${conteudo}

PALAVRAS-CHAVE ALVO:
${palavrasChave.join(', ')}

Otimize este conteúdo para SEO mantendo naturalidade e conversão.
    `;

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
          content: prompt
        }]
      })
    });

    const data = await response.json();
    const content = data.content[0].text;
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Falha ao otimizar SEO');
  }
}

export default ContentCreatorAutonomo;
