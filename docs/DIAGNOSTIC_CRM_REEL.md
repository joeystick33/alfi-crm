# Diagnostic CRM Aura — État Réel au 07/03/2026

> Audit honnête : ce qui marche, ce qui est cassé, ce qui manque.

---

## 🔴 PROBLÈMES CRITIQUES (bloquants pour l'utilisateur)

### 1. Le système IA Agent V2 est cassé (47 erreurs TypeScript)

**Impact** : L'interface IA (panneau AURA) ne fonctionne pas correctement. Les outils de l'agent (recherche clients, analyse patrimoine, création tâches, navigation...) sont inutilisables.

**Fichiers cassés** :
| Fichier | Erreurs | Problème |
|---------|---------|----------|
| `agent-workflows.ts` | 10 | Workflows agent inaccessibles |
| `agent-runtime.ts` | 9 | Runtime V2 cassé |
| `rag-legal-connector.ts` | 11 | Connecteur juridique RAG inutilisable |
| `tool-access-layer.ts` | 5 | Couche d'accès aux outils cassée |
| `aura-pipeline.ts` | 5 | Pipeline AURA V1 cassé |
| `agent-orchestrator.ts` | 4 | Orchestrateur agent cassé |
| `useAIv2.ts` | 3 | Hook frontend IA — `connectionMode` manquant |
| `validation-engine.ts` | 3 | Validation des réponses IA cassée |
| `provider-adapter.ts` | 2 | Adaptateur providers IA cassé |
| `agent-tools-extended.ts` | 3 | Outils étendus de l'agent cassés |
| `agent-tools.ts` | 2 | Outils de base cassés |

**Conséquence** : Même si l'interface `AIChatPanel` s'affiche, l'agent ne peut pas exécuter de vraies actions. Les slash commands (`/bilan`, `/fiscalite`, etc.) ne fonctionnent pas réellement.

---

### 2. Le module Entretien STT a 1 bug + n'est PAS dans la navigation

**Bug** : `useAutoDiarization.ts` — erreur de type `Float32Array` (ligne 296). La diarisation automatique ne compile pas.

**Navigation manquante** : La page `/dashboard/entretiens` existe et est fonctionnelle côté UI, MAIS elle n'apparaît **nulle part dans la navigation** (`FlatNavigation.tsx`). L'utilisateur ne peut pas la trouver sans taper l'URL manuellement.

**État réel du module** :
- ✅ Page liste entretiens (`/dashboard/entretiens`) — UI fonctionnelle
- ✅ Page nouvel entretien (`/dashboard/entretiens/nouveau`) — Wizard 5 étapes complet
- ✅ Hook STT navigateur (`useSpeechToText`) — fonctionnel (Web Speech API)
- ✅ Hook suggestions IA (`useAISuggestions`) — fonctionnel
- ❌ Hook diarisation auto (`useAutoDiarization`) — bug compilation
- ⚠️ Whisper backend — nécessite clé API GROQ_API_KEY
- ⚠️ Traitement IA post-RDV — dépend du système agent V2 (cassé)
- ❌ **Non accessible via la navigation**

---

### 3. Routes API backend cassées (21 erreurs)

Plusieurs API routes ont des erreurs TypeScript qui peuvent causer des 500 en production :

| Route | Erreur |
|-------|--------|
| `/api/advisor/ai/v2/background` | `userId` n'existe pas sur `AuthContext` |
| `/api/advisor/ai/v2/connections` | Type `AIProviderType` incompatible |
| `/api/advisor/ai/v2/sessions` | Type JSON incompatible |
| `/api/advisor/clients/[id]/actifs` | LogContext type mismatch |
| `/api/advisor/dossiers/[id]/generate-pdf` | `logo` n'existe pas |
| `/api/public/booking/[slug]/book` | `conseillerPrincipalId` inexistant, `NotificationType` invalide |
| Plusieurs routes | `LogContext` type mismatch (6 occurrences) |

---

## 🟡 PROBLÈMES MODÉRÉS

### 4. Simulateur Succession — 20 erreurs Chakra UI
Les composants Steps/Wizard du simulateur de succession utilisent `boxSize` (Chakra UI) qui n'est plus compatible. Purement visuel mais le simulateur peut crasher.

### 5. Services backend divers
- `pdf-generator.ts` — 1 erreur
- `prisma-middleware.ts` — 1 erreur
- `bilan-premium.renderer.ts` — lié au PDF
- `cabinet-service.ts` — 1 erreur
- `client-permissions.ts` — 1 erreur

---

## 🟢 CE QUI FONCTIONNE

### Pages existantes (120+ pages)
Le CRM a énormément de pages déjà construites :

**Clients** : Liste, détail 360°, archives, nouveau client, opportunités
**Patrimoine** : Actifs, passifs, contrats, arbitrages, performance, comparateur
**Calculateurs** : Budget, capacité emprunt, donation, IFI, IR, plus-values, succession
**Simulateurs** (25+) : AV, emprunt, donation, épargne, PER, PTZ, retraite, immobilier (13 sous-simulateurs : LMNP, LMP, SCPI, Pinel, Malraux, etc.)
**Organisation** : Agenda, tâches, emails
**Conformité** : Dashboard, alertes, contrôles, documents, réclamations, timeline
**Dossiers** : Liste, détail, Kanban, archives, nouveau
**Management** : Dashboard, actions, conseillers, facturation, objectifs, réunions
**Opérations** : Affaires nouvelles, en cours, gestion, pilotage
**Paramètres** : Profil, sécurité, notifications, templates, IA connections, IA profiles, assistant, abonnement, accès, users
**Entretiens** : Liste, nouveau, détail (mais pas dans la nav !)
**Campagnes** : Liste, actives
**Prospects** : Liste, archives
**Facturation** : Liste, nouveau, détail

### Hooks et services fonctionnels
- Authentification JWT fallback ✅
- CRUD complet clients, actifs, passifs, contrats ✅
- Budget (revenus/dépenses) ✅
- Moteur d'audit patrimonial V3 (synchrone) ✅
- Rules fiscales centralisées (RULES) ✅
- Adresse autocomplete (BAN) ✅

---

## PRIORITÉS DE CORRECTION

### Option A — Réparer l'IA (47 erreurs agent + 3 hook + 21 routes)
Rendre le panneau IA AURA fonctionnel avec les vrais outils agent.
**Effort estimé** : ~2-3 heures
**Impact** : L'IA passe de "décoratif" à "fonctionnel"

### Option B — Réparer et connecter le module Entretien STT
1. Fixer le bug diarisation (1 erreur)
2. Ajouter "Entretiens" dans la navigation
3. S'assurer que le wizard complet fonctionne de bout en bout
**Effort estimé** : ~30 min
**Impact** : Module STT accessible et utilisable

### Option C — Nettoyer les routes API cassées (21 erreurs)
Fixer les types LogContext, AuthContext, AIProviderType.
**Effort estimé** : ~1 heure
**Impact** : Les API ne crashent plus

### Option D — Tout (A + B + C + succession)
**Effort estimé** : ~4-5 heures

---

## Résumé en chiffres

```
Pages frontend existantes :     120+
Erreurs TypeScript totales :    113
  → Système agent/IA :           47  (le plus critique)
  → Routes API :                 21
  → Simulateur succession :      20
  → RAG :                        13
  → Divers :                     12

Navigation manquante :
  → /dashboard/entretiens        (pas dans FlatNavigation)
  → /dashboard/conformite        (pas dans FlatNavigation)
  → /dashboard/operations        (pas dans FlatNavigation)
  → /dashboard/pilotage          (pas dans FlatNavigation)
  → /dashboard/management        (pas dans FlatNavigation)
  → /dashboard/facturation       (pas dans FlatNavigation)
  → /dashboard/patrimoine        (pas dans FlatNavigation)
  → /dashboard/campagnes         (pas dans FlatNavigation)
```
