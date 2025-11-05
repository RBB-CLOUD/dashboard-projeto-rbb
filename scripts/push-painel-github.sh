#!/bin/bash
# Push do Painel de Controle para GitHub

echo "🚀 Fazendo push do Painel de Controle para GitHub..."
echo ""

cd painel-controle-rbb

# Verificar se já tem remote
if git remote get-url origin 2>/dev/null; then
  echo "✅ Remote já configurado"
else
  echo "🔗 Configurando remote..."
  git remote add origin https://github.com/lhsmorais-art/painel-controle-rbb.git
fi

# Commit
echo "📝 Fazendo commit..."
git add .
git commit -m "Initial commit: Painel de Controle RBB" || echo "  ⚠️  Nada para commitar ou já commitado"

# Push
echo "⬆️  Enviando para GitHub..."
git push -u origin main --force

echo ""
echo "════════════════════════════════════════"
echo "✅ PUSH CONCLUÍDO!"
echo "════════════════════════════════════════"
echo ""
echo "📦 GitHub: https://github.com/lhsmorais-art/painel-controle-rbb"
echo "🚀 Vercel: https://painel-controle-rbb.vercel.app"
echo ""
echo "💡 A Vercel vai fazer deploy automático em 1-2 minutos!"
echo ""
