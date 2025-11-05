#!/bin/bash
# Script para sincronizar painel com repositório separado

echo "🔄 Sincronizando Painel de Controle..."

# Limpar pasta antiga
rm -rf painel-controle-rbb/dist

# Copiar dist/ atualizado
cp -r dist painel-controle-rbb/

echo "✅ Painel sincronizado!"
echo ""
echo "📋 Próximos passos:"
echo "1. cd painel-controle-rbb"
echo "2. git add ."
echo "3. git commit -m 'Update: Painel de Controle'"
echo "4. git push origin main"
echo ""
echo "🚀 Deploy automático na Vercel após push!"
