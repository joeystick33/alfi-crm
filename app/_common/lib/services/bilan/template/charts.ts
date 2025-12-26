/**
 * Scripts Chart.js pour les graphiques du bilan premium
 */

import type { BilanPremiumData } from '../bilan-premium.types'
import { COLORS } from './styles'

export function generateChartScripts(data: BilanPremiumData): string {
  return `
    // Configuration globale Chart.js
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 10;
    Chart.defaults.color = '${COLORS.muted}';
    
    // Attendre que le DOM soit prêt
    document.addEventListener('DOMContentLoaded', function() {
      
      // 1. Pie Chart Répartition Patrimoniale
      const ctxRepartition = document.getElementById('chartRepartition');
      if (ctxRepartition) {
        new Chart(ctxRepartition, {
          type: 'doughnut',
          data: {
            labels: ${JSON.stringify(data.charts.patrimoine.repartition.map(r => r.label))},
            datasets: [{
              data: ${JSON.stringify(data.charts.patrimoine.repartition.map(r => r.value))},
              backgroundColor: ${JSON.stringify(data.charts.patrimoine.repartition.map((r, i) => r.color || COLORS.chart[i % COLORS.chart.length]))},
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'right', labels: { boxWidth: 12, padding: 8 } }
            },
            cutout: '60%'
          }
        });
      }
      
      // 2. Line Chart Evolution Patrimoine
      const ctxEvolution = document.getElementById('chartEvolution');
      if (ctxEvolution) {
        new Chart(ctxEvolution, {
          type: 'line',
          data: {
            labels: ${JSON.stringify(data.charts.patrimoine.evolution.map(e => e.date))},
            datasets: [
              {
                label: 'Patrimoine Net',
                data: ${JSON.stringify(data.charts.patrimoine.evolution.map(e => e.net))},
                borderColor: '${COLORS.primary}',
                backgroundColor: '${COLORS.primary}20',
                fill: true,
                tension: 0.3
              },
              {
                label: 'Actifs',
                data: ${JSON.stringify(data.charts.patrimoine.evolution.map(e => e.actifs))},
                borderColor: '${COLORS.secondary}',
                borderDash: [5, 5],
                fill: false,
                tension: 0.3
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top', labels: { boxWidth: 12 } }
            },
            scales: {
              y: { beginAtZero: false, ticks: { callback: (v) => (v/1000) + 'k' } }
            }
          }
        });
      }
      
      // 3. Line Chart Projection
      const ctxProjection = document.getElementById('chartProjection');
      if (ctxProjection) {
        const projectionData = ${JSON.stringify(data.charts.patrimoine.projection)};
        const scenarios = ['pessimiste', 'median', 'optimiste'];
        const colors = { pessimiste: '${COLORS.danger}', median: '${COLORS.primary}', optimiste: '${COLORS.secondary}' };
        
        new Chart(ctxProjection, {
          type: 'line',
          data: {
            labels: [...new Set(projectionData.map(p => p.annee))],
            datasets: scenarios.map(scenario => ({
              label: scenario.charAt(0).toUpperCase() + scenario.slice(1),
              data: projectionData.filter(p => p.scenario === scenario).map(p => p.valeur),
              borderColor: colors[scenario],
              borderDash: scenario === 'median' ? [] : [5, 5],
              fill: false,
              tension: 0.3
            }))
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top', labels: { boxWidth: 12 } }
            },
            scales: {
              y: { beginAtZero: false, ticks: { callback: (v) => (v/1000) + 'k' } }
            }
          }
        });
      }
      
      // 4. Doughnut Chart Budget
      const ctxBudget = document.getElementById('chartBudget');
      if (ctxBudget) {
        const revenusTotal = ${data.budget.revenusMensuels};
        const chargesTotal = ${data.budget.chargesMensuelles};
        const epargne = ${data.budget.epargne};
        
        new Chart(ctxBudget, {
          type: 'doughnut',
          data: {
            labels: ['Charges', 'Credits', 'Epargne'],
            datasets: [{
              data: [${data.budget.chargesMensuelles}, ${data.budget.mensualitesCredits}, ${data.budget.epargne}],
              backgroundColor: ['${COLORS.danger}', '${COLORS.warning}', '${COLORS.secondary}'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'right', labels: { boxWidth: 12, padding: 8 } }
            },
            cutout: '50%'
          }
        });
      }
      
      // 5. Bar Chart Fiscalité
      const ctxFiscalite = document.getElementById('chartFiscalite');
      if (ctxFiscalite) {
        new Chart(ctxFiscalite, {
          type: 'bar',
          data: {
            labels: ${JSON.stringify(data.charts.fiscalite.decomposition.map(d => d.label))},
            datasets: [{
              data: ${JSON.stringify(data.charts.fiscalite.decomposition.map(d => d.montant))},
              backgroundColor: ${JSON.stringify(data.charts.fiscalite.decomposition.map(d => 
                d.type === 'revenu' ? COLORS.secondary : d.type === 'deduction' ? COLORS.primary : COLORS.danger
              ))},
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, ticks: { callback: (v) => (v/1000) + 'k' } }
            }
          }
        });
      }
      
      // 6. Pie Chart Contrats
      const ctxContrats = document.getElementById('chartContrats');
      if (ctxContrats) {
        const contratsData = ${JSON.stringify(data.contrats)};
        const grouped = contratsData.reduce((acc, c) => {
          acc[c.type] = (acc[c.type] || 0) + c.encours;
          return acc;
        }, {});
        
        new Chart(ctxContrats, {
          type: 'pie',
          data: {
            labels: Object.keys(grouped).map(k => k.replace(/_/g, ' ')),
            datasets: [{
              data: Object.values(grouped),
              backgroundColor: ['${COLORS.chart[0]}', '${COLORS.chart[1]}', '${COLORS.chart[2]}', '${COLORS.chart[3]}'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'right', labels: { boxWidth: 10, padding: 6 } }
            }
          }
        });
      }
      
      // 7. Line Chart Objectifs
      const ctxObjectifs = document.getElementById('chartObjectifs');
      if (ctxObjectifs) {
        new Chart(ctxObjectifs, {
          type: 'line',
          data: {
            labels: ${JSON.stringify(data.charts.objectifs.progression.map(p => p.mois))},
            datasets: [
              {
                label: 'Reel',
                data: ${JSON.stringify(data.charts.objectifs.progression.map(p => p.reel))},
                borderColor: '${COLORS.primary}',
                backgroundColor: '${COLORS.primary}20',
                fill: true,
                tension: 0.3
              },
              {
                label: 'Cible',
                data: ${JSON.stringify(data.charts.objectifs.progression.map(p => p.cible))},
                borderColor: '${COLORS.muted}',
                borderDash: [5, 5],
                fill: false,
                tension: 0.3
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { boxWidth: 12 } } },
            scales: {
              y: { beginAtZero: false, ticks: { callback: (v) => (v/1000) + 'k' } }
            }
          }
        });
      }
      
      // 8. Line Chart Performance
      const ctxPerformance = document.getElementById('chartPerformance');
      if (ctxPerformance) {
        new Chart(ctxPerformance, {
          type: 'line',
          data: {
            labels: ${JSON.stringify(data.charts.performance.historique.map(h => h.date))},
            datasets: [
              {
                label: 'Portefeuille',
                data: ${JSON.stringify(data.charts.performance.historique.map(h => h.portefeuille))},
                borderColor: '${COLORS.primary}',
                backgroundColor: '${COLORS.primary}20',
                fill: true,
                tension: 0.3
              },
              {
                label: 'Benchmark',
                data: ${JSON.stringify(data.charts.performance.historique.map(h => h.benchmark))},
                borderColor: '${COLORS.muted}',
                borderDash: [5, 5],
                fill: false,
                tension: 0.3
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { boxWidth: 12 } } },
            scales: {
              y: { ticks: { callback: (v) => v + '%' } }
            }
          }
        });
      }
      
      // 9. Pie Chart Liquidité
      const ctxLiquidite = document.getElementById('chartLiquidite');
      if (ctxLiquidite) {
        const actifs = ${JSON.stringify(data.actifs)};
        const byLiquidite = actifs.reduce((acc, a) => {
          const key = a.liquidite || 'AUTRE';
          acc[key] = (acc[key] || 0) + a.valeur;
          return acc;
        }, {});
        
        new Chart(ctxLiquidite, {
          type: 'pie',
          data: {
            labels: Object.keys(byLiquidite).map(k => k.replace(/_/g, ' ')),
            datasets: [{
              data: Object.values(byLiquidite),
              backgroundColor: ['${COLORS.secondary}', '#06b6d4', '${COLORS.warning}', '${COLORS.muted}'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { boxWidth: 10, padding: 6 } } }
          }
        });
      }
      
      // 10. Pie Chart Géographique
      const ctxGeo = document.getElementById('chartGeo');
      if (ctxGeo) {
        new Chart(ctxGeo, {
          type: 'pie',
          data: {
            labels: ['France', 'Europe', 'International'],
            datasets: [{
              data: [70, 20, 10],
              backgroundColor: ['${COLORS.primary}', '${COLORS.secondary}', '${COLORS.warning}'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { boxWidth: 10, padding: 6 } } }
          }
        });
      }
      
    });
  `
}
