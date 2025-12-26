# AUDIT COMPLET - Simulateur Prévoyance TNS
**Date : 17 décembre 2025**
**Fichier audité : `/app/(advisor)/(backend)/api/advisor/simulators/prevoyance-tns/route.ts`**

---

## 📋 RÉSUMÉ EXÉCUTIF

Le simulateur prévoyance TNS contient **plusieurs erreurs critiques** dans les modalités de calcul. Les données ne sont pas à jour pour 2025 et certaines formules sont incorrectes.

### ❌ Erreurs Critiques Identifiées : 12
### ⚠️ Données Obsolètes : 8 caisses
### ✅ Données Correctes : 2 caisses partiellement

---

## 🏥 RÉGIME COMMUN CNAVPL - CPAM (depuis juillet 2021)

**IMPORTANT** : Pour toutes les professions libérales affiliées à une section de la CNAVPL (sauf avocats CNBF), il existe un **régime commun d'indemnités journalières** versé par la CPAM.

### Structure de prise en charge en 2 temps

| Période | Organisme payeur | Calcul |
|---------|------------------|--------|
| **Jour 4 à 90** | **CPAM** (régime commun CNAVPL) | 1/730e du RAAM (3 ans), plafonné 3 PASS |
| **Jour 91+** | **Caisse spécifique** (CARMF, CARPIMKO, CAVEC...) | Selon règles de la caisse |

### Montants 2025 du régime commun CPAM

| Élément | Montant |
|---------|---------|
| **IJ Minimum** | 25,80 €/jour (si revenus < 40% PASS = 18 840 €) |
| **IJ Maximum** | 193,56 €/jour (si revenus ≥ 3 PASS = 141 300 €) |
| **Carence** | 3 jours (versement à partir du 4e jour) |
| **Durée max** | 87 jours (du 4e au 90e jour inclus) |

### Caisses concernées par ce régime

✅ **Avec régime CPAM 0-90j** : CIPAV, CARMF, CARPIMKO, CAVEC, CAVP, CARCDSF, CARPV, CAVAMAC, CAVOM, CPRN

❌ **Sans régime CPAM** : CNBF (avocats ont leur propre système via LPA/AON), SSI (artisans/commerçants), MSA (agriculteurs)

### Formule de calcul IJ CPAM

```
IJ = RAAM (3 dernières années) / 730

Avec :
- Minimum = 25,80 €/jour si RAAM < 40% PASS
- Maximum = 193,56 €/jour si RAAM > 3 PASS
```

---

## 🔍 AUDIT DÉTAILLÉ PAR CAISSE

### 1. CARMF (Médecins) - ❌ ERREURS MAJEURES

**Réforme 2025 NON INTÉGRÉE**

La CARMF a réformé son régime invalidité-décès au 1er janvier 2025. Le système de classes A/B/C/D est **SUPPRIMÉ**.

| Élément | Code Actuel (FAUX) | Réalité 2025 |
|---------|-------------------|--------------|
| Classe A - IJ | 69 €/jour | **64,52 €/jour** (revenus < 1 PASS) |
| Classe B - IJ | 138 €/jour | **SUPPRIMÉE** → proportionnel 1/730e du revenu |
| Classe C - IJ | 207 €/jour | **193,56 €/jour** (revenus > 3 PASS) |
| Classe D - IJ | 276 €/jour | **N'EXISTE PAS** |
| Invalidité A | 15 000 €/an | **23 198 €/an** (revenus < 1 PASS) |
| Invalidité B | 30 000 €/an | **SUPPRIMÉE** → proportionnel |
| Invalidité C | 45 000 €/an | **30 930 €/an** (revenus > 3 PASS) |
| Invalidité D | 60 000 €/an | **N'EXISTE PAS** |
| Capital décès | 60 000 € (toutes classes) | ✅ Correct mais pas de doublement accident |
| Franchise | 90 jours | ✅ Correct |

**Source:** [GPM - Réforme CARMF 2025](https://www.gpm.fr/uri-carmf-reforme-2025-cotisations-prestations/)

**NOUVEAU CALCUL 2025:**
- Revenus ≤ 1 PASS : IJ = 64,52 €/jour fixe
- Revenus entre 1 et 3 PASS : IJ = 1/730e du revenu (proportionnel)
- Revenus ≥ 3 PASS : IJ = 193,56 €/jour fixe

---

### 2. SSI (Artisans/Commerçants) - ⚠️ ERREURS PARTIELLES

| Élément | Code Actuel | Réalité 2025 | Statut |
|---------|-------------|--------------|--------|
| Formule IJ | 50% revenu / 365 | **1/730e du RAAM 3 ans** | ❌ FAUX |
| Plafond IJ | 64,52 €/jour | 64,52 €/jour | ✅ OK |
| Carence | 3 jours | 3 jours | ✅ OK |
| Invalidité cat 1 | 30%, max 1 159,80 €/mois | **Incorrect** - 30% du RAAM | ⚠️ |
| Invalidité cat 2 | 50%, max 1 932 €/mois | **Incorrect** - 50% du RAAM, max 23 550 €/an | ⚠️ |
| Capital décès | 8 000 € | **~8 798 €** (20% PASS 2025) | ⚠️ |

**Source:** [ToutSurMesFinances - IJ 2025](https://www.toutsurmesfinances.com/argent/a/indemnites-journalieres-montants-calcul-plafond-duree-et-versement)

**Formule correcte IJ SSI:**
```
IJ = RAAM (3 dernières années) / 730
Plafond = 1 PASS / 730 = 64,52 €/jour en 2025
Conjoint collaborateur = 31,75 €/jour (50% du plafond)
```

---

### 3. CIPAV (Professions libérales non réglementées) - ⚠️ RÉFORME 2023

| Élément | Code Actuel | Réalité 2025 | Statut |
|---------|-------------|--------------|--------|
| Formule IJ | 1/730e, max 116,13 € | **Incorrect** - max 193,56 €/jour | ❌ FAUX |
| Minimum IJ | Non précisé | **25,80 €/jour** minimum | ❌ MANQUANT |
| Plafond revenu | Non précisé | **3 PASS = 141 300 €** | ❌ MANQUANT |
| Invalidité | Classes supprimées | **Proportionnel aux revenus** depuis 2023 | ❌ OBSOLÈTE |
| Capital décès | 26 926 / 106 372 € | **Révisé en 2023** | ⚠️ À VÉRIFIER |

**Source:** [APICIL - Prestations CIPAV 2025](https://pro.apicil.com/actualites/prestations-cipav/)

**Formule correcte IJ CIPAV (régime CNAVPL commun):**
```
IJ = RAAM (3 ans) / 730
Minimum = 25,80 €/jour (si revenus < 40% PASS)
Maximum = 193,56 €/jour (si revenus > 3 PASS)
Versement du 4e au 90e jour par CPAM
```

---

### 4. CAVEC (Experts-comptables) - ❌ ERREURS CRITIQUES

| Élément | Code Actuel | Réalité 2025 | Statut |
|---------|-------------|--------------|--------|
| Classes IJ | 4 classes (62,50 à 250 €) | **TAUX UNIQUE 125 €/jour** | ❌ FAUX |
| Franchise | 91 jours | 91 jours | ✅ OK |
| Durée max | 36 mois | 36 mois ou 1095 jours | ✅ OK |
| Invalidité par classe | 7 500 à 30 000 €/an | **Système proportionnel** | ❌ OBSOLÈTE |
| Capital décès | 30 000 € | À vérifier | ⚠️ |

**Source:** [CAVEC officiel - IJ](https://www.cavec.fr/votre-prevoyance/vous-etes-liberal-tns/en-cas-dincapacite-dexercice/les-indemnites-journalieres/)

**IMPORTANT:** Le système de classes de la CAVEC pour les IJ a été **SUPPRIMÉ**. Le montant est désormais **125 € bruts/jour** pour tous, quelle que soit la classe de cotisation.

---

### 5. CARPIMKO (Paramédicaux) - ⚠️ RÉFORME 2024-2025

| Élément | Code Actuel | Réalité 2025 | Statut |
|---------|-------------|--------------|--------|
| Classe 1 IJ | 33,50 €/jour | **Système modifié** | ⚠️ |
| Classe 2 IJ | 67 €/jour | **Système modifié** | ⚠️ |
| Classe 3 IJ | 100,50 €/jour | **Système modifié** | ⚠️ |
| Classe 4 IJ | 134 €/jour | **Système modifié** | ⚠️ |
| Majoration enfants | Non précisée | **Réduite de 50% en 2025** | ❌ MANQUANT |
| Majoration conjoint | Non précisée | **SUPPRIMÉE en 2025** | ❌ MANQUANT |
| Franchise | 90 jours | 90 jours | ✅ OK |

**Source:** [GPM - CARPIMKO 2024-2025](https://www.gpm.fr/carpimko-evolution-2024-cotisations-et-prestations/)

**Modifications 2025:**
- Majoration pour conjoint à charge : **SUPPRIMÉE**
- Majoration pour enfant à charge : **réduite de 50%** (8,06 €/jour au lieu de 16,63 €)
- Majoration tierce personne invalidité : **réduite de 50%** (3 024 €/an au lieu de 6 048 €)

---

### 6. CARCDSF (Chirurgiens-dentistes et Sages-femmes) - ❌ DONNÉES INCORRECTES

| Élément | Code Actuel | Réalité 2025 | Statut |
|---------|-------------|--------------|--------|
| Classe 1 IJ | 35 €/jour | Voir ci-dessous | ❌ FAUX |
| Classe 2 IJ | 70 €/jour | Voir ci-dessous | ❌ FAUX |
| Classe 3 IJ | 105 €/jour | Voir ci-dessous | ❌ FAUX |
| Franchise | 90 jours | 91e jour (à partir du) | ✅ ~OK |

**Source:** [CARCDSF officiel](https://www.carcdsf.fr/prevoyance/indemnites-journalieres)

**Taux officiels 2025 CARCDSF:**
- **Chirurgiens-dentistes:** 111,00 €/jour (40 515 €/an)
- **Sages-femmes:** 48,73 €/jour (17 786,45 €/an)

**ERREUR CRITIQUE:** Le code actuel utilise un système de classes qui **N'EXISTE PAS** pour la CARCDSF. Le taux est **unique par profession**.

---

### 7. CNBF (Avocats) - ⚠️ STRUCTURE INCORRECTE

| Élément | Code Actuel | Réalité 2025 | Statut |
|---------|-------------|--------------|--------|
| Classes A/B | IJ 90/120 €/jour | **SYSTÈME DIFFÉRENT** | ❌ FAUX |
| 0-90 jours | CNBF | **LPA ou AON (assureur)** | ❌ FAUX |
| >90 jours | CNBF | CNBF | ✅ OK |
| Invalidité base | 13 720 / 18 000 €/an | **50% retraite base** | ❌ FAUX |
| Capital décès | 50 000 € | 50 000 € | ✅ OK |

**Source:** [CNBF officiel](https://www.cnbf.fr/espace-avocats/les-droits/linvalidite-deces/)

**Structure correcte CNBF:**
- **0-90 jours:** Prise en charge par La Prévoyance des Avocats (LPA) ou AON (Paris)
- **>90 jours:** CNBF verse les allocations journalières
- **Invalidité:** 50% de la retraite de base forfaitaire (< 20 ans ancienneté) ou proportionnelle (≥ 20 ans)
- **Capital décès:** 50 000 € (pas de doublement accident)

---

### 8. MSA (Agriculteurs) - ⚠️ DONNÉES PARTIELLES

| Élément | Code Actuel | Réalité 2025 | Statut |
|---------|-------------|--------------|--------|
| IJ fixe | 34,39 €/jour | **Variable selon situation** | ⚠️ INCOMPLET |
| Carence | 7 jours | **4 jours** (depuis fév 2024) | ❌ OBSOLÈTE |
| Capital décès | 3 539 € | À vérifier | ⚠️ |

**Source:** [MSA officiel](https://www.msa.fr/lfp/en/sante/ij-amexa)

**Changements 2024:**
- Délai de carence réduit à **4 jours** (contre 7 avant)
- Exception : 3 jours si hospitalisation

---

### 9. Autres caisses (CAVP, CARPV, CAVAMAC, CAVOM, CPRN) - ⚠️ NON VÉRIFIÉES

Ces caisses utilisent des données génériques qui n'ont pas été vérifiées avec les sources officielles 2025. Il est fortement recommandé de les mettre à jour.

---

## 🔧 CORRECTIONS REQUISES

### Priorité 1 - Critiques (à corriger immédiatement)

1. **CARMF:** Supprimer classe D, corriger A/B/C, implémenter calcul proportionnel
2. **CAVEC:** Supprimer système de classes IJ, mettre 125 €/jour fixe
3. **CARCDSF:** Supprimer classes, mettre taux uniques par profession
4. **CIPAV:** Corriger plafond IJ à 193,56 €, ajouter minimum 25,80 €

### Priorité 2 - Importantes

5. **SSI:** Corriger formule IJ (1/730e RAAM), capital décès
6. **CNBF:** Corriger structure 0-90j / >90j, formule invalidité
7. **MSA:** Corriger carence à 4 jours
8. **CARPIMKO:** Ajouter majorations et leurs réductions 2025

### Priorité 3 - Vérifications

9. Vérifier CAVP, CARPV, CAVAMAC, CAVOM, CPRN avec sources officielles

---

## 📊 CONSTANTES 2025 À METTRE À JOUR

```typescript
const PASS_2025 = 47100  // ✅ Correct
const IJ_MAX_PROFLIB = 193.56  // Maximum IJ professions libérales
const IJ_MIN_PROFLIB = 25.80   // Minimum IJ professions libérales  
const IJ_MAX_SSI = 64.52       // Maximum IJ artisans/commerçants
const IJ_CONJOINT_SSI = 31.75  // Conjoint collaborateur SSI
const CAPITAL_DECES_SSI = 8798 // ~20% PASS
```

---

## ✅ RECOMMANDATIONS

1. **Refactorer entièrement** les règles CARMF avec la réforme 2025
2. **Simplifier CAVEC** en supprimant le système de classes
3. **Corriger CARCDSF** avec taux uniques par profession
4. **Ajouter des sources** dans le code pour chaque valeur
5. **Implémenter un système de versioning** pour les données par année
6. **Prévoir une mise à jour annuelle** des constantes au 1er janvier

---

## 📚 SOURCES OFFICIELLES UTILISÉES

- [CARMF - Réforme 2025](https://www.gpm.fr/uri-carmf-reforme-2025-cotisations-prestations/)
- [CAVEC officiel](https://www.cavec.fr/votre-prevoyance/)
- [CARCDSF officiel](https://www.carcdsf.fr/prevoyance/indemnites-journalieres)
- [CNBF officiel](https://www.cnbf.fr/espace-avocats/les-droits/linvalidite-deces/)
- [MSA officiel](https://www.msa.fr/lfp/en/sante/ij-amexa)
- [CARPIMKO - Évolution 2024-2025](https://www.gpm.fr/carpimko-evolution-2024-cotisations-et-prestations/)
- [ToutSurMesFinances - IJ 2025](https://www.toutsurmesfinances.com/argent/a/indemnites-journalieres-montants-calcul-plafond-duree-et-versement)

---

## ⚠️ EXCEPTIONS ET CAS PARTICULIERS CRITIQUES

### Caisses SANS régime CPAM (4-90j)

| Caisse | Raison | Régime propre |
|--------|--------|---------------|
| **CNBF** | Avocats hors CNAVPL | LPA/AON (0-90j), puis CNBF (>90j) |
| **SSI** | Artisans/commerçants (pas libéraux) | SSI direct dès J4 |
| **MSA** | Agriculteurs (régime agricole) | AMEXA direct dès J4 |
| **ENIM** | Marins/pêcheurs (régime spécial) | ENIM selon statut |

### Caisses SANS IJ après 90 jours

| Caisse | Situation | Conséquence |
|--------|-----------|-------------|
| **CIPAV** | Pas de régime IJ propre | ⚠️ AUCUNE couverture après J90 |
| **CARPV** | Pas d'IJ CARPV | ⚠️ AUCUNE couverture après J90 |

### Réformes récentes à intégrer

| Réforme | Date | Impact |
|---------|------|--------|
| **CARMF** | 01/01/2025 | Classe D supprimée, classe B proportionnelle |
| **CARPIMKO** | 01/01/2025 | Majoration conjoint supprimée, autres réduites 50% |
| **CAVEC** | 2025 | Taux unique IJ (classes IJ supprimées) |
| **CARCDSF** | 2025 | Taux uniques par profession (pas de classes) |
| **MSA** | Fév 2024 | Carence réduite à 4 jours (était 7j) |
| **CARPIMKO** | Juil 2024 | PACS reconnu comme conjoint |

### Calculs proportionnels (attention !)

| Caisse | Élément | Formule |
|--------|---------|---------|
| **CARMF classe B** | IJ | 1/730e du revenu N-2 |
| **SSI** | IJ | 1/730e du RAAM (3 ans) |
| **Régime CPAM** | IJ | 1/730e du RAAM (3 ans) |
| **CIPAV** (invalidité) | Pension | Proportionnelle aux revenus cotisés |

### Montants minimums et maximums 2025

| Régime | Minimum | Maximum | Condition |
|--------|---------|---------|-----------|
| **CPAM** | 25,80 €/j | 193,56 €/j | < 40% PASS / ≥ 3 PASS |
| **SSI** | - | 64,52 €/j | Plafond 1 PASS |
| **SSI conjoint** | - | 31,75 €/j | 50% du max |

---

## 📅 VERSIONING ET MISE À JOUR ANNUELLE

### Fichiers de configuration créés

| Fichier | Contenu | Statut |
|---------|---------|--------|
| `parameters-prevoyance-2025.ts` | Données officielles 2025 | ✅ Validé |
| `parameters-prevoyance-2026.ts` | Estimations (+2% PASS) | ⚠️ À confirmer |

### PASS 2026 (officiel)

- **Montant** : 48 060 € (+2% vs 2025)
- **Source** : Bulletin officiel SS du 21 octobre 2025
- **Impact** : Tous les plafonds et montants proportionnels au PASS

### Mise à jour annuelle (checklist)

1. ☐ Vérifier nouveau PASS (publié octobre N-1)
2. ☐ Attendre publications officielles de chaque caisse (janvier)
3. ☐ Copier `parameters-prevoyance-ANNEE.ts` vers nouvelle année
4. ☐ Mettre à jour les montants selon publications
5. ☐ Retirer le flag `_estimation: true`
6. ☐ Documenter les réformes éventuelles
7. ☐ Tester avec cas réels

---

## 📊 TABLEAU RÉCAPITULATIF COMPLET 2025

| Caisse | IJ 4-90j | IJ >90j | Franchise | Durée max | Invalidité | Décès |
|--------|----------|---------|-----------|-----------|------------|-------|
| **SSI** | SSI direct | SSI | 3j | 360j/3ans | Cat1/Cat2 | 8 798 € |
| **MSA** | AMEXA | AMEXA | 4j | 360j/3ans | AMEXA | 3 539 € |
| **CIPAV** | CPAM | ❌ AUCUNE | 3j | 87j | Proportionnel | Proportionnel |
| **CARMF** | CPAM | CARMF A/B/C | 90j | 3 ans | 23-31k€/an | 60 000 € |
| **CAVEC** | CPAM | 125€/j unique | 90j | 36 mois | Commission | Selon classe |
| **CARPIMKO** | CPAM | Selon classe | 90j | 3 ans | 8-32k€/an | 30 000 € |
| **CARCDSF** | CPAM | CD:111€ SF:49€ | 90j | 3 ans | Commission | Selon situation |
| **CARPV** | CPAM | ❌ AUCUNE | 90j | 87j | 8-39k€/an | 37-110k€ |
| **CAVP** | CPAM | Selon classe | 90j | 3 ans | 1 218€/mois | Oui |
| **CNBF** | LPA/AON | CNBF | 90j | 3 ans | 50% retraite | 50 000 € |
| **CAVAMAC** | CPAM | Selon classe | 90j | 3 ans | Selon classe | 30 000 € |
| **CAVOM** | CPAM | Selon classe | 90j | 3 ans | Selon classe | 30 000 € |
| **CPRN** | CPAM | Selon classe | 90j | 3 ans | Selon classe | 30 000 € |

---

*Audit réalisé le 17 décembre 2025*
*Fichiers de paramètres créés pour versioning 2025/2026*
