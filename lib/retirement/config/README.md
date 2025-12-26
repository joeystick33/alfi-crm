# 📋 Paramètres Retraite - Guide de Maintenance

## 🎯 Objectif

Ce dossier centralise **tous les paramètres actuariels** qui changent chaque année pour les calculs de retraite. 

**Un seul fichier à mettre à jour** lors des revalorisations annuelles.

---

## 📁 Structure

```
/lib/retirement/config/
├── parameters-2025.ts    ← FICHIER PRINCIPAL À METTRE À JOUR
├── README.md             ← Ce fichier
└── (archives/            ← Optionnel : anciens fichiers pour historique)
```

---

## 🔄 Mise à jour annuelle

### Quand mettre à jour ?

| Paramètre | Date de publication | Source |
|-----------|---------------------|--------|
| PASS | Décembre N-1 | [URSSAF](https://www.urssaf.fr) |
| Valeur point AGIRC-ARRCO | Novembre N-1 | [AGIRC-ARRCO](https://www.agirc-arrco.fr) |
| Valeur point RAFP | Janvier N | [RAFP](https://rafp.fr) |
| Valeur point IRCANTEC | Janvier N | [IRCANTEC](https://ircantec.retraites.fr) |
| Caisses libérales | Janvier-Mars N | Sites respectifs |

### Comment mettre à jour ?

1. **Ouvrir** `/lib/retirement/config/parameters-2025.ts`
2. **Modifier** les valeurs concernées
3. **Mettre à jour** la date en haut du fichier
4. **Tester** avec le simulateur

---

## 📊 Checklist annuelle

### 1. Plafonds de Sécurité Sociale
```typescript
export const PLAFONDS = {
  PASS: 47100,      // ← METTRE À JOUR
  PMSS: 3925,       // = PASS / 12
  SMIC_MENSUEL: 1801.80,
  SMIC_HORAIRE: 11.88,
}
```

### 2. AGIRC-ARRCO (salariés privés)
```typescript
export const AGIRC_ARRCO = {
  VALEUR_POINT: 1.4386,      // ← METTRE À JOUR
  PRIX_ACHAT_POINT: 20.1877, // ← METTRE À JOUR
  // ...
}
```

### 3. Régimes fonctionnaires
```typescript
export const RAFP = {
  VALEUR_POINT: 0.05593,     // ← METTRE À JOUR
}

export const IRCANTEC = {
  VALEUR_POINT_A: 0.55553,   // ← METTRE À JOUR
}
```

### 4. SSI (artisans/commerçants)
```typescript
export const SSI = {
  VALEUR_POINT: 1.280,       // ← METTRE À JOUR
}
```

### 5. Professions libérales (CIPAV, CARMF, CARPIMKO, CNBF, CRPCEN)
```typescript
export const CARMF = {
  VALEUR_POINT: 76.15,       // ← METTRE À JOUR
  CLASSES: { /* cotisations annuelles */ }
}
```

### 6. Seuils RFR pour taux CSG
```typescript
export const SEUILS_RFR_CSG = {
  PART_1: {
    exoneration: 12455,  // ← METTRE À JOUR
    tauxReduit: 16267,
    tauxMedian: 25246,
  },
  // ...
}
```

---

## 🔗 Sources officielles

| Régime | Site | Contact |
|--------|------|---------|
| Régime général | [lassuranceretraite.fr](https://www.lassuranceretraite.fr) | 3960 |
| AGIRC-ARRCO | [agirc-arrco.fr](https://www.agirc-arrco.fr) | 0 820 200 189 |
| RAFP | [rafp.fr](https://rafp.fr) | |
| IRCANTEC | [ircantec.retraites.fr](https://ircantec.retraites.fr) | |
| SSI | [secu-independants.fr](https://www.secu-independants.fr) | 3648 |
| CIPAV | [cipav.fr](https://www.cipav.fr) | |
| CARMF | [carmf.fr](https://www.carmf.fr) | |
| CARPIMKO | [carpimko.com](https://www.carpimko.com) | |
| CNBF | [cnbf.fr](https://www.cnbf.fr) | |
| CRPCEN | [crpcen.fr](https://www.crpcen.fr) | |

---

## ⚠️ Points d'attention

1. **PASS** : Impacte les plafonds de cotisation de tous les régimes
2. **Valeurs de points** : Les revaloriser dans le bon sens (+2% en moyenne)
3. **Coefficient solidarité** : Vérifier si les règles AGIRC-ARRCO changent
4. **Réforme retraites** : Surveiller les évolutions réglementaires

---

## 🧪 Vérification post-mise à jour

```bash
# Tester le simulateur
curl -X POST http://localhost:3000/api/advisor/simulators/retirement/pension \
  -H "Content-Type: application/json" \
  -d '{"regime":"general","currentAge":45,"retirementAge":67,"yearsWorked":20,"averageSalary":45000,"fullRateAge":67}'
```

Vérifier :
- ✅ Le PASS affiché est correct
- ✅ La pension complémentaire est cohérente
- ✅ Pas d'erreur dans la console

---

## 📅 Historique des mises à jour

| Date | Année réf. | Modifications | Auteur |
|------|------------|---------------|--------|
| 01/01/2025 | 2025 | Création initiale | - |
| ... | ... | ... | ... |

---

*Dernière mise à jour de ce guide : Janvier 2025*
