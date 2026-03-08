# Spécification : Dossiers Intégrés avec Données Client & Simulateurs

## 1. Vision Générale

Transformer le module "Dossiers" d'un simple outil de suivi en une **plateforme de conseil complète** qui :
- **Agrège automatiquement** les données du client
- **Intègre les simulateurs** pour affiner les recommandations
- **Génère des documents PDF** professionnels

---

## 2. Architecture Fonctionnelle

### 2.1 Flux Utilisateur

```
┌─────────────────────────────────────────────────────────────────────────┐
│  1. CRÉATION DOSSIER                                                    │
│  └─> Sélection catégorie/type                                           │
│      └─> Choix du client                                                │
│          └─> IMPORT AUTO des données client pertinentes                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  2. ANALYSE & SIMULATION                                                │
│  └─> Visualisation des données client (patrimoine, revenus, etc.)       │
│      └─> Accès aux simulateurs contextuels                              │
│          └─> Enregistrement des scénarios simulés                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  3. PRÉCONISATIONS                                                      │
│  └─> Rédaction des recommandations                                      │
│      └─> Sélection des produits/solutions                               │
│          └─> Justification et argumentation                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  4. EXPORT PDF                                                          │
│  └─> Génération du document final                                       │
│      └─> Personnalisation (logo cabinet, charte graphique)              │
│          └─> Archivage et envoi au client                               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Détail par Catégorie de Dossier

### 3.1 PATRIMOINE - Bilan Patrimonial

#### Données Client Importées Automatiquement
| Section | Données | Source |
|---------|---------|--------|
| **Identité** | Nom, prénom, date naissance, situation familiale, régime matrimonial | Fiche client |
| **Revenus** | Salaires, BIC/BNC, revenus fonciers, dividendes, pensions | Module Revenus |
| **Charges** | Crédits en cours, pensions alimentaires, impôts | Module Charges |
| **Patrimoine Immobilier** | Biens, valeurs, encours crédit, loyers perçus | Module Patrimoine |
| **Patrimoine Financier** | AV, PEA, CTO, PER, liquidités | Module Patrimoine |
| **Patrimoine Professionnel** | Parts sociales, entreprises | Module Patrimoine |
| **Prévoyance** | Contrats santé, prévoyance, assurance emprunteur | Module Contrats |

#### Simulateurs Disponibles
- **Simulateur fiscal** : calcul IR, TMI, optimisation
- **Simulateur retraite** : estimation pension, âge de départ
- **Simulateur succession** : droits de succession, stratégies
- **Simulateur crédit** : capacité d'emprunt, mensualités
- **Simulateur rendement** : projection placements

#### Structure du PDF Généré
1. Page de garde personnalisée
2. Sommaire
3. Présentation du client et de sa situation
4. Analyse du patrimoine (graphiques camembert/barres)
5. Bilan fiscal
6. Projection retraite
7. Analyse successorale
8. Préconisations et recommandations
9. Annexes (simulations détaillées)
10. Mentions légales et signature

---

### 3.2 INVESTISSEMENT - Souscription Assurance-Vie

#### Données Client Importées
| Section | Données |
|---------|---------|
| **Profil investisseur** | Questionnaire MIF, horizon, tolérance risque |
| **Situation financière** | Revenus, épargne disponible, patrimoine financier |
| **Objectifs** | Retraite, transmission, revenus complémentaires |
| **Contrats existants** | AV en cours, versements, performances |

#### Simulateurs Disponibles
- **Simulateur épargne** : projection capital selon versements
- **Simulateur allocation** : répartition UC/fonds euros
- **Simulateur fiscalité AV** : impact rachat selon durée

#### Structure du PDF
1. Recueil des besoins client
2. Profil investisseur (scoring)
3. Analyse de la situation actuelle
4. Proposition d'allocation
5. Simulation de performance
6. Frais et conditions
7. Documents réglementaires (DIC, note d'information)

---

### 3.3 CRÉDIT - Financement Immobilier

#### Données Client Importées
| Section | Données |
|---------|---------|
| **Revenus** | Tous revenus du foyer |
| **Charges** | Crédits existants, loyers, pensions |
| **Apport** | Épargne disponible |
| **Situation pro** | Statut, ancienneté, stabilité |

#### Simulateurs Disponibles
- **Simulateur capacité d'emprunt**
- **Simulateur mensualités**
- **Simulateur assurance emprunteur**
- **Simulateur PTZ** (si éligible)
- **Comparateur banques**

#### Structure du PDF
1. Présentation du projet
2. Situation financière du client
3. Calcul de la capacité d'emprunt
4. Plan de financement proposé
5. Tableau d'amortissement
6. Comparatif des offres bancaires
7. Coût total du crédit

---

### 3.4 SUCCESSION - Préparation Successorale

#### Données Client Importées
| Section | Données |
|---------|---------|
| **Famille** | Conjoint, enfants, parents, autres héritiers |
| **Patrimoine complet** | Immobilier, financier, professionnel |
| **Donations passées** | Historique des donations |
| **Contrats AV** | Clause bénéficiaire, encours |

#### Simulateurs Disponibles
- **Simulateur droits de succession**
- **Simulateur donation** (quotité disponible, abattements)
- **Simulateur démembrement** (valeur usufruit/NP)
- **Simulateur assurance-vie succession**

#### Structure du PDF
1. Composition du foyer et héritiers
2. Inventaire patrimonial
3. Simulation succession "en l'état"
4. Scénarios d'optimisation
5. Impact des préconisations
6. Plan d'action recommandé

---

### 3.5 ASSURANCE - Prévoyance / Santé

#### Données Client Importées
| Section | Données |
|---------|---------|
| **Situation familiale** | Composition foyer, personnes à charge |
| **Situation pro** | Statut (salarié, TNS), revenus |
| **Contrats existants** | Couvertures actuelles |
| **Charges fixes** | Crédits, loyers |

#### Simulateurs Disponibles
- **Simulateur besoins prévoyance** (capital décès, IJ)
- **Simulateur garanties santé** (reste à charge)
- **Comparateur contrats**

#### Structure du PDF
1. Analyse des risques
2. Couvertures actuelles vs besoins
3. Écarts identifiés
4. Solutions proposées
5. Comparatif tarifs/garanties
6. Recommandation finale

---

## 4. Modèle de Données

### 4.1 Extension du Modèle Dossier

```prisma
model Dossier {
  // ... champs existants ...
  
  // Données client snapshot (copie au moment de la création)
  clientDataSnapshot    Json?     // Copie des données client pertinentes
  
  // Simulations effectuées
  simulations           DossierSimulation[]
  
  // Préconisations
  preconisations        DossierPreconisation[]
  
  // Documents générés
  documentsGeneres      DossierDocument[]
  
  // Workflow
  etapeActuelle         DossierEtape  @default(COLLECTE)
}

enum DossierEtape {
  COLLECTE      // Import données client
  ANALYSE       // Simulations et étude
  PRECONISATION // Rédaction recommandations
  VALIDATION    // Validation client
  CLOTURE       // Dossier finalisé
}

model DossierSimulation {
  id            String   @id @default(cuid())
  dossierId     String
  dossier       Dossier  @relation(fields: [dossierId], references: [id])
  simulateurType String   // "FISCAL", "RETRAITE", "SUCCESSION", etc.
  parametres    Json     // Paramètres d'entrée
  resultats     Json     // Résultats calculés
  selectionne   Boolean  @default(false) // Inclure dans le PDF
  createdAt     DateTime @default(now())
}

model DossierPreconisation {
  id            String   @id @default(cuid())
  dossierId     String
  dossier       Dossier  @relation(fields: [dossierId], references: [id])
  titre         String
  description   String
  produitId     String?  // Lien vers un produit du catalogue
  priorite      Int      @default(1)
  ordre         Int
  createdAt     DateTime @default(now())
}

model DossierDocument {
  id            String   @id @default(cuid())
  dossierId     String
  dossier       Dossier  @relation(fields: [dossierId], references: [id])
  type          DocumentType
  nom           String
  url           String
  taille        Int
  createdAt     DateTime @default(now())
}

enum DocumentType {
  BILAN_PATRIMONIAL
  RAPPORT_CONSEIL
  SIMULATION
  RECUEIL_BESOINS
  PROPOSITION_COMMERCIALE
  MANDAT
  AUTRE
}
```

---

## 5. Composants UI à Développer

### 5.1 Composant Principal : DossierWorkspace

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [←] Retour   │   Dossier #2024-001 - Bilan Patrimonial M. Dupont      │
├───────────────┼─────────────────────────────────────────────────────────┤
│               │                                                         │
│  ○ Collecte   │  ┌─────────────────────────────────────────────────┐   │
│  ● Analyse    │  │  PATRIMOINE GLOBAL                              │   │
│  ○ Préco.     │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐        │   │
│  ○ Validation │  │  │ Immo.    │ │ Financier│ │ Pro.     │        │   │
│  ○ Clôture    │  │  │ 450 000€ │ │ 180 000€ │ │ 50 000€  │        │   │
│               │  │  └──────────┘ └──────────┘ └──────────┘        │   │
│ ─────────────│  └─────────────────────────────────────────────────┘   │
│               │                                                         │
│  SIMULATEURS  │  ┌─────────────────────────────────────────────────┐   │
│  [Fiscal]     │  │  SIMULATIONS EFFECTUÉES                         │   │
│  [Retraite]   │  │  ☑ Simulation fiscale #1 - Économie 3 200€     │   │
│  [Succession] │  │  ☐ Simulation retraite #1 - Départ 64 ans      │   │
│  [Crédit]     │  │  [+ Nouvelle simulation]                        │   │
│               │  └─────────────────────────────────────────────────┘   │
│               │                                                         │
│ ─────────────│  [Générer PDF]  [Envoyer au client]                     │
└───────────────┴─────────────────────────────────────────────────────────┘
```

### 5.2 Composants à Créer

| Composant | Description |
|-----------|-------------|
| `DossierWorkspace` | Conteneur principal avec navigation par étapes |
| `ClientDataImporter` | Affiche et permet de sélectionner les données client à importer |
| `PatrimoineSnapshot` | Vue synthétique du patrimoine (graphiques) |
| `SimulateurPanel` | Panneau latéral pour accéder aux simulateurs |
| `SimulationCard` | Carte affichant une simulation avec option de sélection |
| `PreconisationEditor` | Éditeur de préconisations avec drag & drop |
| `PdfPreview` | Aperçu du PDF avant génération |
| `PdfGenerator` | Service de génération PDF (react-pdf / puppeteer) |

---

## 6. Intégration des Simulateurs Existants

### 6.1 Inventaire des Simulateurs Disponibles (EXISTANTS)

**✅ DISPONIBLES DANS LE CODEBASE :**

| Catégorie | Simulateurs | Chemin |
|-----------|-------------|--------|
| **Fiscal** | Impôt sur le revenu | `/simulateurs/impot-revenu/` |
| | Enveloppe fiscale | `/simulateurs/enveloppe-fiscale/` |
| | Stratégie fiscale comparée | `/simulateurs/tax-strategy-comparison/` |
| | Projecteur fiscal | `/simulateurs/tax-projector/` |
| **Retraite** | Retraite (général) | `/simulateurs/retirement/` |
| | Retraite (comparatif) | `/simulateurs/retirement-comparison/` |
| | Pension | `/simulateurs/pension/` |
| | PER Salariés | `/simulateurs/per-salaries/` |
| | PER TNS | `/simulateurs/per-tns/` |
| **Succession** | Succession | `/simulateurs/succession/` |
| | Succession (comparatif) | `/simulateurs/succession-comparison/` |
| | Optimisation donation | `/simulateurs/donation-optimizer/` |
| **Crédit** | Capacité d'emprunt | `/simulateurs/capacite-emprunt/` |
| | Mensualités | `/simulateurs/mensualite/` |
| | PTZ | `/simulateurs/ptz/` |
| **Immobilier** | Immobilier (complet) | `/simulateurs/immobilier/` |
| | LMNP | `/simulateurs/immobilier/_hooks/useLMNPSimulator.ts` |
| **Épargne** | Épargne projection | `/simulateurs/epargne/` |
| | Assurance-vie | `/simulateurs/assurance-vie/` |
| | Comparatif véhicules | `/simulateurs/investment-vehicle-comparison/` |
| **Prévoyance** | Prévoyance TNS | `/simulateurs/prevoyance-tns/` |

**Total : 20+ simulateurs déjà développés !**

### 6.2 API Simulateurs

Chaque simulateur devra exposer :

```typescript
interface Simulateur<TInput, TOutput> {
  type: SimulateurType
  label: string
  description: string
  
  // Formulaire d'entrée
  getDefaultInputs(clientData: ClientSnapshot): TInput
  validateInputs(inputs: TInput): ValidationResult
  
  // Calcul
  calculate(inputs: TInput): TOutput
  
  // Rendu
  renderResults(results: TOutput): React.ReactNode
  
  // Export
  toPdfSection(results: TOutput): PdfSection
}
```

---

## 7. Génération PDF

### 7.1 Stack Technique Recommandée

**Option 1 : @react-pdf/renderer** (recommandé)
- Génération côté client ou serveur
- Composants React pour le layout
- Bon pour documents structurés

**Option 2 : Puppeteer + HTML/CSS**
- Rendu HTML vers PDF
- Plus flexible pour le design
- Nécessite un serveur

### 7.2 Templates PDF par Type

```
/templates/pdf/
├── BilanPatrimonial/
│   ├── PageGarde.tsx
│   ├── Sommaire.tsx
│   ├── SectionPatrimoine.tsx
│   ├── SectionFiscal.tsx
│   ├── SectionPreconisations.tsx
│   └── Annexes.tsx
├── PropositionInvestissement/
│   ├── ...
├── EtudeFi nancement/
│   ├── ...
└── common/
    ├── Header.tsx
    ├── Footer.tsx
    ├── Charts.tsx
    └── Tables.tsx
```

---

## 8. Roadmap de Développement

### Phase 1 : Fondations (2-3 semaines)
- [ ] Extension modèle Prisma (DossierSimulation, DossierPreconisation, DossierDocument)
- [ ] Composant DossierWorkspace avec navigation par étapes
- [ ] Import automatique données client (snapshot)
- [ ] Vue synthétique patrimoine dans le dossier

### Phase 2 : Simulateurs (2-3 semaines)
- [ ] Inventaire et refactoring des simulateurs existants
- [ ] Interface commune Simulateur
- [ ] Intégration dans DossierWorkspace
- [ ] Sauvegarde des simulations dans le dossier

### Phase 3 : Préconisations (1-2 semaines)
- [ ] Éditeur de préconisations
- [ ] Lien avec catalogue produits
- [ ] Argumentaire et justifications

### Phase 4 : PDF (2-3 semaines)
- [ ] Setup @react-pdf/renderer
- [ ] Templates par type de dossier
- [ ] Personnalisation cabinet (logo, couleurs)
- [ ] Génération et stockage

### Phase 5 : Finalisation (1 semaine)
- [ ] Tests end-to-end
- [ ] Optimisations performance
- [ ] Documentation utilisateur

---

## 9. Estimation Effort

| Phase | Durée | Complexité |
|-------|-------|------------|
| Fondations | 2-3 semaines | Moyenne |
| Simulateurs | 2-3 semaines | Haute |
| Préconisations | 1-2 semaines | Moyenne |
| PDF | 2-3 semaines | Haute |
| Finalisation | 1 semaine | Basse |
| **Total** | **8-12 semaines** | - |

---

## 10. Questions Ouvertes

1. **Simulateurs existants** : Quels simulateurs sont déjà développés dans l'application ?
2. **Charte graphique PDF** : Existe-t-il une charte graphique cabinet à respecter ?
3. **Stockage PDF** : Stockage local ou cloud (S3, Cloudinary) ?
4. **Signature électronique** : Intégration avec un service de signature ?
5. **Conformité** : Quels documents réglementaires inclure (DDA, MIF2, RGPD) ?

---

## 11. Prochaines Étapes

1. **Validation de la spec** par le métier
2. **Inventaire des simulateurs** existants
3. **Maquettes UI** pour le DossierWorkspace
4. **POC PDF** avec un template simple
5. **Démarrage Phase 1**
