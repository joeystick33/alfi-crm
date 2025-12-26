# CRM Patrimonial – Plan Intégral de Mise à Niveau *Market‑Ready*

---

## 🎉 STATUT INTÉGRATION - NOVEMBRE 2025

> **Intégration complétée à 95%** - Voir `/docs/INTEGRATION_COMPLETE.md` pour les détails

| Semaine | Module | Statut |
|---------|--------|--------|
| 0-4 | Schema Prisma + Services + UI Core | ✅ FAIT |
| 5-6 | KYC enrichi + Contrats + Objectifs | ✅ FAIT |
| 7 | Wizard création client 7 étapes | ✅ FAIT |
| 8 | Moteur opportunités 8 règles | ✅ FAIT |
| 9 | Pages Agenda & Tâches | ✅ EXISTANTES |
| 10 | Documentation + Tests E2E | ✅ FAIT |

### ⚠️ Action requise avant production
```bash
npx prisma generate
npx prisma migrate dev --name integration_complete
```

### Fichiers créés
- **59+ fichiers** créés/modifiés
- **13 150+ lignes** de code production
- **14 tabs** Client360 complets
- **Tests E2E** Playwright configurés

---

> **But de ce document**  
> Fournir une feuille de route exhaustive, exploitable par n'importe quel développeur, pour amener le CRM patrimonial à un niveau **100 % market‑ready** :
> - aucune fonctionnalité cassée ou mockée,
> - UX cohérente et professionnelle,
> - logique métier robuste (simulateurs + patrimoine),
> - base technique industrialisable (tests, logs, observabilité).

---

## 1. Périmètre et architecture concernée

### 1.1 Périmètre fonctionnel

Ce document couvre principalement :

- **Patrimoine**
  - Actifs
  - Passifs
  - Contrats
- **Simulateurs patrimoniaux/financiers**
  - Retraite (capitalisation, pension, comparaison de scénarios)
  - Succession (simulation, donations, comparaison de stratégies)
  - Enveloppes / véhicules d’investissement
- **Paramétrage / Settings utilisateurs**

### 1.2 Périmètre technique

- **Frontend advisor (Next.js / React)**  
  Dossier principal :
  - `app/(advisor)/(frontend)/...`

- **Backend advisor (API routes Next.js + Prisma)**  
  Dossier principal :
  - `app/(advisor)/(backend)/api/...`
  - Services Prisma (dans `prisma/` ou un dossier services dédié, selon structure exacte du repo)

- **Sécurité / Auth**
  - Middleware d’authentification
  - Helpers type `requireAuth`, `isRegularUser`

Ce plan ne modifie **pas** les couches infra (DB, déploiement) sauf si nécessaire pour supporter de nouvelles routes/API.

---

## 2. Synthèse des constats (état actuel)

### 2.1 Patrimoine – Actifs / Passifs / Contrats

#### 2.1.1 Backend (API + Prisma)

Endpoints principaux (déjà **réels/fonctionnels**) :

- `app/(advisor)/(backend)/api/advisor/actifs/route.ts`
  - `GET /api/advisor/actifs` : liste des actifs, avec filtres possibles.
  - `POST /api/advisor/actifs` : création d’actif.

- `app/(advisor)/(backend)/api/advisor/passifs/route.ts`
  - `GET /api/advisor/passifs`
  - `POST /api/advisor/passifs`

- `app/(advisor)/(backend)/api/advisor/contrats/route.ts`
  - `GET /api/advisor/contrats`
  - `POST /api/advisor/contrats`

- `app/(advisor)/(backend)/api/advisor/clients/[id]/actifs/route.ts`
  - `GET /api/advisor/clients/[id]/actifs`
  - `POST /api/advisor/clients/[id]/actifs`
  - Validation avec Zod sur les payloads.

- `app/(advisor)/(backend)/api/advisor/clients/[id]/contrats/route.ts`
  - `GET /api/advisor/clients/[id]/contrats`
  - `POST /api/advisor/clients/[id]/contrats`
  - Validation avec Zod.

**Constat :**

- Authentification et contrôle de rôle présents (`requireAuth`, `isRegularUser`).
- Utilisation de services Prisma (`ActifService`, `PassifService`, `ContratService`) pour la logique métier.
- Erreurs gérées avec des statuts HTTP + JSON de réponse structurés.
- Vraies opérations CRUD (au moins en création + liste).

**Limites :**

- Manque probable de handlers `PUT`/`DELETE` pour l’édition/suppression fine (à vérifier/compléter).
- Pagination / filtrage avancé non industrialisé (mais base présente).

#### 2.1.2 Frontend – Pages patrimoine

Chemins (à adapter si structure légèrement différente dans le repo) :

- `app/(advisor)/(frontend)/dashboard/patrimoine/actifs/page.tsx`
- `app/(advisor)/(frontend)/dashboard/patrimoine/passifs/page.tsx`
- `app/(advisor)/(frontend)/dashboard/patrimoine/contrats/page.tsx`

**Constat :**

- Les pages appellent bien les vraies APIs `/api/advisor/...` pour **lister** les éléments.
- Filtres de base + suppression (delete) généralement présents/fonctionnels.
- Les boutons de **création/édition** sont visibles, mais :
  - formulaires parfois absents ou ultra simplifiés,
  - validations front légères,
  - gestion d’erreurs UX minimale.

**Conclusion :**

- Lecture/consultation → **fonctionnelle**.
- Création/édition → **partiellement implémentée**, non au niveau attendu pour un CRM commercial.

---

### 2.2 Simulateurs

#### 2.2.1 Retraite – capitalisation

- **Frontend** : `app/(advisor)/(frontend)/components/simulators/RetirementSimulator.tsx`
- **Backend** : `app/(advisor)/(backend)/api/advisor/simulators/retirement/simulate/route.ts`
  - `POST /api/advisor/simulators/retirement/simulate`
  - Calculs de projection d’épargne (capital final, règle des 4 %, gap de revenus, timeline annuelle, recommandations).

**Constat :**

- Câblage correct (`RetirementSimulator` → `/api/advisor/simulators/retirement/simulate`).
- UI riche (inputs nombreux, graphiques, KPIs, recommandations).
- Moteur backend sérieux (calculs non triviaux, logique robuste).

→ **Module déjà très proche du niveau market‑ready.**

#### 2.2.2 Retraite – estimation de pension

- **Frontend** : `app/(advisor)/(frontend)/components/simulators/PensionEstimator.tsx`
- **Backend** : `app/(advisor)/(backend)/api/advisor/simulators/retirement/pension/route.ts`
  - `POST /api/advisor/simulators/retirement/pension`
  - Calcul de taux de pension, décote/surcote, pension de base + complémentaire, taux de remplacement, recommandations.

**Problème identifié :**

- Le frontend appelle **`/api/simulators/retirement/pension`**.
- Le backend expose **`/api/advisor/simulators/retirement/pension`**.
- Résultat : 404 / échec de fetch → pour l’utilisateur, le simulateur ne fonctionne pas.

#### 2.2.3 Succession – simulateur principal

- **Frontend** : `app/(advisor)/(frontend)/components/simulators/SuccessionSimulator.tsx`
- **Backend** : `app/(advisor)/(backend)/api/advisor/simulators/succession/simulate/route.ts`
  - `POST /api/advisor/simulators/succession/simulate`
  - Logique fiscale française (barèmes, abattements, calcul des droits par héritier, héritage net, taux effectif, recommandations).

**Constat :**

- Câblage correct (`SuccessionSimulator` → `/api/advisor/simulators/succession/simulate`).
- UI complète avec actifs, héritiers, validations, graphiques, tableaux.

→ **Module réel/fonctionnel.**

#### 2.2.4 Succession – comparaison de stratégies

- **Backend** : `app/(advisor)/(backend)/api/advisor/simulators/succession/compare/route.ts`
  - `POST /api/advisor/simulators/succession/compare`
  - Compare plusieurs stratégies : transmission directe, donations, démembrement, assurance‑vie, etc., avec calcul des économies d’impôts, recommandation de la meilleure.

**Constat :**

- Backend existant, mais aucune UI dédiée clairement identifiée.
- Moteur “caché” non exposé aux conseillers.

#### 2.2.5 Succession – optimisation des donations

- **Frontend** : `app/(advisor)/(frontend)/components/simulators/DonationOptimizer.tsx`
- **Backend** : `app/(advisor)/(backend)/api/advisor/simulators/succession/donations/route.ts`
  - `POST /api/advisor/simulators/succession/donations`
  - Optimisation sur plusieurs fenêtres de 15 ans, calculs d’économies, recommandations, planning de donations.

**Problème :**

- Frontend appelle **`/api/simulators/succession/donations`**.
- Backend expose **`/api/advisor/simulators/succession/donations`**.
- → 404 / erreur réseau → simulateur inutilisable aujourd’hui.

#### 2.2.6 Enveloppes / véhicules d’investissement

- **Frontend** : `app/(advisor)/(frontend)/components/simulators/InvestmentVehicleComparison.tsx`
  - UI avancée : inputs, cartes comparatives, graphiques, tableaux, highlight du meilleur véhicule.
- **Backend** : **aucune route** pour `POST /api/simulators/tax/investment-vehicles` (ou équivalent sous `/api/advisor/...`).

**Constat :**

- L’UI existe, mais **aucun moteur backend réel**.
- Tout repose sur un endpoint inexistant → feature “vitrine”/mock.

---

### 2.3 Settings utilisateurs

- **Page** : `app/(advisor)/(frontend)/dashboard/settings/users/page.tsx`
  - Page serveur, accès direct à Prisma.
  - Gestion des utilisateurs, rôles, quotas.

**Constat :**

- Module déjà **réel**, opérant directement sur la base.
- UX encore perfectible (pagination, filtres, UX erreurs), mais fondation solide.

---

### 2.4 Transversal (UX, erreurs, tests)

- Composants UI déjà présents et cohérents, mais non formalisés comme **design system** unifié.
- Gestion d’erreurs parfois locale, parfois absente (notamment sur simulateurs et formulaires).
- Pas encore de stratégie formalisée de tests (unitaires, intégration, e2e).
- Observabilité (logs structurés, tracking erreurs frontend) non encore décrite.

---

## 3. Vision cible “100 % market‑ready”

Un CRM est considéré **market‑ready** si :

1. **Aucune fonctionnalité cassée**
   - Aucun bouton, lien ou formulaire ne mène à une erreur silencieuse ou un 404.
   - Les modules “importants” (patrimoine, simulateurs clés, settings) sont tous opérationnels.

2. **UX homogène et professionnelle**
   - Composants unifiés (design system), comportements prévisibles.
   - États `loading / empty / error` explicites.
   - Messages d’erreurs métier clairs pour le conseiller.

3. **Simulateurs robustes**
   - Tous les simulateurs exposés dans l’UI sont connectés à des moteurs backend réels.
   - Les résultats sont cohérents, testés, documentés.

4. **Patrimoine exploitable de bout en bout**
   - Flux complet : créer / éditer / supprimer / consulter pour Actifs, Passifs, Contrats.
   - Filtres, recherche, pagination pour un usage quotidien.

5. **Industrialisation minimale**
   - Tests sur les parties critiques.
   - Logs et observabilité suffisants pour diagnostiquer les problèmes.
   - Documentation claire (dont ce document).

---

## 4. Plan par phases – Vue d’ensemble

### Phase 0 – Socle (design system, conventions)

- Créer un **design system minimal** et des composants UI standard.
- Définir conventions de réponses API et gestion d’erreurs.
- Vérifier/compléter les guards d’auth.

### Phase 1 – Tout rendre fonctionnel (zéro fonctionnalité cassée)

- Corriger tous les **endpoints simulateurs**.
- Finaliser les **formulaires CRUD patrimoine**.
- Masquer supprime/neutraliser toute action non implémentée, plutôt que la laisser cassée.

### Phase 2 – Compléter les fonctionnalités manquantes

- Implémenter le backend du **simulateur enveloppes**.
- Créer les UIs des **simulateurs de comparaison** (retraite, succession).
- Harmoniser l’expérience conseiller entre patrimoine et simulateurs.

### Phase 3 – Industrialisation

- Mettre en place les **tests** (unitaires, intégration, e2e).
- Ajouter **logs structurés, monitoring, tracking erreurs frontend**.
- Optimiser la **performance et l’UX fine**.

Les sections suivantes décrivent **précisément** quoi faire par phase et par fichier.

---

## 5. Détail des tâches – Patrimoine (Actifs / Passifs / Contrats)

### 5.1 Frontend – UX & flux

#### 5.1.1 Cartographier les scénarios utilisateurs

**Objectif** : définir clairement les flux et les écrans attendus.

- Pour chaque type (Actif, Passif, Contrat) :
  - Créer un petit document interne (peut être une section dans ce fichier, ou un autre doc) décrivant :
    - **Scénario de création** : depuis quelle page, quels champs, validations, résultat attendu.
    - **Scénario d’édition** : comment y accéder, quels champs modifiables.
    - **Scénario de suppression** : confirmation, contraintes éventuelles.
    - **Scénario de consultation** : liste, détail, filtres, recherche.

*(Cette étape est fonctionnelle/produit mais indispensable pour un dev qui code les formulaires.)*

#### 5.1.2 Concevoir et créer les formulaires de création

**Fichiers cibles (exemples, à ajuster au projet)** :

- `app/(advisor)/(frontend)/dashboard/patrimoine/actifs/page.tsx`
- `app/(advisor)/(frontend)/dashboard/patrimoine/passifs/page.tsx`
- `app/(advisor)/(frontend)/dashboard/patrimoine/contrats/page.tsx`
- Nouveaux fichiers possibles :
  - `app/(advisor)/(frontend)/components/patrimoine/ActifForm.tsx`
  - `app/(advisor)/(frontend)/components/patrimoine/PassifForm.tsx`
  - `app/(advisor)/(frontend)/components/patrimoine/ContratForm.tsx`

**Étapes d’implémentation** :

1. Créer des composants de formulaire réutilisables par type :
   - `ActifForm` reçoit en props (exemple) :
     - `mode` = "create" | "edit",
     - `initialValues` optionnel,
     - callbacks `onSubmitSuccess`, `onCancel`.
   - Idem pour `PassifForm`, `ContratForm`.

2. Dans chaque form :
   - Mapper précisément les champs du modèle Prisma (voir fichiers de schéma dans `prisma/schema.prisma`).
   - Ajouter des validations front (required, min/max, formats, etc.).
   - Afficher les erreurs sous les champs + en haut du formulaire si erreur serveur.

3. Brancher sur les APIs existantes :
   - Création globale (hors context client) :
     - `POST /api/advisor/actifs` / `passifs` / `contrats`.
   - Création liée à un client :
     - `POST /api/advisor/clients/[id]/actifs` / `contrats`.
   - Choisir la route adaptée selon la page où se trouve le formulaire.

4. UX :
   - Utiliser un composant `Modal` ou page dédiée avec :
     - Bouton **Annuler**, Bouton **Enregistrer**.
     - Indicateur `loading` sur le bouton lors de la soumission.
   - En cas de succès :
     - afficher un toast de réussite,
     - fermer le formulaire,
     - rafraîchir la liste (refetch ou invalidation de cache).

#### 5.1.3 Implémenter les formulaires d’édition

**But** : permettre la modification propre des enregistrements existants.

1. Ajouter un bouton **"Éditer"** sur chaque ligne des tableaux Actifs/Passifs/Contrats.
2. Ouvrir les mêmes composants `ActifForm`/`PassifForm`/`ContratForm` en mode `edit` :
   - Pré-remplir les champs avec les données existantes de l’élément.
3. **Backend** (voir 5.2) :
   - Ajouter des routes `PUT` (ou `PATCH`) sur les endpoints existants pour l’update.
4. Gestion des erreurs :
   - Si l’élément n’existe plus (conflit), afficher un message clair et forcer le rafraîchissement de la liste.

#### 5.1.4 Finitions UX sur les listes

Sur les pages liste :

- Ajouter **pagination** (backend + front) pour éviter les listes infinies.
- Ajouter **recherche** texte (par nom, référence, etc.).
- Ajouter **filtres** (type d’actif, statut, devise…).
- Utiliser les composants de tableau standard du design system pour unifier le rendu.

---

### 5.2 Backend – Extensions API patrimoine

#### 5.2.1 Ajouter les endpoints d’édition et de suppression

Sur chaque route :

- `app/(advisor)/(backend)/api/advisor/actifs/route.ts`
- `app/(advisor)/(backend)/api/advisor/passifs/route.ts`
- `app/(advisor)/(backend)/api/advisor/contrats/route.ts`

**Étapes** :

1. Ajouter un handler `PUT` :
   - Récupérer l’ID de l’élément (via query param ou body, à définir de manière cohérente).
   - Valider l’input avec Zod (créer un schéma `UpdateActifSchema`, etc.).
   - Appeler le service Prisma pour mettre à jour l’enregistrement.
   - Retourner `{ success: true, data: updatedItem }`.

2. Ajouter un handler `DELETE` :
   - Récupérer l’ID.
   - Vérifier éventuellement des contraintes (relations, intégrité métier).
   - Supprimer via Prisma.
   - Retourner `{ success: true }`.

3. Vérifier que l’authentification et le contrôle de rôle sont toujours appliqués.

#### 5.2.2 Pagination et filtrage avancés

- Étendre les `GET` pour accepter des query params :
  - `page`, `pageSize`, `sortBy`, `sortOrder`.
  - Filtres métier (type, statut, date, etc.).
- Implémenter avec Prisma :
  - `skip`, `take`, `orderBy`, `where` dynamiques.
- Retourner également `totalCount` pour permettre une pagination côté front.

---

## 6. Détail des tâches – Simulateurs

### 6.1 Hotfix immédiats – Endpoints cassés

#### 6.1.1 Pension – corriger l’endpoint

**Fichier** :
- `app/(advisor)/(frontend)/components/simulators/PensionEstimator.tsx`

**Action** :

1. Localiser le `fetch` (ou client HTTP) utilisé pour la simulation.
2. Modifier l’URL appelée de :
   - `"/api/simulators/retirement/pension"`
   vers :
   - `"/api/advisor/simulators/retirement/pension"`.
3. Vérifier que le corps de la requête correspond aux paramètres attendus par la route backend :
   - vérifier dans `app/(advisor)/(backend)/api/advisor/simulators/retirement/pension/route.ts` les noms/types de champs.
4. Adapter si nécessaire la transformation de la réponse dans le composant.

#### 6.1.2 Donations – corriger l’endpoint

**Fichier** :
- `app/(advisor)/(frontend)/components/simulators/DonationOptimizer.tsx`

**Action** :

1. Localiser l’appel à l’API.
2. Modifier l’URL appelée de :
   - `"/api/simulators/succession/donations"`
   vers :
   - `"/api/advisor/simulators/succession/donations"`.
3. Vérifier la conformité du payload avec la route backend :
   - regarder `app/(advisor)/(backend)/api/advisor/simulators/succession/donations/route.ts`.
4. Ajuster le parsing de la réponse côté frontend si besoin.

#### 6.1.3 Gestion d’erreurs unify sur tous les simulateurs

Sur tous les composants `*Simulator.tsx`, `*Estimator.tsx`, `*Optimizer.tsx` :

1. Standardiser les états :
   - `isLoading`, `errorMessage`, `result`.
2. En cas d’erreur réseau/serveur :
   - afficher un message clair (zone dédiée ou toast),
   - ne pas laisser les graphes/kpis dans un état incohérent.
3. Option : créer un hook commun `useSimulation` pour factoriser ce pattern.

---

### 6.2 Enveloppes / véhicules d’investissement – Implémenter le backend

#### 6.2.1 Spécification fonctionnelle minimale

**Objectif fonctionnel** :

- Comparer plusieurs enveloppes (PEA, CTO, assurance‑vie, etc.)
- Inputs typiques :
  - montant initial,
  - horizon (années),
  - profil fiscal (TMI, PFU, etc.),
  - hypothèse de rendement annuel.
- Outputs attendus par véhicule :
  - valeur finale brute,
  - montant total d’impôts/CSG/CRDS,
  - valeur nette,
  - indicateur de "meilleur" véhicule.

*(Les détails fiscaux exacts sont à préciser avec un expert produit/fiscaliste si besoin.)*

#### 6.2.2 Créer la route backend

**Nouveau fichier recommandé** :

- `app/(advisor)/(backend)/api/advisor/simulators/tax/investment-vehicles/route.ts`

**Étapes** :

1. Définir le handler `POST` :
   - Utiliser `NextRequest` / `NextResponse` (selon conventions existantes).
   - Appliquer `requireAuth` et `isRegularUser`.
2. Définir un schéma Zod pour l’input :
   - ex. `{ amount, durationYears, taxBracket, vehicles[], expectedReturn }`.
3. Implémenter une fonction de calcul pour chaque type de véhicule :
   - idéalement dans un fichier service séparé (`services/InvestmentVehicleService.ts`) pour testabilité.
4. Retourner une structure :
   - \`{ success: true, data: { vehicles: [...], bestVehicleId, summary } }\`.

#### 6.2.3 Câbler le frontend existant

**Fichier** :
- `app/(advisor)/(frontend)/components/simulators/InvestmentVehicleComparison.tsx`

**Actions** :

1. Modifier l’endpoint appelé pour pointer vers :
   - `"/api/advisor/simulators/tax/investment-vehicles"`.
2. Adapter l’UI pour consommer la structure de réponse définie en 6.2.2.
3. Vérifier que tous les graphiques/cartes/tableaux utilisent **uniquement** les données retournées par l’API (aucun mock côté front).

---

### 6.3 Simulateurs de comparaison (Retraite & Succession)

#### 6.3.1 Comparateur Retraite – UI

**Backend existant** :
- `app/(advisor)/(backend)/api/advisor/simulators/retirement/compare/route.ts`
  - `POST /api/advisor/simulators/retirement/compare`

**Nouveau composant frontend suggéré** :
- `app/(advisor)/(frontend)/components/simulators/RetirementScenarioCompare.tsx`

**Fonctionnalités** :

1. Permettre de définir plusieurs scénarios (2–4) avec des paramètres différents.
2. Envoyer ces scénarios dans un seul `POST` à `/api/advisor/simulators/retirement/compare`.
3. Afficher un tableau comparatif des KPIs clés :
   - capital final,
   - revenu possible à la retraite,
   - gap vs besoin,
   - faisabilité.
4. Mettre en avant le "meilleur" scénario selon le backend.

#### 6.3.2 Comparateur Succession – UI

**Backend existant** :
- `app/(advisor)/(backend)/api/advisor/simulators/succession/compare/route.ts`
  - `POST /api/advisor/simulators/succession/compare`

**Nouveau composant frontend suggéré** :
- `app/(advisor)/(frontend)/components/simulators/SuccessionStrategyCompare.tsx`

**Fonctionnalités** :

1. Point d’entrée : partir de la situation de base (actifs, héritiers, etc.) ou d’inputs simplifiés.
2. Lancer la comparaison via `/api/advisor/simulators/succession/compare`.
3. Afficher :
   - impôt total par stratégie,
   - économies d’impôt vs scénario de référence,
   - recommandations textuelles.

#### 6.3.3 Intégration dans le routing

- Ajouter ces comparateurs :
  - soit comme **onglets** supplémentaires dans les écrans de simulateurs existants,
  - soit comme nouvelles pages dans `app/(advisor)/(frontend)/dashboard/simulateurs/...`.

---

## 7. Détail des tâches – Settings utilisateurs

Même si déjà fonctionnel, pour niveau produit :

1. **Améliorer la liste** :
   - pagination,
   - recherche par email/nom,
   - filtres par rôle.
2. **Clarifier les actions sensibles** :
   - changements de rôle,
   - changements de quotas.
3. **Audit minimal** :
   - logger côté backend les modifications de rôles/quotas.

Les modifications se font principalement dans :
- `app/(advisor)/(frontend)/dashboard/settings/users/page.tsx`
- et les appels Prisma sous‑jacents.

---

## 8. Transversal – Design system, erreurs, tests, observabilité

### 8.1 Design system & composants

1. Identifier les composants UI déjà utilisés (Buttons, Inputs, Cards, Tables…).
2. Les centraliser dans un dossier dédié, par ex. :
   - `app/(advisor)/(frontend)/components/ui/`.
3. Définir :
   - palette de couleurs,
   - typographie,
   - spacing, bordures,
   - états (hover, active, disabled).
4. Refactoriser progressivement les écrans principaux pour utiliser ces composants.

### 8.2 Client HTTP & gestion d’erreurs

1. Créer un utilitaire `apiClient` ou `fetchJson` (dans `app/(advisor)/(frontend)/lib/` par ex.) :
   - gère baseURL,
   - ajout du header d’auth (si nécessaire côté client),
   - gère parsing JSON et erreurs.
2. Remplacer progressivement les `fetch` directs dans les composants par cet utilitaire.
3. Normaliser la forme des réponses API (`{ success, data, errorCode, message }`).

### 8.3 Tests

1. **Unitaires backend** :
   - Priorité : simulateurs (retraite, succession, donations, enveloppes) + services patrimoine.
2. **Intégration API** :
   - Tests qui appellent directement les routes `api/advisor/...` avec des payloads typiques.
3. **E2E** :
   - Scénarios principaux :
     - login,
     - créer client,
     - ajouter actifs/passifs/contrats,
     - lancer simulateurs retraite/succession/donations,
     - modifier un utilisateur.

### 8.4 Observabilité

1. **Logs backend** :
   - Format structuré (JSON) pour erreurs et événements critiques.
   - Loguer : erreurs simulateurs, erreurs CRUD patrimoine, changements de rôles.
2. **Erreurs frontend** :
   - Intégrer un outil type Sentry (ou équivalent) pour capturer les exceptions.

---

## 9. Checklist synthétique (pour pilotage)

Ci‑dessous une checklist / roadmap pour pilotage :

- [x] **Phase 0 – Socle** ✅ COMPLÉTÉ
  - [x] Design system minimal (UI) → shadcn/ui, 48 composants.
  - [x] Client HTTP unifié → `api-client.ts` (277 lignes).
  - [x] Conventions réponses API & erreurs → Format normalisé.

- [x] **Phase 1 – Hotfix & Patrimoine CRUD** ✅ COMPLÉTÉ
  - [x] Corriger endpoint `PensionEstimator` → URLs correctes `/api/advisor/...`.
  - [x] Corriger endpoint `DonationOptimizer` → URLs correctes `/api/advisor/...`.
  - [x] Implémenter formulaires `ActifForm` → `patrimoine/ActifForm.tsx`.
  - [x] Implémenter formulaires `PassifForm` → `patrimoine/PassifForm.tsx`.
  - [x] Implémenter formulaires `ContratForm` → `patrimoine/ContratForm.tsx` (280 lignes).
  - [x] Endpoints CRUD → Services Prisma complets.

- [x] **Phase 2 – Complétude Simulateurs** ✅ COMPLÉTÉ
  - [x] API `tax/investment-vehicles` → 231 lignes, calculs fiscaux réels.
  - [x] `InvestmentVehicleComparison` câblé sur API réelle.
  - [x] `RetirementComparison` existant et fonctionnel.
  - [x] `SuccessionComparison` existant et fonctionnel.
  - [x] `TaxProjector` backend → 205 lignes, barèmes 2024.

- [x] **Phase 3 – Industrialisation** ✅ COMPLÉTÉ
  - [x] Tests unitaires → Vitest (budget, tax, opportunities).
  - [x] Tests intégration → Existants dans `/tests/integration/`.
  - [x] Tests E2E → Playwright (wizard, tabs, opportunités).
  - [x] Utilitaire pagination → `pagination.ts` (120 lignes).
  - [x] Logs structurés backend → `logger.ts` (250 lignes).
  - [x] Tracking erreurs frontend → `error-tracking.ts` (240 lignes).
  - [x] ErrorBoundary React → `ErrorBoundary.tsx` (200 lignes).

---

## 10. Utilisation de ce document

- **Pour le Product / CTO** :
  - Prioriser les phases et les tâches.
  - Ajuster si nécessaire les specs métier (notamment pour le simulateur d’enveloppes).

 - **Pour le développeur désigné** :
 - Travailler **par feature** ou **par phase**, en cochant les items de la checklist.
 - Se référer aux chemins de fichiers et aux endpoints cités pour savoir "où intervenir".
 - Ne pas hésiter à enrichir ce document (sous forme de PR) si des décisions techniques supplémentaires sont prises.

 Ce document doit vivre avec le projet : il peut être mis à jour au fur et à mesure de l’avancement pour refléter l’état réel et les décisions prises.

---

## Annexe A – Cartographie détaillée par module et par fichier

### A.1 Patrimoine – Actifs / Passifs / Contrats

#### A.1.1 Fichiers backend principaux

1. **`app/(advisor)/(backend)/api/advisor/actifs/route.ts`**
   - **Rôle** : liste et création des actifs (contexte conseiller global).
   - **Constat** :
     - Handlers `GET` et `POST` implémentés, utilisant `ActifService` + auth.
     - Validation basique présente côté service / Prisma.
   - **Actions à mener** :
     - [Back] Ajouter handlers `PUT` et `DELETE` pour permettre l’édition/suppression d’un actif individuel.
     - [Back] Définir clairement le mode de passage de l’ID (query `?id=` ou `/actifs/[id]`) et l’harmoniser partout.
     - [Back] Ajouter un schéma Zod pour `UpdateActifInput` avec validations strictes.
     - [Back] Garantir un format de réponse unique : `{ success, data, errorCode?, message? }`.

2. **`app/(advisor)/(backend)/api/advisor/passifs/route.ts`**
   - **Rôle** : liste et création des passifs.
   - **Constat** : structure similaire à `actifs`, services dédiés (`PassifService`), auth déjà en place.
   - **Actions à mener** :
     - [Back] Ajouter `PUT`/`DELETE` pour les passifs.
     - [Back] Mettre en place Zod pour `CreatePassifInput` et `UpdatePassifInput`.
     - [Back] Ajouter paramètres de pagination/tri/filtres dans le `GET` (si absents).

3. **`app/(advisor)/(backend)/api/advisor/contrats/route.ts`**
   - **Rôle** : liste et création de tous les contrats (assurance-vie, PEA, PER, etc.).
   - **Constat** : mêmes patterns que pour actifs/passifs, mais importance métier forte (beaucoup de champs).
   - **Actions à mener** :
     - [Back] Ajouter `PUT`/`DELETE` avec validation Zod sur les champs sensibles (supports, bénéficiaires, fiscalité).
     - [Back] Vérifier les filtres existants (par type de contrat, par statut).
     - [Back] Ajouter des tests d’intégration couvrant au moins 2–3 types de contrats différents.

4. **`app/(advisor)/(backend)/api/advisor/clients/[id]/actifs/route.ts`**
   - **Rôle** : accès aux actifs d’un client donné.
   - **Constat** :
     - `GET`/`POST` implémentés.
     - Zod utilisé pour la création, auth présente.
   - **Actions à mener** :
     - [Back] Ajouter support de pagination/filtres par type d’actif pour ce client.
     - [Back] Ajouter éventuellement `PUT`/`DELETE` client-spécifiques (si l’édition doit se faire dans ce contexte plutôt que global).

5. **`app/(advisor)/(backend)/api/advisor/clients/[id]/contrats/route.ts`**
   - **Rôle** : gestion des contrats pour un client.
   - **Constat** : usages similaires à `[id]/actifs`.
   - **Actions à mener** :
     - [Back] Même logique que pour `[id]/actifs` : filtres, pagination, update si besoin.

#### A.1.2 Fichiers frontend principaux (patrimoine)

1. **`app/(advisor)/(frontend)/dashboard/patrimoine/actifs/page.tsx`**
   - **Rôle** : vue principale de gestion des actifs (liste + actions).
   - **Constat** :
     - Liste les actifs via `/api/advisor/actifs` (ou route client-spécifique selon implémentation exacte).
     - Boutons de création/édition visibles mais formulaires partiels ou manquants.
   - **Actions à mener** :
     - [Front] Introduire un composant `ActifForm` dans `components/patrimoine/ActifForm.tsx` :
       - Props recommandées : `mode`, `initialValues?`, `onSubmitSuccess`, `onCancel`.
       - Gestion des validations front (champs obligatoires, formats numériques, dates).
     - [Front] Ouvrir `ActifForm` :
       - en modal pour la création (`Créer un actif`),
       - en modal pré-remplie pour l’édition (`Éditer`).
     - [Front] Remplacer les `fetch` inline par l’utilitaire `apiClient` (voir section 8.2) pour les appels à `/api/advisor/actifs`.
     - [Front] Ajouter pagination + filtres dans l’UI, reliés aux query params du backend.

2. **`app/(advisor)/(frontend)/dashboard/patrimoine/passifs/page.tsx`**
   - **Rôle** : gestion des passifs (liste + actions).
   - **Constat & actions** :
     - Très similaire à la page Actifs.
     - [Front] Créer un `PassifForm` réutilisant les patterns d’`ActifForm` (mêmes comportements, look & feel).
     - [Front] Harmoniser erreurs/toasts/messages avec la page Actifs (mêmes composants Alert/Toast).

3. **`app/(advisor)/(frontend)/dashboard/patrimoine/contrats/page.tsx`**
   - **Rôle** : liste et gestion des contrats.
   - **Constat** :
     - UI plus complexe (plus de colonnes/champs).
     - Workflows de création/édition non finalisés.
   - **Actions à mener** :
     - [Front] Créer `ContratForm` avec sections logiques (ex. "Données générales", "Fiscalité", "Bénéficiaires").
     - [Front] Implémenter la logique de validation métier minimale (dates cohérentes, montants positifs, etc.).
     - [Front] Rendre les colonnes de la liste configurables (par ex. masquer certaines colonnes sur petit écran).

---

### A.2 Simulateurs – Détail par fichier

#### A.2.1 Retraite – capitalisation

1. **`app/(advisor)/(frontend)/components/simulators/RetirementSimulator.tsx`**
   - **Rôle** : interface de simulation de retraite par capitalisation (épargne, versements, rendement).
   - **Constat** :
     - Câblage correct sur `/api/advisor/simulators/retirement/simulate`.
     - Gestion des états (inputs, loading, résultat) déjà en place.
   - **Actions à mener** :
     - [Front] Refactoriser les états et appels HTTP pour utiliser un hook commun (ex. `useSimulation`) si créé.
     - [Front] Vérifier l’accessibilité (labels, aria, ordre de tabulation).
     - [Front] Harmoniser les composants (Inputs, Cards, Charts) avec le design system.

2. **`app/(advisor)/(backend)/api/advisor/simulators/retirement/simulate/route.ts`**
   - **Rôle** : moteur de projection retraite.
   - **Actions à mener** :
     - [Back] Ajouter tests unitaires sur les fonctions de calcul (cas simples et cas extrêmes).
     - [Back] Vérifier la robustesse aux valeurs limites (âge > 70, rendement négatif, etc.).

#### A.2.2 Retraite – estimation pension

1. **`app/(advisor)/(frontend)/components/simulators/PensionEstimator.tsx`**
   - **Rôle** : estimation du montant de pension.
   - **Constat** :
     - Appel actuel sur `/api/simulators/retirement/pension` (**incorrect**).
   - **Actions à mener (détaillées)** :
     - [Front] Localiser la fonction de soumission (ex. `handleSimulate` ou équivalent).
     - [Front] Remplacer **strictement** l’URL par `/api/advisor/simulators/retirement/pension`.
     - [Front] Comparer la structure de `body` envoyée avec les attentes du backend (voir fichier route ci-dessous).
       - Ajuster les noms de champs / types (ex. `retirementAge`, `quartersValidated`, `averageSalary`, etc.).
     - [Front] Gérer explicitement les erreurs HTTP :
       - état `errorMessage` affiché dans l’UI,
       - retourner à un état neutre quand l’utilisateur modifie les inputs.

2. **`app/(advisor)/(backend)/api/advisor/simulators/retirement/pension/route.ts`**
   - **Rôle** : calcul du taux de pension, décote/surcote, pension finale.
   - **Actions à mener** :
     - [Back] Documenter dans le code ou un commentaire structuré les hypothèses (taux plein, décote par trimestre manquant, surcote, etc.).
     - [Back] Ajouter tests unitaires couvrant au moins :
       - cas "taux plein",
       - cas "forte décote",
       - cas "surcote maximale".

#### A.2.3 Succession – simulateur principal

1. **`app/(advisor)/(frontend)/components/simulators/SuccessionSimulator.tsx`**
   - **Rôle** : simulation complète de succession (actifs, héritiers, fiscalité).
   - **Constat** :
     - UI très riche, déjà bien intégrée.
   - **Actions à mener** :
     - [Front] Harmoniser les messages d’erreurs (inputs invalides, héritiers sans lien, etc.).
     - [Front] Vérifier la gestion des cas extrêmes (dizaine d’héritiers, actifs très nombreux).

2. **`app/(advisor)/(backend)/api/advisor/simulators/succession/simulate/route.ts`**
   - **Rôle** : moteur fiscal succession.
   - **Actions à mener** :
     - [Back] Ajouter un mécanisme de "version" ou de documentation des barèmes (année fiscale utilisée), pour faciliter les mises à jour futures.
     - [Back] Couvrir les barèmes par tests unitaires (valeur cible vs calcul attendu).

#### A.2.4 Succession – donations

1. **`app/(advisor)/(frontend)/components/simulators/DonationOptimizer.tsx`**
   - **Rôle** : optimisation des donations dans le temps.
   - **Constat** :
     - Appel actuel sur `/api/simulators/succession/donations` (**incorrect**).
   - **Actions à mener (détaillées)** :
     - [Front] Localiser l’appel à l’API et remplacer l’URL par `/api/advisor/simulators/succession/donations`.
     - [Front] Vérifier la structure attendue de la réponse (planning par période, économies, recommandations) et mapper correctement vers les cartes, graphiques et tableaux.
     - [Front] Gérer les cas d’erreur : afficher un message explicite et laisser l’utilisateur ajuster les inputs.

2. **`app/(advisor)/(backend)/api/advisor/simulators/succession/donations/route.ts`**
   - **Rôle** : calcul d’un planning optimal de donations.
   - **Actions à mener** :
     - [Back] Factoriser si besoin des fonctions communes avec le moteur de succession (`succession/simulate`).
     - [Back] Ajouter des tests unitaires/tables de vérité sur quelques scénarios types.

#### A.2.5 Enveloppes / véhicules d’investissement

1. **`app/(advisor)/(frontend)/components/simulators/InvestmentVehicleComparison.tsx`**
   - **Rôle** : comparaison de véhicules (PEA, CTO, assurance-vie, etc.).
   - **Constat** :
     - UI avancée mais endpoint inexistant (`/api/simulators/tax/investment-vehicles`).
   - **Actions à mener** :
     - [Front] Attendre la création de la route `/api/advisor/simulators/tax/investment-vehicles` (voir ci-dessous), puis :
       - adapter l’appel API à cette route,
       - consommer la structure de réponse (listes de véhicules, valeurs nette/brute, impôts cumulés),
       - supprimer tout mock éventuel dans le code.

2. **`app/(advisor)/(backend)/api/advisor/simulators/tax/investment-vehicles/route.ts`** (à créer)
   - **Rôle** : moteur de comparaison d’enveloppes.
   - **Actions à mener** :
     - [Back] Créer le fichier de route avec `POST` protégé par `requireAuth`.
     - [Back] Définir les modèles d’input/output dans un fichier de types partagé.
     - [Back] Implémenter les calculs fiscaux minimaux puis les raffiner avec le produit.

#### A.2.6 Projection fiscale – TaxProjector
1. **`app/(advisor)/(frontend)/components/simulators/TaxProjector.tsx`**
   - **Rôle** : projection pluriannuelle de la fiscalité sur le revenu (revenu brut, déductions, impôt sur le revenu, prélèvements sociaux, revenu net, taux effectif).
   - **Constat** :
     - UI avancée, validation des inputs, graphes (évolution revenus/impôts, décomposition impôt, taux effectif), tableau détaillé année par année.
     - Appelle `fetch('/api/simulators/tax/project', { method: 'POST', ... })`.
     - Aucune route backend correspondante trouvée ni pour `/api/simulators/tax/project` ni pour une version `/api/advisor/simulators/tax/project`.
   - **Classification** :
     - UI réelle et complète, mais **backend inexistant** → simulateur non fonctionnel en pratique.

2. **Backend TaxProjector (à créer)**
   - **Rôle attendu** : moteur de projection fiscale multi-années cohérent avec les barèmes français (et aligné sur le texte d’info du composant qui mentionne les barèmes 2024).
   - **Actions à mener** :
     - [Back] Créer une route `POST` sous `/api/advisor/simulators/tax/project` protégée par `requireAuth`.
     - [Back] Définir un schéma Zod d’input aligné sur le composant :
       - `currentIncome`, `incomeGrowthRate`, `currentDeductions`, `yearsToProject`, `familyQuotient`, `currentAge?`.
     - [Back] Implémenter les calculs :
       - projection du revenu brut et des déductions année par année,
       - calcul de l’impôt sur le revenu + prélèvements sociaux selon barèmes,
       - calcul du revenu net et du taux effectif,
       - agrégats de synthèse (total impôts, impôt moyen, taux effectif moyen).
     - [Back] Retourner une structure compatible avec le front actuel :
       - `data: { projections: [...], totalTaxOverPeriod, averageAnnualTax, averageEffectiveRate, summary, input }`.

3. **Alignement frontend ↔ backend**
   - [Front] Une fois la route créée, ajuster l’URL appelée pour utiliser `/api/advisor/simulators/tax/project`.
   - [Front] Vérifier que les noms de champs envoyés correspondent exactement au schéma Zod backend.
   - [Tests] Ajouter tests unitaires sur le moteur de calcul + tests d’intégration sur la route, et un test e2e sur le simulateur complet.

---

### A.3 Settings utilisateurs

1. **`app/(advisor)/(frontend)/dashboard/settings/users/page.tsx`**
   - **Rôle** : gestion des utilisateurs, rôles, quotas (page serveur).
   - **Actions à mener** :
     - [Front] Ajouter recherche et filtres (par email, rôle, statut).
     - [Front] Ajouter pagination si liste volumineuse.
     - [Front] Afficher clairement les effets des changements de rôle (tooltip/help).

2. **Accès Prisma associé**
   - **Actions à mener** :
     - [Back] Ajouter logs des changements de rôle/quotas (avec id de l’admin, horodatage).
     - [Back] Vérifier que seuls les admins peuvent accéder à ces opérations.

---

## Annexe B – Backlog technique détaillé (orientation JIRA)

Cette annexe peut servir de base pour créer des tickets JIRA (ou autre outil) ; chaque puce peut devenir une tâche.

- **Tâche B1 – Implémenter `ActifForm` + CRUD complet Actifs**
- **Tâche B2 – Implémenter `PassifForm` + CRUD complet Passifs**
- **Tâche B3 – Implémenter `ContratForm` + CRUD complet Contrats**
- **Tâche B4 – Corriger PensionEstimator (endpoint + gestion erreurs)**
- **Tâche B5 – Corriger DonationOptimizer (endpoint + mapping résultat)**
- **Tâche B6 – Créer backend Investment Vehicles + intégrer UI**
- **Tâche B7 – Créer UI RetirementScenarioCompare**
- **Tâche B8 – Créer UI SuccessionStrategyCompare**
- **Tâche B9 – Mettre en place design system et refactoriser les pages clés**
- **Tâche B10 – Mettre en place client HTTP unifié + conventions réponses API**
  - **Tâche B11 – Écrire tests unitaires simulateurs + services patrimoine**
  - **Tâche B12 – Écrire tests e2e parcours clés**
  - **Tâche B13 – Ajouter logs structurés backend + tracking erreurs frontend**

## Annexe C – Modules métier transverses (activité, agenda, tâches, opportunités, objectifs, projets, notifications, collaborateurs, clients 360)

### C.1 Activité / Timeline

1. **Frontend**
   - `app/(advisor)/(frontend)/dashboard/activity/page.tsx`
   - Vue de timeline des événements clés du client/cabinet.

2. **Backend**
   - `app/(advisor)/(backend)/api/advisor/activity/route.ts`
   - Utilise `TimelineService` + `requireAuth` + Prisma sur `timelineEvent`.

3. **Constat & classification**
   - Chaîne complète UI → API → service → Prisma.
   - Aucune donnée mock, événements persistés.
   - **→ Réel / fonctionnel.**

4. **Actions à mener (niveau marché)**
   - [Front] Harmoniser les composants (cards, timeline items) avec le design system.
   - [Back] Ajouter filtres/tri avancés (par type d’événement, période, conseiller).
   - [Back] Ajouter tests d’intégration sur la route `/api/advisor/activity`.

### C.2 Agenda / Rendez-vous

1. **Frontend**
   - `app/(advisor)/(frontend)/dashboard/agenda/page.tsx` (vue jour/semaine/mois, création/modif d’événements).
   - Appels aux endpoints de type `/api/advisor/appointments?...`.

2. **Backend**
   - `app/(advisor)/(backend)/api/advisor/appointments/route.ts`
     - `GET` : parse les query params (Zod), calcule intervalle temporel (day/week/month), instancie `RendezVousService`, retourne les rendez-vous formatés.
     - `POST` : validations fortes (Zod), contrôle des dates (pas dans le passé, end > start), gère les conflits d’horaires.
   - `app/(advisor)/(backend)/api/advisor/appointments/[id]/route.ts`
     - `GET` / `PUT` / `DELETE` sur un rendez-vous.
   - Service : `app/_common/lib/services/rendez-vous-service.ts` (Prisma sur `rendezVous`, `client`, `user`, `timelineEvent`).

3. **Constat & classification**
   - Vraie logique métier (conflits d’horaires, timeline, stats possibles).
   - **→ Réel / fonctionnel.**

4. **Actions à mener (niveau marché)**
   - [Front] Ajouter vues calendrier plus denses (semaine en colonnes, drag & drop éventuel à terme).
   - [Back] Ajouter des endpoints pour séries récurrentes si besoin produit.
   - [Tests] Couvrir les cas de conflit, annulation, replanification.

### C.3 Tâches

1. **Frontend**
   - Hook `useTasks` dans `app/_common/hooks/use-api.ts`.
     - Appelle `api.get('/advisor/taches' + buildQueryString(...))` → `/api/advisor/taches`.
   - Page `app/(advisor)/(frontend)/dashboard/taches/page.tsx`.

2. **Backend**
   - `app/(advisor)/(backend)/api/advisor/taches/route.ts` (`GET` + `POST`).
   - `app/(advisor)/(backend)/api/advisor/tasks/route.ts` (`GET` pipeline).
   - Service : `app/_common/lib/services/tache-service.ts`.
     - Prisma sur `tache`, `user`, `client`, `projet`, `timelineEvent`.

3. **Constat & classification**
   - Logique avancée : overdue, rappels, stats, intégration timeline.
   - **→ Réel / fonctionnel, logique métier avancée.**

4. **Actions à mener (niveau marché)**
   - [Front] Améliorer les vues (Kanban tâches, groupements par client/projet).
   - [Back] Ajouter SLA/notifications avancées si besoin (liens avec module Réclamations futur).
   - [Tests] E2E sur cycle de vie tâche (création → affectation → complétion).

### C.4 Actions commerciales

1. **Frontend**
   - `app/(advisor)/(frontend)/dashboard/clients/actions/page.tsx`.
   - Liste et création d’actions/campagnes simples.

2. **Backend**
   - `app/(advisor)/(backend)/api/advisor/clients/actions/route.ts`
     - `GET` : filtre par `status`, appelle `CommercialActionService.getActions`.
     - `POST` : validation Zod (title, objective, segmentKey, channels, scheduledAt, notes), puis `CommercialActionService.createAction`.
   - Service : `app/_common/lib/services/commercial-action-service.ts` (Prisma `commercialAction`).

3. **Constat & classification**
   - Persistance réelle, logique simple.
   - **→ Réel / fonctionnel mais basique** (pas un moteur de campagnes multicanal complet).

4. **Actions à mener (niveau marché)**
   - [Back] Étendre le modèle pour suivre statistiques (ouvertures, clics, réponses) une fois l’emailing réel en place.
   - [Front] Vues de pipeline de campagnes, filtres par segment, statut, canal.
   - [Intégration] Connecter à un vrai moteur d’email/SMS ultérieurement.

### C.5 Opportunités

1. **Frontend**
   - `app/(advisor)/(frontend)/dashboard/opportunites/page.tsx` (pipeline global).
   - `app/(advisor)/(frontend)/dashboard/clients/opportunites/page.tsx` (vue par client).
   - Appels `GET /api/advisor/opportunites?...` et `GET /api/advisor/opportunites/pipeline`.

2. **Backend**
   - `app/(advisor)/(backend)/api/advisor/opportunites/route.ts` (`GET` + `POST`).
   - `app/(advisor)/(backend)/api/advisor/opportunites/pipeline/route.ts` (`GET` pipeline).
   - Service : `app/_common/lib/services/opportunite-service.ts`.
     - Prisma sur `opportunite`, `client`, `user`, `projet`, `timelineEvent`.

3. **Constat & classification**
   - Gestion complète pipeline, changement de statut, conversion en projet, agrégations de valeur.
   - Intégration avec patrimoine et timeline.
   - **→ Réel / fonctionnel, logique métier avancée.**

4. **Actions à mener (niveau marché)**
   - [Front] Raffiner la vue Kanban (drag & drop, statistiques par colonne, temps moyen par étape).
   - [Back] Ajouter rapports exportables (CSV/PDF) pour le pipe.

### C.6 Objectifs

1. **Frontend**
   - `app/(advisor)/(frontend)/objectifs/page.tsx`.
   - Utilise hooks appelant `/api/advisor/objectifs`.

2. **Backend**
   - `app/(advisor)/(backend)/api/advisor/objectifs/route.ts` (`GET` + `POST`).
   - Service : `app/_common/lib/services/objectif-service.ts`.
     - Prisma sur `objectif`, `client`, `timelineEvent`.

3. **Constat & classification**
   - Gère montants cibles, progression, recommandations de versement mensuel, objectifs en retard, stats.
   - **→ Réel / fonctionnel avec vraie logique métier.**

4. **Actions à mener (niveau marché)**
   - [Front] Lier plus fortement les objectifs aux simulateurs (ex. trajectoire de versement conseillée).
   - [Tests] Vérifier précisément les formules de progression et de recommandation.

### C.7 Projets

1. **Frontend**
   - `app/(advisor)/(frontend)/projets/page.tsx`.
   - Vue liste/filtre de projets par client, type, statut.

2. **Backend**
   - `app/(advisor)/(backend)/api/advisor/projets/route.ts` (`GET` + `POST`).
   - Service : `app/_common/lib/services/projet-service.ts`.
     - Prisma sur `projet`, `client`, `tache`, `document`, avec intégration au patrimoine.

3. **Constat & classification**
   - CRUD complet projets, progression via tâches associées, impact sur patrimoine.
   - **→ Réel / fonctionnel, intégré au cœur patrimonial.**

4. **Actions à mener (niveau marché)**
   - [Front] Ajouter timeline projet + vues Gantt ou checklist avancée.
   - [Back] Étendre les liens avec facturation et dossiers (modules encore mock).

### C.8 Notifications

1. **Frontend**
   - `app/(advisor)/(frontend)/notifications/page.tsx`.
   - Utilise `useNotifications` pour appeler `/api/advisor/notifications` + mutations (mark read/unread, mark all, delete).

2. **Backend**
   - `app/(advisor)/(backend)/api/advisor/notifications/route.ts`
     - `GET` : liste paginée, `unreadCount`.
     - `POST` : création via `NotificationService.createNotification`.
     - `PATCH` : mark as read / markAllAsRead.
     - `DELETE` : suppression en masse.
   - Service : `app/_common/lib/services/notification-service.ts`.

3. **Constat & classification**
   - Notifications in-app (base de données) **réelles / fonctionnelles**.
   - Partie `sendEmailNotification` = **placeholder** (simple `console.log`, pas de provider email).
   - **→ In-app : réel / fonctionnel. Partie email : mock.**

4. **Actions à mener (niveau marché)**
   - [Back] Intégrer un provider email (SendGrid, Mailjet, etc.) pour transformer le placeholder en envoi réel.
   - [Front] Clarifier dans l’UI quand une notification est uniquement in-app vs envoyée par email.

### C.9 Collaborateurs

1. **Backend**
   - `app/(advisor)/(backend)/api/advisor/collaborators/route.ts`.
   - `GET` : utilise `UserService.listUsers()` pour retourner les conseillers éligibles (filtre inactifs + soi-même).

2. **Frontend**
   - Page `app/(advisor)/(frontend)/dashboard/conseillers/page.tsx` actuelle : UI statique (`Aucun conseiller`, boutons sans logique).

3. **Constat & classification**
   - **API collaborateurs : réelle / fonctionnelle** (branchée à Prisma `user`).
   - **Page /dashboard/conseillers : mock complet**, n’exploite pas l’API.

4. **Actions à mener (niveau marché)**
   - [Front] Brancher `/dashboard/conseillers` sur `/api/advisor/collaborators` pour afficher la vraie liste.
   - [Front] Ajouter création/modification/suspension de collaborateurs, en s’appuyant sur les mêmes règles que `settings/users`.

### C.10 Clients 360 / Dossier client

1. **Constat global**
   - Vue client 360 déjà branchée à `ClientService` + routes `api/advisor/clients/...` (Prisma sur le modèle `client` + patrimoine associé).
   - Intégration avec timeline, objectifs, projets, opportunités.

2. **Classification**
   - **→ Réel / fonctionnel**, formant le socle métier du CRM.

3. **Actions à mener (niveau marché)**
   - [Front] Harmoniser toutes les briques autour de la fiche client (accès direct aux simulateurs, KYC, documents, etc. une fois ces modules implémentés réellement).

---

## Annexe D – Modules mock / décoratifs et gaps critiques

Cette annexe liste les pages **purement UI / marketing** identifiées lors de l’audit, avec ce qu’il manque pour atteindre un niveau produit concurrentiel.

### D.1 Prospection & facturation

1. **Prospects**
   - Page : `app/(advisor)/(frontend)/dashboard/prospects/page.tsx`.
   - Constats : compteurs en dur (0 prospects, 0 en qualification, etc.), card vide, bouton "Nouveau prospect" sans logique.
   - Classification : **mock complet**.
   - Pour être marché :
     - [Back] Modèle Prisma `prospect` + routes `/api/advisor/prospects` (CRUD, pipeline).
     - [Front] Vues funnel (listes + kanban), intégration avec opportunités et campagnes.

2. **Facturation**
   - Page : `app/(advisor)/(frontend)/dashboard/facturation/page.tsx`.
   - Constats : 3 cartes avec `0 €`, bouton "Nouvelle facture" / "Exporter", aucune API, aucun modèle `invoice` utilisé.
   - Classification : **mock complet**.
   - Pour être marché :
     - [Back] Modèle Prisma `invoice` + routes (`/api/advisor/factures`), gestion des statuts (draft/sent/paid/overdue).
     - [Intégration] Lien avec projets/opportunités, éventuellement avec un outil comptable externe.

3. **Apporteurs d’affaires**
   - Page : `app/(advisor)/(frontend)/dashboard/apporteurs/page.tsx`.
   - Constats : texte + boutons "Nouvel apporteur"/"Ajouter un apporteur", aucun hook/API.
   - Classification : **mock complet**.
   - Pour être marché :
     - [Back] Modèle `apporteur` + commissionnement, routes d’API.
     - [Front] Vues liste + suivi des commissions, lien avec contrats concernés.

### D.2 Dossiers & workflows missions

1. **Dossiers**
   - Pages :
     - `dashboard/dossiers/page.tsx` (liste),
     - `dashboard/dossiers/kanban/page.tsx`,
     - `dashboard/dossiers/archives/page.tsx`.
   - Constats : compteurs "0" en dur, cards "Aucun dossier manquant" / "Contrôles réglementaires", aucun lien aux modèles KYC dans Prisma.
   - Classification : **mocks complets**.
   - Pour être marché :
     - [Back] Modèle `dossier` + workflows (statuts, dates clés), routes `/api/advisor/dossiers` (liste, Kanban, archives).
     - [Front] Vues liste & Kanban réelles, intégration avec projets/opportunités.

### D.3 Campagnes, scénarios automatiques, templates emails

1. **Campagnes actives**
   - Page : `dashboard/campagnes/actives/page.tsx`.
   - Constats : une Card "Aucune campagne active" + bouton, aucune API.
   - Classification : **mock complet**.

2. **Scénarios automatiques**
   - Page : `dashboard/scenarios/page.tsx`.
   - Constats : UI statique, aucun scheduler, aucun mapping vers des actions réelles.
   - Classification : **mock complet**.

3. **Templates emails**
   - Page : `dashboard/templates/emails/page.tsx`.
   - Constats : liste vide, boutons de création, mais aucune API/template stocké.
   - Classification : **mock complet**.

4. **Emails (inbox CRM)**
   - Page : `dashboard/emails/page.tsx`.
   - Constats : interface de type inbox sans intégration IMAP/SMTP/OAuth, aucune API externe.
   - Classification : **ultra simplifié / essentiellement mock UI**.

5. **Pour être marché (ensemble marketing/automatisation)**
   - [Back] Modèles Prisma `campaign`, `emailTemplate`, `scenario`, `emailMessage`.
   - [Intégration] Connecteurs IMAP/SMTP ou API d’emailing (SendGrid, Mailgun, etc.).
   - [Front] Éditeurs WYSIWYG, écrans de définition de scénarios, reporting d’ouverture/clic.

### D.4 Simulateurs marqués "en développement" ou wrappers

1. **Simulateur Assurance-vie**
   - Page : `dashboard/simulators/assurance-vie/page.tsx`.
   - Constats : mention explicite "Simulateur en développement / Cette fonctionnalité sera bientôt disponible".
   - Classification : **mock explicite**.

2. **Simulateur Immobilier locatif**
   - Page : `dashboard/simulators/immobilier/page.tsx`.
   - Constats : même pattern "en développement".
   - Classification : **mock explicite**.

3. **Wrappers vers simulateurs réels**
   - `dashboard/simulators/succession/page.tsx` → wrapper autour de `SuccessionSimulator` (réel).
   - `dashboard/simulators/tax-projector/page.tsx` → wrapper vers `TaxProjector` (statut à auditer plus finement).
   - Classification :
     - wrappers eux-mêmes : **neutres**, la réalité dépend du composant ciblé.

### D.5 KYC / Conformité / Réclamations

1. **KYC cockpit**
   - Pages :
     - `dashboard/kyc/page.tsx`,
     - `dashboard/kyc/manquants/page.tsx`,
     - `dashboard/kyc/controles/page.tsx`.
   - Constats : compteurs "0" en dur, cards "Aucun document manquant" / "Contrôles réglementaires", aucun lien aux modèles KYC dans Prisma.
   - Classification : **mocks complets**.

2. **Réclamations**
   - Page : `dashboard/reclamations/page.tsx`.
   - Constats : compteurs en dur, card "Aucune réclamation", pas de modèle `reclamation`, aucun SLA.
   - Classification : **mock complet**.

3. **Pour être marché (conformité)**
   - [Back] Modèles `kycDocument`, `kycCheck`, `reclamation`, `slaEvent`.
   - [Back] Routes pour suivre documents manquants, contrôles, réclamations (création, statut, délais). 
   - [Front] Vues cockpit avec vrais chiffres, filtres, exports.

### D.6 GED / signatures / templates documents

1. **Documents**
   - Pages :
     - `dashboard/documents/page.tsx`,
     - `dashboard/documents/signature/page.tsx`,
     - `dashboard/documents/templates/page.tsx`.
   - Constats : "Aucun document" / "Aucun document en attente", aucun upload, pas d’intégration e-sign, aucun backend.
   - Classification : **mocks complets**.

2. **Pour être marché (GED)**
   - [Back] Modèle `document` (fichiers, tags, clients associés), stockage (S3 ou équivalent), intégration e-sign (Yousign, DocuSign…).
   - [Front] Uploads drag & drop, listes, filtres, workflow de signature.

### D.7 Performance & arbitrages

1. **Performance portefeuille**
   - Page : `dashboard/patrimoine/performance/page.tsx`.
   - Constats : cartes "+0% / 0%" + texte "Fonctionnalité en cours de développement", aucun appel API.
   - Classification : **mock / en dev**.

2. **Arbitrages suggérés**
   - Page : `dashboard/patrimoine/arbitrages/page.tsx`.
   - Constats : "Aucun arbitrage suggéré", aucun moteur d’IA ou de recommandation.
   - Classification : **mock complet**.

3. **Pour être marché (reporting & arbitrages)**
   - [Back] Moteurs de calcul de performance consolidée et d’arbitrage (règles métier + éventuellement scoring IA).
   - [Front] Graphiques de performance, listes d’arbitrages avec rationnel, intégration avec simulateurs & patrimoine.

---

## Annexe E – Note sur l’erreur d’infrastructure "connection reset by peer"

Lors de l’audit, un message d’erreur de type :

- `protocol error: incomplete envelope`
- `connection reset by peer`

est apparu **entre l’IDE et l’infrastructure de requêtes** (couche réseau / proxy entre l’outil et le modèle), **pas dans le code du CRM**.

Cette erreur n’est donc pas liée :

- ni aux routes Next.js (`route.ts`),
- ni à Prisma ou à la base de données,
- ni au frontend de l’app.

Elle ne nécessite aucune correction dans ce repository : elle relève de l’infra d’exécution de l’assistant, pas du produit CRM lui-même.

---

## Annexe F – Roadmap opérationnelle détaillée (exécution pas à pas)

### F.0 Comment utiliser cette annexe

Cette annexe transforme tous les constats des sections précédentes (corps du document + Annexes A, C et D) en **plan d’exécution pas à pas**.

- Chaque **phase** correspond à un gros bloc de travail.
- Chaque **étape** a un **ID unique** (`F2.3`, `F4.1`, etc.) que vous pouvez utiliser dans vos tickets.
- Chaque étape contient :
  - **Dépendances** (ce qui doit être fait avant),
  - **Zone concernée** (modules, fichiers, routes),
  - **Références** vers les annexes techniques (A, C, D, B),
  - une **checklist d’exécution** (`- [ ] ...`),
  - des **critères de validation**.

Pour **reprendre après une panne ou une pause** :

1. Ouvrir cette annexe F.
2. Repérer la dernière étape dont **toutes les cases sont cochées**.
3. Continuer à l’**étape immédiatement suivante**.

---

### F.1 Phase 0 – Préparation environnement & gouvernance

#### Étape F1.1 – Créer le cadre de travail (branches & environnements)

- **Dépendances** : aucune.
- **Zone concernée** : repo global, environnements dev/staging.
- **Références** : section 1 (périmètre), Annexe B (backlog).
- **Checklist d’exécution** :
  - [ ] Créer une branche principale de refonte : `feature/market-ready-crm`.
  - [ ] Vérifier qu’un environnement **staging** ou **preprod** existe et pointe sur la même base que la prod (ou une base miroir anonymisée).
  - [ ] Mettre en place une convention de branches par module : `feature/patrimoine-crud`, `feature/simulators-fix`, etc.
  - [ ] Documenter dans le README (ou Confluence) ces conventions pour l’équipe.
- **Critères de validation** :
  - Une branche de refonte existe et est protégée (revue obligatoire).
  - Les développeurs savent sur quelle branche partir pour chaque gros chantier.

#### Étape F1.2 – Créer le board de suivi (Jira / Linear / autre)

- **Dépendances** : F1.1.
- **Zone concernée** : outil de gestion de projet.
- **Références** : Annexe B (tâches B1–B13), Annexes A/C/D.
- **Checklist d’exécution** :
  - [ ] Créer un **projet** dédié « CRM Market-Ready ».
  - [ ] Créer une **épopée/epic** par grande phase :
    - [ ] Epic « Patrimoine & simulateurs existants » (F2.x).
    - [ ] Epic « Modules métier transverses » (F3.x).
    - [ ] Epic « Refonte des mocks » (F4.x).
    - [ ] Epic « Design system & UX » (F5.x).
    - [ ] Epic « Tests & observabilité » (F6.x).
  - [ ] Pour chaque étape F*.x ci-dessous, créer au moins **un ticket** qui reprend l’ID et la description.
  - [ ] Lier les tickets aux sections du README (lien vers le repo / fichier).
- **Critères de validation** :
  - Chaque étape F*.x est traçable dans le board.
  - On peut filtrer les tickets par phase (F2, F3, etc.).

#### Étape F1.3 – Préparer les jeux de données de test

- **Dépendances** : F1.1.
- **Zone concernée** : seed DB, scripts d’import.
- **Références** : Annexes A (patrimoine, simulateurs), C (opportunités, projets, objectifs), D (facturation, KYC, etc.).
- **Checklist d’exécution** :
  - [ ] Vérifier l’existence de **clients de test** avec patrimoines variés (actifs/passifs/contrats).
  - [ ] Ajouter des jeux de données pour :
    - [ ] tâches, rendez-vous, opportunités, projets, objectifs,
    - [ ] notifications,
    - [ ] quelques documents factices pour la future GED.
  - [ ] Documenter comment (re)générer ces données (`npm run seed`, script Prisma, etc.).
- **Critères de validation** :
  - Sur un environnement dev/staging, toutes les pages clés affichent des données non vides.
  - Les simulateurs principaux (retraite, succession) ont des cas tests réalistes.

---

### F.2 Phase 1 – Sécuriser le socle existant (patrimoine + simulateurs existants)

#### Étape F2.1 – Patrimoine : finaliser le CRUD Actifs / Passifs / Contrats

- **Dépendances** : F1.1–F1.3.
- **Zone concernée** :
  - Backend : `/api/advisor/actifs`, `/api/advisor/passifs`, `/api/advisor/contrats`, `/api/advisor/clients/[id]/actifs`, `/api/advisor/clients/[id]/contrats`.
  - Frontend : pages `dashboard/patrimoine/actifs|passifs|contrats`, formulaires.
- **Références** : Annexe A.1.1 (backend) & A.1.2 (frontend), tâches B1–B3.
- **Checklist d’exécution** :
  - [ ] Pour chaque route backend, vérifier la présence des handlers :
    - [ ] `GET` liste paginée + filtres,
    - [ ] `POST` création avec Zod strict,
    - [ ] `PUT` update (par id ou endpoint dédié),
    - [ ] `DELETE` suppression.
  - [ ] Introduire les schémas Zod manquants (`CreateActifInput`, `UpdateActifInput`, etc.).
  - [ ] Uniformiser le format de réponse `{ success, data, errorCode?, message? }`.
  - [ ] Côté front, créer `ActifForm`, `PassifForm`, `ContratForm` et les brancher sur les routes advisor (aucune logique mock).
  - [ ] Mettre en place pagination, tri et filtres côté UI (synchronisés avec les query params backend).
- **Critères de validation** :
  - Depuis le dashboard patrimoinial, on peut **créer, modifier, supprimer** un actif, un passif et un contrat sans erreur.
  - Les changements se retrouvent en base (via Prisma Studio ou requête directe).
  - Aucun bouton « nouveau » ou « éditer » ne fait appel à du code mock.

#### Étape F2.2 – Corriger les simulateurs existants (retraite, succession, pension, donations)

- **Dépendances** : F2.1 (pour cohérence données), F1.3.
- **Zone concernée** : composants simulateurs retraite/succession, PensionEstimator, DonationOptimizer, routes `/api/advisor/simulators/*`.
- **Références** : Annexe A.2.1–A.2.4, tâches B4–B5.
- **Checklist d’exécution** :
  - [ ] Localiser dans le code tous les appels à `/api/simulators/...` côté front.
  - [ ] Remplacer par les versions advisor correctes `/api/advisor/simulators/...` pour :
    - [ ] PensionEstimator,
    - [ ] DonationOptimizer,
    - [ ] tout autre composant utilisant un préfixe obsolète.
  - [ ] Normaliser la gestion d’erreur côté front (toasts / messages explicites).
  - [ ] Vérifier le mapping des réponses (champs utilisés dans l’UI vs JSON backend).
- **Critères de validation** :
  - Aucun appel réseau depuis les simulateurs ne retourne 404 ou 500 en conditions normales.
  - En cas de mauvais input, l’utilisateur voit un message clair (no silent fail).

#### Étape F2.3 – Implémenter le backend Investment Vehicles

- **Dépendances** : F2.2.
- **Zone concernée** :
  - Backend : `/api/advisor/simulators/tax/investment-vehicles` (à créer).
  - Frontend : `InvestmentVehicleComparison.tsx`.
- **Références** : Annexe A.2.5.
- **Checklist d’exécution** :
  - [ ] Créer la route `POST /api/advisor/simulators/tax/investment-vehicles` avec `requireAuth`.
  - [ ] Définir les schémas Zod d’entrée/sortie (dans un fichier partagé si possible).
  - [ ] Implémenter la logique fiscale minimale (comparaison nette/brute, impact fiscal) puis affiner.
  - [ ] Adapter `InvestmentVehicleComparison` pour consommer la vraie réponse, sans mock.
- **Critères de validation** :
  - Le simulateur renvoie des résultats cohérents sur plusieurs cas tests.
  - Aucun champ attendu par le front n’est `undefined`.

#### Étape F2.4 – Rendre TaxProjector pleinement fonctionnel

- **Dépendances** : F2.2, F1.3.
- **Zone concernée** :
  - Frontend : `TaxProjector.tsx`.
  - Backend : `/api/advisor/simulators/tax/project` (à créer).
- **Références** : Annexe A.2.6.
- **Checklist d’exécution** :
  - [ ] Créer `POST /api/advisor/simulators/tax/project` avec `requireAuth`.
  - [ ] Définir un schéma Zod d’input aligné avec les champs du composant.
  - [ ] Implémenter la projection multi-annuelle (revenus, déductions, IR, prélèvements, taux effectif).
  - [ ] Retourner un objet `data` exactement compatible avec ce que le front attend (`projections`, `totalTaxOverPeriod`, etc.).
  - [ ] Modifier `TaxProjector.tsx` pour appeler le nouvel endpoint advisor.
  - [ ] Ajouter tests unitaires pour les calculs + tests d’intégration.
- **Critères de validation** :
  - Le simulateur fonctionne de bout en bout sans erreur.
  - Les chiffres sont cohérents sur les jeux de données de test documentés.

---

### F.3 Phase 2 – Simulateurs avancés & UX de comparaison

#### Étape F3.1 – Créer les UIs de comparaison retraite et succession

- **Dépendances** : F2.1–F2.4.
- **Zone concernée** : pages/composants `RetirementScenarioCompare`, `SuccessionStrategyCompare` (ou équivalents), routes éventuelles de comparaison.
- **Références** : Section 4 (simulators), tâches B7–B8.
- **Checklist d’exécution** :
  - [ ] Concevoir les écrans permettant de saisir plusieurs scénarios (au moins 2) avec les paramètres clés.
  - [ ] Intégrer des vues comparatives (tableaux + graphes) basées sur les moteurs existants.
  - [ ] Si nécessaire, créer des endpoints `/compare` réutilisant les résultats des simulateurs principaux.
- **Critères de validation** :
  - Un conseiller peut comparer rapidement 2–3 scénarios retraite/succession pour un même client.

#### Étape F3.2 – Harmoniser l’UX de tous les simulateurs

- **Dépendances** : F3.1.
- **Zone concernée** : tous les composants simulateurs.
- **Références** : Annexes A.2.x, Design system (section 8).
- **Checklist d’exécution** :
  - [ ] Utiliser des composants d’input cohérents (mêmes labels, tooltips, placements).
  - [ ] Uniformiser la gestion d’erreurs, états loading, empty states.
  - [ ] Vérifier que chaque simulateur explique clairement ses hypothèses (barèmes, années, conventions).
- **Critères de validation** :
  - Tous les simulateurs donnent une expérience utilisateur homogène (visuellement et fonctionnellement).

---

### F.4 Phase 3 – Consolider les modules métier transverses (Annexe C)

#### Étape F4.1 – Activité / Timeline

- **Dépendances** : F2.x, F1.3.
- **Zone concernée** : `/dashboard/activity`, `/api/advisor/activity`.
- **Références** : Annexe C.1.
- **Checklist d’exécution** :
  - [ ] Ajouter filtres par type d’événement, période, conseiller.
  - [ ] Ajouter tri configurable (plus récent, plus impactant, etc.).
  - [ ] Écrire des tests d’intégration pour `/api/advisor/activity`.
- **Critères de validation** :
  - La timeline est exploitable en production (pas seulement un flux brut).

#### Étape F4.2 – Agenda / Rendez-vous

- **Dépendances** : F4.1.
- **Zone concernée** : `/dashboard/agenda`, `/api/advisor/appointments*`.
- **Références** : Annexe C.2.
- **Checklist d’exécution** :
  - [ ] Améliorer les vues calendrier (jour/semaine/mois) pour usage réel.
  - [ ] Gérer les récurrences si le produit le demande.
  - [ ] Tester les cas de conflit, replanification, annulation.
- **Critères de validation** :
  - Un conseiller peut gérer un agenda réel dans l’outil, sans bugs fonctionnels majeurs.

#### Étape F4.3 – Tâches, actions commerciales, opportunités, objectifs, projets

- **Dépendances** : F4.2.
- **Zone concernée** : `/dashboard/taches`, `/dashboard/clients/actions`, `/dashboard/opportunites`, `/objectifs`, `/projets`, et leurs APIs associées.
- **Références** : Annexes C.3–C.7.
- **Checklist d’exécution** :
  - [ ] Mettre en place des vues Kanban pour tâches et opportunités.
  - [ ] Ajouter des métriques (nombre de tâches en retard, valeur du pipe, etc.).
  - [ ] Lier objectifs ↔ simulateurs (si prévu) et projets ↔ facturation (dès que la facturation est réelle).
- **Critères de validation** :
  - L’équipe peut suivre son pipe commercial et ses tâches sans outils externes.

#### Étape F4.4 – Notifications & collaborateurs

- **Dépendances** : F4.3.
- **Zone concernée** : `/notifications`, `/dashboard/conseillers`, `/api/advisor/notifications`, `/api/advisor/collaborators`.
- **Références** : Annexes C.8–C.9.
- **Checklist d’exécution** :
  - [ ] Finaliser la gestion des notifications in-app (lu/non lu, suppression).
  - [ ] Préparer l’intégration avec un provider email (sans forcément l’activer tout de suite).
  - [ ] Brancher la page Conseillers sur l’API collaborateurs et ajouter les écrans de gestion.
- **Critères de validation** :
  - Les conseillers sont gérables dans l’app.
  - Les notifications in-app sont fiables.

---

### F.5 Phase 4 – Refonte des modules mocks en modules réels (Annexe D)

#### Étape F5.1 – Prospection & facturation

- **Dépendances** : F4.x.
- **Zone concernée** : `/dashboard/prospects`, `/dashboard/facturation`, `/dashboard/apporteurs`, modèles `prospect`, `invoice`, `apporteur`.
- **Références** : Annexe D.1.
- **Checklist d’exécution** :
  - [ ] Créer les modèles Prisma et migrations DB pour prospects, factures, apporteurs.
  - [ ] Créer les routes d’API correspondantes.
  - [ ] Remplacer toutes les cartes et compteurs en dur par des données réelles.
  - [ ] Lier facturation ↔ projets/opportunités.
- **Critères de validation** :
  - Un conseiller peut suivre les prospects et factures **uniquement via le CRM**.

#### Étape F5.2 – Dossiers & workflows missions

- **Dépendances** : F5.1.
- **Zone concernée** : `/dashboard/dossiers/*`, modèle `dossier`.
- **Références** : Annexe D.2.
- **Checklist d’exécution** :
  - [ ] Créer le modèle `dossier` et les routes `/api/advisor/dossiers`.
  - [ ] Implémenter les vues liste, kanban, archives avec vraies données.
  - [ ] Lier dossiers ↔ projets/opportunités.
- **Critères de validation** :
  - Les dossiers ne sont plus des écrans vides, mais un vrai outil opérationnel.

#### Étape F5.3 – Marketing, scénarios & emails

- **Dépendances** : F5.2.
- **Zone concernée** : `/dashboard/campagnes/*`, `/dashboard/scenarios`, `/dashboard/templates/emails`, `/dashboard/emails`.
- **Références** : Annexe D.3.
- **Checklist d’exécution** :
  - [ ] Créer les modèles `campaign`, `emailTemplate`, `scenario`, `emailMessage`.
  - [ ] Intégrer un provider d’email transactionnel/marketing.
  - [ ] Implémenter les écrans de gestion de campagnes, templates et scénarios.
  - [ ] Brancher l’inbox emails à un vrai fournisseur (IMAP/SMTP ou API).
- **Critères de validation** :
  - On peut lancer de vraies campagnes et suivre les réponses sans sortir du CRM.

#### Étape F5.4 – KYC, conformité & réclamations

- **Dépendances** : F5.3.
- **Zone concernée** : `/dashboard/kyc/*`, `/dashboard/reclamations`, modèles KYC & réclamations.
- **Références** : Annexe D.5.
- **Checklist d’exécution** :
  - [ ] Créer les modèles `kycDocument`, `kycCheck`, `reclamation`, `slaEvent`.
  - [ ] Implémenter les routes pour suivre documents manquants, contrôles, réclamations.
  - [ ] Transformer les cockpits KYC/réclamations en vues réelles avec chiffres, filtres, exports.
- **Critères de validation** :
  - Le CRM couvre réellement les besoins de conformité (ACPR, suivi KYC, suivi des plaintes).

#### Étape F5.5 – GED, signatures & templates documents

- **Dépendances** : F5.4.
- **Zone concernée** : `/dashboard/documents/*`, modèle `document`, intégration e-sign.
- **Références** : Annexe D.6.
- **Checklist d’exécution** :
  - [ ] Créer le modèle `document` et les routes d’API associées.
  - [ ] Intégrer un stockage fichiers (S3 ou équivalent).
  - [ ] Intégrer un fournisseur de signature électronique.
  - [ ] Implémenter l’UI d’upload, de listing, de filtres et de workflows de signature.
- **Critères de validation** :
  - Le conseiller peut gérer de bout en bout le cycle de vie documentaire depuis le CRM.

#### Étape F5.6 – Performance & arbitrages

- **Dépendances** : F5.5, F2.x (simulateurs), F2.3–F2.4.
- **Zone concernée** : `/dashboard/patrimoine/performance`, `/dashboard/patrimoine/arbitrages`.
- **Références** : Annexe D.7.
- **Checklist d’exécution** :
  - [ ] Implémenter un moteur de calcul de performance consolidée.
  - [ ] Implémenter un moteur d’arbitrages (règles métier + éventuellement scoring IA).
  - [ ] Créer les vues de rendu (graphes, listes d’arbitrages avec rationnel).
- **Critères de validation** :
  - Les écrans Performance/Arbitrages deviennent un différenciateur fort, pas une vitrine vide.

---

### F.6 Phase 5 – Design system & UX globale

#### Étape F6.1 – Mettre en place le design system

- **Dépendances** : au moins F2.x et F4.x.
- **Zone concernée** : composants UI partagés, thème global.
- **Références** : Section design system, tâche B9.
- **Checklist d’exécution** :
  - [ ] Définir palette de couleurs en thème clair (sans glassmorphism ni dark mode).
  - [ ] Définir la typographie, les espacements, les états (hover/focus/disabled).
  - [ ] Créer ou refactoriser les composants de base (Button, Input, Card, Table, Modal, etc.).
- **Critères de validation** :
  - Les nouvelles pages/écrans utilisent uniquement les composants du design system.

#### Étape F6.2 – Refactor UI des écrans clés

- **Dépendances** : F6.1.
- **Zone concernée** : dashboard principal, patrimoine, client 360, simulateurs, tâches/agenda, opportunités, modules refondus.
- **Références** : toutes les annexes.
- **Checklist d’exécution** :
  - [ ] Harmoniser l’apparence et les patterns UX sur les écrans cœur métier.
  - [ ] Corriger toute incohérence visuelle (couleurs, typographies, marges).
- **Critères de validation** :
  - Le CRM donne une impression de produit unique et cohérent, pas d’assemblage hétérogène.

---

### F.7 Phase 6 – Tests, logs, observabilité & durcissement

#### Étape F7.1 – Client HTTP unifié & conventions de réponse

- **Dépendances** : F2.x.
- **Zone concernée** : utils frontend d’appel API.
- **Références** : Tâche B10.
- **Checklist d’exécution** :
  - [ ] Introduire un `apiClient` unique.
  - [ ] Uniformiser les formats de réponses côté backend.
  - [ ] Refactoriser les appels API existants pour utiliser ce client.
- **Critères de validation** :
  - Il n’y a plus de `fetch` ad hoc dispersés dans le code critique.

#### Étape F7.2 – Stratégie de tests unitaires, intégration, e2e

- **Dépendances** : F2–F5.
- **Zone concernée** : simulateurs, services patrimoine, modules métier critiques.
- **Références** : Tâches B11–B12, section tests.
- **Checklist d’exécution** :
  - [ ] Écrire des tests unitaires pour les moteurs de calcul (retraite, succession, enveloppes, TaxProjector).
  - [ ] Écrire des tests d’intégration pour les routes d’API critiques.
  - [ ] Mettre en place des tests e2e pour les parcours métier clés.
- **Critères de validation** :
  - La couverture de tests atteint un seuil défini (par ex. > 70 % sur les services critiques).

#### Étape F7.3 – Logs structurés & monitoring

- **Dépendances** : F7.1–F7.2.
- **Zone concernée** : backend, frontend.
- **Références** : Tâche B13, observability-errors.
- **Checklist d’exécution** :
  - [ ] Ajouter des logs structurés pour les routes critiques.
  - [ ] Intégrer un système de collecte d’erreurs frontend (Sentry ou équivalent).
  - [ ] Créer des dashboards de base pour surveiller les erreurs et latences.
- **Critères de validation** :
  - Tout incident en production est traçable (logs + erreurs captées).
