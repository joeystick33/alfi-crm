/**
 * API Route - Simulateur Nue-Propriété Immobilière
 * Calculs sécurisés côté serveur
 * 
 * POST /api/advisor/simulators/immobilier/nue-propriete
 * 
 * Nue-Propriété Immobilière (CGI art. 965, 669) :
 * - Acquisition de la nue-propriété d'un bien immobilier
 * - Usufruitier temporaire (bailleur social, institutionnel)
 * - Décote = valeur de la nue-propriété (barème fiscal art. 669)
 * - Exonération IFI pendant le démembrement
 * - Pas de revenus, pas de charges pendant le démembrement
 * - Récupération de la pleine propriété à terme
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import {
  calculNombreParts,
  calculIRDetaille,
  calculIFI,
  calculMensualiteCredit,
  calculTableauAmortissement,
  calculImpotPlusValue,
  calculTRI,
} from '../_shared/calculations'
import {
  BAREME_DEMEMBREMENT,
  PRELEVEMENTS_SOCIAUX,
} from '../_shared/constants'
import { nueProprieteInputSchema, type NueProprieteInput } from '../_shared/validators'
import { logger } from '@/app/_common/lib/logger'
// ══════════════════════════════════════════════════════════════════════════════
// FONCTION DE SIMULATION NUE-PROPRIÉTÉ
// ══════════════════════════════════════════════════════════════════════════════

function simulerNuePropriete(input: NueProprieteInput) {
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. PROFIL FISCAL
  // ─────────────────────────────────────────────────────────────────────────────
  const nombreParts = calculNombreParts({
    situationFamiliale: input.situationFamiliale,
    enfantsACharge: input.enfantsACharge,
    enfantsGardeAlternee: input.enfantsGardeAlternee,
    parentIsole: input.parentIsole,
  })

  const revenusTotaux = input.revenusSalaires + input.revenusFonciersExistants + input.autresRevenus
  const irAvant = calculIRDetaille(revenusTotaux, nombreParts)
  const tmi = irAvant.tmi

  // IFI avant investissement
  const ifiAvant = calculIFI({
    patrimoineImmobilierBrut: input.patrimoineImmobilierExistant,
    dettesDeductibles: input.dettesImmobilieres,
    valeurRP: input.valeurRP,
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. CALCUL DE LA DÉCOTE NUE-PROPRIÉTÉ
  // ─────────────────────────────────────────────────────────────────────────────
  // Décote temporaire (démembrement conventionnel) ou barème fiscal (viager)
  let decoteNP: number
  let valeurUsufruit: number

  if (input.decoteNP) {
    // Décote fournie par l'utilisateur (programme immobilier)
    decoteNP = input.decoteNP
  } else {
    // Calcul selon durée (environ 3% par an pour bailleur social)
    decoteNP = Math.min(60, input.dureeDemembrement * 3)
  }

  const prixNP = input.valeurPP * (decoteNP / 100)
  valeurUsufruit = input.valeurPP - prixNP

  // Frais de notaire sur la NP
  const fraisNotaireEur = prixNP * (input.fraisNotaire / 100)

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. INVESTISSEMENT ET FINANCEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  const investTotal = prixNP + fraisNotaireEur
  const montantEmprunte = Math.max(0, investTotal - input.apport)

  const mensualiteHorsAss = calculMensualiteCredit(montantEmprunte, input.tauxCredit, input.dureeCredit)
  const assuranceMensuelle = montantEmprunte * (input.assuranceCredit / 100) / 12
  const mensualite = mensualiteHorsAss + assuranceMensuelle

  const tableauAmort = calculTableauAmortissement(montantEmprunte, input.tauxCredit, input.dureeCredit)

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. DURÉE TOTALE DE PROJECTION
  // ─────────────────────────────────────────────────────────────────────────────
  const dureeDetentionTotale = input.dureeDemembrement + (input.optionRevente ? 0 : input.dureePostDemembrement)

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. PROJECTIONS ANNUELLES
  // ─────────────────────────────────────────────────────────────────────────────
  const projections: Array<{
    annee: number
    phase: 'DEMEMBREMENT' | 'PLEINE_PROPRIETE'
    loyer: number
    charges: number
    revenuFoncier: number
    ir: number
    ps: number
    creditAnnuel: number
    capitalRestant: number
    cfAvantImpots: number
    cfApresImpots: number
    valeurBien: number
    valeurIFI: number
    capitalNet: number
  }> = []

  const [anneeAcq] = input.dateAcquisition.split('-').map(Number)
  let capitalRestant = montantEmprunte
  let valeurBien = input.valeurPP
  let loyerActuel = input.loyerEstimeApres
  let cashFlowCumule = 0
  let irCumule = 0
  let psCumule = 0

  for (let i = 1; i <= dureeDetentionTotale; i++) {
    const annee = anneeAcq + i - 1
    const phaseDemembrement = i <= input.dureeDemembrement
    const phase = phaseDemembrement ? 'DEMEMBREMENT' : 'PLEINE_PROPRIETE'

    // Revalorisation du bien
    if (i > 1) {
      valeurBien *= (1 + input.revalorisationBien / 100)
    }

    // Crédit
    const amort = tableauAmort.find(a => a.annee === i)
    const interetsAnnuels = amort?.interets || 0
    capitalRestant = amort?.capitalFin || Math.max(0, capitalRestant)
    const creditAnnuel = i <= input.dureeCredit ? mensualite * 12 : 0

    // Phase démembrement : pas de loyer, pas de charges, pas d'IFI
    // Phase PP : loyers et charges
    let loyer = 0
    let charges = 0
    let revenuFoncier = 0
    let ir = 0
    let ps = 0

    if (!phaseDemembrement && !input.optionRevente) {
      // Récupération de la PP : perception des loyers
      if (i === input.dureeDemembrement + 1) {
        loyerActuel = input.loyerEstimeApres
      } else if (i > input.dureeDemembrement + 1) {
        loyerActuel *= (1 + input.revalorisationLoyer / 100)
      }

      loyer = loyerActuel * 12
      charges = input.taxeFonciereEstimee + input.chargesCoProEstimees + input.assurancePNOEstimee + 
        (loyer * input.fraisGestion / 100)
      
      // Revenus fonciers (intérêts déductibles si crédit encore en cours)
      const chargesDeductibles = charges + interetsAnnuels
      revenuFoncier = Math.max(0, loyer - chargesDeductibles)
      
      ir = revenuFoncier * (tmi / 100)
      ps = revenuFoncier * PRELEVEMENTS_SOCIAUX.FONCIER.TAUX_GLOBAL
    }

    irCumule += ir
    psCumule += ps

    // Cash-flow
    const cfAvantImpots = loyer - charges - creditAnnuel
    const cfApresImpots = cfAvantImpots - ir - ps
    cashFlowCumule += cfApresImpots

    // Valeur IFI : 0 pendant démembrement (NP non soumise à IFI art. 965)
    const valeurIFI = phaseDemembrement ? 0 : valeurBien

    projections.push({
      annee,
      phase,
      loyer: Math.round(loyer),
      charges: Math.round(charges),
      revenuFoncier: Math.round(revenuFoncier),
      ir: Math.round(ir),
      ps: Math.round(ps),
      creditAnnuel: Math.round(creditAnnuel),
      capitalRestant: Math.round(capitalRestant),
      cfAvantImpots: Math.round(cfAvantImpots),
      cfApresImpots: Math.round(cfApresImpots),
      valeurBien: Math.round(valeurBien),
      valeurIFI: Math.round(valeurIFI),
      capitalNet: Math.round(valeurBien - capitalRestant),
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. PLUS-VALUE À LA REVENTE
  // ─────────────────────────────────────────────────────────────────────────────
  const valeurRevente = Math.round(valeurBien)
  const pvResult = calculImpotPlusValue(
    prixNP,
    valeurRevente,
    dureeDetentionTotale,
    fraisNotaireEur
  )
  
  const fraisReventeEur = valeurRevente * (input.fraisRevente / 100)
  const plusValueNette = pvResult.plusValueBrute - pvResult.impotTotal - fraisReventeEur

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. IFI SIMULATION
  // ─────────────────────────────────────────────────────────────────────────────
  // Pendant démembrement : NP non soumise à IFI
  // Après : pleine propriété soumise
  const ifiPendantDemembrement = calculIFI({
    patrimoineImmobilierBrut: input.patrimoineImmobilierExistant,
    dettesDeductibles: input.dettesImmobilieres,
    valeurRP: input.valeurRP,
  })

  const ifiApresDemembrement = calculIFI({
    patrimoineImmobilierBrut: input.patrimoineImmobilierExistant + valeurBien,
    dettesDeductibles: input.dettesImmobilieres + capitalRestant,
    valeurRP: input.valeurRP,
  })

  // Économie IFI pendant démembrement
  const economieIFI_annuelle = ifiApresDemembrement.impotNet - ifiPendantDemembrement.impotNet
  const economieIFI_totale = economieIFI_annuelle * input.dureeDemembrement

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. INDICATEURS DE PERFORMANCE
  // ─────────────────────────────────────────────────────────────────────────────
  // Gain intrinsèque = récupération de la PP pour le prix de la NP
  const gainIntrinseque = input.valeurPP - prixNP
  const gainIntrinsequeRevalue = valeurRevente - prixNP

  const cashFlowMoyen = cashFlowCumule / dureeDetentionTotale
  
  // Capital final = ce qu'il reste après revente et remboursement
  const capitalFinal = valeurRevente - capitalRestant - fraisReventeEur - pvResult.impotTotal
  
  // Gain total = Cash-flows cumulés + Capital final - Apport
  // Note: l'économie IFI pendant le démembrement est un avantage fiscal distinct, pas un gain patrimonial
  const gainTotal = cashFlowCumule + capitalFinal - input.apport

  // TRI
  const fluxTresorerie = [-input.apport]
  projections.forEach(p => fluxTresorerie.push(p.cfApresImpots))
  fluxTresorerie[fluxTresorerie.length - 1] += (valeurRevente - capitalRestant - fraisReventeEur - pvResult.impotTotal)
  const tri = calculTRI(fluxTresorerie)

  // Rendement annualisé
  const rendementAnnualise = Math.pow((valeurRevente / prixNP), 1 / dureeDetentionTotale) - 1

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. ALERTES
  // ─────────────────────────────────────────────────────────────────────────────
  const alertes = generateAlertesNP(input, decoteNP, economieIFI_totale, ifiAvant.assujetti, tri)

  return {
    success: true,
    synthese: {
      valeurPP: input.valeurPP,
      decoteNP,
      prixNP: Math.round(prixNP),
      fraisNotaire: Math.round(fraisNotaireEur),
      investTotal: Math.round(investTotal),
      montantEmprunte,
      mensualite: Math.round(mensualite),
      gainIntrinseque: Math.round(gainIntrinseque),
      gainIntrinsequeRevalue: Math.round(gainIntrinsequeRevalue),
      tri,
      rendementAnnualise: Math.round(rendementAnnualise * 10000) / 100,
      cashFlowMoyen: Math.round(cashFlowMoyen),
      cashFlowCumule: Math.round(cashFlowCumule),
      irCumule: Math.round(irCumule),
      psCumule: Math.round(psCumule),
      economieIFI_annuelle: Math.round(economieIFI_annuelle),
      economieIFI_totale: Math.round(economieIFI_totale),
      valeurRevente,
      plusValueBrute: pvResult.plusValueBrute,
      impotPV: pvResult.impotTotal,
      plusValueNette: Math.round(plusValueNette),
      capitalFinal: Math.round(capitalFinal),
      gainTotal: Math.round(gainTotal),
    },
    demembrement: {
      dureeDemembrement: input.dureeDemembrement,
      typeUsufruitier: input.typeUsufruitier,
      decoteNP,
      valeurUsufruit: Math.round(valeurUsufruit),
      exonerationIFI: true,
      pasDeRevenus: true,
      pasDeCharges: true,
      finDemembrement: anneeAcq + input.dureeDemembrement - 1,
    },
    apresPleinePropriete: {
      dureePostDemembrement: input.dureePostDemembrement,
      optionRevente: input.optionRevente,
      loyerEstime: input.loyerEstimeApres,
      chargesEstimees: input.taxeFonciereEstimee + input.chargesCoProEstimees + input.assurancePNOEstimee,
    },
    profilClient: {
      nombreParts,
      tmi,
      irAvant: irAvant.impotNet,
      ifiAvant: ifiAvant.impotNet,
      assujettiIFIAvant: ifiAvant.assujetti,
      ifiPendantDemembrement: ifiPendantDemembrement.impotNet,
      ifiApresDemembrement: ifiApresDemembrement.impotNet,
    },
    plusValue: pvResult,
    projections,
    alertes,
  }
}

function generateAlertesNP(
  input: NueProprieteInput,
  decoteNP: number,
  economieIFI: number,
  assujettiIFI: boolean,
  tri: number
): Array<{ type: string; message: string }> {
  const alertes: Array<{ type: string; message: string }> = []

  // Exonération IFI
  if (assujettiIFI) {
    alertes.push({
      type: 'success',
      message: `✅ Exonération IFI pendant ${input.dureeDemembrement} ans. Économie estimée : ${economieIFI.toLocaleString('fr-FR')} €.`,
    })
  } else {
    alertes.push({
      type: 'info',
      message: `📋 Nue-propriété exonérée d'IFI (art. 965 CGI). Non applicable si non assujetti.`,
    })
  }

  // Décote
  alertes.push({
    type: 'success',
    message: `✅ Décote de ${decoteNP}% : acquisition à ${100 - decoteNP}% de la valeur en pleine propriété.`,
  })

  // Pas de revenus = pas de fiscalité
  alertes.push({
    type: 'success',
    message: `✅ Aucune fiscalité pendant le démembrement (pas de revenus fonciers à déclarer).`,
  })

  // Type d'usufruitier
  if (input.typeUsufruitier === 'BAILLEUR_SOCIAL') {
    alertes.push({
      type: 'info',
      message: `📋 Usufruitier bailleur social : bien loué à loyers conventionnés. Sécurité locative à terme.`,
    })
  }

  // Financement
  if (input.tauxCredit > 0 && input.dureeCredit > input.dureeDemembrement) {
    alertes.push({
      type: 'warning',
      message: `⚠️ Crédit (${input.dureeCredit} ans) > démembrement (${input.dureeDemembrement} ans). Loyers après PP pour rembourser.`,
    })
  }

  // Option revente
  if (input.optionRevente) {
    alertes.push({
      type: 'info',
      message: `📋 Option revente immédiate à fin de démembrement. Plus-value calculée sur durée totale.`,
    })
  }

  // TRI
  if (tri > 5) {
    alertes.push({
      type: 'success',
      message: `✅ TRI de ${tri}% : performance attractive compte tenu du faible risque.`,
    })
  }

  return alertes
}

// ══════════════════════════════════════════════════════════════════════════════
// ROUTE HANDLERS
// ══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request)

    const body = await request.json()
    const input = nueProprieteInputSchema.parse(body)

    const resultat = simulerNuePropriete(input)

    return createSuccessResponse(resultat)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Données invalides: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      )
    }
    logger.error('Erreur simulateur nue-propriété:', { error: error instanceof Error ? error.message : String(error) })
    return createErrorResponse('Erreur lors de la simulation', 500)
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    return createSuccessResponse({
      description: 'Simulateur Nue-Propriété Immobilière - Démembrement temporaire',
      avantages: [
        'Exonération IFI pendant démembrement',
        'Décote à l\'acquisition',
        'Pas de fiscalité sur revenus inexistants',
        'Récupération pleine propriété à terme',
      ],
      typesUsufruitier: ['BAILLEUR_SOCIAL', 'PARTICULIER', 'INSTITUTIONNEL'],
      baremeDemembrement: BAREME_DEMEMBREMENT,
      parametresDefaut: {
        situationFamiliale: 'MARIE_PACSE',
        enfantsACharge: 2,
        valeurPP: 300000,
        dureeDemembrement: 15,
        typeUsufruitier: 'BAILLEUR_SOCIAL',
        decoteNP: 45,
        apport: 100000,
        tauxCredit: 3.5,
        dureeCredit: 15,
        loyerEstimeApres: 1200,
        dureePostDemembrement: 10,
        revalorisationBien: 2,
      },
    })
  } catch (error) {
    return createErrorResponse('Erreur lors de la récupération des paramètres', 500)
  }
}
