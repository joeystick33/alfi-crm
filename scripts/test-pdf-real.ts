import { generateBilanPatrimonialPremiumHtml } from '../app/_common/lib/templates/bilan-patrimonial-premium'
import puppeteer from 'puppeteer'
import fs from 'fs'

const mockData = {
  dossier: { id: 'test', reference: 'BP-2025-001', type: 'BILAN_PATRIMONIAL', categorie: 'PATRIMOINE', createdAt: new Date() },
  client: { nom: 'Dupont', prenom: 'Jean', dateNaissance: new Date('1975-06-15'), age: 49, situationFamiliale: 'Marié(e)', regimeMatrimonial: 'Communauté réduite aux acquêts', enfants: 2, profession: 'Cadre supérieur', email: 'jean.dupont@email.com', telephone: '06 12 34 56 78' },
  conseiller: { nom: 'Martin', prenom: 'Sophie', email: 'sophie.martin@cabinet.fr', telephone: '01 23 45 67 89' },
  cabinet: { nom: 'Cabinet Conseil Patrimoine', adresse: '12 rue de la Paix, 75002 Paris', telephone: '01 23 45 67 89', email: 'contact@cabinet.fr', siren: '123 456 789', opiasNumber: 'ORIAS-12345', cifNumber: 'CIF-67890' },
  patrimoine: {
    immobilier: [
      { type: 'Résidence principale', nom: 'Appartement Paris 16e', valeur: 850000, location: 'Paris' },
      { type: 'Investissement locatif', nom: 'Studio Lyon 3e', valeur: 180000, location: 'Lyon' },
    ],
    financier: [
      { type: 'Assurance-vie', nom: 'AV Generali', valeur: 120000 },
      { type: 'PEA', nom: 'PEA Boursorama', valeur: 45000 },
      { type: 'Livret A', nom: 'Livret A', valeur: 22950 },
      { type: 'PER', nom: 'PER Individuel', valeur: 35000 },
    ],
    professionnel: [],
    passifs: [
      { type: 'Crédit immobilier', nom: 'Crédit RP', capitalRestant: 320000, tauxInteret: 1.8, mensualite: 1450 },
      { type: 'Crédit immobilier', nom: 'Crédit locatif', capitalRestant: 95000, tauxInteret: 2.1, mensualite: 520 },
    ],
  },
  revenus: {
    total: 78000,
    details: [
      { type: 'Salaire', montant: 5200, frequence: 'MENSUEL' },
      { type: 'Revenus fonciers', montant: 750, frequence: 'MENSUEL' },
      { type: 'Prime annuelle', montant: 6600, frequence: 'ANNUEL' },
    ],
  },
  charges: { total: 3200, totalMensualitesCredits: 1970 },
  preconisations: [
    { titre: 'Optimisation assurance-vie', description: 'Diversifier l\'allocation de l\'assurance-vie vers des unités de compte pour améliorer le rendement long terme.', priorite: 'HAUTE' as const, produit: 'AV Multisupport', montantEstime: 50000, scoreImpact: 78 },
    { titre: 'Ouverture PER complémentaire', description: 'Profiter de la déductibilité fiscale du PER pour réduire l\'impôt sur le revenu.', priorite: 'MOYENNE' as const, produit: 'PER Individuel', montantEstime: 10000, scoreImpact: 65 },
  ],
  audit: {
    dateAudit: new Date().toISOString(),
    nomClient: 'Jean Dupont',
    budget: {
      revenusMensuels: 6500, chargesMensuelles: 3200, mensualitesCredits: 1970,
      resteAVivre: 1330, capaciteEpargneMensuelle: 800, capaciteEpargneAnnuelle: 9600,
      tauxEffort: 30.3, tauxEpargne: 12.3, scoreSante: 'bon',
      narratif: 'Situation budgétaire globalement saine avec un taux d\'épargne de 12.3%.',
      alertes: ['Taux d\'effort proche du seuil de 33%'],
      detailRevenus: [
        { categorie: 'Salaire', montant: 5200, poids: 80 },
        { categorie: 'Revenus fonciers', montant: 750, poids: 11.5 },
        { categorie: 'Primes', montant: 550, poids: 8.5 },
      ],
      detailCharges: [
        { categorie: 'Logement', montant: 800, poids: 25 },
        { categorie: 'Alimentation', montant: 600, poids: 18.8 },
        { categorie: 'Transport', montant: 350, poids: 10.9 },
        { categorie: 'Loisirs', montant: 400, poids: 12.5 },
        { categorie: 'Divers', montant: 1050, poids: 32.8 },
      ],
    },
    emprunt: {
      tauxEndettementActuel: 30.3,
      capaciteEndettementResiduelle: 2.7,
      mensualiteMaxSupportable: 2145,
      enveloppes: [
        { duree: 15, tauxInteret: 3.5, montantMax: 45000, interetsTotal: 12500 },
        { duree: 20, tauxInteret: 3.7, montantMax: 55000, interetsTotal: 18000 },
      ],
      narratif: 'Capacité d\'emprunt résiduelle limitée en raison d\'un taux d\'endettement déjà proche de 33%.',
    },
    fiscalite: {
      ir: {
        revenuBrut: 78000, deductions: 7800, revenuImposable: 70200,
        nombreParts: 3, quotientFamilial: 23400,
        impotBrut: 5200, plafonnementQF: 0, decote: 0, cehr: 0, impotTotal: 5200,
        contributionsSociales: 1250, tmi: 30, tauxEffectif: 7.4,
        tranches: [
          { taux: 0, base: 11294, impot: 0 },
          { taux: 11, base: 17206, impot: 1893 },
          { taux: 30, base: 0, impot: 0 },
        ],
        revenuNetApresImpot: 71550,
        narratif: 'TMI à 30%. Optimisation possible via PER et investissements défiscalisants.',
      },
      ifi: { patrimoineImmobilierBrut: 1030000, abattementRP: 255000, dettesDeductibles: 415000, patrimoineImposable: 360000, montantIFI: 0, assujetti: false, narratif: 'Non assujetti à l\'IFI.' },
      narratif: 'Fiscalité maîtrisée avec des marges d\'optimisation via le PER.',
    },
    epargnePrecaution: {
      montantCible: 19200, epargneLiquideActuelle: 22950, gap: 3750,
      priorite: 'low', narratif: 'Épargne de précaution suffisante.',
      detailEpargneLiquide: [{ support: 'Livret A', montant: 22950 }],
      moisCouverts: 7.2,
    },
    immobilier: {
      totalImmobilier: 1030000, poidsPatrimoine: 82,
      patrimoineImmobilierNet: 615000, cashFlowGlobalMensuel: -770,
      concentrationRisque: true,
      biens: [
        {
          nom: 'Appartement Paris 16e', type: 'Résidence principale', valeur: 850000, poidsPatrimoine: 68,
          rendementLocatifBrut: null, rendementLocatifNet: null,
          scenarioRevente: { horizons: [{ annees: 5, prixEstime: 920000, plusValueBrute: 70000, totalFiscalite: 0, netVendeur: 920000, gainNetTotal: 70000 }], narratif: 'RP exonérée de plus-value.' },
          analyse: 'Résidence principale bien située.',
        },
        {
          nom: 'Studio Lyon 3e', type: 'Investissement locatif', valeur: 180000, poidsPatrimoine: 14,
          loyerMensuel: 650, chargesAnnuelles: 2800, cashFlowMensuel: 130,
          rendementLocatifBrut: 4.3, rendementLocatifNet: 2.8, tri: 5.2,
          scenarioRevente: { horizons: [{ annees: 5, prixEstime: 195000, plusValueBrute: 15000, totalFiscalite: 5400, netVendeur: 189600, gainNetTotal: 9600 }], narratif: 'Plus-value modérée attendue.' },
          fiscaliteLocative: { regimeFiscal: 'Micro-foncier', tauxImpositionGlobal: 47.2, totalAnnuel: 2760 },
          analyse: 'Rendement correct, cashflow positif.',
        },
      ],
      narratif: 'Patrimoine immobilier concentré sur la RP. Diversification géographique avec le studio lyonnais.',
    },
    financier: {
      totalFinancier: 222950, scoreDiversification: 55, scoreRisque: 45,
      allocationParType: [
        { type: 'Assurance-vie', valeur: 120000, poids: 53.8 },
        { type: 'PEA', valeur: 45000, poids: 20.2 },
        { type: 'Épargne réglementée', valeur: 22950, poids: 10.3 },
        { type: 'PER', valeur: 35000, poids: 15.7 },
      ],
      allocationParRisque: [
        { risque: 'Faible', valeur: 57950, poids: 26 },
        { risque: 'Modéré', valeur: 120000, poids: 53.8 },
        { risque: 'Élevé', valeur: 45000, poids: 20.2 },
      ],
      allocationParLiquidite: [
        { liquidite: 'Immédiate', valeur: 22950, poids: 10.3 },
        { liquidite: 'Court terme', valeur: 45000, poids: 20.2 },
        { liquidite: 'Moyen terme', valeur: 120000, poids: 53.8 },
        { liquidite: 'Long terme', valeur: 35000, poids: 15.7 },
      ],
      recommandationAllocation: [
        { categorie: 'Actions', actuel: 20, cible: 35, ecart: -15 },
        { categorie: 'Obligations', actuel: 54, cible: 30, ecart: 24 },
        { categorie: 'Immobilier papier', actuel: 0, cible: 15, ecart: -15 },
        { categorie: 'Liquidités', actuel: 26, cible: 20, ecart: 6 },
      ],
      actifs: [
        { nom: 'AV Generali', type: 'Assurance-vie', valeur: 120000, poidsPatrimoine: 9.6, poidsPortefeuille: 53.8, risque: 'Modéré', liquidite: 'Moyen terme', enveloppeFiscale: 'Assurance-vie', commentaire: 'Bon support multi-gestion.' },
        { nom: 'PEA Boursorama', type: 'PEA', valeur: 45000, poidsPatrimoine: 3.6, poidsPortefeuille: 20.2, risque: 'Élevé', liquidite: 'Court terme', enveloppeFiscale: 'PEA', commentaire: 'ETF world.' },
        { nom: 'Livret A', type: 'Épargne réglementée', valeur: 22950, poidsPatrimoine: 1.8, poidsPortefeuille: 10.3, risque: 'Faible', liquidite: 'Immédiate', enveloppeFiscale: 'Exonéré', commentaire: 'Épargne de précaution.' },
        { nom: 'PER Individuel', type: 'PER', valeur: 35000, poidsPatrimoine: 2.8, poidsPortefeuille: 15.7, risque: 'Modéré', liquidite: 'Long terme', enveloppeFiscale: 'PER', commentaire: 'Avantage fiscal IR.' },
      ],
      narratif: 'Portefeuille financier sous-diversifié. Surexposition obligations, sous-exposition actions et immobilier papier.',
    },
    retraite: {
      ageActuel: 49,
      estimationPension: {
        pensionBaseMensuelle: 1800, pensionComplementaireMensuelle: 900, pensionTotaleMensuelle: 2700,
        tauxRemplacement: 41.5, trimestresValides: 108, trimestresRestants: 64,
        trimestresRequis: 172, trimestresManquants: 0,
        decoteSurcote: 0, decoteSurcoteLabel: 'Taux plein',
        pointsComplementaires: 6500, valeurPoint: 1.4159,
      },
      evolutionParAge: [
        { age: 62, trimestres: 160, trimestresManquants: 12, decoteSurcotePct: -7.5, decoteSurcoteLabel: 'Décote', pensionMensuelle: 2200, tauxRemplacement: 33.8, differenceVsChoisi: -500, estChoisi: false, estOptimal: false },
        { age: 64, trimestres: 168, trimestresManquants: 4, decoteSurcotePct: -2.5, decoteSurcoteLabel: 'Décote', pensionMensuelle: 2550, tauxRemplacement: 39.2, differenceVsChoisi: -150, estChoisi: false, estOptimal: false },
        { age: 65, trimestres: 172, trimestresManquants: 0, decoteSurcotePct: 0, decoteSurcoteLabel: 'Taux plein', pensionMensuelle: 2700, tauxRemplacement: 41.5, differenceVsChoisi: 0, estChoisi: true, estOptimal: true },
        { age: 67, trimestres: 180, trimestresManquants: 0, decoteSurcotePct: 5, decoteSurcoteLabel: 'Surcote', pensionMensuelle: 2970, tauxRemplacement: 45.7, differenceVsChoisi: 270, estChoisi: false, estOptimal: false },
      ],
      analyseGap: { revenuSouhaite: 4000, pensionEstimee: 2700, gapMensuel: 1300, capitalNecessaire4Pct: 390000, narratif: 'Gap de revenus à combler par l\'épargne retraite.' },
      detailEpargneRetraite: [{ support: 'PER', montant: 35000 }, { support: 'AV', montant: 120000 }],
      epargneRetraiteActuelle: 155000,
      scenarios: [
        { label: 'Prudent (3%)', rendement: 3, ageDepart: 65, capitalRetraite: 280000, revenuDurable: 933, gapMensuel: 367, capitalEpuiseAge: 89, faisable: true },
        { label: 'Équilibré (5%)', rendement: 5, ageDepart: 65, capitalRetraite: 380000, revenuDurable: 1583, gapMensuel: 0, capitalEpuiseAge: null, faisable: true },
      ],
      recommandations: [
        { priorite: 'haute', description: 'Augmenter les versements PER de 300€/mois.' },
        { priorite: 'moyenne', description: 'Diversifier l\'AV vers des UC dynamiques.' },
      ],
      narratif: 'Départ possible à 65 ans au taux plein. Gap de revenus de 1 300 €/mois à combler.',
    },
    succession: {
      patrimoineNetTaxable: 837950, situationFamiliale: 'Marié(e)', regimeMatrimonial: 'Communauté réduite aux acquêts',
      nbEnfants: 2, droitsEstimes: 18500, tauxEffectif: 4.4, abattementTotal: 200000,
      detailParHeritier: [
        { lien: 'Enfant 1', partBrute: 209487, abattement: 100000, taxable: 109487, droits: 9250, tauxEffectif: 4.4, tranches: [{ taux: 5, base: 8072, impot: 404 }, { taux: 10, base: 4037, impot: 404 }, { taux: 15, base: 3823, impot: 573 }, { taux: 20, base: 93555, impot: 7869 }] },
        { lien: 'Enfant 2', partBrute: 209487, abattement: 100000, taxable: 109487, droits: 9250, tauxEffectif: 4.4, tranches: [{ taux: 5, base: 8072, impot: 404 }, { taux: 10, base: 4037, impot: 404 }, { taux: 15, base: 3823, impot: 573 }, { taux: 20, base: 93555, impot: 7869 }] },
      ],
      strategiesOptimisation: [
        { strategie: 'Donation-partage', description: 'Transmettre une partie du patrimoine de votre vivant.', economieEstimee: 8000, priorite: 'haute', detailMiseEnOeuvre: 'Donation en nue-propriété possible.' },
      ],
      narratif: 'Droits de succession modérés grâce aux abattements en ligne directe.',
    },
    synthese: {
      scoreGlobal: 68,
      scores: [
        { theme: 'Budget', score: 72, verdict: 'Bon', couleur: '#10b981', commentaire: 'Bonne gestion budgétaire.' },
        { theme: 'Épargne', score: 78, verdict: 'Bon', couleur: '#10b981', commentaire: 'Précaution couverte.' },
        { theme: 'Fiscalité', score: 55, verdict: 'Attention', couleur: '#f59e0b', commentaire: 'Optimisation possible.' },
        { theme: 'Immobilier', score: 65, verdict: 'Correct', couleur: '#f59e0b', commentaire: 'Concentration sur la RP.' },
        { theme: 'Financier', score: 50, verdict: 'Attention', couleur: '#f59e0b', commentaire: 'Sous-diversifié.' },
        { theme: 'Retraite', score: 60, verdict: 'Attention', couleur: '#f59e0b', commentaire: 'Gap à combler.' },
        { theme: 'Succession', score: 80, verdict: 'Bon', couleur: '#10b981', commentaire: 'Bien optimisé.' },
      ],
      pointsForts: ['Épargne de précaution constituée', 'Taux d\'endettement maîtrisé', 'Succession bien anticipée'],
      pointsVigilance: ['Patrimoine concentré sur l\'immobilier', 'Portefeuille financier sous-diversifié', 'Gap retraite significatif'],
      actionsPrioritaires: ['Diversifier le portefeuille financier', 'Augmenter les versements PER', 'Envisager des SCPI pour diversifier l\'immobilier'],
      narratifGlobal: 'Situation patrimoniale solide mais perfectible. Les principaux axes d\'amélioration sont la diversification financière et la préparation retraite.',
    },
  },
}

async function main() {
  console.log('[TEST] Generating HTML from template...')
  const html = generateBilanPatrimonialPremiumHtml(mockData)
  fs.writeFileSync('/tmp/bilan-debug.html', html)
  console.log(`[TEST] HTML generated: ${(html.length / 1024).toFixed(1)} KB`)
  console.log(`[TEST] Pages: ${(html.match(/class="page/g) || []).length}`)
  console.log(`[TEST] SVGs: ${(html.match(/<svg/g) || []).length}`)
  console.log(`[TEST] Gradients: ${(html.match(/linear-gradient/g) || []).length}`)
  console.log(`[TEST] HTML saved to /tmp/bilan-debug.html`)

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  })

  // Test A: Full print as-is
  console.log('\n=== Test A: Print as-is ===')
  let page = await browser.newPage()
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 })
  await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await new Promise(r => setTimeout(r, 500))
  try {
    await page.pdf({ path: '/tmp/bilan-A.pdf', format: 'A4', printBackground: true, tagged: false, waitForFonts: false, outline: false, preferCSSPageSize: false, scale: 1, margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }, timeout: 60000 })
    console.log('✅ Test A PASSED')
  } catch (e: any) { console.error('❌ Test A FAILED:', e.message) }
  await page.close()

  // Test B: Strip inline gradients then print
  console.log('\n=== Test B: Strip inline gradients ===')
  page = await browser.newPage()
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 })
  await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await new Promise(r => setTimeout(r, 300))
  await page.evaluate(() => {
    document.querySelectorAll('*').forEach(el => {
      const s = (el as HTMLElement).style
      if (s.background?.includes('gradient')) { const m = s.background.match(/#[0-9a-fA-F]{3,8}/); s.background = m ? m[0] : '#f8fafc' }
      if (s.backgroundImage?.includes('gradient')) s.backgroundImage = 'none'
    })
  })
  try {
    await page.pdf({ path: '/tmp/bilan-B.pdf', format: 'A4', printBackground: true, tagged: false, waitForFonts: false, outline: false, preferCSSPageSize: false, scale: 1, margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }, timeout: 60000 })
    console.log('✅ Test B PASSED')
  } catch (e: any) { console.error('❌ Test B FAILED:', e.message) }
  await page.close()

  // Test C: Binary search — first half of pages only
  console.log('\n=== Test C: First half of pages only ===')
  page = await browser.newPage()
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 })
  await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await new Promise(r => setTimeout(r, 300))
  const totalPages = await page.evaluate(() => {
    const pages = document.querySelectorAll('.page')
    const half = Math.ceil(pages.length / 2)
    for (let i = half; i < pages.length; i++) pages[i].remove()
    return pages.length
  })
  console.log(`  Kept first ${Math.ceil(totalPages / 2)} of ${totalPages} pages`)
  try {
    await page.pdf({ path: '/tmp/bilan-C.pdf', format: 'A4', printBackground: true, tagged: false, waitForFonts: false, outline: false, preferCSSPageSize: false, margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }, timeout: 60000 })
    console.log('✅ Test C PASSED (first half)')
  } catch (e: any) { console.error('❌ Test C FAILED (first half):', e.message) }
  await page.close()

  // Test D: Second half of pages only
  console.log('\n=== Test D: Second half of pages only ===')
  page = await browser.newPage()
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 })
  await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await new Promise(r => setTimeout(r, 300))
  await page.evaluate(() => {
    const pages = document.querySelectorAll('.page')
    const half = Math.ceil(pages.length / 2)
    for (let i = 0; i < half; i++) pages[i].remove()
  })
  try {
    await page.pdf({ path: '/tmp/bilan-D.pdf', format: 'A4', printBackground: true, tagged: false, waitForFonts: false, outline: false, preferCSSPageSize: false, margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }, timeout: 60000 })
    console.log('✅ Test D PASSED (second half)')
  } catch (e: any) { console.error('❌ Test D FAILED (second half):', e.message) }
  await page.close()

  // Test E: One page at a time to find the crasher
  console.log('\n=== Test E: One page at a time ===')
  for (let i = 0; i < totalPages; i++) {
    page = await browser.newPage()
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 })
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await new Promise(r => setTimeout(r, 200))
    const pageTitle = await page.evaluate((idx) => {
      const pages = document.querySelectorAll('.page')
      for (let j = 0; j < pages.length; j++) { if (j !== idx) pages[j].remove() }
      const h = pages[idx]?.querySelector('h2, h1, .page-title, .cover-title')
      return h?.textContent?.trim() || `Page ${idx}`
    }, i)
    try {
      await page.pdf({ path: `/tmp/bilan-page-${i}.pdf`, format: 'A4', printBackground: true, tagged: false, waitForFonts: false, outline: false, preferCSSPageSize: false, margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }, timeout: 30000 })
      console.log(`  ✅ Page ${i}: ${pageTitle}`)
    } catch (e: any) {
      console.error(`  ❌ Page ${i}: ${pageTitle} — ${e.message}`)
    }
    await page.close()
  }

  await browser.close()
  console.log('\n[TEST] Done.')
}

main().catch(console.error)
