// ...imports dos agentes autonomous (AnalistaAutonomo, ExecutorAutonomo, etc.)

const AGENTES = {
  // originais autonomous...
  ANALISTA_AUTONOMO: AnalistaAutonomo,
  EXECUTOR_AUTONOMO: ExecutorAutonomo,
  PAGINAS_AUTONOMO:  PaginasAutonomo,
  GITHUB_AUTONOMO:   GithubAutonomo,

  // === aliases p/ nomes usados no teu painel (Cloud) ===
  RBB_AgenteAnalista: AnalistaAutonomo,
  RBB_AgenteExecutor: ExecutorAutonomo,
  RBB_AgentePaginas:  PaginasAutonomo,
  RBB_AgenteGitHub:   GithubAutonomo,
};

export default AGENTES;
