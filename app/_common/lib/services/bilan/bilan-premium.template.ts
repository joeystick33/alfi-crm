/**
 * Template HTML/CSS Premium pour le Bilan Patrimonial
 * Utilise Chart.js pour les graphiques
 */

import type { BilanPremiumData } from './bilan-premium.types'
import { generateCSS, COLORS } from './template/styles'
import { generateCoverPage, generateSynthesePage } from './template/pages-cover'
import { generatePatrimoinePage, generateEvolutionPage } from './template/pages-patrimoine'
import { generateBudgetPage, generateFiscalitePage } from './template/pages-budget'
import { generateContratsPage, generateObjectifsPage, generatePerformancePage } from './template/pages-contrats'
import { generateAllocationPage, generateProtectionPage, generateSuccessionPage } from './template/pages-advanced'
import { generateConclusionPage } from './template/pages-conclusion'
import { generateChartScripts } from './template/charts'

/**
 * Génère le template HTML complet du bilan premium
 */
export function generatePremiumTemplate(data: BilanPremiumData): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bilan Patrimonial - ${data.client.prenom} ${data.client.nom}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <style>
    ${generateCSS()}
  </style>
</head>
<body>
  ${generateCoverPage(data)}
  ${generateSynthesePage(data)}
  ${generatePatrimoinePage(data)}
  ${generateEvolutionPage(data)}
  ${generateBudgetPage(data)}
  ${generateFiscalitePage(data)}
  ${generateContratsPage(data)}
  ${generateObjectifsPage(data)}
  ${generatePerformancePage(data)}
  ${generateAllocationPage(data)}
  ${generateProtectionPage(data)}
  ${generateSuccessionPage(data)}
  ${generateConclusionPage(data)}
  
  <script>
    ${generateChartScripts(data)}
  </script>
</body>
</html>`
}

export { COLORS }
