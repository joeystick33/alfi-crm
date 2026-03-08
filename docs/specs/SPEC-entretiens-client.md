# SPEC — Module "Mes Entretiens" (remplacement de "Mes Dossiers")

> **Version** : 1.0  
> **Date** : 2025-02-19  
> **Auteur** : Cascade AI  
> **Statut** : Draft — En attente de validation

---

## 1. Objectif

Remplacer intégralement la section **"Mes Dossiers"** (`/dashboard/dossiers/`) par un module **"Mes Entretiens"** (`/dashboard/entretiens/`) permettant aux conseillers en gestion de patrimoine (CGP) de :

1. **Enregistrer en temps réel** un entretien client via Speech-to-Text (STT)
2. **Diariser** la conversation (distinguer conseiller vs client/prospect)
3. **Visualiser et éditer** la transcription en temps réel
4. **Traiter la transcription via IA** pour produire :
   - **Choix 1** : Un résumé structuré de l'entretien
   - **Choix 2** : Un bilan patrimonial basé sur les éléments recueillis
5. **Enregistrer** les données dans le dossier client existant ou créer un nouveau prospect
6. **Exporter en PDF** le résumé ou le bilan pour restitution au client
7. **Respecter la vie privée** : l'audio n'est jamais sauvegardé, seul le texte est conservé

---

## 2. Contexte technique

### 2.1 Stack existante
- **Framework** : Next.js 14 (App Router)
- **Frontend** : React 18, TailwindCSS, shadcn/ui, Lucide icons
- **Backend** : API Routes Next.js, Prisma ORM, PostgreSQL
- **IA** : Ollama (llama3.2:3b local) avec RAG, service centralisé `ai-service.ts`
- **Auth** : Session-based avec `requireAuth()`, multi-tenant (`cabinetId`)

### 2.2 Inspiration Murmure
[Murmure](https://github.com/Kieirra/murmure) est une app desktop STT locale utilisant NVIDIA Parakeet TDT 0.6B v3. On s'en inspire pour :
- **Philosophie privacy-first** : tout le traitement STT se fait dans le navigateur (Web Speech API) ou via un serveur Whisper local
- **UX minimaliste** : overlay de visualisation audio, feedback temps réel
- **Post-processing LLM** : correction grammaticale et mise en forme via l'IA locale (Ollama)

### 2.3 Approche STT choisie

| Couche | Technologie | Usage |
|--------|------------|-------|
| **Temps réel (primaire)** | `Web Speech API` (navigateur) | Transcription live pendant l'entretien, gratuit, aucune dépendance serveur |
| **Fallback / correction** | Whisper via Ollama ou API locale | Post-traitement audio pour correction qualité si Web Speech API indisponible |
| **Diarisation** | Heuristique front-end | Le conseiller attribue manuellement les segments via un bouton toggle "Moi / Client" ou via détection de pause + alternance |
| **Post-processing** | Ollama llama3.2:3b | Résumé, bilan patrimonial, correction grammaticale, extraction d'informations structurées |

> **Note** : La Web Speech API fonctionne nativement dans Chrome/Edge. Pour Firefox/Safari, un fallback sera prévu (enregistrement audio → envoi au backend Whisper).

---

## 3. Modèle de données (Prisma)

### 3.1 Nouveau modèle `Entretien`

```prisma
// ============================================
// MODULE : Entretiens Client (Speech-to-Text)
// ============================================

enum EntretienStatus {
  EN_COURS        // Enregistrement en cours
  TRANSCRIT       // Transcription terminée, en attente de traitement
  TRAITE          // Traitement IA effectué (résumé ou bilan)
  FINALISE        // Validé et sauvegardé dans le dossier client
  ARCHIVE         // Archivé
}

enum EntretienType {
  DECOUVERTE          // Premier entretien prospect
  SUIVI_PERIODIQUE    // Suivi annuel / semestriel
  BILAN_PATRIMONIAL   // Bilan complet
  CONSEIL_PONCTUEL    // Conseil sur un sujet précis
  SIGNATURE           // Rendez-vous de signature
  AUTRE
}

enum TraitementType {
  RESUME              // Résumé structuré de l'entretien
  BILAN_PATRIMONIAL   // Bilan patrimonial extrait
}

model Entretien {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Multi-tenant
  cabinetId String
  cabinet   Cabinet @relation(fields: [cabinetId], references: [id], onDelete: Cascade)

  // Conseiller qui mène l'entretien
  conseillerId String
  conseiller   User @relation("ConseillerEntretiens", fields: [conseillerId], references: [id], onDelete: Restrict)

  // Client ou prospect (nullable si prospect pas encore créé)
  clientId String?
  client   Client? @relation(fields: [clientId], references: [id], onDelete: SetNull)

  // Métadonnées de l'entretien
  titre       String            // Titre auto-généré ou personnalisé
  type        EntretienType     @default(DECOUVERTE)
  status      EntretienStatus   @default(EN_COURS)
  duree       Int?              // Durée en secondes
  dateEntretien DateTime        @default(now())

  // Consentement RGPD
  consentementRecueilli  Boolean  @default(false)
  consentementDate       DateTime?
  consentementTexte      String?  @db.Text // Texte exact du consentement affiché

  // Prospect (si pas encore client)
  prospectNom    String?
  prospectPrenom String?
  prospectEmail  String?
  prospectTel    String?

  // Transcription complète (seul élément sauvegardé — PAS l'audio)
  transcription Json? // Array<TranscriptionSegment>
  // Structure TranscriptionSegment :
  // {
  //   id: string,
  //   speaker: 'conseiller' | 'client',
  //   text: string,
  //   timestamp: number (ms depuis début),
  //   confidence: number (0-1),
  //   edited: boolean
  // }

  transcriptionBrute String? @db.Text // Texte brut complet (backup)

  // Résultat du traitement IA
  traitementType    TraitementType?
  traitementResultat Json?  // Structure dépend du type :
  // RESUME → { objet, pointsCles[], decisions[], actionsASuivre[], synthese }
  // BILAN_PATRIMONIAL → { situationFamiliale, patrimoine, revenus, fiscalite, objectifs, preconisations[] }

  traitementDate    DateTime?
  traitementPrompt  String?  @db.Text // Prompt utilisé (pour audit/debug)

  // Données extraites (structurées par l'IA)
  donneesExtraites Json? // Données patrimoniales structurées extraites de la conversation

  // Synchronisation avec le dossier client
  syncAvecClient     Boolean   @default(false)
  syncDate           DateTime?
  champsModifies     Json?     // Liste des champs client mis à jour

  // Export PDF
  pdfGenere     Boolean   @default(false)
  pdfUrl        String?
  pdfGenereDate DateTime?

  // Notes du conseiller (post-entretien)
  notesConseiller String? @db.Text

  // Tags et recherche
  tags String[]

  @@index([cabinetId, conseillerId])
  @@index([cabinetId, clientId])
  @@index([cabinetId, status])
  @@index([cabinetId, dateEntretien])
  @@map("entretiens")
}
```

### 3.2 Relations à ajouter

```prisma
// Dans model Cabinet, ajouter :
entretiens Entretien[]

// Dans model User, ajouter :
entretiens Entretien[] @relation("ConseillerEntretiens")

// Dans model Client, ajouter :
entretiens Entretien[]
```

---

## 4. Architecture API

### 4.1 Routes Backend

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/advisor/entretiens` | Liste des entretiens (filtres: status, clientId, dateRange, search) |
| `POST` | `/api/advisor/entretiens` | Créer un nouvel entretien |
| `GET` | `/api/advisor/entretiens/:id` | Détail d'un entretien |
| `PATCH` | `/api/advisor/entretiens/:id` | Mettre à jour (transcription, status, notes) |
| `DELETE` | `/api/advisor/entretiens/:id` | Supprimer un entretien |
| `POST` | `/api/advisor/entretiens/:id/traiter` | Lancer le traitement IA (résumé ou bilan) |
| `POST` | `/api/advisor/entretiens/:id/sync-client` | Synchroniser les données vers le dossier client |
| `POST` | `/api/advisor/entretiens/:id/pdf` | Générer et télécharger le PDF |
| `GET` | `/api/advisor/entretiens/stats` | Statistiques (nb entretiens, durée moyenne, etc.) |

### 4.2 Route de traitement IA `/api/advisor/entretiens/:id/traiter`

```typescript
// POST body :
{
  type: 'RESUME' | 'BILAN_PATRIMONIAL',
  transcription: TranscriptionSegment[], // Envoyée depuis le front
}

// Logique :
// 1. Récupérer l'entretien
// 2. Construire le prompt spécialisé selon le type
// 3. Appeler aiCapability() avec le prompt
// 4. Parser le résultat JSON
// 5. Sauvegarder dans traitementResultat
// 6. Si BILAN_PATRIMONIAL → extraire les données structurées dans donneesExtraites
// 7. Retourner le résultat
```

---

## 5. Pages Frontend

### 5.1 Structure des routes

```
/dashboard/entretiens/                  → Liste des entretiens
/dashboard/entretiens/nouveau           → Wizard nouvel entretien
/dashboard/entretiens/:id               → Détail d'un entretien (transcription + résultat)
/dashboard/entretiens/:id/traitement    → Wizard de traitement post-entretien
```

### 5.2 Sidebar Navigation (remplacement)

```typescript
// AVANT (dans NavigationSidebar.tsx) :
{
  name: 'Mes dossiers',
  icon: FolderOpen,
  children: [
    { name: 'Vue liste', href: '/dashboard/dossiers', icon: Layers },
    { name: 'Vue Kanban', href: '/dashboard/dossiers/kanban', icon: Kanban },
    { name: 'Dossiers archivés', href: '/dashboard/dossiers/archives', icon: Archive },
  ]
}

// APRÈS :
{
  name: 'Mes entretiens',
  icon: Mic,
  children: [
    { name: 'Tous les entretiens', href: '/dashboard/entretiens', icon: List },
    { name: 'Nouvel entretien', href: '/dashboard/entretiens/nouveau', icon: Plus },
  ]
}
```

---

## 6. Flux utilisateur détaillé

### 6.1 Wizard "Nouvel Entretien" — 5 étapes

#### Étape 1 : Configuration
- **Sélection du client** : Recherche parmi les clients existants (autocomplete)
- **OU Nouveau prospect** : Formulaire rapide (nom, prénom, email, téléphone)
- **Type d'entretien** : Découverte, Suivi, Bilan patrimonial, Conseil ponctuel, Signature, Autre
- **Titre** : Auto-généré (`"Entretien découverte — Jean Dupont — 19/02/2025"`) mais modifiable

#### Étape 2 : Consentement
- Affichage d'un texte de consentement RGPD :
  > "Cet entretien sera transcrit en texte à l'aide d'un outil de reconnaissance vocale. L'enregistrement audio ne sera pas conservé. Seule la transcription textuelle sera sauvegardée pour le suivi de votre dossier. Vous pouvez demander la suppression de cette transcription à tout moment."
- **Checkbox obligatoire** : "Le client/prospect a donné son consentement oral"
- **Horodatage** automatique du consentement
- **Impossible de passer à l'étape suivante** sans consentement coché

#### Étape 3 : Enregistrement & Transcription en temps réel
- **Interface d'enregistrement** :
  - Bouton START / PAUSE / STOP
  - Visualiseur audio (waveform animée, inspirée de Murmure)
  - Timer de durée écoulée
  - Indicateur de statut STT (actif / en pause / erreur)
- **Toggle speaker** : Bouton bascule `Conseiller ↔ Client` pour la diarisation
  - Par défaut, commence sur "Conseiller"
  - Le conseiller clique pour basculer quand le client parle (et inversement)
  - Alternative : raccourci clavier `Espace` pour toggle
- **Transcription temps réel** :
  - Panel scrollable affichant les segments en temps réel
  - Chaque segment est coloré selon le speaker :
    - **Conseiller** : bulle bleue (à droite, style chat)
    - **Client** : bulle grise (à gauche)
  - Horodatage relatif affiché (00:03:24)
  - Édition inline possible (clic sur un segment → mode édition)
- **Sauvegarde automatique** toutes les 30s (transcription partielle envoyée au backend)
- **Gestion des erreurs STT** : Si la Web Speech API échoue, afficher un message et proposer la saisie manuelle

#### Étape 4 : Révision de la transcription
- Affichage complet de la transcription avec diarisation
- Possibilité de :
  - **Éditer** chaque segment (correction d'erreurs STT)
  - **Changer le speaker** d'un segment (si mal attribué)
  - **Supprimer** un segment
  - **Fusionner** deux segments consécutifs du même speaker
  - **Ajouter** une note manuelle
- Bouton **"Corriger avec l'IA"** : envoie la transcription à Ollama pour correction grammaticale et orthographique (sans modifier le sens)

#### Étape 5 : Traitement — Choix 1 ou 2
- **Choix 1 : Résumé de l'entretien**
  - L'IA analyse la transcription et produit :
    - **Objet** de l'entretien
    - **Points clés** abordés (liste structurée)
    - **Décisions prises**
    - **Actions à suivre** (avec responsable : conseiller ou client)
    - **Synthèse** narrative (2-3 paragraphes)
  - Le conseiller peut éditer le résumé avant validation
  - Export PDF disponible

- **Choix 2 : Bilan patrimonial**
  - L'IA extrait de la conversation :
    - **Situation familiale** : état civil, enfants, régime matrimonial
    - **Patrimoine** : immobilier, financier, professionnel, dettes
    - **Revenus** : salaires, revenus fonciers, BIC/BNC, pensions
    - **Fiscalité** : TMI estimé, IFI, dispositifs en place
    - **Objectifs** : retraite, transmission, protection, investissement
    - **Préconisations préliminaires** : suggestions basées sur le profil
  - Chaque champ est éditable par le conseiller
  - **Bouton "Enregistrer dans le dossier client"** :
    - Affiche un diff de ce qui va changer dans la fiche client
    - Le conseiller valide champ par champ
    - Les données sont sauvegardées via PATCH `/api/advisor/clients/:id`
  - Export PDF disponible

### 6.2 Export PDF

Structure du PDF généré :
- **En-tête** : Logo cabinet, nom du conseiller, date
- **Informations client** : Nom, prénom, coordonnées
- **Type d'entretien** et durée
- **Contenu** : Résumé OU Bilan patrimonial (selon le choix)
- **Actions à suivre** (si résumé)
- **Préconisations** (si bilan)
- **Mentions légales** et consentement
- **Pied de page** : Coordonnées cabinet, mention RGPD

---

## 7. Intégration IA — Prompts spécialisés

### 7.1 Nouvelle capability : `'entretien-resume'`

```typescript
'entretien-resume': `Tu es un assistant spécialisé dans la synthèse d'entretiens patrimoniaux pour un cabinet de gestion de patrimoine (CGP).

Tu reçois la transcription complète d'un entretien entre un conseiller et un client/prospect. Chaque segment est identifié par le locuteur (CONSEILLER ou CLIENT).

Ton rôle : produire un résumé structuré, professionnel et fidèle à la conversation.

IMPORTANT :
- Ne jamais inventer d'information non mentionnée dans la transcription
- Distinguer clairement ce qui a été dit par le client vs les recommandations du conseiller
- Identifier les engagements pris et les prochaines étapes
- Utiliser un vocabulaire professionnel CGP

Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  "objet": "string — objet principal de l'entretien",
  "pointsCles": ["string — chaque point clé abordé"],
  "decisions": ["string — chaque décision prise"],
  "actionsASuivre": [
    { "action": "string", "responsable": "conseiller | client", "echeance": "string | null" }
  ],
  "synthese": "string — synthèse narrative de 2-3 paragraphes",
  "motifsAlerte": ["string — tout élément nécessitant une attention particulière (KYC, compliance, etc.)"]
}
${FISCAL_CONTEXT_2025}`
```

### 7.2 Nouvelle capability : `'entretien-bilan'`

```typescript
'entretien-bilan': `Tu es un expert CGP senior avec 20 ans d'expérience. Tu analyses la transcription d'un entretien client pour en extraire un bilan patrimonial structuré.

Tu reçois la transcription complète d'un entretien entre un conseiller et un client/prospect. Chaque segment est identifié par le locuteur.

Ton rôle : extraire TOUTES les informations patrimoniales mentionnées et les structurer de manière exploitable.

RÈGLES STRICTES :
- N'extrais QUE les informations explicitement mentionnées dans la conversation
- Si une information n'est pas mentionnée, mets null (ne devine pas)
- Les montants doivent être en euros, arrondis à l'unité
- Identifie les incertitudes (quand le client hésite ou donne une estimation)
- Propose des préconisations préliminaires basées UNIQUEMENT sur les éléments mentionnés

Réponds UNIQUEMENT en JSON valide :
{
  "situationFamiliale": {
    "etatCivil": "string | null",
    "regimeMatrimonial": "string | null",
    "nombreEnfants": "number | null",
    "agesEnfants": "number[] | null",
    "situationConjoint": "string | null"
  },
  "patrimoine": {
    "immobilier": [{ "type": "string", "valeur": "number", "financement": "string | null", "propriete": "string" }],
    "financier": [{ "type": "string", "montant": "number", "gestionnaire": "string | null" }],
    "professionnel": [{ "type": "string", "valeur": "number | null" }],
    "dettes": [{ "type": "string", "montant": "number", "dureeRestante": "string | null" }],
    "totalBrut": "number | null",
    "totalDettes": "number | null",
    "totalNet": "number | null"
  },
  "revenus": {
    "salaires": "number | null",
    "revenusFonciers": "number | null",
    "revenus BIC_BNC": "number | null",
    "pensions": "number | null",
    "autres": "number | null",
    "totalAnnuel": "number | null"
  },
  "fiscalite": {
    "tmiEstime": "number | null",
    "ifiAssujetti": "boolean | null",
    "dispositifsEnPlace": ["string"],
    "preoccupationsFiscales": ["string"]
  },
  "objectifs": {
    "priorites": ["string — objectifs exprimés par le client"],
    "horizon": "string | null — court/moyen/long terme",
    "preoccupations": ["string — inquiétudes ou points de vigilance exprimés"]
  },
  "preconisationsPreliminaires": [
    {
      "titre": "string",
      "description": "string",
      "priorite": "haute | moyenne | basse",
      "categorie": "fiscalite | epargne | immobilier | succession | retraite | protection"
    }
  ],
  "informationsManquantes": ["string — informations qu'il faudrait collecter lors du prochain RDV"],
  "scoreCompletude": "number — 0 à 100, degré de complétude du bilan"
}
${FISCAL_CONTEXT_2025}`
```

### 7.3 Capability `'entretien-correction'` (correction grammaticale post-STT)

```typescript
'entretien-correction': `Tu es un correcteur spécialisé dans la transcription d'entretiens professionnels.

Tu reçois un texte brut issu d'une reconnaissance vocale (Speech-to-Text). Le texte peut contenir :
- Des erreurs de reconnaissance (mots mal transcrits)
- Des problèmes de ponctuation
- Des phrases incomplètes ou mal coupées

Ton rôle : corriger UNIQUEMENT la forme (grammaire, orthographe, ponctuation) sans JAMAIS modifier le sens ni ajouter d'information.

RÈGLES :
- Préserver le registre de langue utilisé (tutoiement/vouvoiement)
- Ne pas reformuler les phrases (juste corriger)
- Conserver les termes techniques patrimoniaux tels quels
- Si un passage est incompréhensible, le laisser avec la mention [inaudible]
- Retourner le texte corrigé, segment par segment

Réponds en JSON : { "segments": [{ "id": "string", "textCorrige": "string" }] }`
```

---

## 8. Composants Frontend clés

### 8.1 Hook `useSpeechToText`

```typescript
// Encapsule la Web Speech API avec :
// - start() / stop() / pause() / resume()
// - isListening, isSupported, error
// - transcript (texte courant), interimTranscript (en cours de reconnaissance)
// - language: 'fr-FR'
// - continuous: true (pour entretiens longs ~1h)
// - interimResults: true (feedback temps réel)
// - Gestion des reconnexions automatiques (Web Speech API se déconnecte parfois)
```

### 8.2 Hook `useEntretienRecorder`

```typescript
// Orchestre l'enregistrement complet :
// - Gère les segments de transcription
// - Gère le toggle speaker (conseiller/client)
// - Gère l'horodatage relatif
// - Auto-save toutes les 30s
// - Calcule la durée totale
// - Gère les états (idle, recording, paused, stopped)
```

### 8.3 Composant `TranscriptionView`

```typescript
// Affiche la transcription en temps réel :
// - Bulles de chat colorées par speaker
// - Auto-scroll vers le bas
// - Mode édition inline
// - Indicateur de reconnaissance en cours (...)
// - Horodatage relatif sur chaque segment
```

### 8.4 Composant `AudioVisualizer`

```typescript
// Waveform animée (inspirée Murmure) :
// - Utilise Web Audio API (AnalyserNode)
// - Barres verticales animées reflétant le volume micro
// - Couleur selon le speaker actif (bleu/gris)
// - Animation fluide 60fps via requestAnimationFrame
```

### 8.5 Composant `TraitementWizard`

```typescript
// Wizard post-entretien :
// - Choix du type de traitement (résumé / bilan)
// - Loading avec animation pendant le traitement IA
// - Affichage du résultat éditable
// - Actions : Enregistrer dans dossier client / Exporter PDF / Modifier
```

---

## 9. Gestion de la vie privée et conformité RGPD

| Aspect | Règle |
|--------|-------|
| **Audio** | JAMAIS sauvegardé. Traitement temps réel uniquement, buffer mémoire. |
| **Transcription** | Sauvegardée en base (chiffrée si nécessaire). Supprimable sur demande. |
| **Consentement** | Obligatoire AVANT le début de l'enregistrement. Horodaté. |
| **Droit d'accès** | Le client peut demander sa transcription (via le conseiller). |
| **Droit à l'effacement** | Suppression de l'entretien = suppression de toute donnée associée. |
| **Durée de conservation** | Configurable par cabinet (défaut : 3 ans après dernier contact). |
| **Transfert de données** | Aucun transfert hors du serveur. STT dans le navigateur (Web Speech API). |

---

## 10. Fichiers impactés

### 10.1 Fichiers à SUPPRIMER (section Dossiers)

```
app/(advisor)/(frontend)/dashboard/dossiers/          → Tout le dossier
app/(advisor)/(backend)/api/advisor/dossiers/          → Tout le dossier
app/_common/hooks/api/use-dossiers-api.ts              → Fichier
app/_common/lib/services/dossier-service.ts            → Fichier
```

### 10.2 Fichiers à CRÉER (section Entretiens)

```
# Frontend
app/(advisor)/(frontend)/dashboard/entretiens/page.tsx                    → Liste
app/(advisor)/(frontend)/dashboard/entretiens/nouveau/page.tsx            → Wizard nouvel entretien
app/(advisor)/(frontend)/dashboard/entretiens/[id]/page.tsx               → Détail
app/(advisor)/(frontend)/dashboard/entretiens/[id]/traitement/page.tsx    → Wizard traitement
app/(advisor)/(frontend)/dashboard/entretiens/_components/
  TranscriptionView.tsx        → Affichage transcription temps réel
  AudioVisualizer.tsx          → Waveform animée
  SpeakerToggle.tsx            → Bouton toggle conseiller/client
  ConsentementStep.tsx         → Étape consentement
  ConfigurationStep.tsx        → Étape configuration (client + type)
  EnregistrementStep.tsx       → Étape enregistrement
  RevisionStep.tsx             → Étape révision transcription
  TraitementChoix.tsx          → Choix résumé vs bilan
  ResumeView.tsx               → Affichage résumé éditable
  BilanPatrimonialView.tsx     → Affichage bilan éditable
  SyncClientDialog.tsx         → Dialog de synchronisation avec dossier client
  EntretienPdfTemplate.tsx     → Template HTML pour génération PDF

# Hooks
app/_common/hooks/api/use-entretiens-api.ts            → React Query hooks CRUD
app/(advisor)/(frontend)/dashboard/entretiens/_hooks/
  useSpeechToText.ts           → Hook Web Speech API
  useEntretienRecorder.ts      → Hook orchestrateur enregistrement
  useAudioVisualizer.ts        → Hook Web Audio API (waveform)

# Backend
app/(advisor)/(backend)/api/advisor/entretiens/route.ts                   → GET + POST
app/(advisor)/(backend)/api/advisor/entretiens/[id]/route.ts              → GET + PATCH + DELETE
app/(advisor)/(backend)/api/advisor/entretiens/[id]/traiter/route.ts      → POST traitement IA
app/(advisor)/(backend)/api/advisor/entretiens/[id]/sync-client/route.ts  → POST sync
app/(advisor)/(backend)/api/advisor/entretiens/[id]/pdf/route.ts          → POST PDF
app/(advisor)/(backend)/api/advisor/entretiens/stats/route.ts             → GET stats

# Service
app/_common/lib/services/entretien-service.ts          → Service métier Prisma
```

### 10.3 Fichiers à MODIFIER

```
prisma/schema.prisma                                   → Ajouter modèle Entretien + relations
app/(advisor)/(frontend)/components/dashboard/NavigationSidebar.tsx  → Remplacer Dossiers → Entretiens
app/_common/lib/services/ai-service.ts                 → Ajouter capabilities entretien-resume, entretien-bilan, entretien-correction
app/_common/hooks/use-api.ts                           → Remplacer exports dossiers → entretiens
```

---

## 11. Plan d'implémentation (ordre)

| # | Tâche | Priorité | Dépendances |
|---|-------|----------|-------------|
| 1 | Ajouter modèle Prisma `Entretien` + migration | Haute | — |
| 2 | Créer `entretien-service.ts` (CRUD Prisma) | Haute | #1 |
| 3 | Créer routes API backend (CRUD) | Haute | #2 |
| 4 | Créer hooks React Query `use-entretiens-api.ts` | Haute | #3 |
| 5 | Modifier sidebar navigation | Haute | — |
| 6 | Implémenter `useSpeechToText` hook | Haute | — |
| 7 | Implémenter `useAudioVisualizer` hook | Moyenne | — |
| 8 | Implémenter `useEntretienRecorder` hook | Haute | #6 |
| 9 | Créer page liste entretiens | Haute | #4 |
| 10 | Créer wizard nouvel entretien (5 étapes) | Haute | #5, #6, #7, #8 |
| 11 | Ajouter prompts IA dans `ai-service.ts` | Haute | — |
| 12 | Créer route `/traiter` (traitement IA) | Haute | #11 |
| 13 | Créer wizard traitement (résumé + bilan) | Haute | #12 |
| 14 | Créer route `/sync-client` | Haute | #2 |
| 15 | Implémenter `SyncClientDialog` | Haute | #14 |
| 16 | Créer route `/pdf` + template | Moyenne | #12 |
| 17 | Page détail entretien | Moyenne | #4 |
| 18 | Supprimer section Dossiers | Basse | Après validation de tout |
| 19 | Tests TypeScript 0 erreurs | Haute | Tout |

---

## 12. Considérations techniques

### 12.1 Web Speech API — Limitations connues

- **Durée** : Se déconnecte après ~60s de silence ou ~5min continu → reconnexion automatique requise
- **Navigateurs** : Chrome/Edge natif, Firefox/Safari non supporté
- **Précision** : ~85-95% en français, dépend de la qualité micro et de l'accent
- **Solution** : Le hook `useSpeechToText` gère les reconnexions automatiques et les segments en file d'attente

### 12.2 Diarisation — Approche heuristique

La diarisation automatique (distinguer les voix) nécessite des modèles lourds (pyannote, etc.) et n'est pas réalisable côté navigateur. L'approche choisie est **semi-manuelle** :

1. **Toggle manuel** : Le conseiller bascule entre "Moi" et "Client" pendant l'entretien
2. **Raccourci clavier** : `Espace` pour toggle rapide (quand le focus est sur l'interface d'enregistrement)
3. **Détection de pause** : Si silence > 2s, le système suggère un changement de speaker (indicateur visuel)
4. **Correction post-hoc** : En étape de révision, le conseiller peut réattribuer chaque segment

### 12.3 Performance pour entretiens de ~1h

- **Buffer mémoire** : Les segments sont stockés en `useState` avec batch updates
- **Auto-save** : Toutes les 30s, envoi PATCH au backend avec les nouveaux segments uniquement (diff)
- **Pas de streaming audio** : L'audio est traité localement dans le navigateur, seul le texte transite
- **Limite pratique** : ~3600 segments max (1 segment/seconde pendant 1h) ≈ 500KB de JSON → parfaitement gérable

---

## 13. Maquette UX (description textuelle)

### Page liste entretiens
```
┌─────────────────────────────────────────────────────────┐
│ 🎙️ Mes entretiens                    [+ Nouvel entretien]│
├─────────────────────────────────────────────────────────┤
│ 📊 12 entretiens │ ⏱ 45min moy. │ 📝 8 traités │ 🗓 3 cette semaine │
├─────────────────────────────────────────────────────────┤
│ 🔍 Rechercher...    [Status ▾]  [Type ▾]  [Date ▾]     │
├─────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────┐    │
│ │ 📋 Entretien découverte — Jean Dupont            │    │
│ │    19/02/2025 • 52 min • ✅ Traité (Résumé)     │    │
│ │    [Voir] [PDF]                                   │    │
│ └──────────────────────────────────────────────────┘    │
│ ┌──────────────────────────────────────────────────┐    │
│ │ 📋 Suivi annuel — Marie Martin                    │    │
│ │    18/02/2025 • 38 min • ⏳ En attente traitement│    │
│ │    [Voir] [Traiter]                               │    │
│ └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Wizard enregistrement (étape 3)
```
┌─────────────────────────────────────────────────────────┐
│ ● Enregistrement en cours    ⏱ 00:23:45                │
│                                                         │
│ ┌───────────────────────────────────┐                   │
│ │ ▁▃▅▇▅▃▁▃▅▇▅▃▁ (waveform)       │                   │
│ └───────────────────────────────────┘                   │
│                                                         │
│    [⏸ Pause]  [⏹ Terminer]                             │
│                                                         │
│    Speaker actuel : [🧑‍💼 Conseiller ↔ 👤 Client]         │
│                                                         │
│ ┌───────────────── Transcription ──────────────────┐    │
│ │                                                   │    │
│ │  👤 00:00:12 — Bonjour, je suis ravi de vous     │    │
│ │     rencontrer aujourd'hui.                       │    │
│ │                                                   │    │
│ │  🧑‍💼 00:00:18 — Bonjour Monsieur Dupont, merci  │    │
│ │     d'avoir pris le temps de venir. Aujourd'hui   │    │
│ │     nous allons faire un point sur votre          │    │
│ │     patrimoine...                                 │    │
│ │                                                   │    │
│ │  👤 00:01:02 — Oui, alors j'ai actuellement un   │    │
│ │     appartement à Paris dans le 16ème, que j'ai   │    │
│ │     acheté il y a 10 ans pour environ 800 000     │    │
│ │     euros...                                      │    │
│ │                                                   │    │
│ │  ▌ (transcription en cours...)                    │    │
│ └───────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 14. Risques et mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Web Speech API non supportée (Firefox/Safari) | Modéré | Afficher message + proposer saisie manuelle. Prévoir fallback Whisper API. |
| Qualité STT faible (accent, bruit) | Élevé | Correction IA post-hoc + édition manuelle en étape révision |
| Entretien de 1h = volume de texte important | Faible | Architecture par segments, auto-save, buffer mémoire maîtrisé |
| Hallucination IA (bilan patrimonial) | Élevé | Prompt strict "n'extrais QUE ce qui est mentionné" + validation manuelle obligatoire |
| Consentement RGPD | Critique | Étape bloquante dans le wizard, horodatage, texte archivé |
| Perte de connexion pendant l'enregistrement | Modéré | STT 100% local (navigateur), auto-save fréquent, récupération au rechargement |

---

## 15. Métriques de succès

- **Adoption** : 80% des CGP utilisent le module dans le premier mois
- **Qualité STT** : Taux de correction manuelle < 15% des segments
- **Temps gagné** : Réduction de 50% du temps de rédaction post-entretien
- **Complétude bilan** : Score moyen > 60% sur les entretiens de découverte
- **Conformité** : 100% des entretiens avec consentement documenté
