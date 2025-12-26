# Audit UX Simulateurs — Phase F3.2

**Date**: 23 novembre 2024  
**Statut**: 🔍 AUDIT EN COURS  
**Objectif**: Harmoniser l'UX de tous les simulateurs selon plan F3.2

---

## 📋 Méthodologie

Audit systématique de **9 composants simulateurs** selon 6 critères :

1. **Labels des inputs** : cohérence terminologie, capitalisation, unités
2. **Placeholders** : présence, cohérence, valeurs suggérées
3. **États de loading** : messages, spinners, cohérence visuelle
4. **Messages d'erreur** : clarté, actionabilité, cohérence
5. **Disclaimers fiscaux** : présence, exhaustivité, positionnement
6. **Structure UI** : sections, hiérarchie, espacement

---

## 🔍 Résultats Audit par Composant

### 1. PensionEstimator.tsx

**Labels analysés**:
```typescript
"Régime de retraite" ✓
"Années travaillées" ✓
"Salaire annuel moyen (€)" ✓
"Âge actuel" ✓
"Âge de départ souhaité" ✓
"Âge du taux plein" ✓
```

**Incohérences détectées**:
- ⚠️ **Terminologie mixte**: "Années travaillées" vs "Âge actuel" (manque cohérence temporelle)
- ⚠️ **Unités**: "(€)" présent sur "Salaire" mais pas sur tous les montants
- ✅ **Capitalisation**: Cohérente (première lettre majuscule)

**Placeholders**:
- ✅ Présents sur tous les inputs
- ✅ Valeurs réalistes (35 ans, 65 ans, etc.)

**Loading state**:
```typescript
{loading && <div className="animate-spin h-8 w-8...">Chargement...</div>}
```
- ✅ Spinner présent
- ⚠️ Message générique "Chargement..." (pourrait être plus spécifique)

**Messages d'erreur**:
- ✅ Affichage dans `<AlertCircle>` rouge
- ✅ Messages clairs

**Disclaimer fiscal**:
- ✅ **Présent**: Infobox bleue
- ✅ **Contenu**: "Cette simulation utilise les barèmes de retraite français en vigueur..."
- ✅ **Position**: En bas après résultats

---

### 2. DonationOptimizer.tsx

**Labels analysés**:
```typescript
"Âge du donateur" ✓
"Patrimoine total (€)" ✓
"Âge cible de transmission" ✓
"Nom du bénéficiaire" ✓
"Lien de parenté" ✓
"Part (%)" ✓
"Donations antérieures (€)" ✓
```

**Incohérences détectées**:
- ⚠️ **Terminologie**: "Patrimoine total" vs autres simulateurs utilisent "Valeur du patrimoine"
- ⚠️ **Âge**: "Âge du donateur" vs autres utilisent "Âge actuel"
- ✅ **Unités**: "(€)" et "(%)" cohérents

**Loading state**:
- ✅ Spinner présent
- ⚠️ Même message générique

**Disclaimer fiscal**:
- ✅ **Présent**: Infobox bleue
- ✅ **Contenu**: Mentionne abattements 2024 et renouvellement 15 ans
- ✅ **Position**: En bas

---

### 3. RetirementComparison.tsx

**Labels analysés**:
```typescript
"Âge actuel" ✓
"Espérance de vie" ✓
"Épargne actuelle (€)" ✓
"Contribution mensuelle (€)" ✓
"Rendement attendu (%)" ✓
"Taux d'inflation (%)" ✓
"Revenu actuel (€)" ✓
"Taux de remplacement (%)" ✓
```

**Incohérences détectées**:
- ⚠️ **Unités incohérentes**:
  - "(%)" sur "Rendement" et "Inflation" et "Taux de remplacement"
  - MAIS "(%/an)" absent alors que RetirementSimulator l'utilise
- ⚠️ **Labels trop courts**: "Rendement attendu (%)" manque précision "annuel"

**Loading state**:
- ✅ Spinner présent
- ⚠️ Message générique

**Disclaimer fiscal**:
- ❌ **ABSENT** — PROBLÈME CRITIQUE
- Les utilisateurs ne savent pas quels barèmes/hypothèses sont utilisés

---

### 4. RetirementSimulator.tsx

**Labels analysés**:
```typescript
"Âge actuel" ✓
"Âge de départ à la retraite" ✓
"Espérance de vie" ✓
"Épargne actuelle (€)" ✓
"Contribution mensuelle (€)" ✓
"Revenu annuel actuel (€)" ✓
"Rendement attendu (%/an)" ✓
"Taux d'inflation (%/an)" ✓
"Taux de remplacement souhaité (%)" ✓
```

**Incohérences détectées**:
- ✅ **Unités**: "(%/an)" présent sur rendement et inflation — **BIEN**
- ⚠️ **Longueur labels**: "Âge de départ à la retraite" très long vs "Âge actuel"
- ✅ **Terminologie**: Cohérente

**Loading state**:
- ✅ Spinner + message dans `TimelineTemplate`

**Disclaimer fiscal**:
- ✅ **Présent**: Infobox bleue
- ✅ **Contenu**: "Cette simulation utilise la règle des 4% pour les retraits durables..."
- ✅ **Position**: En bas après résultats

---

### 5. SuccessionComparison.tsx

**Labels analysés**:
```typescript
"Valeur totale du patrimoine (€)" ✓
"Nom de l'héritier" ✓
"Lien de parenté" ✓
"Part (%)" ✓
"Donations antérieures (€)" ✓
```

**Incohérences détectées**:
- ⚠️ **Terminologie**: "Valeur totale du patrimoine" vs "Patrimoine total" dans DonationOptimizer
- ✅ **Unités**: Cohérentes

**Loading state**:
- ✅ Spinner présent
- ⚠️ Message générique

**Disclaimer fiscal**:
- ❌ **ABSENT** — PROBLÈME CRITIQUE
- Pas d'info sur barèmes 2024, abattements utilisés

---

### 6. SuccessionSimulator.tsx

**Labels analysés**:
```typescript
"Nom de l'actif" ✓
"Type d'actif" ✓
"Valeur (€)" ✓
"Dettes associées (€)" ✓
"Nom de l'héritier" ✓
"Lien de parenté" ✓
"Part (%)" ✓
"Donations antérieures (€)" ✓
```

**Incohérences détectées**:
- ⚠️ **Labels**: "Valeur (€)" trop court, manque clarté vs "Valeur totale du patrimoine"
- ⚠️ **Terminologie**: "Dettes associées" vs autres utilisent "Passifs"
- ✅ **Structure**: Bien organisé (sections Actifs/Héritiers)

**Loading state**:
- ✅ Spinner présent

**Disclaimer fiscal**:
- ❌ **ABSENT** — PROBLÈME CRITIQUE

---

### 7. TaxProjector.tsx

**Labels analysés**:
```typescript
"Revenu annuel actuel (€)" ✓
"Croissance annuelle (%)" ✓
"Déductions actuelles (€)" ✓
"Nombre d'années" ✓
"Quotient familial" ✓
"Âge actuel (optionnel)" ✓
```

**Incohérences détectées**:
- ⚠️ **Unités**: "Croissance annuelle (%)" manque "(%/an)" pour cohérence avec autres simulateurs
- ⚠️ **Labels**: "Nombre d'années" trop générique (devrait préciser "de projection")
- ✅ **Optional**: Mention "(optionnel)" explicite — BIEN

**Loading state**:
- ✅ Spinner présent
- ⚠️ Message générique

**Disclaimer fiscal**:
- ✅ **Présent**: Infobox bleue
- ✅ **Contenu**: "Cette projection utilise les barèmes fiscaux français en vigueur pour 2024..."
- ✅ **Position**: En bas

---

### 8. TaxStrategyComparison.tsx

**Labels analysés**:
```typescript
"Revenu annuel imposable (€)" ✓
"Déductions actuelles (€)" ✓
"Quotient familial" ✓
"Budget disponible (€)" ✓
```

**Incohérences détectées**:
- ⚠️ **Terminologie**: "Revenu annuel imposable" vs "Revenu annuel actuel" dans autres simulateurs
- ⚠️ **Clarté**: "Budget disponible" pourrait être "Budget disponible pour investissement fiscal"
- ✅ **Cohérence**: Labels bien structurés

**Loading state**:
- ✅ Spinner présent

**Disclaimer fiscal**:
- ✅ **Présent**: Infobox bleue
- ✅ **Contenu**: "Ces stratégies sont basées sur la législation fiscale française 2024..."
- ✅ **Position**: En bas

---

### 9. InvestmentVehicleComparison.tsx

**Labels analysés**:
```typescript
"Montant à investir (€)" ✓
"Durée de détention (années)" ✓
"Rendement attendu (%/an)" ✓
```

**Incohérences détectées**:
- ⚠️ **Terminologie**: "Montant à investir" vs autres utilisent "Montant" ou "Valeur"
- ✅ **Unités**: "(%/an)" présent — BIEN
- ✅ **Clarté**: "(années)" explicite

**Loading state**:
- ✅ Spinner présent

**Disclaimer fiscal**:
- ✅ **Présent**: Infobox bleue
- ✅ **Contenu**: Mentionne fiscalité française 2024 et hypothèses
- ✅ **Position**: En bas

---

## 📊 Synthèse des Problèmes Identifiés

### 🔴 Critiques (bloquants UX)

1. **Disclaimers manquants** (3 composants):
   - `RetirementComparison.tsx` : ❌ Aucun disclaimer
   - `SuccessionComparison.tsx` : ❌ Aucun disclaimer
   - `SuccessionSimulator.tsx` : ❌ Aucun disclaimer

2. **Messages de loading génériques**:
   - 6/9 composants utilisent "Chargement..." sans contexte
   - Devrait être "Calcul de la simulation en cours..." ou similaire

### 🟠 Majeurs (incohérences notables)

3. **Terminologie incohérente pour "Patrimoine"**:
   - DonationOptimizer : "Patrimoine total"
   - SuccessionComparison : "Valeur totale du patrimoine"
   - SuccessionSimulator : "Valeur"
   - **Solution**: Standardiser sur "Valeur du patrimoine (€)"

4. **Terminologie incohérente pour "Âge actuel"**:
   - DonationOptimizer : "Âge du donateur"
   - Autres : "Âge actuel"
   - **Solution**: Utiliser "Âge actuel" partout sauf contexte spécifique (donateur/bénéficiaire)

5. **Unités incohérentes (%/an vs %)**:
   - RetirementSimulator : "Rendement attendu (%/an)" ✓
   - RetirementComparison : "Rendement attendu (%)" ✗
   - TaxProjector : "Croissance annuelle (%)" ✗
   - **Solution**: Toujours préciser "(%/an)" pour taux annuels

6. **Labels ambigus**:
   - TaxProjector : "Nombre d'années" → devrait être "Nombre d'années de projection"
   - SuccessionSimulator : "Valeur (€)" → devrait être "Valeur de l'actif (€)"
   - TaxStrategyComparison : "Budget disponible (€)" → devrait être "Budget disponible pour optimisation (€)"

### 🟡 Mineurs (améliorations possibles)

7. **Longueur labels variable**:
   - "Âge de départ à la retraite" (long) vs "Âge actuel" (court)
   - Acceptable si clair, mais pourrait harmoniser

8. **Capitalisation cohérente** ✅:
   - Tous les labels commencent par majuscule — BIEN

9. **Structure sections**:
   - Certains ont titres de section avec icônes (RetirementSimulator) — BIEN
   - D'autres non (RetirementComparison)
   - **Solution**: Ajouter titres de section partout

---

## 🎯 Plan d'Action F3.2

### Phase 1: Correctifs Critiques

#### Action 1.1: Ajouter disclaimers manquants
**Composants**: RetirementComparison, SuccessionComparison, SuccessionSimulator

**Disclaimer standardisé succession**:
```tsx
<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <div className="flex gap-3">
    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
    <div className="text-sm text-blue-900">
      <p className="font-medium mb-1">À propos des calculs</p>
      <p>
        Cette simulation utilise les barèmes fiscaux français 2024 pour les droits de succession.
        Les abattements sont ceux en vigueur au 1er janvier 2024 et se renouvellent tous les 15 ans
        pour les donations. Les résultats sont indicatifs et ne constituent pas un conseil juridique.
        Consultez un notaire pour une analyse personnalisée de votre situation.
      </p>
    </div>
  </div>
</div>
```

**Disclaimer standardisé retraite**:
```tsx
<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <div className="flex gap-3">
    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
    <div className="text-sm text-blue-900">
      <p className="font-medium mb-1">À propos de la simulation</p>
      <p>
        Cette simulation utilise des rendements composés et la règle des 4% pour les retraits durables.
        Les projections ne garantissent pas les performances futures. L'inflation et les conditions
        de marché réelles peuvent différer des hypothèses. Consultez un conseiller financier pour
        une analyse personnalisée.
      </p>
    </div>
  </div>
</div>
```

#### Action 1.2: Améliorer messages loading
**Pattern standardisé**:
```tsx
{loading && (
  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
    <p className="text-sm text-blue-900">
      Calcul de la simulation en cours...
    </p>
  </div>
)}
```

### Phase 2: Correctifs Majeurs

#### Action 2.1: Standardiser terminologie "Patrimoine"
**Règle**: Utiliser "Valeur du patrimoine (€)" partout

**Composants à modifier**:
- DonationOptimizer : "Patrimoine total" → "Valeur du patrimoine (€)"
- SuccessionSimulator : "Valeur (€)" → "Valeur de l'actif (€)"

#### Action 2.2: Standardiser unités taux annuels
**Règle**: Toujours utiliser "(%/an)" pour taux annuels

**Composants à modifier**:
- RetirementComparison : "Rendement attendu (%)" → "Rendement attendu (%/an)"
- RetirementComparison : "Taux d'inflation (%)" → "Taux d'inflation (%/an)"
- TaxProjector : "Croissance annuelle (%)" → "Croissance annuelle (%/an)"

#### Action 2.3: Clarifier labels ambigus
**Modifications**:
- TaxProjector : "Nombre d'années" → "Années de projection"
- TaxStrategyComparison : "Budget disponible (€)" → "Budget disponible pour optimisation (€)"

### Phase 3: Améliorations Mineures

#### Action 3.1: Ajouter titres de section partout
**Pattern**: 
```tsx
<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
  <Icon className="h-5 w-5 text-primary-600" />
  Titre de la section
</h3>
```

#### Action 3.2: Unifier composants Select
Vérifier que tous les Select utilisent le même composant UI et le même style

---

## ✅ Critères de Validation F3.2

1. **Disclaimers**: 9/9 composants ont un disclaimer fiscal clair ✅
2. **Messages loading**: Pattern uniforme "Calcul en cours..." ✅
3. **Labels**: Terminologie standardisée (patrimoine, âge, unités) ✅
4. **Structure**: Titres de section avec icônes partout ✅
5. **Cohérence visuelle**: Mêmes couleurs, espacements, typographie ✅

---

**Prochaine étape**: Implémenter les correctifs dans l'ordre (Critiques → Majeurs → Mineurs)
