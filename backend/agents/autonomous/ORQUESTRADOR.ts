/**
 * 🎼 ORQUESTRADOR AUTÔNOMO
 * Coordena todos os agentes para executar tarefas complexas
 * Versão: 2.0 - Autonomous Master
 */

import ArquitetoAutonomo from './ARQUITETO';
import ExecutorAutonomo from './EXECUTOR';
import DeployMasterAutonomo from './DEPLOY_MASTER';
import ContentCreatorAutonomo from './CONTENT_CREATOR';

interface OrquestradorConfig {
  anthropicKey: string;
  githubToken?: string;
  vercelToken?: string;
  model?: string;
}

interface TarefaCompleta {
  tipo: 'site' | 'app' | 'landing' | 'feature' | 'deploy' | 'content';
  descricao: string;
  requisitos?: string[];
  contexto?: string;
}

interface ResultadoOrquestracao {
  sucesso: boolean;
  etapas: Array<{
    agente: string;
    acao: string;
    resultado: any;
    tempo: number;
  }>;
  arquivosCriados: Array<{caminho: string, conteudo: string}>;
  deployUrl?: string;
  proximasAcoes: string[];
  logs: string[];
}

export class OrquestradorAutonomo {
  private arquiteto: ArquitetoAutonomo;
  private executor: ExecutorAutonomo;
  private deployMaster: DeployMasterAutonomo;
  private contentCreator: ContentCreatorAutonomo;
  private logs: string[] = [];

  constructor(config: OrquestradorConfig) {
    const baseConfig = {
      model: config.model || 'claude-sonnet-4-20250514',
      apiKey: config.anthropicKey,
      maxTokens: 4096
    };

    this.arquiteto = new ArquitetoAutonomo(baseConfig);
    this.executor = new ExecutorAutonomo(baseConfig);
    this.deployMaster = new DeployMasterAutonomo({
      ...baseConfig,
      githubToken: config.githubToken,
      vercelToken: config.vercelToken
    });
    this.contentCreator = new ContentCreatorAutonomo(baseConfig);
  }

  private log(mensagem: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${mensagem}`;
    this.logs.push(logEntry);
    console.log(logEntry);
  }

  async executarTarefaCompleta(tarefa: TarefaCompleta): Promise<ResultadoOrquestracao> {
    this.log(`🎼 Iniciando orquestração: ${tarefa.tipo}`);
    const inicio = Date.now();
    
    const resultado: ResultadoOrquestracao = {
      sucesso: false,
      etapas: [],
      arquivosCriados: [],
      proximasAcoes: [],
      logs: []
    };

    try {
      // ETAPA 1: Planejamento com Arquiteto
      this.log('🏗️ Consultando Arquiteto...');
      const inicioArquiteto = Date.now();
      
      const arquitetura = await this.arquiteto.analisar(
        `${tarefa.descricao}\n\nRequisitos: ${tarefa.requisitos?.join(', ') || 'Nenhum'}`
      );
      
      resultado.etapas.push({
        agente: 'ARQUITETO',
        acao: 'Análise e planejamento',
        resultado: arquitetura,
        tempo: Date.now() - inicioArquiteto
      });
      
      this.log(`✅ Arquitetura definida: ${arquitetura.tecnologias.join(', ')}`);

      // ETAPA 2: Execução com Executor
      if (tarefa.tipo === 'site' || tarefa.tipo === 'app' || tarefa.tipo === 'feature') {
        this.log('💻 Executor criando código...');
        const inicioExecutor = Date.now();
        
        const codigo = await this.executor.criar(
          tarefa.descricao,
          JSON.stringify(arquitetura)
        );
        
        resultado.arquivosCriados = codigo.arquivos.map(a => ({
          caminho: a.caminho,
          conteudo: a.conteudo
        }));
        
        resultado.etapas.push({
          agente: 'EXECUTOR',
          acao: 'Criação de código',
          resultado: codigo,
          tempo: Date.now() - inicioExecutor
        });
        
        this.log(`✅ ${codigo.arquivos.length} arquivos criados`);

        // ETAPA 3: Deploy (se solicitado)
        if (tarefa.tipo !== 'feature') {
          this.log('🚀 DeployMaster preparando deploy...');
          const inicioDeploy = Date.now();
          
          const planoDeploy = await this.deployMaster.criarPlanoDeply(
            codigo.arquivos,
            tarefa.descricao
          );
          
          resultado.etapas.push({
            agente: 'DEPLOY_MASTER',
            acao: 'Planejamento de deploy',
            resultado: planoDeploy,
            tempo: Date.now() - inicioDeploy
          });
          
          this.log(`✅ Plano de deploy criado`);
          resultado.proximasAcoes.push('Executar deploy com GitHub + Vercel');
        }
      }

      // ETAPA 4: Conteúdo (se for landing ou content)
      if (tarefa.tipo === 'landing' || tarefa.tipo === 'content') {
        this.log('🎨 ContentCreator gerando conteúdo...');
        const inicioContent = Date.now();
        
        const conteudo = await this.contentCreator.criarLandingPage(
          tarefa.descricao,
          tarefa.contexto || 'Público geral',
          tarefa.requisitos || []
        );
        
        if (conteudo.html) {
          resultado.arquivosCriados.push({
            caminho: 'index.html',
            conteudo: conteudo.html
          });
        }
        
        resultado.etapas.push({
          agente: 'CONTENT_CREATOR',
          acao: 'Criação de conteúdo',
          resultado: conteudo,
          tempo: Date.now() - inicioContent
        });
        
        this.log(`✅ Landing page criada`);
      }

      resultado.sucesso = true;
      resultado.logs = this.logs;
      
      const tempoTotal = Date.now() - inicio;
      this.log(`🎉 Orquestração concluída em ${(tempoTotal / 1000).toFixed(2)}s`);

    } catch (error) {
      this.log(`❌ Erro: ${error}`);
      resultado.sucesso = false;
      resultado.logs = this.logs;
      resultado.proximasAcoes.push('Revisar erro e tentar novamente');
    }

    return resultado;
  }

  async criarProjetoCompleto(
    nome: string,
    descricao: string,
    tipo: 'ecommerce' | 'saas' | 'blog' | 'portfolio' | 'dashboard'
  ): Promise<ResultadoOrquestracao> {
    this.log(`🎯 Criando projeto completo: ${nome} (${tipo})`);

    const tarefa: TarefaCompleta = {
      tipo: 'app',
      descricao: `Criar ${tipo} completo chamado "${nome}": ${descricao}`,
      requisitos: this.getRequisitosPorTipo(tipo)
    };

    return await this.executarTarefaCompleta(tarefa);
  }

  private getRequisitosPorTipo(tipo: string): string[] {
    const requisitos: Record<string, string[]> = {
      ecommerce: [
        'Catálogo de produtos',
        'Carrinho de compras',
        'Checkout',
        'Painel admin',
        'Integração pagamento'
      ],
      saas: [
        'Sistema de autenticação',
        'Dashboard',
        'Planos e assinaturas',
        'API',
        'Documentação'
      ],
      blog: [
        'Sistema de posts',
        'Categorias e tags',
        'Comentários',
        'SEO otimizado',
        'RSS feed'
      ],
      portfolio: [
        'Página sobre',
        'Galeria de projetos',
        'Formulário de contato',
        'Seção de habilidades',
        'Responsivo'
      ],
      dashboard: [
        'Gráficos e métricas',
        'Tabelas de dados',
        'Filtros',
        'Exportação',
        'Real-time updates'
      ]
    };

    return requisitos[tipo] || [];
  }

  async refinarComFeedback(
    resultadoAnterior: ResultadoOrquestracao,
    feedback: string
  ): Promise<ResultadoOrquestracao> {
    this.log(`🔄 Refinando com feedback: ${feedback}`);

    // Identifica qual agente precisa refinar
    const ultimaEtapa = resultadoAnterior.etapas[resultadoAnterior.etapas.length - 1];
    
    if (ultimaEtapa.agente === 'ARQUITETO') {
      const novaArquitetura = await this.arquiteto.refinar(
        ultimaEtapa.resultado,
        feedback
      );
      
      // Reexecuta pipeline com nova arquitetura
      return await this.executarTarefaCompleta({
        tipo: 'app',
        descricao: feedback,
        contexto: JSON.stringify(novaArquitetura)
      });
    }

    // Adicionar lógica para outros agentes...
    
    return resultadoAnterior;
  }

  obterLogs(): string[] {
    return [...this.logs];
  }

  limparLogs(): void {
    this.logs = [];
  }
}

export default OrquestradorAutonomo;
