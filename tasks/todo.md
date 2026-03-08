# Task Tracker

> Updated: 2025-03-02

---

# AUDIT INTÉGRAL — Rapport & Plan d'Action

## Résumé Exécutif

Le codebase est **massif** (~900+ fichiers advisor, 80+ services, 39+ pages dashboard).
La majorité des pages sont **fonctionnelles** avec de vraies API calls, CRUD, filtres, stats.
Cependant, plusieurs problèmes critiques ont été identifiés.

---

## PROBLÈMES CRITIQUES (à corriger immédiatement)

### C1. `mes-actions/page.tsx` — Modal création **CASSÉE**
- Le formulaire "Nouvelle Action" utilise des `<select>` et `<Input>` **sans state binding**
- Le bouton "Créer" n'appelle **jamais** `createActionMutation`
- → **Coquille vide** : l'UI s'affiche mais rien ne se passe au submit

### C2. `reclamations/page.tsx` — Select cassé (lignes 160-171)
- Utilise `<Select>` Radix avec des `<option>` enfants natifs au lieu de `SelectTrigger/SelectContent/SelectItem`
- → Les dropdowns de filtre **ne fonctionnent pas**

### C3. AURA Chat — Branding "Agent IA" au lieu de "AURA"
- Le header du panel dit "Agent IA" partout
- L'utilisateur veut que le surnom soit **AURA**
- Le bouton sidebar dit "Assistant IA" au lieu de "AURA"

### C4. AURA — Pas de mode proactif
- L'IA ne prend **jamais** l'initiative de converser
- Pas de notifications proactives, pas de "bonjour" automatique au login
- L'utilisateur veut une IA **force de proposition** qui engage la conversation

### C5. RAG — Mention "RAG interne" visible
- Le code contient des références "RAG" visibles dans les logs et potentiellement dans l'UI
- L'utilisateur veut **zéro mention** de "RAG interne"

---

## PROBLÈMES MAJEURS (à corriger)

### M1. Prompts LLM — Non optimisés pour le domaine CGP
- Les prompts système dans `ai-service.ts` et `agent-orchestrator.ts` sont génériques
- Pas de persona AURA spécialisée dans les system prompts
- Le RAG embarqué (`cgp-rag-knowledge.ts`) est bon mais pourrait être plus riche

### M2. AIChatPanel — UX améliorable
- Pas de FAB (Floating Action Button) pour accéder à AURA en un clic
- Le panel est caché derrière ⌘I ou le bouton sidebar
- Pas d'animation d'entrée engageante

### M3. Vocal — STT basique via Web Speech API
- Fonctionne mais pas de fallback serveur (Whisper)
- TTS via `speechSynthesis` natif = voix robotique

---

## PAGES AUDITÉES — Statut

### Pages fonctionnelles (✅ API + CRUD + UI complète) :
- dashboard/page.tsx (hub principal, KPIs)
- clients/page.tsx, clients/[id]/page.tsx, clients/nouveau/page.tsx
- clients/archives/page.tsx, clients/actions/page.tsx, clients/opportunites/page.tsx
- opportunites/page.tsx (Kanban pipeline complet)
- taches/page.tsx (Kanban + liste, CRUD)
- apporteurs/page.tsx (CRUD complet)
- conseillers/page.tsx (CRUD + modals)
- prospects/page.tsx (grid/list + conversion)
- campagnes/page.tsx, campagnes/actives/page.tsx
- scenarios/page.tsx (table + stats)
- kyc/page.tsx (dashboard compliance)
- reclamations/page.tsx (SLA + actions) — **sauf filtres Select cassés**
- conformite/page.tsx + sous-pages
- entretiens/nouveau/page.tsx (wizard 5 étapes)
- entretiens/[id]/page.tsx
- documents/page.tsx + signature + templates
- dossiers/page.tsx + kanban + [id] + new + archives
- emails/page.tsx
- agenda/page.tsx
- activity/page.tsx
- pilotage/page.tsx + portefeuille
- calculateurs/* (7 calculateurs)
- simulateurs/* (10+ simulateurs)
- operations/* (4 sous-pages)
- settings/* (11 sous-pages)

### Pages avec bugs :
- **mes-actions/page.tsx** — Modal création non fonctionnelle (C1)
- **reclamations/page.tsx** — Select natifs au lieu de Radix (C2)

---

## SERVICES AUDITÉES — Statut

### RAG (✅ Complet et sophistiqué) :
- `rag-service.ts` — Orchestrateur V3 multi-niveau
- `rag-knowledge-base.ts` — Base TF-IDF
- `rag-query-engine.ts` — Analyse de requête
- `rag-web-search.ts` — Tavily/Serper avec 40+ domaines de confiance
- `rag-legal-connector.ts` — Legifrance, BOFIP
- `rag-chunks-core.ts` + `rag-chunks-pro.ts` — Chunks spécialisés
- `rag-sources-registry.ts` — Registre de sources
- `cgp-rag-knowledge.ts` — Base de connaissances CGP embarquée

### Agent (✅ Architecture solide) :
- `agent-orchestrator.ts` — ReAct pattern avec mémoire
- `agent-memory.ts` — Mémoire persistante
- `agent-tools.ts` — Outils CRM (recherche, tâches, RDV, navigation)

### AURA (✅ Modules créés) :
- `aura-config.ts` — Config modèles et routing
- `aura-models.ts` — Multi-model router OpenAI + Mistral
- `aura-budget.ts` — Token budget tracking
- `aura-background.ts` — Scan CRON proactif
- `aura-pipeline.ts` — Pipeline post-meeting

---

## PLAN D'ACTION (par priorité)

- [x] **FIX C1** — mes-actions : connecter le formulaire au state + mutation API ✅
- [x] **FIX C2** — reclamations : remplacer les <option> par SelectTrigger/SelectContent/SelectItem ✅
- [x] **FIX C3** — Rebranding "Agent IA" → "AURA" partout (panel, sidebar, prompts, useAI type) ✅
- [x] **FIX C4** — AURA proactif : FAB flottant + auto-greeting toast au login ✅
- [x] **FIX C5** — Supprimer toute mention "RAG" visible dans l'UI ✅
- [x] **FIX C6** — ma-facturation : formulaire "Créer brouillon" connecté au state + mutation ✅
- [x] **FIX C7** — management/reunions : formulaire "Créer" connecté au state + mutation ✅
- [x] **FIX C8** — AIProvider/AIStatus types nettoyés (ollama → openai) ✅
- [x] **FIX C9** — Fichiers artifacts (.tsx.new) supprimés ✅
- [x] **FIX C10** — kyc/controles : 3 Select Radix cassés (option → SelectItem) ✅
- [x] **FIX C11** — kyc/manquants : 2 Select Radix cassés (option → SelectItem + imports) ✅
- [x] **AUDIT** — Scan complet formulaires, Radix Select, routes sidebar, imports, stubs — tout OK ✅
- [x] **FIX M1** — Enrichir les prompts système avec persona AURA spécialisée CGP ✅
- [x] **FIX M2** — Améliorer la voix TTS (premium voice selection cascade) ✅
- [x] **FIX M3** — lessons.md mis à jour avec patterns audit ✅

---

## Completed (previous sessions)

- [x] AURA Architecture — foundational modules
- [x] AURA API routes (background CRON, budget status)
- [x] AURA integration into ai-service.ts
- [x] API keys integration (.env.local) + Ollama cleanup
- [x] Workflow orchestration rules
