# 📋 CAHIER DES CHARGES
## Synthèse Client 360 + Gestion Features Premium

**Version:** 1.1  
**Date:** 25 novembre 2025  
**Statut:** En cours de développement

---

## 📌 SOMMAIRE

1. [Contexte et objectifs](#1-contexte-et-objectifs)
2. [Périmètre fonctionnel](#2-périmètre-fonctionnel)
3. [Architecture technique](#3-architecture-technique)
4. [Spécifications détaillées](#4-spécifications-détaillées)
5. [Plan de développement](#5-plan-de-développement)
6. [Suivi d'avancement](#6-suivi-davancement)
7. [Améliorations futures](#7-améliorations-futures)

---

## ⚡ SCOPE v1.1 - AMÉLIORATIONS INCLUSES

Les améliorations suivantes sont **intégrées au scope** (pas futures) :

| # | Amélioration | Description | Phase |
|---|--------------|-------------|-------|
| 1 | **Pré-remplissage simulateurs** | Données client auto-injectées dans les simulateurs | Phase 7 |
| 3 | **Historique Synthèse** | Comparer évolution N-1, N-2, snapshots | Phase 8 |
| 4 | **Portail Client** | Client voit sa synthèse simplifiée | Phase 9 |
| 5 | **Notifications proactives** | Alertes automatiques conseiller | Phase 10 |

---

## 1. CONTEXTE ET OBJECTIFS

### 1.1 Contexte
Le CRM Aura dispose actuellement de multiples simulateurs et calculateurs dispersés. L'objectif est de :
- Créer une vue synthétique consolidée du client (Tab Synthèse)
- Structurer l'offre commerciale avec des features Base vs Premium
- Permettre la gestion granulaire des accès depuis le SuperAdmin

### 1.2 Objectifs métier
| Objectif | Description | Priorité |
|----------|-------------|----------|
| Vision 360° | Synthèse complète du client en un coup d'œil | Haute |
| Monétisation | Différencier features Base/Premium | Haute |
| Valeur immédiate | Donner des données utiles sans payer | Moyenne |
| Upsell naturel | Teasers vers fonctionnalités premium | Moyenne |

### 1.3 Utilisateurs cibles
- **Conseillers** : Utilisent la synthèse et les simulateurs
- **SuperAdmin** : Configure les features par cabinet
- **Clients finaux** : Bénéficient indirectement de meilleurs conseils

---

## 2. PÉRIMÈTRE FONCTIONNEL

### 2.1 Fonctionnalités BASE (incluses dans tous les plans)

#### 2.1.1 Tab Synthèse - Section Patrimoine
| Donnée | Calcul | Source |
|--------|--------|--------|
| Patrimoine brut | Somme des actifs | `ClientActif` |
| Patrimoine net | Actifs - Passifs | `ClientActif`, `Passif` |
| Répartition % | Groupement par catégorie | Calcul local |
| Actifs gérés vs non gérés | Filtrage `managedByFirm` | `Actif` |

#### 2.1.2 Tab Synthèse - Section Budget
| Donnée | Calcul | Source |
|--------|--------|--------|
| Revenus mensuels | Somme revenus | `ClientBudget` |
| Charges mensuelles | Somme charges | `ClientBudget` |
| Capacité d'épargne | Revenus - Charges | Calcul local |
| Taux d'épargne | (Capacité / Revenus) × 100 | Calcul local |
| Taux d'endettement actuel | (Mensualités crédits / Revenus) × 100 | `Passif` |

#### 2.1.3 Tab Synthèse - Section Objectifs & Projets
| Donnée | Source |
|--------|--------|
| Objectifs déclarés | `Objectif` |
| Projets en cours | `Projet` |
| Échéances proches | Filtrage par date |

#### 2.1.4 Tab Synthèse - Alertes de base
| Alerte | Condition | Sévérité |
|--------|-----------|----------|
| Concentration immobilière | Immo > 70% patrimoine | Warning |
| Taux d'endettement élevé | > 35% | Critical |
| Épargne de précaution insuffisante | < 3 mois charges | Warning |
| Échéance proche | Objectif < 6 mois | Info |

#### 2.1.5 Indicateurs teaser (estimations simples)
| Indicateur | Formule simplifiée | Mention |
|------------|-------------------|---------|
| Capacité d'emprunt estimée | (Revenus × 35% - Mensualités) × 240 | "~X € estimé*" |
| Épargne recommandée | Charges × 6 mois | "Objectif sécurité" |

### 2.2 Fonctionnalités PREMIUM

#### 2.2.1 Simulateurs
| Code | Nom | Description |
|------|-----|-------------|
| `SIM_RETIREMENT` | Retraite | Projection pension, déficit, stratégie |
| `SIM_PER` | PER Salariés | Économie IR, capital terme |
| `SIM_PER_TNS` | PER TNS (Madelin) | Plafonds Madelin, optimisation |
| `SIM_ASSURANCE_VIE` | Assurance-Vie | Projection, rachat, fiscalité |
| `SIM_IMMOBILIER` | Immobilier | Rentabilité, cash-flow, fiscalité |
| `SIM_SUCCESSION` | Succession | Droits, optimisation, stratégies |
| `SIM_PREVOYANCE` | Prévoyance TNS | Couverture, gaps, optimisation |
| `SIM_DONATION` | Donation | Abattements, stratégie |
| `SIM_EPARGNE` | Épargne | Projection long terme |
| `SIM_PTZ` | PTZ 2025 | Éligibilité, simulation |

#### 2.2.2 Calculateurs
| Code | Nom | Description |
|------|-----|-------------|
| `CALC_INCOME_TAX` | IR | Barème complet, optimisations |
| `CALC_WEALTH_TAX` | IFI | Assiette détaillée, stratégies |
| `CALC_CAPITAL_GAINS` | Plus-Values | Abattements, régimes |
| `CALC_DONATION` | Donation | Barèmes complets |
| `CALC_INHERITANCE` | Succession | Par héritier, démembrement |
| `CALC_DEBT_CAPACITY` | Capacité Emprunt | Calcul précis personnalisé |
| `CALC_BUDGET` | Budget | Analyse détaillée, recommandations |

#### 2.2.3 Modules additionnels
| Code | Nom | Description |
|------|-----|-------------|
| `MOD_EXPORT_PDF` | Export PDF | Inclus dans Base |
| `MOD_EXPORT_EXCEL` | Export Excel | Premium |
| `MOD_API_ACCESS` | Accès API | Enterprise |
| `MOD_WHITE_LABEL` | Marque blanche | Enterprise |
| `MOD_MULTI_CABINET` | Multi-cabinet | Enterprise |

### 2.3 Configuration par plan

| Plan | Simulateurs | Calculateurs | Modules |
|------|-------------|--------------|---------|
| **TRIAL** | Aucun | `CALC_DEBT_CAPACITY` (limité) | PDF |
| **STARTER** | 2 au choix | 2 au choix | PDF |
| **BUSINESS** | 5 au choix | 4 au choix | PDF, Excel |
| **PREMIUM** | Tous | Tous | PDF, Excel |
| **ENTERPRISE** | Tous | Tous | Tous |
| **CUSTOM** | Configurable | Configurable | Configurable |

---

## 3. ARCHITECTURE TECHNIQUE

### 3.1 Nouveaux fichiers à créer

```
app/
├── _common/
│   ├── lib/
│   │   ├── features/
│   │   │   ├── feature-config.ts           # Configuration des features
│   │   │   ├── feature-service.ts          # Service de vérification
│   │   │   └── plan-presets.ts             # Presets par plan
│   │   └── services/
│   │       ├── synthesis-service.ts        # Calculs synthèse
│   │       ├── synthesis-snapshot-service.ts # Historique synthèse (Phase 8)
│   │       ├── client-data-extractor.ts    # Extraction données client (Phase 7)
│   │       ├── alert-detection-service.ts  # Détection alertes (Phase 10)
│   │       └── notification-service.ts     # Notifications (Phase 10)
│   ├── hooks/
│   │   ├── use-feature-access.ts           # Hook accès features
│   │   └── use-prefill-data.ts             # Hook pré-remplissage (Phase 7)
│   └── components/
│       ├── FeatureGate.tsx                 # Composant restriction
│       ├── LockedFeatureCard.tsx           # UI feature verrouillée
│       └── NotificationCenter.tsx          # Centre notifications (Phase 10)
│
├── (advisor)/(frontend)/
│   └── components/
│       └── client360/
│           ├── TabSynthese.tsx             # Nouvel onglet
│           ├── SynthesisComparison.tsx     # Comparaison historique (Phase 8)
│           └── WealthEvolutionChart.tsx    # Graphique évolution (Phase 8)
│
├── (advisor)/(backend)/
│   └── api/advisor/
│       ├── synthesis/
│       │   ├── [clientId]/route.ts         # API synthèse
│       │   └── [clientId]/snapshot/route.ts # API snapshot (Phase 8)
│       └── notifications/
│           └── route.ts                    # API notifications (Phase 10)
│
├── (client)/                               # PORTAIL CLIENT (Phase 9)
│   ├── (frontend)/
│   │   ├── layout.tsx                      # Layout portail
│   │   ├── components/
│   │   │   ├── ClientSynthesis.tsx         # Synthèse simplifiée
│   │   │   ├── ClientWealth.tsx            # Vue patrimoine
│   │   │   ├── ClientObjectives.tsx        # Vue objectifs
│   │   │   └── ClientAppointments.tsx      # Vue rendez-vous
│   │   └── dashboard/
│   │       └── page.tsx                    # Dashboard client
│   └── (backend)/
│       └── api/client/
│           └── synthesis/route.ts          # API client sécurisée
│
└── (superadmin)/(frontend)/
    └── superadmin/
        └── cabinets/
            └── [id]/
                ├── page.tsx                # Vue cabinet
                ├── features/page.tsx       # Gestion features
                └── portal-access/page.tsx  # Accès portail (Phase 9)
```

### 3.2 Modifications de fichiers existants

| Fichier | Modification |
|---------|--------------|
| `Client360Page.tsx` | Ajouter onglet Synthèse |
| `SuperAdminSidebar.tsx` | Ajouter lien Features |
| Chaque simulateur/calculateur | Wrapper avec `FeatureGate` |

### 3.3 API Routes

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/superadmin/.../features` | GET | Récupérer features cabinet |
| `/api/superadmin/.../features` | PUT | Mettre à jour features |
| `/api/advisor/synthesis/[clientId]` | GET | Récupérer synthèse client |
| `/api/advisor/synthesis/[clientId]/refresh` | POST | Recalculer synthèse |

### 3.4 Schéma de données (Cabinet.features)

```json
{
  "simulators": {
    "SIM_RETIREMENT": true,
    "SIM_PER": true,
    "SIM_PER_TNS": false,
    "SIM_ASSURANCE_VIE": false,
    "SIM_IMMOBILIER": true,
    "SIM_SUCCESSION": false,
    "SIM_PREVOYANCE": false,
    "SIM_DONATION": false,
    "SIM_EPARGNE": true,
    "SIM_PTZ": false
  },
  "calculators": {
    "CALC_INCOME_TAX": true,
    "CALC_WEALTH_TAX": false,
    "CALC_CAPITAL_GAINS": false,
    "CALC_DONATION": false,
    "CALC_INHERITANCE": false,
    "CALC_DEBT_CAPACITY": true,
    "CALC_BUDGET": true
  },
  "modules": {
    "MOD_EXPORT_PDF": true,
    "MOD_EXPORT_EXCEL": false,
    "MOD_API_ACCESS": false,
    "MOD_WHITE_LABEL": false
  },
  "customLimits": {
    "maxSimulationsPerMonth": 100,
    "maxExportsPerMonth": 50
  }
}
```

---

## 4. SPÉCIFICATIONS DÉTAILLÉES

### 4.1 TabSynthese.tsx

#### 4.1.1 Props
```typescript
interface TabSyntheseProps {
  clientId: string
  client: ClientDetail
}
```

#### 4.1.2 Sections
1. **En-tête** : Nom client, date dernière MAJ, bouton Actualiser
2. **Patrimoine** : 3 cartes (Brut, Net, Répartition graphique)
3. **Budget** : 4 métriques (Revenus, Charges, Épargne, Endettement)
4. **Objectifs & Projets** : Liste avec priorités et échéances
5. **Indicateurs** : Capacité emprunt estimée + teasers premium
6. **Alertes** : Badges colorés selon sévérité
7. **Actions** : Export PDF, Actualiser

#### 4.1.3 États
- `loading` : Chargement initial
- `refreshing` : Actualisation en cours
- `error` : Erreur de chargement

### 4.2 Page SuperAdmin Features

#### 4.2.1 Structure
1. **En-tête** : Nom cabinet, plan actuel, bouton Changer plan
2. **Features Base** : Liste non modifiable (toujours inclus)
3. **Simulateurs** : Toggles ON/OFF
4. **Calculateurs** : Toggles ON/OFF
5. **Modules** : Toggles ON/OFF
6. **Presets** : Boutons pour appliquer rapidement un preset
7. **Historique** : Dernières modifications

#### 4.2.2 Validation
- Vérifier cohérence avec le plan
- Alerter si dépassement des limites du plan
- Log d'audit à chaque modification

### 4.3 FeatureGate.tsx

#### 4.3.1 Props
```typescript
interface FeatureGateProps {
  feature: string           // Code de la feature
  children: React.ReactNode // Contenu si autorisé
  fallback?: React.ReactNode // Contenu si non autorisé
  showTeaser?: boolean      // Afficher teaser upgrade
}
```

#### 4.3.2 Comportement
- Si autorisé : Affiche `children`
- Si non autorisé + `showTeaser` : Affiche carte teaser
- Si non autorisé sans teaser : Affiche `fallback` ou rien

---

## 5. PLAN DE DÉVELOPPEMENT

### Phase 1 : Infrastructure Features (Priorité: Haute) ✅ TERMINÉE

| # | Tâche | Fichier | Statut |
|---|-------|---------|--------|
| 1.1 | Créer config features | `feature-config.ts` | ✅ Terminé |
| 1.2 | Créer presets par plan | `plan-presets.ts` | ✅ Terminé |
| 1.3 | Créer service features | `feature-service.ts` | ✅ Terminé |
| 1.4 | Créer hook useFeatureAccess | `use-feature-access.ts` | ✅ Terminé |
| 1.5 | Créer composant FeatureGate | `FeatureGate.tsx` | ✅ Terminé |
| 1.6 | Créer composant LockedFeatureCard | `LockedFeatureCard.tsx` | ✅ Terminé |
| 1.7 | Créer API route features | `api/advisor/features/route.ts` | ✅ Terminé |
| 1.8 | Créer index exports | `features/index.ts` | ✅ Terminé |

### Phase 2 : SuperAdmin Features (Priorité: Haute) ✅ TERMINÉE

| # | Tâche | Fichier | Statut |
|---|-------|---------|--------|
| 2.1 | API GET/PUT/POST features | `cabinets/[id]/features/route.ts` | ✅ Terminé |
| 2.2 | Page gestion features | `cabinets/[id]/features/page.tsx` | ✅ Terminé |
| 2.3 | Lien dans liste cabinets | `cabinets/page.tsx` | ✅ Terminé |
| 2.4 | Icône Sparkles dans actions | `cabinets/page.tsx` | ✅ Terminé |

### Phase 3 : Tab Synthèse (Priorité: Haute)

| # | Tâche | Fichier | Statut |
|---|-------|---------|--------|
| 3.1 | Service calculs synthèse | `synthesis-service.ts` | ⬜ À faire |
| 3.2 | API synthèse client | `synthesis/route.ts` | ⬜ À faire |
| 3.3 | Composant TabSynthese | `TabSynthese.tsx` | ⬜ À faire |
| 3.4 | Intégrer dans Client360 | `page.tsx` | ⬜ À faire |
| 3.5 | Export PDF synthèse | `export-service.ts` | ⬜ À faire |

### Phase 4 : Intégration Simulateurs (Priorité: Moyenne)

| # | Tâche | Fichier | Statut |
|---|-------|---------|--------|
| 4.1 | Wrapper simulateur Retraite | `retirement/page.tsx` | ⬜ À faire |
| 4.2 | Wrapper simulateur PER | `per-salaries/page.tsx` | ⬜ À faire |
| 4.3 | Wrapper simulateur PER TNS | `per-tns/page.tsx` | ⬜ À faire |
| 4.4 | Wrapper autres simulateurs | Tous | ⬜ À faire |
| 4.5 | Page simulateurs avec filtrage | `simulateurs/page.tsx` | ⬜ À faire |

### Phase 5 : Intégration Calculateurs (Priorité: Moyenne)

| # | Tâche | Fichier | Statut |
|---|-------|---------|--------|
| 5.1 | Wrapper calculateurs | Tous | ⬜ À faire |
| 5.2 | Page calculateurs avec filtrage | `calculateurs/page.tsx` | ⬜ À faire |

### Phase 6 : Finitions Base (Priorité: Basse)

| # | Tâche | Fichier | Statut |
|---|-------|---------|--------|
| 6.1 | Tests E2E synthèse | `synthesis.spec.ts` | ⬜ À faire |
| 6.2 | Tests E2E features | `features.spec.ts` | ⬜ À faire |
| 6.3 | Documentation utilisateur | `README.md` | ⬜ À faire |

### Phase 7 : Pré-remplissage Simulateurs (Priorité: Haute)

| # | Tâche | Fichier | Statut |
|---|-------|---------|--------|
| 7.1 | Service extraction données client | `client-data-extractor.ts` | ⬜ À faire |
| 7.2 | Hook usePrefillData | `use-prefill-data.ts` | ⬜ À faire |
| 7.3 | Intégrer dans simulateur Retraite | `retirement/page.tsx` | ⬜ À faire |
| 7.4 | Intégrer dans simulateur PER | `per-salaries/page.tsx` | ⬜ À faire |
| 7.5 | Intégrer dans simulateur Capacité Emprunt | `capacite-emprunt/page.tsx` | ⬜ À faire |
| 7.6 | Intégrer dans simulateur Succession | `succession/page.tsx` | ⬜ À faire |
| 7.7 | Intégrer dans autres simulateurs | Tous | ⬜ À faire |
| 7.8 | Bouton "Simuler" dans TabSynthese | `TabSynthese.tsx` | ⬜ À faire |

### Phase 8 : Historique Synthèse (Priorité: Moyenne)

| # | Tâche | Fichier | Statut |
|---|-------|---------|--------|
| 8.1 | Modèle Prisma SynthesisSnapshot | `schema.prisma` | ⬜ À faire |
| 8.2 | Migration base de données | `migration.sql` | ⬜ À faire |
| 8.3 | Service snapshot synthèse | `synthesis-snapshot-service.ts` | ⬜ À faire |
| 8.4 | API créer snapshot | `snapshot/route.ts` | ⬜ À faire |
| 8.5 | API lister snapshots | `snapshots/route.ts` | ⬜ À faire |
| 8.6 | Composant comparaison | `SynthesisComparison.tsx` | ⬜ À faire |
| 8.7 | Intégrer dans TabSynthese | `TabSynthese.tsx` | ⬜ À faire |
| 8.8 | Graphique évolution patrimoine | `WealthEvolutionChart.tsx` | ⬜ À faire |

### Phase 9 : Portail Client (Priorité: Moyenne)

| # | Tâche | Fichier | Statut |
|---|-------|---------|--------|
| 9.1 | Layout portail client | `(client)/layout.tsx` | ⬜ À faire |
| 9.2 | Page dashboard client | `client/dashboard/page.tsx` | ⬜ À faire |
| 9.3 | Composant synthèse simplifiée | `ClientSynthesis.tsx` | ⬜ À faire |
| 9.4 | Vue patrimoine client | `ClientWealth.tsx` | ⬜ À faire |
| 9.5 | Vue objectifs client | `ClientObjectives.tsx` | ⬜ À faire |
| 9.6 | Vue rendez-vous client | `ClientAppointments.tsx` | ⬜ À faire |
| 9.7 | API données client (sécurisée) | `api/client/synthesis/route.ts` | ⬜ À faire |
| 9.8 | Gestion accès portail (SuperAdmin) | `portal-access/page.tsx` | ⬜ À faire |

### Phase 10 : Notifications Proactives (Priorité: Moyenne)

| # | Tâche | Fichier | Statut |
|---|-------|---------|--------|
| 10.1 | Modèle Prisma Notification | `schema.prisma` | ⬜ À faire |
| 10.2 | Migration base de données | `migration.sql` | ⬜ À faire |
| 10.3 | Service détection alertes | `alert-detection-service.ts` | ⬜ À faire |
| 10.4 | Service notifications | `notification-service.ts` | ⬜ À faire |
| 10.5 | Job planifié vérification | `cron/check-alerts.ts` | ⬜ À faire |
| 10.6 | API notifications conseiller | `notifications/route.ts` | ⬜ À faire |
| 10.7 | Composant centre notifications | `NotificationCenter.tsx` | ⬜ À faire |
| 10.8 | Intégrer dans header | `Header.tsx` | ⬜ À faire |
| 10.9 | Template email alertes | `email-templates/alert.tsx` | ⬜ À faire |
| 10.10 | Envoi email (optionnel) | `email-service.ts` | ⬜ À faire |

### Phase 11 : Tests & Documentation Finale (Priorité: Basse)

| # | Tâche | Fichier | Statut |
|---|-------|---------|--------|
| 11.1 | Tests E2E pré-remplissage | `prefill.spec.ts` | ⬜ À faire |
| 11.2 | Tests E2E historique | `history.spec.ts` | ⬜ À faire |
| 11.3 | Tests E2E portail client | `client-portal.spec.ts` | ⬜ À faire |
| 11.4 | Tests E2E notifications | `notifications.spec.ts` | ⬜ À faire |
| 11.5 | Documentation finale | `README.md` | ⬜ À faire |

---

## 6. SUIVI D'AVANCEMENT

### Légende
- ⬜ À faire
- 🔄 En cours
- ✅ Terminé
- ❌ Bloqué

### Progression globale
| Phase | Description | Tâches | Terminées | % |
|-------|-------------|--------|-----------|---|
| Phase 1 | Infrastructure Features | 8 | 8 | 100% |
| Phase 2 | SuperAdmin Features | 4 | 4 | 100% |
| Phase 3 | Tab Synthèse | 5 | 0 | 0% |
| Phase 4 | Intégration Simulateurs | 5 | 0 | 0% |
| Phase 5 | Intégration Calculateurs | 2 | 0 | 0% |
| Phase 6 | Finitions Base | 3 | 0 | 0% |
| Phase 7 | Pré-remplissage Simulateurs | 8 | 0 | 0% |
| Phase 8 | Historique Synthèse | 8 | 0 | 0% |
| Phase 9 | Portail Client | 8 | 0 | 0% |
| Phase 10 | Notifications Proactives | 10 | 0 | 0% |
| Phase 11 | Tests & Documentation | 5 | 0 | 0% |
| **TOTAL** | | **66** | **12** | **18%** |

### Journal des modifications
| Date | Phase | Tâche | Statut | Notes |
|------|-------|-------|--------|-------|
| 25/11/2025 | - | Création CDC | ✅ | Document initial |
| 25/11/2025 | - | Ajout améliorations 1,3,4,5 au scope | ✅ | v1.1 - 66 tâches total |
| 25/11/2025 | 1 | Phase 1 terminée | ✅ | 8 fichiers créés |
| 25/11/2025 | 2 | Phase 2 terminée | ✅ | API + Page SuperAdmin |
| 25/11/2025 | 3 | Début Phase 3 | 🔄 | Tab Synthèse |

---

## 7. AMÉLIORATIONS FUTURES (Hors scope v1.1)

> **Note** : Les améliorations 1, 3, 4, 5 ont été intégrées au scope v1.1

### 7.1 Court terme (après v1.1)
| Amélioration | Description | Impact |
|--------------|-------------|--------|
| Sauvegarde simulations | Historique des simulations par client | ⭐⭐⭐⭐ |
| Scoring santé financière | Score global 0-100 | ⭐⭐⭐⭐ |
| Comparaison clients | Benchmark par segment | ⭐⭐⭐ |

### 7.2 Moyen terme
| Amélioration | Description | Impact |
|--------------|-------------|--------|
| Recommandations IA | Suggestions personnalisées ML | ⭐⭐⭐⭐⭐ |
| Rapport PDF avancé | Mise en page professionnelle | ⭐⭐⭐ |
| Agenda intégré | Synchronisation calendrier | ⭐⭐⭐ |

### 7.3 Long terme
| Amélioration | Description | Impact |
|--------------|-------------|--------|
| API partenaires | Récupération données externes | ⭐⭐⭐⭐ |
| Agrégation bancaire | Données temps réel | ⭐⭐⭐⭐⭐ |
| Open Banking | Synchronisation automatique | ⭐⭐⭐⭐⭐ |
| Signature électronique | Intégration DocuSign/Yousign | ⭐⭐⭐⭐ |

---

## 8. ANNEXES

### 8.1 Glossaire
| Terme | Définition |
|-------|------------|
| Feature | Fonctionnalité activable/désactivable |
| Teaser | Aperçu d'une feature premium pour inciter à l'upgrade |
| Gate | Mécanisme de restriction d'accès |
| Preset | Configuration prédéfinie par plan |

### 8.2 Références
- Prisma schema : `/prisma/schema.prisma`
- API existante plans : `/api/superadmin/organizations/[id]/plan`
- Calculateurs existants : `/app/_common/lib/services/calculators/`

---

**Document maintenu par l'équipe de développement Aura CRM**
