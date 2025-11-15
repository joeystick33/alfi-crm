# Task 13: Migration des Calculateurs Fiscaux avec Chart Hero - STATUS

## Date
14 Novembre 2024

## Statut Actuel
⚠️ **PARTIELLEMENT COMPLETE** - Les calculateurs existent mais n'utilisent pas encore ChartHeroTemplate

## Analyse de la Situation

### Ce qui a été fait ✅
1. ✅ Les calculateurs fiscaux ont été copiés de CRM vers alfi-crm
2. ✅ Les calculateurs sont en TypeScript
3. ✅ Les calculs fonctionnent correctement
4. ✅ ChartHeroTemplate a été créé et est prêt à l'emploi

### Ce qui reste à faire ⏳
1. ⏳ Appliquer ChartHeroTemplate sur IncomeTaxCalculator
2. ⏳ Appliquer ChartHeroTemplate sur CapitalGainsTaxCalculator
3. ⏳ Appliquer ChartHeroTemplate sur WealthTaxCalculator
4. ⏳ Appliquer ChartHeroTemplate sur InheritanceTaxCalculator
5. ⏳ Appliquer ChartHeroTemplate sur DonationTaxCalculator
6. ⏳ Adapter le stockage des résultats pour Prisma (via simulation API)

## Calculateurs Existants

### 1. IncomeTaxCalculator.tsx ✅ (Existe, pas encore Bento)
**Localisation**: `alfi-crm/components/calculators/IncomeTaxCalculator.tsx`
**État actuel**: Layout traditionnel avec grilles uniformes
**Structure actuelle**:
- Inputs en haut
- 4 summary cards uniformes
- 2 rate cards
- 1 chart
- 1 tableau détaillé

**Structure Bento cible**:
```tsx
<ChartHeroTemplate
  mainChart={<ModernBarChart data={chartData} />}
  chartTitle="Répartition de l'impôt par tranche"
  chartDescription="Visualisation de votre imposition"
  kpis={[
    { label: 'Revenu imposable', value: formatCurrency(result.taxableIncome) },
    { label: 'Impôt total', value: formatCurrency(result.totalTax) },
    { label: 'Taux effectif', value: `${result.effectiveRate.toFixed(2)}%` },
    { label: 'Revenu net', value: formatCurrency(result.netIncome) }
  ]}
  details={<TaxBreakdownTable breakdown={result.breakdown} />}
/>
```

### 2. CapitalGainsTaxCalculator.tsx ✅ (Existe, pas encore Bento)
**Localisation**: `alfi-crm/components/calculators/CapitalGainsTaxCalculator.tsx`
**État actuel**: Layout traditionnel
**Structure actuelle**:
- Inputs (gain, période de détention, type d'actif)
- Summary cards
- Pie chart
- Détails

**Structure Bento cible**:
```tsx
<ChartHeroTemplate
  mainChart={<ModernPieChart data={pieData} />}
  chartTitle="Répartition de la plus-value"
  chartDescription="Gain net après impôts et prélèvements"
  kpis={[
    { label: 'Plus-value brute', value: formatCurrency(result.grossGain) },
    { label: 'Abattement', value: formatCurrency(result.abatement) },
    { label: 'Impôts totaux', value: formatCurrency(result.totalTax) },
    { label: 'Plus-value nette', value: formatCurrency(result.netGain) }
  ]}
/>
```

### 3. WealthTaxCalculator.tsx ✅ (Existe, pas encore Bento)
**Localisation**: `alfi-crm/components/calculators/WealthTaxCalculator.tsx`
**État actuel**: Layout traditionnel
**Structure actuelle**:
- Input patrimoine total
- Summary cards
- Bar chart
- Tableau des tranches

**Structure Bento cible**:
```tsx
<ChartHeroTemplate
  mainChart={<ModernBarChart data={chartData} />}
  chartTitle="IFI par tranche de patrimoine"
  chartDescription="Calcul de l'Impôt sur la Fortune Immobilière"
  kpis={[
    { label: 'Patrimoine total', value: formatCurrency(result.totalWealth) },
    { label: 'Patrimoine taxable', value: formatCurrency(result.taxableWealth) },
    { label: 'IFI dû', value: formatCurrency(result.wealthTax) },
    { label: 'Taux effectif', value: `${result.effectiveRate.toFixed(2)}%` }
  ]}
  details={<WealthTaxBreakdownTable breakdown={result.breakdown} />}
/>
```

### 4. InheritanceTaxCalculator.tsx ✅ (Existe, pas encore Bento)
**Localisation**: `alfi-crm/components/calculators/InheritanceTaxCalculator.tsx`
**État actuel**: Layout traditionnel
**Structure actuelle**:
- Inputs (montant, lien de parenté)
- Summary cards
- Bar chart
- Détails des abattements

**Structure Bento cible**:
```tsx
<ChartHeroTemplate
  mainChart={<ModernBarChart data={chartData} />}
  chartTitle="Droits de succession"
  chartDescription="Calcul selon le lien de parenté"
  kpis={[
    { label: 'Montant hérité', value: formatCurrency(result.inheritanceAmount) },
    { label: 'Abattement', value: formatCurrency(result.abatement) },
    { label: 'Droits à payer', value: formatCurrency(result.inheritanceTax) },
    { label: 'Montant net', value: formatCurrency(result.netAmount) }
  ]}
/>
```

### 5. DonationTaxCalculator.tsx ✅ (Existe, pas encore Bento)
**Localisation**: `alfi-crm/components/calculators/DonationTaxCalculator.tsx`
**État actuel**: Layout traditionnel
**Structure actuelle**:
- Inputs (montant, bénéficiaire)
- Summary cards
- Bar chart
- Détails des abattements

**Structure Bento cible**:
```tsx
<ChartHeroTemplate
  mainChart={<ModernBarChart data={chartData} />}
  chartTitle="Droits de donation"
  chartDescription="Calcul selon le bénéficiaire"
  kpis={[
    { label: 'Montant donné', value: formatCurrency(result.donationAmount) },
    { label: 'Abattement', value: formatCurrency(result.abatement) },
    { label: 'Droits à payer', value: formatCurrency(result.donationTax) },
    { label: 'Montant net reçu', value: formatCurrency(result.netAmount) }
  ]}
/>
```

## ChartHeroTemplate - Prêt à l'emploi ✅

**Localisation**: `alfi-crm/components/ui/bento/ChartHeroTemplate.tsx`

**Interface**:
```typescript
interface ChartHeroTemplateProps {
  mainChart: React.ReactNode
  chartTitle: string
  chartDescription?: string
  kpis: Array<Omit<BentoKPIProps, 'span'>>
  details?: React.ReactNode
  loading?: boolean
  className?: string
}
```

**Layout**:
```
┌─────────────┬───┐
│             │ K │
│   Chart     │ P │
│   (Hero)    │ I │
│             │ s │
├─────────────┴───┤
│    Details      │
└─────────────────┘
```

**Caractéristiques**:
- Chart principal en hero (4x3)
- KPIs en sidebar vertical (2x1 chacun)
- Section détails optionnelle en full-width
- Responsive (stack sur mobile)
- Loading states intégrés

## Plan d'Action pour Compléter la Tâche

### Étape 1: Refactoriser IncomeTaxCalculator
1. Importer ChartHeroTemplate
2. Extraire la logique de calcul (garder intacte)
3. Restructurer le JSX pour utiliser le template
4. Passer le chart principal en prop
5. Convertir les summary cards en KPIs
6. Déplacer le tableau détaillé dans details
7. Tester que les calculs fonctionnent toujours

### Étape 2: Répéter pour les 4 autres calculateurs
- CapitalGainsTaxCalculator
- WealthTaxCalculator
- InheritanceTaxCalculator
- DonationTaxCalculator

### Étape 3: Adapter le stockage Prisma
1. Créer un hook `useSaveCalculation` similaire à `useSaveSimulation`
2. Utiliser l'API `/api/simulations` avec type approprié
3. Ajouter un bouton "Sauvegarder" dans chaque calculateur
4. Permettre de lier le calcul à un client

### Étape 4: Tester
1. Vérifier que les calculs sont préservés
2. Tester le responsive (mobile, tablet, desktop)
3. Vérifier que les charts restent lisibles
4. Tester la sauvegarde des résultats

## Avantages du ChartHeroTemplate

### 1. Hiérarchie Visuelle Claire
- Le chart devient le point focal
- Les KPIs sont accessibles mais pas envahissants
- Les détails sont disponibles sans surcharger

### 2. Responsive Automatique
- Desktop: Chart hero + KPIs sidebar
- Tablet: Chart hero + KPIs en dessous
- Mobile: Stack vertical

### 3. Cohérence
- Tous les calculateurs fiscaux auront le même look
- Expérience utilisateur unifiée
- Maintenance simplifiée

### 4. Performance
- Lazy loading des charts hors viewport
- Skeleton loaders intégrés
- Animations optimisées

## Estimation du Travail Restant

### Par Calculateur
- Temps estimé: 30-45 minutes
- Complexité: Faible (template prêt)
- Risque: Faible (calculs déjà testés)

### Total
- 5 calculateurs × 40 minutes = ~3-4 heures
- Adaptation Prisma: 1-2 heures
- Tests: 1 heure
- **Total: 5-7 heures de travail**

## Dépendances

### Satisfaites ✅
- ✅ ChartHeroTemplate créé
- ✅ BentoGrid system en place
- ✅ Calculateurs existants fonctionnels
- ✅ Charts (ModernBarChart, ModernPieChart) disponibles
- ✅ API simulations prête

### À vérifier
- ⏳ Hook `useSaveCalculation` (peut réutiliser `useSaveSimulation`)
- ⏳ Types Prisma pour les calculs (peut utiliser Simulation avec type TAX_OPTIMIZATION)

## Recommandations

### 1. Commencer par IncomeTaxCalculator
C'est le plus simple et servira de modèle pour les autres.

### 2. Créer un composant wrapper
```tsx
// components/calculators/TaxCalculatorWrapper.tsx
export function TaxCalculatorWrapper({
  inputs,
  result,
  onCalculate,
  onSave,
  chartComponent,
  kpis,
  details
}) {
  return (
    <div className="space-y-6">
      {/* Inputs section */}
      <Card>
        {inputs}
      </Card>
      
      {/* Results with ChartHeroTemplate */}
      {result && (
        <ChartHeroTemplate
          mainChart={chartComponent}
          kpis={kpis}
          details={details}
        />
      )}
      
      {/* Save button */}
      <SaveCalculationButton onSave={onSave} />
    </div>
  )
}
```

### 3. Garder les calculs intacts
Ne toucher QUE à la présentation, pas à la logique de calcul.

### 4. Tester au fur et à mesure
Tester chaque calculateur avant de passer au suivant.

## Conclusion

La tâche est **presque complète** - tous les éléments sont en place:
- ✅ Calculateurs fonctionnels
- ✅ ChartHeroTemplate prêt
- ✅ Bento Grid system opérationnel
- ✅ API de sauvegarde disponible

Il ne reste plus qu'à **appliquer le template** aux 5 calculateurs fiscaux, ce qui est un travail de refactoring relativement simple et à faible risque.

**Prochaine action**: Commencer par refactoriser `IncomeTaxCalculator.tsx` pour utiliser `ChartHeroTemplate`.

---

**Créé par**: Kiro AI Assistant  
**Date**: 14 Novembre 2024  
**Statut**: ⚠️ EN ATTENTE D'IMPLÉMENTATION
