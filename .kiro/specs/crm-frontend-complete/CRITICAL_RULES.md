# 🚨 RÈGLES CRITIQUES - CRM Frontend

## ⛔ INTERDICTIONS ABSOLUES

### 1. AUCUN MOCK DE DONNÉES
- ❌ **INTERDIT**: Utiliser des données mockées ou hardcodées
- ❌ **INTERDIT**: Créer des fichiers de données fictives (mock-data.ts, fake-clients.json, etc.)
- ❌ **INTERDIT**: Utiliser des tableaux statiques pour simuler des données
- ✅ **OBLIGATOIRE**: Toutes les données DOIVENT venir de PostgreSQL via Prisma

### 2. INTÉGRATION PRISMA/POSTGRESQL OBLIGATOIRE
- ✅ **OBLIGATOIRE**: Utiliser les API routes existantes dans `alfi-crm/app/api/`
- ✅ **OBLIGATOIRE**: Utiliser Prisma Client pour toutes les opérations de base de données
- ✅ **OBLIGATOIRE**: Respecter le schéma Prisma existant (`alfi-crm/prisma/schema.prisma`)
- ✅ **OBLIGATOIRE**: Utiliser les services métier existants dans `alfi-crm/lib/services/`

### 3. DONNÉES DE TEST
- ✅ **AUTORISÉ**: Créer des clients de test via l'interface ou via seed script
- ✅ **AUTORISÉ**: Utiliser des données de démonstration stockées en base
- ❌ **INTERDIT**: Simuler des données sans les persister en base

### 4. APPELS API
- ✅ **OBLIGATOIRE**: Tous les appels doivent passer par les routes API Next.js
- ✅ **OBLIGATOIRE**: Format: `fetch('/api/clients')` ou `apiCall('/clients')`
- ❌ **INTERDIT**: Appels directs à Prisma depuis les composants client
- ✅ **OBLIGATOIRE**: Gestion d'erreur pour tous les appels API

### 5. SÉCURITÉ
- ✅ **OBLIGATOIRE**: Respecter Row Level Security (RLS) via cabinetId
- ✅ **OBLIGATOIRE**: Vérifier les permissions utilisateur (role)
- ✅ **OBLIGATOIRE**: Valider toutes les entrées utilisateur
- ✅ **OBLIGATOIRE**: Logger les actions sensibles dans AuditLog

### 6. ÉTAT DE CHARGEMENT
- ✅ **OBLIGATOIRE**: Afficher des loading states pendant les appels API
- ✅ **OBLIGATOIRE**: Afficher des messages d'erreur clairs
- ✅ **OBLIGATOIRE**: Gérer les états vides (pas de données)
- ❌ **INTERDIT**: Afficher des données avant qu'elles soient chargées

## ✅ ARCHITECTURE CORRECTE

### Pattern à suivre:

```typescript
// ❌ MAUVAIS - Mock interdit
const clients = [
  { id: '1', name: 'Jean Dupont' },
  { id: '2', name: 'Marie Martin' }
];

// ✅ BON - Données réelles de l'API
const [clients, setClients] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadClients = async () => {
    try {
      const data = await fetch('/api/clients').then(r => r.json());
      setClients(data.clients);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };
  loadClients();
}, []);
```

### Routes API à utiliser:

```
✅ /api/clients - Liste clients
✅ /api/clients/[id] - Détail client
✅ /api/actifs - Liste actifs
✅ /api/passifs - Liste passifs
✅ /api/contrats - Liste contrats
✅ /api/documents - Liste documents
✅ /api/objectifs - Liste objectifs
✅ /api/projets - Liste projets
✅ /api/opportunites - Liste opportunités
✅ /api/taches - Liste tâches
✅ /api/rendez-vous - Liste rendez-vous
✅ /api/kyc - Données KYC
```

## 🎯 OBJECTIF

Créer un CRM **100% fonctionnel** qui:
- ✅ Utilise VRAIMENT PostgreSQL
- ✅ Persiste VRAIMENT les données
- ✅ Fonctionne VRAIMENT en production
- ❌ N'a AUCUNE donnée mockée
- ❌ N'a AUCUNE fonctionnalité simulée

## 📝 VALIDATION

Avant de considérer une fonctionnalité comme terminée:
1. ✅ Les données sont stockées dans PostgreSQL
2. ✅ Les données sont récupérées via API routes
3. ✅ Les opérations CRUD fonctionnent réellement
4. ✅ La sécurité RLS est respectée
5. ✅ Les erreurs sont gérées correctement

## 🚀 SEED DATA (Autorisé)

Pour les tests et démos, on peut créer un script de seed:

```typescript
// ✅ AUTORISÉ - Seed script qui PERSISTE en base
// alfi-crm/prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Créer un cabinet de test
  const cabinet = await prisma.cabinet.create({
    data: {
      name: 'Cabinet Demo',
      slug: 'cabinet-demo',
      email: 'demo@cabinet.fr',
      plan: 'BUSINESS',
      status: 'ACTIVE'
    }
  });

  // Créer des clients de test
  await prisma.client.create({
    data: {
      cabinetId: cabinet.id,
      clientType: 'PARTICULIER',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@email.fr',
      // ... autres champs
    }
  });
}

main();
```

**Ces données de seed sont RÉELLES et PERSISTÉES en base.**

---

**EN RÉSUMÉ: Si ça ne vient pas de PostgreSQL via Prisma, ça n'existe pas! 🚫**
