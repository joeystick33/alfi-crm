# 📊 RAPPORT D'AUDIT - DISPARITÉS CRM AURA

**Date de l'audit:** Janvier 2025  
**Scope:** Prisma Schema, Types TypeScript, API Routes, Hooks Frontend, Constants/Enums  
**Objectif:** Identifier les incohérences entre les différentes couches du système

---

## 📋 RÉSUMÉ EXÉCUTIF

### État Global de l'Harmonisation

| Couche | État | Score |
|--------|------|-------|
| **Prisma Schema** | ✅ Bien structuré, enums FR uniformes | 9/10 |
| **Types TypeScript** | ⚠️ Mélange d'imports Prisma et types locaux | 7/10 |
| **API Routes** | ✅ Architecture cohérente avec services | 8/10 |
| **Hooks Frontend** | ⚠️ Query keys non centralisées partout | 7/10 |
| **Constants/Enums** | ⚠️ Rétrocompatibilité complexe | 6/10 |
| **Mappings** | ✅ Système de normalisation en place | 8/10 |

**Score global: 7.5/10** - Système fonctionnel avec axes d'amélioration identifiés.

---

## 🔍 ANALYSE DÉTAILLÉE PAR COUCHE

---

### 1. PRISMA SCHEMA (`prisma/schema.prisma`)

#### ✅ Points Positifs

1. **Structure complète**: 4022 lignes, ~60 modèles, ~80 enums
2. **Migration vers valeurs FR uniformes** (effectuée 2024-12-10):
   - Tous les enums principaux sont en français
   - Cohérence linguistique: `RESIDENCE_PRINCIPALE`, `CREDIT_IMMOBILIER`, etc.
3. **Relations bien définies**: Cascades appropriées, indexes optimisés
4. **Multi-tenant**: `cabinetId` présent sur tous les modèles métier
5. **Modules bien séparés**: Patrimoine, Budget, Documents, KYC, Marketing, etc.

#### ⚠️ Points d'Attention

| Problème | Fichier/Ligne | Impact | Recommandation |
|----------|---------------|--------|----------------|
| **Doublons potentiels** | `opportunites` vs `opportunities` routes | Confusion API | Unifier sur un seul endpoint FR |
| **Modèles similaires** | `Passif` vs `Credit` | Redondance données | Clarifier la distinction ou fusionner |
| **Enum Contrat** | `ContratType` limité à 9 types | Manque granularité | Étendre ou utiliser `details` JSON |

#### 📊 Inventaire des Enums Prisma (Extrait)

| Enum | Valeurs | Langue | Commentaires |
|------|---------|--------|--------------|
| `ActifType` | 47 valeurs | FR | ✅ Complet |
| `ActifCategory` | 7 valeurs | FR | ✅ OK |
| `PassifType` | 14 valeurs | FR | ✅ Migré EN→FR |
| `ContratType` | 9 valeurs | FR | ⚠️ Limité |
| `RevenueCategory` | 35 valeurs | FR | ✅ Détaillé |
| `ExpenseCategory` | 53 valeurs | FR | ✅ Très complet |
| `DocumentType` | 20 valeurs | FR | ✅ OK |
| `NotificationType` | 10 valeurs | FR | ✅ Migré |
| `CampaignStatus` | 6 valeurs | FR | ✅ OK |

---

### 2. TYPES TYPESCRIPT (`app/_common/lib/api-types.ts`)

#### ✅ Points Positifs

1. **Réutilisation des types Prisma**: Import direct depuis `@prisma/client`
2. **Types Request/Response** bien définis pour chaque entité
3. **Interfaces détaillées** pour Client, Document, Wealth, Performance
4. **Support des filtres** avec interfaces dédiées (`ClientFilters`, `DocumentFilters`)

#### ⚠️ Disparités Identifiées

| Disparité | Localisation | Impact |
|-----------|--------------|--------|
| **`[key: string]: any`** | `ClientDetail` L155 | Perte de typage strict |
| **Types `any`** | Multiples interfaces | Contournement du typage |
| **KYCStatus redéfini** | L199 vs import Prisma L22 | Potentiel conflit |
| **ApporteurType frontend** | L748 | ≠ `ApporteurEntityType` Prisma |

#### 📋 Tableau des Correspondances Types

| Type Frontend | Type Prisma | Aligné? |
|---------------|-------------|---------|
| `ActifType` | `ActifType` | ✅ Import direct |
| `PassifType` | `PassifType` | ✅ Import direct |
| `ClientType` | `ClientType` | ✅ Import direct |
| `ApporteurType` | `ApporteurEntityType` | ❌ Noms différents |
| `KYCStatus` (local) | `KYCStatus` (Prisma) | ⚠️ Redéfini |
| `StorageProvider` | N/A | ⚠️ Défini localement |

---

### 3. PATRIMOINE CONFIG (`app/_common/lib/patrimoine-config.ts`)

#### ✅ Points Positifs

1. **Configuration centralisée** des 47 types d'actifs avec métadonnées UI
2. **Alignement avec Prisma** post-migration FR
3. **Informations enrichies**: icons, colors, fields requis, taxable, liquidable
4. **Dispositifs fiscaux** documentés (LMNP, Pinel, Malraux, etc.)
5. **Clauses bénéficiaires** AV détaillées

#### ⚠️ Points d'Attention

| Problème | Détail | Recommandation |
|----------|--------|----------------|
| **Type local vs Prisma** | `ActifTypeValue` redéfini en string union | Importer depuis `@prisma/client` |
| **Maintenance double** | Si Prisma change, config manuelle requise | Générer depuis Prisma |
| **Catégorie `FINANCIER`** | Inclut bancaire + placements | Considérer séparation |

---

### 4. ENUM MAPPINGS (`app/_common/lib/enum-mappings.ts`)

#### ✅ Architecture de Rétrocompatibilité

Le système gère la transition EN→FR avec:

1. **Labels d'affichage** pour le frontend
2. **Mapping legacy→new** pour données existantes (`LEGACY_TO_NEW_VALUES`)
3. **Fonctions de normalisation** (`mapPassifType()`, `mapActifType()`, etc.)

#### ⚠️ Complexité de Maintenance

```
Flux actuel:
[Donnée legacy EN] → normalizeEnumValue() → [Valeur FR Prisma]
[Valeur FR Prisma] → LABELS[value] → [Affichage UI]
```

| Problème | Impact | Recommandation |
|----------|--------|----------------|
| **757 lignes de mappings** | Maintenance lourde | Script de migration unique puis nettoyage |
| **Mappings bidirectionnels** | Risque d'incohérence | Supprimer après migration complète |
| **Fonctions redondantes** | `mapXxx()` pour chaque enum | Généraliser avec une seule fonction |

---

### 5. HOOKS API (`app/_common/hooks/api/`)

#### ✅ Points Positifs

1. **Modularisation**: 21 fichiers spécialisés
2. **React Query** bien utilisé avec `staleTime` appropriés
3. **Toast notifications** intégrées
4. **Query keys centralisées** dans `query-keys.ts`

#### ⚠️ Disparités Identifiées

| Hook | Problème | Impact |
|------|----------|--------|
| `useClientActifs` | Query key en dur `['clients', id, 'actifs']` | ≠ queryKeys centralisées |
| `useClientContrats` | Query key en dur | Même problème |
| Types génériques | Certains hooks sans typage strict | Perte de sécurité |

#### 📋 Fichiers Hooks API

```
api/
├── index.ts              # Export centralisé
├── query-keys.ts         # ✅ Clés centralisées
├── use-clients-api.ts    # ✅ OK
├── use-documents-api.ts  # ✅ OK
├── use-wealth-api.ts     # ⚠️ Query keys non centralisées
├── use-tasks-api.ts      # ✅ OK
├── use-campaigns-api.ts  # ✅ OK
├── ... (17 autres fichiers)
```

---

### 6. ROUTES API BACKEND

#### ✅ Points Positifs

1. **40+ routes** organisées par domaine
2. **Architecture Service Layer**: Routes → Services → Prisma
3. **Auth centralisée**: `requireAuth()` sur toutes les routes
4. **Normalisation des payloads**: `normalizeClientCreatePayload()`

#### ⚠️ Disparités Identifiées

| Route | Problème | Recommandation |
|-------|----------|----------------|
| `/opportunites` + `/opportunities` | Doublons | Supprimer `/opportunities` |
| Validation | Pas de schéma Zod uniforme | Implémenter validation centralisée |
| Responses | Format variable | Standardiser avec `createSuccessResponse()` |

---

### 7. SERVICES BACKEND (`app/_common/lib/services/`)

#### ✅ Points Positifs

1. **Services métier** bien séparés (`ActifService`, `ClientService`, etc.)
2. **Gestion multi-tenant** avec `cabinetId`
3. **Timeline events** créés automatiquement
4. **Mapping type→catégorie** dans `ActifService`

#### ⚠️ Points d'Attention

| Service | Problème | Impact |
|---------|----------|--------|
| `actif-service.ts` | Map type→catégorie en dur | Si Prisma change, mise à jour manuelle |
| Erreurs | Messages en anglais | Inconsistance avec UI FR |

---

## 🔄 MATRICE DES DISPARITÉS ENUM

### Comparaison Prisma ↔ Frontend ↔ Config

| Enum | Prisma | api-types.ts | patrimoine-config.ts | enum-mappings.ts |
|------|--------|--------------|---------------------|------------------|
| **ActifType** | 47 valeurs FR | Import ✅ | Type local ⚠️ | Labels ✅ |
| **PassifType** | 14 valeurs FR | Import ✅ | Type local ⚠️ | Labels ✅ |
| **ContratType** | 9 valeurs FR | Import ✅ | N/A | Labels ✅ |
| **ActifCategory** | 7 valeurs FR | Import ✅ | Type local ⚠️ | N/A |
| **ClientType** | 2 valeurs | Import ✅ | N/A | N/A |
| **RevenueCategory** | 35 valeurs FR | N/A | Constants ⚠️ | N/A |
| **ExpenseCategory** | 53 valeurs FR | N/A | Constants ⚠️ | N/A |

**Légende**:
- ✅ Aligné (import depuis Prisma)
- ⚠️ Redéfini localement (risque de désynchronisation)
- N/A Non applicable

---

## 📊 SYNTHÈSE DES RISQUES

### 🔴 Risques Élevés

| # | Risque | Probabilité | Impact | Localisation |
|---|--------|-------------|--------|--------------|
| 1 | Types locaux désynchronisés de Prisma | Moyenne | Élevé | patrimoine-config.ts |
| 2 | Données legacy non migrées | Faible | Élevé | Base Supabase |
| 3 | Doublons API (/opportunites vs /opportunities) | Certaine | Moyen | Routes backend |

### 🟡 Risques Moyens

| # | Risque | Probabilité | Impact | Localisation |
|---|--------|-------------|--------|--------------|
| 4 | Query keys non centralisées | Moyenne | Moyen | use-wealth-api.ts |
| 5 | Validation API incomplète | Moyenne | Moyen | Routes backend |
| 6 | Types `any` excessifs | Certaine | Moyen | api-types.ts |

### 🟢 Risques Faibles

| # | Risque | Probabilité | Impact | Localisation |
|---|--------|-------------|--------|--------------|
| 7 | Labels d'affichage incorrects | Faible | Faible | enum-mappings.ts |
| 8 | Mappings rétrocompat inutilisés | Faible | Faible | enum-mappings.ts |

---

## ✅ RECOMMANDATIONS

### Court Terme (Sprint 1-2)

1. **Supprimer le doublon** `/opportunities` route
2. **Centraliser toutes les query keys** dans `query-keys.ts`
3. **Remplacer `any`** par types spécifiques dans `ClientDetail`
4. **Aligner `ApporteurType`** frontend avec `ApporteurEntityType` Prisma

### Moyen Terme (Sprint 3-4)

1. **Générer types depuis Prisma** pour `patrimoine-config.ts`
   ```bash
   npx prisma generate # déjà fait
   # Créer script de sync config → Prisma
   ```

2. **Implémenter validation Zod** sur toutes les routes API
   ```typescript
   const CreateClientSchema = z.object({
     clientType: z.enum(['PARTICULIER', 'PROFESSIONNEL']),
     firstName: z.string().min(1),
     // ...
   })
   ```

3. **Nettoyer enum-mappings.ts** après migration complète des données

### Long Terme (Sprint 5+)

1. **Tests de régression** sur les enums et types
2. **Documentation technique** du système de types
3. **CI/CD check** pour détecter les désynchronisations type/schema

---

## 📁 FICHIERS CLÉS ANALYSÉS

```
prisma/
└── schema.prisma                    # 4022 lignes, source de vérité

app/_common/
├── lib/
│   ├── api-types.ts                 # 2170 lignes, types API
│   ├── patrimoine-config.ts         # 1273 lignes, config UI
│   ├── enum-mappings.ts             # 757 lignes, rétrocompat
│   └── services/
│       ├── actif-service.ts         # Service CRUD actifs
│       ├── client-service.ts        # Service CRUD clients
│       └── passif-service.ts        # Service CRUD passifs
├── hooks/api/
│   ├── index.ts                     # Export central
│   ├── query-keys.ts                # Clés React Query
│   ├── use-wealth-api.ts            # Hooks patrimoine
│   └── ... (21 fichiers)
├── types/
│   └── patrimoine.types.ts          # 1267 lignes, types métier
└── constants/
    └── patrimoine.constants.ts      # 464 lignes, constantes UI

app/(advisor)/(backend)/api/advisor/
├── clients/route.ts                 # CRUD clients
├── actifs/route.ts                  # CRUD actifs
├── passifs/route.ts                 # CRUD passifs
├── documents/route.ts               # CRUD documents
└── ... (40 routes)
```

---

## 🎯 CONCLUSION

Le CRM Aura présente une **architecture globalement cohérente** avec un effort notable de migration vers des enums FR uniformes. Les principales sources de disparités proviennent de:

1. **Redéfinitions locales** de types qui devraient être importés depuis Prisma
2. **Système de rétrocompatibilité** qui ajoute de la complexité
3. **Quelques doublons** et incohérences mineures

**La méthode recommandée pour l'harmonisation:**

> **"Single Source of Truth"**: Prisma schema comme référence unique, génération automatique des types frontend, suppression progressive des mappings legacy après migration complète des données.

---

*Rapport généré automatiquement par l'audit CRM Aura - Janvier 2025*
