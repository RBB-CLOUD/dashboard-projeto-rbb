#!/bin/bash
# RBB Cloud - Scripts Rapidos

case "$1" in
  servidor)
    echo "Iniciando servidor..."
    node server.js
    ;;
  
  orquestrador)
    echo "Iniciando orquestrador..."
    npx tsx backend/agents/orquestrador_polling.ts
    ;;
  
  test-api)
    echo "Testando API..."
    curl http://localhost:5000/api/health
    ;;
  
  limpar-uploads)
    echo "Limpando uploads antigos..."
    find uploads/ -type f -mtime +7 -delete 2>/dev/null
    echo "Uploads antigos removidos"
    ;;
  
  *)
    echo "============================================"
    echo "COMANDOS RAPIDOS RBB"
    echo "============================================"
    echo "Uso: ./scripts/quick-commands.sh [comando]"
    echo ""
    echo "Comandos disponiveis:"
    echo "  servidor         - Iniciar servidor"
    echo "  orquestrador     - Iniciar orquestrador"
    echo "  test-api         - Testar API"
    echo "  limpar-uploads   - Limpar uploads antigos"
    ;;
esac
