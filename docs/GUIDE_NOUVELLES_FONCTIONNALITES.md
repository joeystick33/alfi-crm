# 📖 Guide des Nouvelles Fonctionnalités - Aura CRM

> Guide pratique pour utiliser les nouvelles fonctionnalités intégrées

---

## 🆕 Création Client (Wizard 7 Étapes)

### Accès
`/dashboard/clients/nouveau`

### Étapes

#### Étape 1 : Type de Relation
- **Prospect** : Contact potentiel en phase de découverte
- **Client** : Client actif avec contrats/gestion
- **Particulier** : Personne physique
- **Professionnel** : Entreprise, société, indépendant

#### Étape 2 : Identification
- Civilité obligatoire (M., Mme, Mlle)
- Nom et prénom obligatoires
- Date de naissance obligatoire
- Nationalité et résidence fiscale

#### Étape 3 : Coordonnées
- Email obligatoire (validation format)
- Téléphone mobile recommandé
- Adresse postale complète

#### Étape 4 : Situation Familiale
- Situation matrimoniale
- Régime matrimonial (si marié/pacsé)
- Nombre d'enfants
- Personnes à charge fiscalement

#### Étape 5 : Situation Professionnelle
- Catégorie socio-professionnelle
- Type de contrat
- Employeur
- Revenus annuels bruts

#### Étape 6 : Patrimoine Estimé
- Actifs financiers (assurance-vie, PEA...)
- Actifs immobiliers
- Autres actifs
- Total des dettes
- → Patrimoine net calculé automatiquement

#### Étape 7 : KYC / MIF II
- Profil de risque (Prudent → Offensif)
- Horizon d'investissement
- Objectif principal
- Connaissance des marchés (0-100)
- PEP (Personne Politiquement Exposée)
- Origine des fonds

### Fonctionnalités
- ✅ **Sauvegarde brouillon** : Enregistrez à tout moment
- ✅ **Validation progressive** : Erreurs affichées par étape
- ✅ **Navigation libre** : Retour arrière possible

---

## 💰 Tab Budget

### Accès
Client360 → Onglet "Budget"

### KPIs Affichés
- **Revenus mensuels** : Total des sources de revenus
- **Charges mensuelles** : Total des dépenses
- **Épargne mensuelle** : Revenus - Charges
- **Reste à vivre** : Après charges incompressibles

### Fonctionnalités
- Ajout/modification revenus par catégorie
- Ajout/modification charges par catégorie
- Visualisation graphique répartition
- **Alertes automatiques** :
  - Épargne insuffisante (<10%)
  - Charges logement trop élevées (>33%)
  - Reste à vivre critique
- **Recommandations personnalisées**

---

## 📊 Tab Fiscalité

### Accès
Client360 → Onglet "Fiscalité"

### Calculs Disponibles

#### Impôt sur le Revenu (IR)
- Barèmes 2024 officiels
- Quotient familial automatique
- TMI (Tranche Marginale d'Imposition)
- Détail par tranche

#### IFI (Impôt sur la Fortune Immobilière)
- Seuil 1,3 M€
- Abattement 30% résidence principale
- Barème progressif
- Détail des biens concernés

### Optimisations Suggérées
- PER : Déduction revenus imposables
- Madelin : TNS et professions libérales
- Défiscalisation immobilière
- FCPI/FIP : Réduction IR

---

## 👨‍👩‍👧‍👦 Tab Famille

### Accès
Client360 → Onglet "Famille"

### Informations Membres
- **Conjoint** : Revenus, profession, régime
- **Enfants** : Âge, dépendance fiscale
- **Ascendants** : À charge ou non
- **Autres** : Personnes à charge

### KPIs
- Nombre total membres
- Dépendants fiscaux
- Revenus famille cumulés
- Impact quotient familial

---

## 📑 Tab Contrats

### Accès
Client360 → Onglet "Contrats"

### Types de Contrats (9)
| Type | Catégorie |
|------|-----------|
| Assurance-vie | Épargne |
| PER | Épargne |
| PEA | Épargne |
| Compte-titres | Épargne |
| Livret | Épargne |
| Crédit immobilier | Crédit |
| Crédit consommation | Crédit |
| Prévoyance | Prévoyance |
| Santé/Mutuelle | Prévoyance |

### Indicateurs
- Badge **"Géré"** pour contrats sous gestion cabinet
- Valeur actuelle
- Mensualité
- Taux d'intérêt (crédits)

---

## ✅ Tab KYC Enrichi

### Accès
Client360 → Onglet "KYC & Conformité"

### Nouveautés

#### Progress Bar
- % de complétion KYC
- Documents manquants listés
- Alertes expiration

#### Score MIF II
- Score global /100
- Connaissance marchés
- Capacité financière
- Recommandation produits adaptés

#### LCB-FT (Anti-blanchiment)
- Statut PEP
- Origine des fonds
- Source du patrimoine
- Niveau de risque
- Vigilance renforcée si nécessaire

---

## 🎯 Tab Objectifs Enrichi

### Accès
Client360 → Onglet "Objectifs & Projets"

### Types d'Objectifs (9)
- 🏠 Achat immobilier
- 🎓 Éducation enfants
- 🏖️ Retraite
- 👨‍👩‍👧 Transmission
- 💰 Optimisation fiscale
- 📈 Revenus complémentaires
- 🛡️ Protection capital
- ✈️ Voyage / Loisirs
- 📌 Autre

### Priorités
- 🔴 Haute
- 🟠 Moyenne
- 🟢 Basse

### Statuts (6)
| Statut | Signification |
|--------|---------------|
| Non démarré | Objectif créé mais pas d'action |
| En cours | Actions en cours |
| En bonne voie | Progression satisfaisante |
| À risque | Retard ou problème détecté |
| Atteint | Objectif réalisé |
| Abandonné | Objectif annulé |

### Calcul Temps Restant
- Affichage automatique en jours/mois/années
- Code couleur selon urgence :
  - 🟢 > 90 jours
  - 🟠 30-90 jours
  - 🔴 < 30 jours

---

## 💡 Moteur Opportunités

### Accès
Client360 → Onglet "Opportunités"
Ou : Bouton "Détecter opportunités"

### Règles de Détection (8)

| Règle | Déclencheur |
|-------|-------------|
| Diversification | >70% patrimoine sur un type d'actif |
| Préparation retraite | 50+ ans sans épargne retraite |
| Optimisation fiscale | TMI ≥30% |
| Assurance-vie | Aucune assurance-vie détectée |
| Planification succession | 60+ ans, patrimoine >300k€ |
| Restructuration dettes | Ratio dettes/revenus >33% |
| Investissement immo | Épargne disponible, pas d'immo |
| PER | TMI élevée sans PER |

### Scoring
- Score 0-100 par opportunité
- Priorité automatique (HIGH/MEDIUM/LOW)
- Gain potentiel estimé en €

---

## 📅 Agenda (Rappel)

### Fonctionnalités Complètes
- Vue jour/semaine/mois
- Récurrence (quotidien, hebdo, mensuel)
- Types : Premier RDV, Suivi, Bilan annuel, Signature, Appel, Visio
- Visioconférence intégrée
- Rappels automatiques
- Collaborateurs

---

## ✔️ Tâches (Rappel)

### Fonctionnalités Complètes
- Vue Kanban drag & drop
- Vue liste avec tri
- Filtres : Priorité, Type, Client
- Statuts : À faire, En cours, Terminé
- Priorités : Urgente, Haute, Moyenne, Basse
- Assignation et deadlines

---

## 🔧 Configuration Requise

### Migration Base de Données
Avant première utilisation :
```bash
cd /chemin/vers/aura-crm
npx prisma generate
npx prisma migrate dev --name nouvelles_fonctionnalites
```

### Variables d'Environnement
Aucune nouvelle variable requise.

---

*Guide mis à jour - Novembre 2025*
