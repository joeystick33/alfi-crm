/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Bilan Patrimonial Audit Builder
 * 
 * Construit la section `audit` complète du template premium PDF.
 * Analyse : budget, emprunt, fiscalité, épargne précaution, immobilier,
 * financier, retraite, succession, synthèse.
 */

import { RULES } from '@/app/_common/lib/rules/fiscal-rules'

// Barème IR — Source : RULES.ir.bareme
const BAREME_IR = RULES.ir.bareme.map(t => ({
  min: t.min,
  max: t.max,
  taux: t.taux * 100,
}))

// Barème droits de succession en ligne directe — Source : RULES.succession
const BAREME_SUCCESSION = RULES.succession.bareme_ligne_directe.map(t => ({
  min: t.min,
  max: t.max,
  taux: t.taux * 100,
}))

// Barème IFI — Source : RULES.ifi.bareme
const BAREME_IFI = RULES.ifi.bareme.map(t => ({
  min: t.min,
  max: t.max,
  taux: t.taux * 100,
}))

interface AuditInput {
  client: any
  actifs: any[]
  passifs: any[]
  contrats: any[]
  simulations: any[]
}

function calculateAge(birthDate: any): number {
  if (!birthDate) return 0
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function calculerNombreParts(situation: string, enfants: number): number {
  let parts = 1
  if (situation && (situation.toLowerCase().includes('marié') || situation.toLowerCase().includes('pacsé') || situation === 'MARIE' || situation === 'PACSE')) {
    parts = 2
  }
  if (enfants >= 1) parts += 0.5
  if (enfants >= 2) parts += 0.5
  if (enfants >= 3) parts += (enfants - 2)
  return parts
}

function calculerIR(revenuImposable: number, nombreParts: number): { impot: number; tmi: number; tauxEffectif: number; tranches: { taux: number; base: number; impot: number }[] } {
  const quotient = revenuImposable / nombreParts
  let irPart = 0
  let tmi = 0
  const tranches: { taux: number; base: number; impot: number }[] = []

  for (const t of BAREME_IR) {
    if (quotient > t.min) {
      const base = Math.min(quotient, t.max) - t.min
      const impotTranche = base * (t.taux / 100)
      irPart += impotTranche
      if (t.taux > 0) {
        tranches.push({ taux: t.taux, base: Math.round(base * nombreParts), impot: Math.round(impotTranche * nombreParts) })
      }
      if (t.taux > tmi) tmi = t.taux
    }
  }

  const impot = Math.round(irPart * nombreParts)
  const tauxEffectif = revenuImposable > 0 ? (impot / revenuImposable) * 100 : 0

  return { impot, tmi, tauxEffectif, tranches }
}

function calculerDroitsSuccession(patrimoineNet: number, enfants: number, situationFamiliale: string): {
  droitsEstimes: number
  tauxEffectif: number
  abattementTotal: number
  detailParHeritier: any[]
} {
  if (enfants === 0) {
    return { droitsEstimes: 0, tauxEffectif: 0, abattementTotal: 0, detailParHeritier: [] }
  }

  const abattementParEnfant = 100000
  const partParEnfant = patrimoineNet / enfants
  const detailParHeritier: any[] = []
  let droitsTotal = 0

  for (let i = 0; i < enfants; i++) {
    const taxable = Math.max(0, partParEnfant - abattementParEnfant)
    let droits = 0
    const tranchesHeritier: { taux: number; base: number; impot: number }[] = []

    for (const t of BAREME_SUCCESSION) {
      if (taxable > t.min) {
        const base = Math.min(taxable, t.max) - t.min
        const impotTranche = base * (t.taux / 100)
        droits += impotTranche
        if (base > 0) tranchesHeritier.push({ taux: t.taux, base: Math.round(base), impot: Math.round(impotTranche) })
      }
    }

    droitsTotal += droits
    detailParHeritier.push({
      lien: `Enfant ${i + 1}`,
      partBrute: Math.round(partParEnfant),
      abattement: abattementParEnfant,
      taxable: Math.round(taxable),
      droits: Math.round(droits),
      tauxEffectif: partParEnfant > 0 ? (droits / partParEnfant) * 100 : 0,
      tranches: tranchesHeritier,
    })
  }

  return {
    droitsEstimes: Math.round(droitsTotal),
    tauxEffectif: patrimoineNet > 0 ? (droitsTotal / patrimoineNet) * 100 : 0,
    abattementTotal: enfants * abattementParEnfant,
    detailParHeritier,
  }
}

function calculerIFI(patrimoineImmoBrut: number, hasRP: boolean): {
  assujetti: boolean
  patrimoineImposable: number
  montantIFI: number
  abattementRP: number
} {
  const abattementRP = hasRP ? patrimoineImmoBrut * 0.30 * 0.3 : 0 // 30% sur la RP estimée à 30% du parc immo
  const patrimoineImposable = Math.max(0, patrimoineImmoBrut - abattementRP)
  const assujetti = patrimoineImposable > RULES.ifi.seuil_assujettissement

  if (!assujetti) return { assujetti: false, patrimoineImposable, montantIFI: 0, abattementRP }

  let ifi = 0
  for (const t of BAREME_IFI) {
    if (patrimoineImposable > t.min) {
      const base = Math.min(patrimoineImposable, t.max) - t.min
      ifi += base * (t.taux / 100)
    }
  }

  return { assujetti, patrimoineImposable, montantIFI: Math.round(ifi), abattementRP: Math.round(abattementRP) }
}

export function buildAuditData(input: AuditInput): any {
  const { client, actifs, passifs, contrats } = input

  const age = calculateAge(client.birthDate)
  const enfants = client.numberOfChildren || 0
  const situationFamiliale = client.maritalStatus || ''
  const regimeMatrimonial = client.matrimonialRegime || ''

  // ── PATRIMOINE ──
  const immoActifs = actifs.filter((a: any) => a.category === 'IMMOBILIER')
  const finActifs = actifs.filter((a: any) => ['EPARGNE', 'PLACEMENT', 'RETRAITE', 'FINANCIER'].includes(a.category))
  const proActifs = actifs.filter((a: any) => a.category === 'PROFESSIONNEL')

  const totalImmo = immoActifs.reduce((s: number, a: any) => s + Number(a.value || 0), 0)
  const totalFin = finActifs.reduce((s: number, a: any) => s + Number(a.value || 0), 0)
  const totalPro = proActifs.reduce((s: number, a: any) => s + Number(a.value || 0), 0)
  const totalActifs = totalImmo + totalFin + totalPro
  const totalPassifs = passifs.reduce((s: number, p: any) => s + Number(p.remainingAmount || 0), 0)
  const patrimoineNet = totalActifs - totalPassifs

  // ── REVENUS ──
  const revenusAnnuels = Number(client.annualIncome || 0)
  const revenusMensuels = revenusAnnuels / 12

  // ── CHARGES ──
  const mensualitesCredits = passifs.reduce((s: number, p: any) => s + Number(p.monthlyPayment || 0), 0)
  const chargesMensuelles = mensualitesCredits // Approximation : on ne connaît que les crédits
  const resteAVivre = revenusMensuels - chargesMensuelles
  const capaciteEpargneMensuelle = Math.max(0, resteAVivre * 0.7) // 30% pour dépenses courantes
  const tauxEffort = revenusMensuels > 0 ? (mensualitesCredits / revenusMensuels) * 100 : 0
  const tauxEpargne = revenusMensuels > 0 ? (capaciteEpargneMensuelle / revenusMensuels) * 100 : 0

  // ── BUDGET ──
  const scoreSanteBudget = tauxEffort > 50 ? 'CRITIQUE' : tauxEffort > 33 ? 'TENDU' : tauxEffort > 20 ? 'CORRECT' : 'SAIN'
  const alertesBudget: string[] = []
  if (tauxEffort > 33) alertesBudget.push(`Taux d'endettement de ${tauxEffort.toFixed(1)}% supérieur au seuil prudentiel de 33%`)
  if (resteAVivre < 1500) alertesBudget.push(`Reste à vivre mensuel faible : ${Math.round(resteAVivre)} €`)
  if (revenusAnnuels === 0) alertesBudget.push('Revenus non renseignés — l\'analyse budgétaire est incomplète')

  const budget = {
    revenusMensuels: Math.round(revenusMensuels),
    chargesMensuelles: Math.round(chargesMensuelles),
    mensualitesCredits: Math.round(mensualitesCredits),
    resteAVivre: Math.round(resteAVivre),
    capaciteEpargneMensuelle: Math.round(capaciteEpargneMensuelle),
    capaciteEpargneAnnuelle: Math.round(capaciteEpargneMensuelle * 12),
    tauxEffort: Math.round(tauxEffort * 10) / 10,
    tauxEpargne: Math.round(tauxEpargne * 10) / 10,
    scoreSante: scoreSanteBudget,
    narratif: `Avec des revenus mensuels de ${Math.round(revenusMensuels).toLocaleString('fr-FR')} € et des mensualités de crédit de ${Math.round(mensualitesCredits).toLocaleString('fr-FR')} €, votre taux d'effort s'établit à ${tauxEffort.toFixed(1)}%. ${scoreSanteBudget === 'SAIN' ? 'Votre situation budgétaire est saine et vous disposez d\'une bonne marge de manœuvre.' : scoreSanteBudget === 'CORRECT' ? 'Votre budget est maîtrisé avec une capacité d\'épargne correcte.' : scoreSanteBudget === 'TENDU' ? 'Votre budget est tendu, la capacité d\'épargne est limitée.' : 'Votre situation budgétaire nécessite une attention particulière.'}`,
    alertes: alertesBudget,
    detailRevenus: [{ categorie: 'Revenus d\'activité', montant: Math.round(revenusMensuels), poids: 100 }],
    detailCharges: [{ categorie: 'Mensualités crédits', montant: Math.round(mensualitesCredits), poids: revenusMensuels > 0 ? Math.round(mensualitesCredits / revenusMensuels * 100) : 0 }],
  }

  // ── EMPRUNT ──
  const capaciteEndettement = revenusMensuels * 0.33
  const capaciteResiduelle = Math.max(0, capaciteEndettement - mensualitesCredits)
  const tauxMoyen = 3.5 // Taux moyen actuel
  const enveloppes = [10, 15, 20, 25].map(duree => {
    const n = duree * 12
    const r = tauxMoyen / 100 / 12
    const montantMax = r > 0 ? capaciteResiduelle * (1 - Math.pow(1 + r, -n)) / r : capaciteResiduelle * n
    const interetsTotal = capaciteResiduelle * n - montantMax
    return { duree, tauxInteret: tauxMoyen, montantMax: Math.round(montantMax), interetsTotal: Math.round(Math.abs(interetsTotal)) }
  })

  const emprunt = {
    tauxEndettementActuel: Math.round(tauxEffort * 10) / 10,
    capaciteEndettementResiduelle: Math.round(capaciteResiduelle),
    mensualiteMaxSupportable: Math.round(capaciteEndettement),
    enveloppes,
    narratif: `Avec une capacité d'endettement résiduelle de ${Math.round(capaciteResiduelle).toLocaleString('fr-FR')} €/mois, vous pouvez envisager un emprunt de ${Math.round(enveloppes[2]?.montantMax || 0).toLocaleString('fr-FR')} € sur 20 ans au taux de ${tauxMoyen}%.`,
  }

  // ── FISCALITÉ ──
  const nombreParts = calculerNombreParts(situationFamiliale, enfants)
  const abattement10pct = Math.min(Math.max(revenusAnnuels * 0.10, 495), 14171)
  const revenuImposable = Math.max(0, revenusAnnuels - abattement10pct)
  const irResult = calculerIR(revenuImposable, nombreParts)

  // CEHR
  let cehr = 0
  if (revenusAnnuels > 500000 && nombreParts >= 2) {
    cehr = (revenusAnnuels - 500000) * 0.03
    if (revenusAnnuels > 1000000) cehr += (revenusAnnuels - 1000000) * 0.01
  } else if (revenusAnnuels > 250000 && nombreParts < 2) {
    cehr = (revenusAnnuels - 250000) * 0.03
    if (revenusAnnuels > 500000) cehr += (revenusAnnuels - 500000) * 0.01
  }

  const ps = revenusAnnuels * 0.172 * 0 // PS sur revenus du patrimoine uniquement, pas salaires
  const revenuNetApresImpot = revenusAnnuels - irResult.impot - cehr

  const fiscaliteIR = {
    revenuBrut: Math.round(revenusAnnuels),
    deductions: Math.round(abattement10pct),
    revenuImposable: Math.round(revenuImposable),
    nombreParts,
    quotientFamilial: Math.round(revenuImposable / nombreParts),
    impotBrut: irResult.impot,
    plafonnementQF: 0,
    decote: 0,
    cehr: Math.round(cehr),
    impotTotal: irResult.impot + Math.round(cehr),
    contributionsSociales: Math.round(ps),
    tmi: irResult.tmi,
    tauxEffectif: irResult.tauxEffectif / 100, // Template does tauxEffectif * 100 to display %
    tranches: irResult.tranches,
    revenuNetApresImpot: Math.round(revenuNetApresImpot),
    narratif: `Votre revenu imposable de ${Math.round(revenuImposable).toLocaleString('fr-FR')} € (${nombreParts} part${nombreParts > 1 ? 's' : ''}) vous place dans la tranche marginale à ${irResult.tmi}%. L'impôt sur le revenu s'élève à ${irResult.impot.toLocaleString('fr-FR')} €, soit un taux effectif de ${irResult.tauxEffectif.toFixed(2)}%.`,
  }

  // IFI
  const ifiResult = calculerIFI(totalImmo, immoActifs.length > 0)
  const fiscaliteIFI = totalImmo > 800000 ? {
    patrimoineImmobilierBrut: Math.round(totalImmo),
    abattementRP: ifiResult.abattementRP,
    dettesDeductibles: Math.round(totalPassifs),
    patrimoineImposable: ifiResult.patrimoineImposable,
    montantIFI: ifiResult.montantIFI,
    assujetti: ifiResult.assujetti,
    narratif: ifiResult.assujetti
      ? `Avec un patrimoine immobilier net de ${Math.round(ifiResult.patrimoineImposable).toLocaleString('fr-FR')} €, vous êtes assujetti à l'IFI pour un montant de ${ifiResult.montantIFI.toLocaleString('fr-FR')} €.`
      : `Votre patrimoine immobilier de ${Math.round(totalImmo).toLocaleString('fr-FR')} € reste sous le seuil d'assujettissement à l'IFI (1 300 000 €).`,
  } : null

  // Optimisation fiscale
  const plafondPER = Math.min(revenusAnnuels * 0.10, 35194)
  const economiePER = plafondPER * (irResult.tmi / 100)
  const strategies: { nom: string; description: string; economie: number; priorite: string; detailMiseEnOeuvre: string }[] = []
  if (revenusAnnuels > 30000) {
    strategies.push({
      nom: 'Versement PER',
      description: `Versement déductible jusqu'à ${Math.round(plafondPER).toLocaleString('fr-FR')} €/an (art. 163 quatervicies CGI)`,
      economie: Math.round(economiePER),
      priorite: 'high',
      detailMiseEnOeuvre: `Plafond PER : 10% des revenus nets = ${Math.round(plafondPER).toLocaleString('fr-FR')} €. TMI ${irResult.tmi}% → économie IR de ${Math.round(economiePER).toLocaleString('fr-FR')} €/an. Capital bloqué jusqu'à la retraite sauf cas de déblocage anticipé.`
    })
  }
  if (totalImmo > 0 && immoActifs.some((a: any) => Number(a.monthlyIncome || 0) > 0)) {
    const revenusLocatifs = immoActifs.reduce((s: number, a: any) => s + Number(a.monthlyIncome || 0), 0) * 12
    if (revenusLocatifs > 15000) {
      strategies.push({
        nom: 'Déficit foncier',
        description: `Travaux déductibles des revenus fonciers (${Math.round(revenusLocatifs).toLocaleString('fr-FR')} €/an)`,
        economie: Math.round(Math.min(10700, revenusLocatifs * 0.3) * (irResult.tmi / 100)),
        priorite: 'medium',
        detailMiseEnOeuvre: `Déduction des travaux d'entretien/amélioration sur revenus fonciers. Plafond imputable sur revenu global : 10 700 €/an. Report du surplus sur 10 ans.`
      })
    }
  }
  if (irResult.tmi >= 30 && enfants > 0) {
    strategies.push({
      nom: 'Donation temporaire d\'usufruit',
      description: 'Réduire la base imposable en transférant l\'usufruit de biens à vos enfants majeurs',
      economie: Math.round(revenusAnnuels * 0.05 * (irResult.tmi / 100)),
      priorite: 'low',
      detailMiseEnOeuvre: 'Donation temporaire d\'usufruit (art. 669 CGI). Les revenus sont imposés chez l\'usufruitier. Durée minimale recommandée : 3 ans.'
    })
  }

  const fiscalite = {
    ir: fiscaliteIR,
    ifi: fiscaliteIFI,
    impactRevenusFonciers: null,
    optimisation: strategies.length > 0 ? {
      economiesPotentielles: strategies.reduce((s, st) => s + st.economie, 0),
      strategies,
    } : null,
    narratif: `La charge fiscale globale (IR${ifiResult.assujetti ? ' + IFI' : ''}) représente ${Math.round(irResult.impot + (ifiResult.assujetti ? ifiResult.montantIFI : 0) + cehr).toLocaleString('fr-FR')} € par an, soit un taux de prélèvement de ${revenusAnnuels > 0 ? ((irResult.impot + cehr) / revenusAnnuels * 100).toFixed(1) : 0}% sur vos revenus.`,
  }

  // ── ÉPARGNE DE PRÉCAUTION ──
  const epargneLiquide = finActifs
    .filter((a: any) => ['LIVRET_A', 'LDDS', 'LEP', 'LIVRET_JEUNE', 'COMPTE_COURANT', 'CSL'].includes(a.type))
    .reduce((s: number, a: any) => s + Number(a.value || 0), 0)
  const montantCible = revenusMensuels * 6
  const gapEpargne = Math.max(0, montantCible - epargneLiquide)
  const moisCouverts = chargesMensuelles > 0 ? Math.round(epargneLiquide / chargesMensuelles) : 999

  const epargnePrecaution = {
    montantCible: Math.round(montantCible),
    epargneLiquideActuelle: Math.round(epargneLiquide),
    gap: Math.round(gapEpargne),
    priorite: gapEpargne > montantCible * 0.5 ? 'critical' : gapEpargne > 0 ? 'high' : 'low',
    moisCouverts,
    narratif: epargneLiquide >= montantCible
      ? `Votre épargne de précaution de ${Math.round(epargneLiquide).toLocaleString('fr-FR')} € couvre ${moisCouverts} mois de charges. L'objectif de 6 mois est atteint.`
      : `Votre épargne liquide de ${Math.round(epargneLiquide).toLocaleString('fr-FR')} € est insuffisante. Il manque ${Math.round(gapEpargne).toLocaleString('fr-FR')} € pour atteindre l'objectif de 6 mois de charges (${Math.round(montantCible).toLocaleString('fr-FR')} €).`,
    detailEpargneLiquide: finActifs
      .filter((a: any) => ['LIVRET_A', 'LDDS', 'LEP', 'LIVRET_JEUNE', 'COMPTE_COURANT', 'CSL'].includes(a.type))
      .map((a: any) => ({ support: a.name || a.type, montant: Math.round(Number(a.value || 0)) })),
    planConstitution: gapEpargne > 0 && capaciteEpargneMensuelle > 0 ? {
      moisEpargne: Math.ceil(gapEpargne / (capaciteEpargneMensuelle * 0.5)),
      montantMensuel: Math.round(Math.min(gapEpargne / 12, capaciteEpargneMensuelle * 0.5)),
    } : null,
  }

  // ── IMMOBILIER ──
  const immobilier = immoActifs.length > 0 ? {
    totalImmobilier: Math.round(totalImmo),
    poidsPatrimoine: totalActifs > 0 ? Math.round(totalImmo / totalActifs * 100) : 0,
    patrimoineImmobilierNet: Math.round(totalImmo - passifs.filter((p: any) => p.type && p.type.includes('IMMOBILIER')).reduce((s: number, p: any) => s + Number(p.remainingAmount || 0), 0)),
    cashFlowGlobalMensuel: 0,
    concentrationRisque: totalActifs > 0 && (totalImmo / totalActifs) > 0.7,
    biens: immoActifs.map((a: any) => {
      const valeur = Number(a.value || 0)
      const loyer = Number(a.monthlyIncome || 0)
      const rendementBrut = valeur > 0 && loyer > 0 ? (loyer * 12 / valeur) * 100 : null
      return {
        nom: a.name,
        type: a.type,
        valeur: Math.round(valeur),
        poidsPatrimoine: totalActifs > 0 ? Math.round(valeur / totalActifs * 100) : 0,
        loyerMensuel: loyer > 0 ? Math.round(loyer) : undefined,
        rendementLocatifBrut: rendementBrut ? Math.round(rendementBrut * 100) / 100 : null,
        rendementLocatifNet: rendementBrut ? Math.round((rendementBrut * 0.7) * 100) / 100 : null,
        scenarioRevente: valeur > 0 ? {
          horizons: [5, 10, 15].map(annees => {
            const tauxAppreciation = 0.02
            const prixEstime = Math.round(valeur * Math.pow(1 + tauxAppreciation, annees))
            const pvBrute = prixEstime - valeur
            const abattIR = annees >= 22 ? 1 : annees >= 6 ? Math.min(1, 0.06 * (annees - 5)) : 0
            const abattPS = annees >= 30 ? 1 : annees >= 6 ? Math.min(1, (1.65 / 100) * (annees - 5) + (annees > 21 ? (9 / 100) * (annees - 21) : 0)) : 0
            const pvIR = Math.round(pvBrute * (1 - abattIR))
            const pvPS = Math.round(pvBrute * (1 - abattPS))
            const impotIR = Math.round(pvIR * 0.19)
            const ps = Math.round(pvPS * RULES.ps.total)
            const totalFisc = impotIR + ps
            return {
              annees,
              prixEstime,
              plusValueBrute: pvBrute,
              totalFiscalite: totalFisc,
              netVendeur: prixEstime - totalFisc,
              gainNetTotal: prixEstime - totalFisc - valeur,
            }
          }),
          narratif: `Projection de revente sur 5, 10 et 15 ans avec une hypothèse d'appréciation de 2%/an.`,
        } : null,
        analyse: loyer > 0 ? `Bien locatif avec un rendement brut de ${rendementBrut?.toFixed(2)}%.` : 'Bien non locatif (résidence principale ou secondaire).',
      }
    }),
    narratif: `Votre patrimoine immobilier de ${Math.round(totalImmo).toLocaleString('fr-FR')} € représente ${totalActifs > 0 ? Math.round(totalImmo / totalActifs * 100) : 0}% de votre patrimoine total. ${(totalActifs > 0 && totalImmo / totalActifs > 0.7) ? 'La concentration immobilière est élevée, une diversification vers les actifs financiers serait souhaitable.' : 'La répartition immobilier/financier est équilibrée.'}`,
  } : undefined

  // ── FINANCIER ──
  const financier = finActifs.length > 0 ? {
    totalFinancier: Math.round(totalFin),
    scoreDiversification: Math.min(100, finActifs.length * 20),
    scoreRisque: 50,
    allocationParType: finActifs.reduce((acc: any[], a: any) => {
      const existing = acc.find(x => x.type === a.type)
      if (existing) {
        existing.valeur += Number(a.value || 0)
      } else {
        acc.push({ type: a.type, valeur: Number(a.value || 0), poids: 0 })
      }
      return acc
    }, []).map((item: any) => ({ ...item, valeur: Math.round(item.valeur), poids: totalFin > 0 ? Math.round(item.valeur / totalFin * 100) : 0 })),
    allocationParRisque: [
      { risque: 'Sécuritaire', valeur: Math.round(totalFin * 0.4), poids: 40 },
      { risque: 'Équilibré', valeur: Math.round(totalFin * 0.35), poids: 35 },
      { risque: 'Dynamique', valeur: Math.round(totalFin * 0.25), poids: 25 },
    ],
    allocationParLiquidite: [
      { liquidite: 'Très liquide (J+1)', valeur: Math.round(epargneLiquide), poids: totalFin > 0 ? Math.round(epargneLiquide / totalFin * 100) : 0 },
      { liquidite: 'Liquide (J+30)', valeur: Math.round(totalFin - epargneLiquide), poids: totalFin > 0 ? Math.round((totalFin - epargneLiquide) / totalFin * 100) : 0 },
    ],
    recommandationAllocation: (() => {
      const recos: { categorie: string; actuel: number; cible: number; ecart: number }[] = []
      const pctLiquide = totalFin > 0 ? Math.round(epargneLiquide / totalFin * 100) : 0
      const pctNonLiquide = 100 - pctLiquide
      recos.push({ categorie: 'Épargne liquide', actuel: pctLiquide, cible: 20, ecart: pctLiquide - 20 })
      recos.push({ categorie: 'Fonds euros / Obligations', actuel: Math.round(pctNonLiquide * 0.4), cible: 30, ecart: Math.round(pctNonLiquide * 0.4) - 30 })
      recos.push({ categorie: 'Actions / UC', actuel: Math.round(pctNonLiquide * 0.35), cible: 35, ecart: Math.round(pctNonLiquide * 0.35) - 35 })
      recos.push({ categorie: 'Diversifié / Alternatif', actuel: Math.round(pctNonLiquide * 0.25), cible: 15, ecart: Math.round(pctNonLiquide * 0.25) - 15 })
      return recos
    })(),
    actifs: finActifs.map((a: any) => ({
      nom: a.name,
      type: a.type,
      valeur: Math.round(Number(a.value || 0)),
      poidsPatrimoine: totalActifs > 0 ? Math.round(Number(a.value || 0) / totalActifs * 100) : 0,
      poidsPortefeuille: totalFin > 0 ? Math.round(Number(a.value || 0) / totalFin * 100) : 0,
      risque: 'Modéré',
      liquidite: ['LIVRET_A', 'LDDS', 'LEP', 'CSL', 'COMPTE_COURANT'].includes(a.type) ? 'Immédiate' : 'Moyenne',
      enveloppeFiscale: a.type?.includes('PEA') ? 'PEA' : a.type?.includes('ASSURANCE_VIE') ? 'Assurance-vie' : 'Compte-titres',
      commentaire: '',
    })),
    narratif: `Votre patrimoine financier de ${Math.round(totalFin).toLocaleString('fr-FR')} € est réparti sur ${finActifs.length} support${finActifs.length > 1 ? 's' : ''}.`,
  } : undefined

  // ── RETRAITE ──
  let retraite = null
  if (age > 0 && age < 67 && revenusAnnuels > 0) {
    const trimestresValides = Math.max(0, (age - 22) * 4)
    const trimestresRequis = 172
    const trimestresRestants = Math.max(0, trimestresRequis - trimestresValides)
    const trimestresManquants = Math.max(0, trimestresRequis - trimestresValides - (67 - age) * 4)

    const pensionBase = revenusAnnuels * 0.50 * Math.min(1, trimestresValides / trimestresRequis) / 12
    const pensionCompl = revenusAnnuels * 0.25 / 12
    const pensionTotale = pensionBase + pensionCompl
    const tauxRemplacement = revenusMensuels > 0 ? (pensionTotale / revenusMensuels) * 100 : 0

    const gapMensuel = Math.max(0, revenusMensuels * 0.8 - pensionTotale)
    const capitalNecessaire = gapMensuel > 0 ? gapMensuel * 12 / 0.04 : 0

    const epargneRetraite = finActifs
      .filter((a: any) => ['PER', 'PERP', 'MADELIN', 'RETRAITE', 'PER_INDIVIDUEL', 'PER_ENTREPRISE'].includes(a.type))
      .reduce((s: number, a: any) => s + Number(a.value || 0), 0)

    const scenarios = [
      { label: 'Prudent (2%)', rendement: 2, ageDepart: 64 },
      { label: 'Équilibré (4%)', rendement: 4, ageDepart: 64 },
      { label: 'Dynamique (6%)', rendement: 6, ageDepart: 64 },
    ].map(s => {
      const anneesRestantes = Math.max(0, s.ageDepart - age)
      const capitalFutur = epargneRetraite * Math.pow(1 + s.rendement / 100, anneesRestantes) + capaciteEpargneMensuelle * 0.3 * 12 * ((Math.pow(1 + s.rendement / 100, anneesRestantes) - 1) / (s.rendement / 100))
      const revenuDurable = capitalFutur * 0.04 / 12
      return {
        label: s.label,
        rendement: s.rendement,
        ageDepart: s.ageDepart,
        capitalRetraite: Math.round(capitalFutur),
        revenuDurable: Math.round(revenuDurable),
        gapMensuel: Math.round(Math.max(0, revenusMensuels * 0.8 - pensionTotale - revenuDurable)),
        capitalEpuiseAge: null,
        faisable: (pensionTotale + revenuDurable) >= revenusMensuels * 0.7,
      }
    })

    retraite = {
      ageActuel: age,
      estimationPension: {
        pensionBaseMensuelle: Math.round(pensionBase),
        pensionComplementaireMensuelle: Math.round(pensionCompl),
        pensionTotaleMensuelle: Math.round(pensionTotale),
        tauxRemplacement: Math.round(tauxRemplacement * 10) / 10,
        trimestresValides,
        trimestresRestants,
        trimestresRequis,
        trimestresManquants,
        decoteSurcote: 0,
        decoteSurcoteLabel: 'Taux plein estimé',
        pointsComplementaires: 0,
        valeurPoint: 0,
      },
      evolutionParAge: [60, 62, 63, 64, 65, 67].filter(a => a > age).map(ageDepart => {
        const trimAtAge = Math.max(0, (ageDepart - 22) * 4)
        const trimManquants = Math.max(0, trimestresRequis - trimAtAge)
        const decotePct = trimManquants > 0 ? -(trimManquants * 0.625) : Math.min((trimAtAge - trimestresRequis) * 0.625, 5)
        const coeff = Math.max(0.25, 1 + decotePct / 100)
        const pensionAtAge = (revenusAnnuels * 0.50 * Math.min(1, trimAtAge / trimestresRequis) / 12) * coeff + pensionCompl
        const isChoisi = ageDepart === 64
        const isOptimal = trimManquants === 0
        return {
          age: ageDepart,
          trimestres: trimAtAge,
          trimestresManquants: trimManquants,
          decoteSurcotePct: Math.round(decotePct * 100) / 100,
          decoteSurcoteLabel: decotePct < 0 ? `Décote ${Math.abs(decotePct).toFixed(1)}%` : decotePct > 0 ? `Surcote +${decotePct.toFixed(1)}%` : 'Taux plein',
          pensionMensuelle: Math.round(pensionAtAge),
          tauxRemplacement: revenusMensuels > 0 ? Math.round(pensionAtAge / revenusMensuels * 1000) / 10 : 0,
          differenceVsChoisi: 0,
          estChoisi: isChoisi,
          estOptimal: isOptimal,
        }
      }),
      analyseGap: {
        revenuSouhaite: Math.round(revenusMensuels * 0.8),
        pensionEstimee: Math.round(pensionTotale),
        gapMensuel: Math.round(gapMensuel),
        capitalNecessaire4Pct: Math.round(capitalNecessaire),
        narratif: gapMensuel > 0
          ? `Un complément de ${Math.round(gapMensuel).toLocaleString('fr-FR')} €/mois sera nécessaire pour maintenir 80% de votre niveau de vie. Cela correspond à un capital de ${Math.round(capitalNecessaire).toLocaleString('fr-FR')} € à la retraite (hypothèse 4% de rendement).`
          : 'Votre pension estimée couvre l\'objectif de 80% de vos revenus actuels.',
      },
      detailEpargneRetraite: finActifs
        .filter((a: any) => ['PER', 'PERP', 'MADELIN', 'RETRAITE', 'PER_INDIVIDUEL', 'PER_ENTREPRISE'].includes(a.type))
        .map((a: any) => ({ support: a.name || a.type, montant: Math.round(Number(a.value || 0)) })),
      epargneRetraiteActuelle: Math.round(epargneRetraite),
      scenarios,
      recommandations: [
        { priorite: 'HAUTE', description: `Maximiser les versements PER déductibles (jusqu'à ${Math.round(plafondPER).toLocaleString('fr-FR')} €/an)` },
        { priorite: 'MOYENNE', description: 'Diversifier les supports de retraite (PER + assurance-vie)' },
      ],
      narratif: `À ${age} ans, il vous reste environ ${Math.max(0, 64 - age)} ans avant la retraite. Votre pension estimée de ${Math.round(pensionTotale).toLocaleString('fr-FR')} €/mois représenterait ${tauxRemplacement.toFixed(0)}% de vos revenus actuels.`,
    }
  }

  // ── SUCCESSION ──
  const succResult = calculerDroitsSuccession(patrimoineNet, enfants, situationFamiliale)

  // Impact assurance-vie
  const totalAV = finActifs
    .filter((a: any) => a.type?.includes('ASSURANCE_VIE') || a.type === 'AV_FONDS_EUROS' || a.type === 'AV_UC')
    .reduce((s: number, a: any) => s + Number(a.value || 0), 0)

  const impactAV = totalAV > 0 ? {
    totalAV: Math.round(totalAV),
    versementsAvant70: Math.round(totalAV * 0.7),
    versementsApres70: Math.round(totalAV * 0.3),
    abattement990I: enfants > 0 ? enfants * 152500 : 152500,
    taxable990I: Math.max(0, Math.round(totalAV * 0.7) - (enfants > 0 ? enfants * 152500 : 152500)),
    droits990I: 0,
    abattement757B: 30500,
    taxable757B: Math.max(0, Math.round(totalAV * 0.3) - 30500),
    droits757B: 0,
    droitsTotalAV: 0,
    economieVsDMTG: 0,
    narratif: `L'assurance-vie (${Math.round(totalAV).toLocaleString('fr-FR')} €) bénéficie d'un régime fiscal privilégié avec un abattement de 152 500 €/bénéficiaire sur les primes versées avant 70 ans.`,
  } : null

  const succession = {
    patrimoineNetTaxable: Math.round(patrimoineNet),
    situationFamiliale: situationFamiliale || 'Non renseignée',
    regimeMatrimonial: regimeMatrimonial || 'Non renseigné',
    nbEnfants: enfants,
    droitsEstimes: succResult.droitsEstimes,
    tauxEffectif: Math.round(succResult.tauxEffectif * 100) / 100,
    abattementTotal: succResult.abattementTotal,
    detailParHeritier: succResult.detailParHeritier,
    impactAssuranceVie: impactAV,
    strategiesOptimisation: [
      {
        strategie: 'Donation en pleine propriété',
        description: `Utiliser l'abattement de 100 000 € par enfant, renouvelable tous les 15 ans`,
        economieEstimee: Math.min(succResult.droitsEstimes, enfants * 100000 * 0.20),
        priorite: 'haute',
        detailMiseEnOeuvre: 'Donation-partage devant notaire. Abattement 100 000 €/enfant (art. 779 CGI). Renouvelable tous les 15 ans.',
      },
      {
        strategie: 'Assurance-vie',
        description: 'Placer en AV pour bénéficier de l\'abattement 152 500 €/bénéficiaire',
        economieEstimee: Math.round(Math.min(enfants * 152500 * 0.20, succResult.droitsEstimes * 0.5)),
        priorite: 'haute',
        detailMiseEnOeuvre: 'Versements avant 70 ans → abattement art. 990I : 152 500 €/bénéficiaire. Au-delà : prélèvement de 20% puis 31,25%.',
      },
    ],
    narratif: enfants > 0
      ? `Les droits de succession estimés s'élèvent à ${succResult.droitsEstimes.toLocaleString('fr-FR')} € (taux effectif ${succResult.tauxEffectif.toFixed(2)}%) pour ${enfants} héritier${enfants > 1 ? 's' : ''} en ligne directe. Des stratégies d'optimisation permettraient de réduire significativement cette charge.`
      : 'L\'analyse successorale nécessite de connaître la composition familiale pour estimer les droits.',
  }

  // ── SYNTHÈSE ──
  // Template expects scores on 0-100 scale (used in generateGauge(scoreGlobal, 100, ...))
  const scores = [
    {
      theme: 'Budget',
      score: tauxEffort < 20 ? 85 : tauxEffort < 33 ? 65 : tauxEffort < 50 ? 40 : 20,
      verdict: scoreSanteBudget,
      couleur: scoreSanteBudget === 'SAIN' ? '#22c55e' : scoreSanteBudget === 'CORRECT' ? '#3b82f6' : scoreSanteBudget === 'TENDU' ? '#f59e0b' : '#ef4444',
      commentaire: `Taux d'effort : ${tauxEffort.toFixed(1)}%`,
    },
    {
      theme: 'Épargne',
      score: epargneLiquide >= montantCible ? 90 : epargneLiquide >= montantCible * 0.5 ? 55 : 25,
      verdict: epargneLiquide >= montantCible ? 'Bon' : 'Insuffisant',
      couleur: epargneLiquide >= montantCible ? '#22c55e' : '#f59e0b',
      commentaire: `${moisCouverts} mois couverts`,
    },
    {
      theme: 'Diversification',
      score: (totalActifs > 0 && totalImmo / totalActifs < 0.7 && totalImmo / totalActifs > 0.2) ? 80 : 35,
      verdict: totalActifs > 0 && totalImmo / totalActifs > 0.7 ? 'Concentré' : 'Diversifié',
      couleur: totalActifs > 0 && totalImmo / totalActifs > 0.7 ? '#f59e0b' : '#22c55e',
      commentaire: `Immo ${totalActifs > 0 ? Math.round(totalImmo / totalActifs * 100) : 0}% / Fin ${totalActifs > 0 ? Math.round(totalFin / totalActifs * 100) : 0}%`,
    },
    {
      theme: 'Fiscalité',
      score: irResult.tauxEffectif < 10 ? 80 : irResult.tauxEffectif < 20 ? 60 : 35,
      verdict: `TMI ${irResult.tmi}%`,
      couleur: irResult.tmi <= 30 ? '#3b82f6' : '#f59e0b',
      commentaire: `Taux effectif : ${irResult.tauxEffectif.toFixed(2)}%`,
    },
    {
      theme: 'Retraite',
      score: retraite ? (retraite.estimationPension.tauxRemplacement > 70 ? 80 : retraite.estimationPension.tauxRemplacement > 50 ? 55 : 30) : 50,
      verdict: retraite ? `${retraite.estimationPension.tauxRemplacement.toFixed(0)}% remplacement` : 'Non évalué',
      couleur: retraite && retraite.estimationPension.tauxRemplacement > 70 ? '#22c55e' : '#f59e0b',
      commentaire: retraite ? `Pension estimée : ${retraite.estimationPension.pensionTotaleMensuelle.toLocaleString('fr-FR')} €/mois` : '',
    },
    {
      theme: 'Succession',
      score: succResult.tauxEffectif < 5 ? 85 : succResult.tauxEffectif < 15 ? 60 : 30,
      verdict: succResult.droitsEstimes > 0 ? `${succResult.droitsEstimes.toLocaleString('fr-FR')} €` : 'OK',
      couleur: succResult.tauxEffectif < 10 ? '#22c55e' : '#f59e0b',
      commentaire: `Taux effectif : ${succResult.tauxEffectif.toFixed(2)}%`,
    },
  ]

  const scoreGlobal = Math.round(scores.reduce((s, sc) => s + sc.score, 0) / scores.length)
  const pointsForts: string[] = []
  const pointsVigilance: string[] = []
  const actionsPrioritaires: string[] = []

  if (tauxEffort < 33) pointsForts.push('Taux d\'endettement maîtrisé')
  if (epargneLiquide >= montantCible) pointsForts.push('Épargne de précaution suffisante')
  if (totalActifs > 0 && totalImmo / totalActifs < 0.7 && totalFin / totalActifs > 0.2) pointsForts.push('Patrimoine bien diversifié')
  if (patrimoineNet > 500000) pointsForts.push('Patrimoine net confortable')

  if (tauxEffort > 33) pointsVigilance.push('Taux d\'endettement élevé')
  if (epargneLiquide < montantCible) pointsVigilance.push('Épargne de précaution insuffisante')
  if (totalActifs > 0 && totalImmo / totalActifs > 0.7) pointsVigilance.push('Patrimoine trop concentré sur l\'immobilier')
  if (succResult.droitsEstimes > 50000) pointsVigilance.push('Droits de succession significatifs')
  if (ifiResult.assujetti) pointsVigilance.push('Assujettissement à l\'IFI')

  if (epargneLiquide < montantCible) actionsPrioritaires.push('Constituer l\'épargne de précaution')
  if (revenusAnnuels > 40000 && age >= 30) actionsPrioritaires.push('Maximiser les versements PER')
  if (succResult.droitsEstimes > 50000) actionsPrioritaires.push('Mettre en place une stratégie de transmission')
  if (tauxEffort > 33) actionsPrioritaires.push('Restructurer l\'endettement')
  if (totalActifs > 0 && totalImmo / totalActifs > 0.7) actionsPrioritaires.push('Diversifier vers les actifs financiers')

  const synthese = {
    scoreGlobal,
    scores,
    pointsForts,
    pointsVigilance,
    actionsPrioritaires,
    narratifGlobal: `Le score patrimonial global est de ${scoreGlobal}/100. ${pointsForts.length > 0 ? `Points forts : ${pointsForts.join(', ').toLowerCase()}.` : ''} ${pointsVigilance.length > 0 ? `Points de vigilance : ${pointsVigilance.join(', ').toLowerCase()}.` : ''} ${actionsPrioritaires.length > 0 ? `Actions prioritaires recommandées : ${actionsPrioritaires.join(', ').toLowerCase()}.` : ''}`,
  }

  return {
    dateAudit: new Date().toISOString(),
    nomClient: `${client.firstName} ${client.lastName}`,
    budget,
    emprunt,
    fiscalite,
    epargnePrecaution,
    immobilier,
    financier,
    retraite,
    succession,
    synthese,
  }
}
