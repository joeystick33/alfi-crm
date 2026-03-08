import { generateBilanPatrimonialPremiumHtml } from '../app/_common/lib/templates/bilan-patrimonial-premium'
import puppeteer from 'puppeteer'
import { PDFDocument } from 'pdf-lib'
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
  revenus: { total: 78000, details: [{ type: 'Salaire', montant: 5200, frequence: 'MENSUEL' }, { type: 'Revenus fonciers', montant: 750, frequence: 'MENSUEL' }] },
  charges: { total: 3200, totalMensualitesCredits: 1970 },
  preconisations: [
    { titre: 'Optimisation assurance-vie', description: 'Diversifier l\'allocation.', priorite: 'HAUTE' as const, produit: 'AV Multisupport', montantEstime: 50000, scoreImpact: 78 },
    { titre: 'Ouverture PER', description: 'Profiter de la déductibilité fiscale.', priorite: 'MOYENNE' as const, produit: 'PER', montantEstime: 10000, scoreImpact: 65 },
  ],
  audit: {
    dateAudit: new Date().toISOString(), nomClient: 'Jean Dupont',
    budget: { revenusMensuels: 6500, chargesMensuelles: 3200, mensualitesCredits: 1970, resteAVivre: 1330, capaciteEpargneMensuelle: 800, capaciteEpargneAnnuelle: 9600, tauxEffort: 30.3, tauxEpargne: 12.3, scoreSante: 'bon', narratif: 'Bonne gestion.', alertes: ['Taux d\'effort proche de 33%'], detailRevenus: [{ categorie: 'Salaire', montant: 5200, poids: 80 }, { categorie: 'Fonciers', montant: 750, poids: 12 }], detailCharges: [{ categorie: 'Logement', montant: 800, poids: 25 }, { categorie: 'Alimentation', montant: 600, poids: 19 }] },
    emprunt: { tauxEndettementActuel: 30.3, capaciteEndettementResiduelle: 2.7, mensualiteMaxSupportable: 2145, enveloppes: [{ duree: 15, tauxInteret: 3.5, montantMax: 45000 }, { duree: 20, tauxInteret: 3.7, montantMax: 55000 }], narratif: 'Capacité limitée.' },
    fiscalite: { ir: { revenuBrut: 78000, deductions: 7800, revenuImposable: 70200, nombreParts: 3, quotientFamilial: 23400, impotBrut: 5200, plafonnementQF: 0, decote: 0, cehr: 0, impotTotal: 5200, contributionsSociales: 1250, tmi: 30, tauxEffectif: 7.4, tranches: [{ taux: 0, base: 11294, impot: 0 }, { taux: 11, base: 17206, impot: 1893 }], revenuNetApresImpot: 71550, narratif: 'TMI 30%.' }, ifi: { patrimoineImmobilierBrut: 1030000, abattementRP: 255000, dettesDeductibles: 415000, patrimoineImposable: 360000, montantIFI: 0, assujetti: false, narratif: 'Non assujetti.' }, narratif: 'Fiscalité maîtrisée.' },
    epargnePrecaution: { montantCible: 19200, epargneLiquideActuelle: 22950, gap: 3750, priorite: 'low', narratif: 'Suffisante.', detailEpargneLiquide: [{ support: 'Livret A', montant: 22950 }], moisCouverts: 7.2 },
    immobilier: { totalImmobilier: 1030000, poidsPatrimoine: 82, patrimoineImmobilierNet: 615000, cashFlowGlobalMensuel: -770, concentrationRisque: true, biens: [{ nom: 'Appartement Paris 16e', type: 'RP', valeur: 850000, poidsPatrimoine: 68, rendementLocatifBrut: null, rendementLocatifNet: null, scenarioRevente: { horizons: [{ annees: 5, prixEstime: 920000, plusValueBrute: 70000, totalFiscalite: 0, netVendeur: 920000, gainNetTotal: 70000 }], narratif: 'RP exonérée.' }, analyse: 'Bien situé.' }, { nom: 'Studio Lyon', type: 'Locatif', valeur: 180000, poidsPatrimoine: 14, loyerMensuel: 650, chargesAnnuelles: 2800, cashFlowMensuel: 130, rendementLocatifBrut: 4.3, rendementLocatifNet: 2.8, tri: 5.2, scenarioRevente: { horizons: [{ annees: 5, prixEstime: 195000, plusValueBrute: 15000, totalFiscalite: 5400, netVendeur: 189600, gainNetTotal: 9600 }], narratif: 'PV modérée.' }, fiscaliteLocative: { regimeFiscal: 'Micro-foncier', tauxImpositionGlobal: 47.2, totalAnnuel: 2760 }, analyse: 'Rendement correct.' }], narratif: 'Concentré sur RP.' },
    financier: { totalFinancier: 222950, scoreDiversification: 55, scoreRisque: 45, allocationParType: [{ type: 'AV', valeur: 120000, poids: 54 }, { type: 'PEA', valeur: 45000, poids: 20 }, { type: 'Livret', valeur: 22950, poids: 10 }, { type: 'PER', valeur: 35000, poids: 16 }], allocationParRisque: [{ risque: 'Faible', valeur: 57950, poids: 26 }, { risque: 'Modéré', valeur: 120000, poids: 54 }, { risque: 'Élevé', valeur: 45000, poids: 20 }], allocationParLiquidite: [{ liquidite: 'Immédiate', valeur: 22950, poids: 10 }, { liquidite: 'Court terme', valeur: 45000, poids: 20 }, { liquidite: 'Moyen terme', valeur: 120000, poids: 54 }, { liquidite: 'Long terme', valeur: 35000, poids: 16 }], recommandationAllocation: [{ categorie: 'Actions', actuel: 20, cible: 35, ecart: -15 }, { categorie: 'Obligations', actuel: 54, cible: 30, ecart: 24 }], actifs: [{ nom: 'AV Generali', type: 'AV', valeur: 120000, poidsPatrimoine: 10, poidsPortefeuille: 54, risque: 'Modéré', liquidite: 'MT', enveloppeFiscale: 'AV', commentaire: 'Bon support.' }, { nom: 'PEA', type: 'PEA', valeur: 45000, poidsPatrimoine: 4, poidsPortefeuille: 20, risque: 'Élevé', liquidite: 'CT', enveloppeFiscale: 'PEA', commentaire: 'ETF.' }], narratif: 'Sous-diversifié.' },
    retraite: { ageActuel: 49, estimationPension: { pensionBaseMensuelle: 1800, pensionComplementaireMensuelle: 900, pensionTotaleMensuelle: 2700, tauxRemplacement: 41.5, trimestresValides: 108, trimestresRestants: 64, trimestresRequis: 172, trimestresManquants: 0, decoteSurcote: 0, decoteSurcoteLabel: 'Taux plein', pointsComplementaires: 6500, valeurPoint: 1.4159 }, evolutionParAge: [{ age: 62, trimestres: 160, trimestresManquants: 12, decoteSurcotePct: -7.5, decoteSurcoteLabel: 'Décote', pensionMensuelle: 2200, tauxRemplacement: 34, differenceVsChoisi: -500, estChoisi: false, estOptimal: false }, { age: 65, trimestres: 172, trimestresManquants: 0, decoteSurcotePct: 0, decoteSurcoteLabel: 'Taux plein', pensionMensuelle: 2700, tauxRemplacement: 42, differenceVsChoisi: 0, estChoisi: true, estOptimal: true }], analyseGap: { revenuSouhaite: 4000, pensionEstimee: 2700, gapMensuel: 1300, capitalNecessaire4Pct: 390000, narratif: 'Gap à combler.' }, detailEpargneRetraite: [{ support: 'PER', montant: 35000 }], epargneRetraiteActuelle: 155000, scenarios: [{ label: 'Prudent', rendement: 3, ageDepart: 65, capitalRetraite: 280000, revenuDurable: 933, gapMensuel: 367, capitalEpuiseAge: 89, faisable: true }], recommandations: [{ priorite: 'haute', description: 'Augmenter PER.' }], narratif: 'Départ 65 ans.' },
    succession: { patrimoineNetTaxable: 837950, situationFamiliale: 'Marié(e)', regimeMatrimonial: 'Communauté', nbEnfants: 2, droitsEstimes: 18500, tauxEffectif: 4.4, abattementTotal: 200000, detailParHeritier: [{ lien: 'Enfant 1', partBrute: 209487, abattement: 100000, taxable: 109487, droits: 9250, tauxEffectif: 4.4, tranches: [{ taux: 5, base: 8072, impot: 404 }] }, { lien: 'Enfant 2', partBrute: 209487, abattement: 100000, taxable: 109487, droits: 9250, tauxEffectif: 4.4, tranches: [{ taux: 5, base: 8072, impot: 404 }] }], strategiesOptimisation: [{ strategie: 'Donation-partage', description: 'Transmettre de votre vivant.', economieEstimee: 8000, priorite: 'haute', detailMiseEnOeuvre: 'Donation nue-propriété.' }], narratif: 'Droits modérés.' },
    synthese: { scoreGlobal: 68, scores: [{ theme: 'Budget', score: 72, verdict: 'Bon', couleur: '#10b981', commentaire: 'OK.' }, { theme: 'Épargne', score: 78, verdict: 'Bon', couleur: '#10b981', commentaire: 'OK.' }, { theme: 'Fiscalité', score: 55, verdict: 'Attention', couleur: '#f59e0b', commentaire: 'Optimisable.' }, { theme: 'Immobilier', score: 65, verdict: 'Correct', couleur: '#f59e0b', commentaire: 'Concentré.' }, { theme: 'Financier', score: 50, verdict: 'Attention', couleur: '#f59e0b', commentaire: 'Sous-diversifié.' }, { theme: 'Retraite', score: 60, verdict: 'Attention', couleur: '#f59e0b', commentaire: 'Gap.' }, { theme: 'Succession', score: 80, verdict: 'Bon', couleur: '#10b981', commentaire: 'OK.' }], pointsForts: ['Épargne de précaution', 'Endettement maîtrisé'], pointsVigilance: ['Concentration immobilière', 'Gap retraite'], actionsPrioritaires: ['Diversifier', 'PER'], narratifGlobal: 'Solide mais perfectible.' },
  },
}

async function main() {
  console.log('[TEST] Generating HTML...')
  const html = generateBilanPatrimonialPremiumHtml(mockData)
  const pageCount = (html.match(/class="page[\s"]/g) || []).length
  console.log(`[TEST] HTML: ${(html.length / 1024).toFixed(1)} KB, ${pageCount} pages`)

  const CHUNK_SIZE = 5
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] })

  try {
    const chunkCount = Math.ceil(pageCount / CHUNK_SIZE)
    const pdfChunks: Buffer[] = []

    for (let c = 0; c < chunkCount; c++) {
      const start = c * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, pageCount)
      console.log(`[TEST] Chunk ${c + 1}/${chunkCount}: pages ${start}-${end - 1}`)

      const page = await browser.newPage()
      await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 })
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 })
      await new Promise(r => setTimeout(r, 300))

      await page.evaluate((s, e) => {
        const pages = document.querySelectorAll('.page')
        pages.forEach((p, i) => { if (i < s || i >= e) p.remove() })
        document.querySelectorAll('*').forEach(el => {
          const st = (el as HTMLElement).style
          if (st?.background?.includes('gradient')) { const m = st.background.match(/#[0-9a-fA-F]{3,8}/); st.background = m ? m[0] : '#f8fafc' }
          if (st?.backgroundImage?.includes('gradient')) st.backgroundImage = 'none'
        })
        const remaining = document.querySelectorAll('.page')
        if (remaining.length > 0) (remaining[remaining.length - 1] as HTMLElement).style.pageBreakAfter = 'avoid'
      }, start, end)

      try {
        const buf = await page.pdf({ format: 'A4', printBackground: true, tagged: false, waitForFonts: false, outline: false, preferCSSPageSize: false, scale: 1, margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }, timeout: 60000 })
        pdfChunks.push(Buffer.from(buf))
        console.log(`  ✅ Chunk ${c + 1} OK (${(buf.length / 1024).toFixed(1)} KB)`)
      } catch (e: any) {
        console.error(`  ❌ Chunk ${c + 1} FAILED: ${e.message}`)
      }
      await page.close()
    }

    // Merge
    console.log(`\n[TEST] Merging ${pdfChunks.length} chunks...`)
    const merged = await PDFDocument.create()
    for (const buf of pdfChunks) {
      const src = await PDFDocument.load(buf)
      const pages = await merged.copyPages(src, src.getPageIndices())
      pages.forEach(p => merged.addPage(p))
    }
    const result = await merged.save()
    fs.writeFileSync('/tmp/bilan-final.pdf', result)
    console.log(`\n✅ FINAL PDF: /tmp/bilan-final.pdf (${(result.length / 1024).toFixed(1)} KB, ${merged.getPageCount()} pages)`)
  } finally {
    await browser.close()
  }
}

main().catch(console.error)
