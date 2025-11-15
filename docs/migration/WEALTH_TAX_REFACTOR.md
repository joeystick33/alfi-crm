# WealthTaxCalculator - Refactoring avec ChartHeroTemplate

## Section à remplacer

Chercher la section qui commence par `{result && (` et la remplacer par:

```tsx
{result && (
  <ChartHeroTemplate
    mainChart={
      chartData.length > 0 ? (
        <ModernBarChart
          data={chartData}
          dataKeys={['Patrimoine', 'IFI']}
          formatValue={formatCurrency}
          title=""
        />
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Aucune donnée à afficher
        </div>
      )
    }
    chartTitle="IFI par tranche de patrimoine"
    chartDescription="Calcul de l'Impôt sur la Fortune Immobilière"
    kpis={[
      {
        label: 'Patrimoine total',
        value: formatCurrency(result.totalWealth),
        variant: 'default' as const,
      },
      {
        label: 'Patrimoine taxable',
        value: formatCurrency(result.taxableWealth),
        variant: 'default' as const,
      },
      {
        label: 'IFI à payer',
        value: formatCurrency(result.wealthTax),
        variant: 'accent' as const,
      },
      {
        label: 'Taux effectif',
        value: formatPercent(result.effectiveRate),
        variant: 'default' as const,
      },
    ]}
    details={
      <div className="space-y-6">
        {/* Breakdown Table */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Barème IFI 2024</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Tranche</th>
                  <th className="px-4 py-3 text-left font-medium">Taux</th>
                  <th className="px-4 py-3 text-right font-medium">Patrimoine taxable</th>
                  <th className="px-4 py-3 text-right font-medium">IFI</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {result.breakdown.map((bracket, index) => (
                  <tr key={index} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      {formatCurrency(bracket.min)} - {bracket.max ? formatCurrency(bracket.max) : '∞'}
                    </td>
                    <td className="px-4 py-3">{formatPercent(bracket.rate)}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(bracket.taxableAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(bracket.taxAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted border-t-2">
                <tr>
                  <td colSpan={3} className="px-4 py-3 font-bold">Total IFI</td>
                  <td className="px-4 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(result.wealthTax)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-2">À propos de l'IFI</p>
              <ul className="list-disc list-inside space-y-1">
                <li>L'IFI s'applique uniquement au patrimoine immobilier net</li>
                <li>Seuil d'imposition: 1 300 000 € (avec décote entre 800 000 € et 1 300 000 €)</li>
                <li>Les dettes liées aux biens immobiliers sont déductibles</li>
                <li>La résidence principale bénéficie d'un abattement de 30%</li>
                <li>Déclaration annuelle obligatoire si patrimoine ≥ 1 300 000 €</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    }
    loading={loading}
  />
)}
```

## Ligne approximative

Chercher autour de la ligne 170-180 où commence `{result && (`
