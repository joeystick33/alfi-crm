# Intelligence Engines — Intégration & Corrections TypeScript

> Document généré le 07/03/2026 — Résumé complet de tout le travail effectué sur les moteurs d'intelligence.

---

## 1. Vue d'ensemble

### Objectif
Intégrer **8 moteurs d'intelligence** dans le CRM Aura, puis corriger **toutes les erreurs TypeScript** (105 erreurs → 0) pour que la compilation passe proprement.

### Fichiers concernés
Tous situés dans `/app/_common/lib/services/intelligence/` :

| # | Fichier | Rôle |
|---|---------|------|
| 1 | `relationship-intelligence.ts` | Scoring relationnel 0-100, nudges, profils relationnels |
| 2 | `lead-pipeline.ts` | Pipeline prospect → client, scoring, state machine |
| 3 | `business-intelligence-council.ts` | Analyses nocturnes multi-experts (fiscal, patrimoine, marché…) |
| 4 | `portfolio-allocation.ts` | Rééquilibrage portefeuille, allocation cible par profil de risque |
| 5 | `llm-cost-tracker.ts` | Suivi tokens/coûts LLM par utilisateur et période |
| 6 | `notification-batching.ts` | Regroupement intelligent des notifications par priorité |
| 7 | `email-outreach.ts` | Campagnes email automatisées, follow-ups, séquences |
| 8 | `meeting-intelligence.ts` | Post-RDV : CR auto, actions, mise à jour CRM, email de suivi |

---

## 2. Problème commun n°1 — `getPrismaClient()` sans argument

### Cause
La fonction `getPrismaClient` exige un `cabinetId` :
```typescript
export function getPrismaClient(cabinetId: string, isSuperAdmin: boolean = false)
```

Or, **tous les 8 fichiers** appelaient :
```typescript
const prisma = getPrismaClient() // ❌ manque cabinetId
```

### Correction appliquée (identique dans les 8 fichiers)

**Avant :**
```typescript
import { getPrismaClient } from '@/app/_common/lib/prisma'
const prisma = getPrismaClient()

export class MonEngine {
  private cabinetId: string
  constructor(cabinetId: string) { ... }

  async maMethode() {
    await prisma.client.findFirst({ ... }) // ❌ prisma global
  }
}
```

**Après :**
```typescript
import { getPrismaClient } from '@/app/_common/lib/prisma'
// ← plus de const prisma global

export class MonEngine {
  private cabinetId: string
  constructor(cabinetId: string) { ... }

  private get prisma() {
    return getPrismaClient(this.cabinetId) // ✅ scoped par cabinet
  }

  async maMethode() {
    await this.prisma.client.findFirst({ ... }) // ✅ this.prisma
  }
}
```

---

## 3. Problème commun n°2 — Enums invalides

Les fichiers utilisaient des valeurs d'enum qui **n'existent pas** dans `prisma/schema.prisma`. Voici toutes les corrections :

### ClientStatus
| ❌ Invalide | ✅ Corrigé | Fichiers |
|-------------|-----------|----------|
| `EN_COURS` | `ACTIF` | lead-pipeline, portfolio-allocation, email-outreach |

### OpportuniteStatus
| ❌ Invalide | ✅ Corrigé | Fichiers |
|-------------|-----------|----------|
| `EN_COURS` | `DETECTEE` | lead-pipeline |
| `IDENTIFIEE` | `QUALIFIEE` | lead-pipeline |

### RendezVousType
| ❌ Invalide | ✅ Corrigé | Fichiers |
|-------------|-----------|----------|
| `DECOUVERTE` | `PREMIER_RDV` | lead-pipeline |
| `PREMIER_CONTACT` | `PREMIER_RDV` | lead-pipeline |

### ObjectifPriority
| ❌ Invalide | ✅ Corrigé | Fichiers |
|-------------|-----------|----------|
| `CRITIQUE` | `URGENTE` | lead-pipeline |

### AuditAction
| ❌ Invalide | ✅ Corrigé | Fichiers |
|-------------|-----------|----------|
| `PIPELINE_TRANSITION` | `MODIFICATION` | lead-pipeline |

### TachePriority
| ❌ Invalide | ✅ Corrigé | Fichiers |
|-------------|-----------|----------|
| `NORMALE` | `MOYENNE` | meeting-intelligence |

### TimelineEventType
| ❌ Invalide | ✅ Corrigé | Fichiers |
|-------------|-----------|----------|
| `ENTRETIEN` | `CLIENT_UPDATED` | meeting-intelligence |

### EntretienStatus
| ❌ Invalide | ✅ Corrigé | Fichiers |
|-------------|-----------|----------|
| `TERMINE` | `FINALISE` | meeting-intelligence |

### NotificationPriority / autres
| ❌ Invalide | ✅ Corrigé | Fichiers |
|-------------|-----------|----------|
| `BI_COUNCIL_DIGEST` | `CONSULTATION` | business-intelligence-council |
| `ANNULEE` | `ANNULE` | relationship-intelligence |
| `SUCCESSION` | `TRANSMISSION` | relationship-intelligence |
| `INVESTISSEMENT` | `ACHAT_IMMOBILIER` | relationship-intelligence |

---

## 4. Corrections spécifiques par fichier

### 4.1 `relationship-intelligence.ts`
- Suppression d'un **doublon `objectifs`** dans un `include` Prisma (plantait la query)
- Correction des enums `ANNULEE`, `SUCCESSION`, `INVESTISSEMENT`

### 4.2 `lead-pipeline.ts`
- `prisma` → `this.prisma` (toutes les occurrences)
- Remplacement de 6 valeurs d'enum invalides (voir tableau ci-dessus)
- `details` → `changes` (le modèle `AuditLog` utilise `changes`, pas `details`)
- Cast `as any` pour la mise à jour du statut client (type union complexe)

### 4.3 `notification-batching.ts`
- `prisma` → `this.prisma`
- `read` → `isRead` (le modèle `Notification` utilise `isRead`)
- Suppression du champ `status` (n'existe pas sur `Notification`)
- `n.client.firstName` → accès correct via relation inclue

### 4.4 `meeting-intelligence.ts`
- `prisma` → `this.prisma`
- `entretien.notes` → `entretien.notesConseiller` (le champ s'appelle `notesConseiller`)
- `entretien.transcription` → `entretien.transcriptionBrute` (champ texte brut, pas le JSON)
- `userId` → `createdBy` sur `TimelineEvent` (pas de champ `userId`)
- `metadata` → `relatedEntityId` sur `TimelineEvent` (pas de champ `metadata`)
- Ajout de `createdById` sur `Tache.create` (champ requis manquant)
- Ajout d'un null guard sur `entretien.client` (relation optionnelle car `clientId String?`)
- `contrats` select : `label` → `name` (le modèle `Contrat` utilise `name`)

### 4.5 `llm-cost-tracker.ts`
- `prisma` → `this.prisma`
- **Refonte de `logCall`** : le modèle `AuraTokenUsage` est agrégé par période (`role + cabinetId + userId + period`), pas individuel par appel. Remplacement du `create` par un `upsert` qui incrémente `tokensUsed`.
- **Adaptation de `getUsageReport`** : utilisation des champs réels (`tokensUsed`, `role`) au lieu des champs inexistants (`tokensInput`, `tokensOutput`, `model`, `taskType`, `estimatedCost`)

### 4.6 `portfolio-allocation.ts`
- `prisma` → `this.prisma`
- La relation `Client → ClientActif[]` s'appelle **`actifs`** dans le schéma (pas `clientActifs`)
- `label` → `name` sur `Actif` et `Contrat`
- `totalAmount` → `initialAmount` sur `Passif`
- `subType` → `category` sur `Actif`
- `status: { in: ['ACTIF', 'EN_COURS'] }` → `status: 'ACTIF'`

### 4.7 `email-outreach.ts`
- `prisma` → `this.prisma`
- `createdById` → `createdBy` sur `Campaign` (le schéma utilise `createdBy`)
- `content` → `plainContent` sur `Campaign` (pas de champ `content`)
- Ajout du champ `email` dans `CampaignRecipient.create` (requis par le schéma)
- Suppression du filtre `direction: 'ENTRANT'` sur `Email` (ce champ n'existe pas)
- `status: { in: ['ACTIF', 'EN_COURS'] }` → `status: 'ACTIF'` dans les segments

### 4.8 `business-intelligence-council.ts`
- `prisma` → `this.prisma`
- Correction des enums et noms de champs (cf. tableaux ci-dessus)

---

## 5. Résultat final

```
Avant : 105 erreurs TypeScript dans /intelligence/
Après :   0 erreurs TypeScript dans /intelligence/
```

Les ~114 erreurs restantes dans le projet sont **pré-existantes** et non liées aux moteurs d'intelligence (fichiers `rag-web-search.ts`, `scripts/test-pdf*.ts`, etc.).

---

## 6. Référence rapide — Schéma Prisma

Valeurs d'enums les plus utilisées dans les moteurs :

```
ClientStatus:       PROSPECT, ACTIF, INACTIF, ARCHIVE, PERDU
OpportuniteStatus:  DETECTEE, QUALIFIEE, CONTACTEE, PRESENTEE, ACCEPTEE, PERDUE, SIGNEE
TachePriority:      BASSE, MOYENNE, HAUTE, URGENTE
TacheType:          APPEL, EMAIL, REUNION, REVUE_DOCUMENTS, MISE_A_JOUR_KYC, SUIVI, ADMINISTRATIF, AUTRE
EntretienStatus:    EN_COURS, TRANSCRIT, TRAITE, FINALISE, ARCHIVE
AuditAction:        CREATION, MODIFICATION, SUPPRESSION, CONNEXION, DECONNEXION, EXPORT, IMPORT, CONSULTATION
TimelineEventType:  CLIENT_CREATED, CLIENT_UPDATED, CLIENT_ARCHIVED, ASSET_ADDED, ASSET_UPDATED, ...
```

Modèles clés pour les moteurs :
```
AuraTokenUsage:  role, cabinetId, userId, period, tokensUsed, sttMinutesUsed (@@unique[role,cabinetId,userId,period])
Notification:    isRead (pas 'read'), pas de champ 'status'
TimelineEvent:   createdBy (pas 'userId'), relatedEntityId (pas 'metadata')
AuditLog:        changes (pas 'details')
Entretien:       notesConseiller, transcriptionBrute (pas 'notes', pas 'transcription' en string)
Campaign:        createdBy, plainContent/htmlContent (pas 'content')
CampaignRecipient: email (requis), clientId, status
Actif:           name (pas 'label'), category (pas 'subType')
Passif:          initialAmount (pas 'totalAmount')
```
