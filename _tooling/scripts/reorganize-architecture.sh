#!/bin/bash

# Script de réorganisation de l'architecture CRM Aura
# Sépare les 3 interfaces: Advisor, Client, SuperAdmin

set -e  # Arrêter en cas d'erreur

echo "🏗️  Réorganisation de l'architecture CRM Aura"
echo "=============================================="
echo ""

# Vérifier qu'on est à la racine du projet
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

# Créer une branche de sauvegarde
echo "📦 Création d'une branche de sauvegarde..."
git checkout -b backup-before-reorganization 2>/dev/null || echo "⚠️  Branche existe déjà"

# Créer une nouvelle branche pour la réorganisation
echo "🌿 Création de la branche feature/architecture-reorganisation..."
git checkout -b feature/architecture-reorganisation 2>/dev/null || git checkout feature/architecture-reorganisation

echo ""
echo "Phase 1: Réorganisation Frontend"
echo "================================="

# 1. Créer la structure (advisor)
echo "📁 Création de app/(advisor)..."
mkdir -p "app/(advisor)"

# Déplacer dashboard → (advisor)
echo "📦 Déplacement de dashboard → (advisor)..."
if [ -d "app/dashboard" ]; then
    mv app/dashboard/* "app/(advisor)/" 2>/dev/null || true
    rmdir app/dashboard 2>/dev/null || true
    echo "✅ Dashboard déplacé vers (advisor)"
else
    echo "⚠️  app/dashboard n'existe pas"
fi

# 2. Créer la structure (client)
echo "📁 Création de app/(client)..."
mkdir -p "app/(client)"

# Déplacer client → (client)
echo "📦 Déplacement de client → (client)..."
if [ -d "app/client" ]; then
    mv app/client/* "app/(client)/" 2>/dev/null || true
    rmdir app/client 2>/dev/null || true
    echo "✅ Client déplacé vers (client)"
else
    echo "⚠️  app/client n'existe pas"
fi

# 3. Créer la structure (superadmin)
echo "📁 Création de app/(superadmin)..."
mkdir -p "app/(superadmin)"

# Déplacer admin → (superadmin)
echo "📦 Déplacement de admin → (superadmin)..."
if [ -d "app/(advisor)/admin" ]; then
    mv "app/(advisor)/admin" "app/(superadmin)/" 2>/dev/null || true
    echo "✅ Admin déplacé vers (superadmin)"
else
    echo "⚠️  app/(advisor)/admin n'existe pas"
fi

# 4. Créer la structure (auth)
echo "📁 Création de app/(auth)..."
mkdir -p "app/(auth)"

# Déplacer login → (auth)
echo "📦 Déplacement de login → (auth)..."
if [ -d "app/login" ]; then
    mv app/login "app/(auth)/" 2>/dev/null || true
    echo "✅ Login déplacé vers (auth)"
else
    echo "⚠️  app/login n'existe pas"
fi

echo ""
echo "Phase 2: Réorganisation APIs"
echo "============================"

# Créer la structure API advisor
echo "📁 Création de app/api/advisor..."
mkdir -p "app/api/advisor"

# Liste des APIs à déplacer vers advisor
apis_to_move=(
    "clients"
    "actifs"
    "passifs"
    "contrats"
    "documents"
    "opportunites"
    "projets"
    "objectifs"
    "taches"
    "rendez-vous"
    "notifications"
    "simulations"
    "patrimoine"
    "kyc"
    "calculators"
    "simulators"
    "dashboard"
    "audit"
)

echo "📦 Déplacement des APIs vers advisor..."
for api in "${apis_to_move[@]}"; do
    if [ -d "app/api/$api" ]; then
        # Vérifier si l'API n'est pas déjà dans advisor
        if [ ! -d "app/api/advisor/$api" ]; then
            mv "app/api/$api" "app/api/advisor/" 2>/dev/null || true
            echo "  ✅ $api déplacé"
        else
            echo "  ⚠️  $api existe déjà dans advisor"
        fi
    else
        echo "  ⚠️  $api n'existe pas"
    fi
done

echo ""
echo "Phase 3: Création des Layouts"
echo "=============================="

# Créer layout advisor si n'existe pas
if [ ! -f "app/(advisor)/layout.tsx" ]; then
    echo "📝 Création de app/(advisor)/layout.tsx..."
    cat > "app/(advisor)/layout.tsx" << 'EOF'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aura CRM - Conseiller',
  description: 'Interface conseiller en gestion de patrimoine',
}

export default function AdvisorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="advisor-layout">
      {/* TODO: Ajouter AdvisorSidebar */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
EOF
    echo "✅ Layout advisor créé"
else
    echo "⚠️  Layout advisor existe déjà"
fi

# Créer layout client si n'existe pas
if [ ! -f "app/(client)/layout.tsx" ]; then
    echo "📝 Création de app/(client)/layout.tsx..."
    cat > "app/(client)/layout.tsx" << 'EOF'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aura CRM - Portail Client',
  description: 'Portail client sécurisé',
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="client-layout">
      {/* TODO: Ajouter ClientSidebar */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
EOF
    echo "✅ Layout client créé"
else
    echo "⚠️  Layout client existe déjà"
fi

# Créer layout superadmin si n'existe pas
if [ ! -f "app/(superadmin)/layout.tsx" ]; then
    echo "📝 Création de app/(superadmin)/layout.tsx..."
    cat > "app/(superadmin)/layout.tsx" << 'EOF'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aura CRM - SuperAdmin',
  description: 'Interface d\'administration système',
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="superadmin-layout">
      {/* TODO: Ajouter SuperAdminSidebar */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
EOF
    echo "✅ Layout superadmin créé"
else
    echo "⚠️  Layout superadmin existe déjà"
fi

# Créer layout auth si n'existe pas
if [ ! -f "app/(auth)/layout.tsx" ]; then
    echo "📝 Création de app/(auth)/layout.tsx..."
    cat > "app/(auth)/layout.tsx" << 'EOF'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aura CRM - Connexion',
  description: 'Authentification',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="auth-layout min-h-screen flex items-center justify-center">
      {children}
    </div>
  )
}
EOF
    echo "✅ Layout auth créé"
else
    echo "⚠️  Layout auth existe déjà"
fi

echo ""
echo "✅ Réorganisation terminée avec succès!"
echo ""
echo "📝 Prochaines étapes:"
echo "  1. Vérifier que tout compile: npm run build"
echo "  2. Mettre à jour les imports dans les composants"
echo "  3. Mettre à jour les appels API"
echo "  4. Tester chaque interface"
echo "  5. Commit les changements"
echo ""
echo "⚠️  IMPORTANT:"
echo "  - Les imports devront être mis à jour manuellement"
echo "  - Les routes API ont changé (ex: /api/clients → /api/advisor/clients)"
echo "  - Tester avant de merger!"
echo ""
