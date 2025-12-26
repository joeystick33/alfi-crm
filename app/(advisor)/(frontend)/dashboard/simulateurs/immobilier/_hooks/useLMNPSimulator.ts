 
/**
 * Hook spécifique pour le simulateur LMNP
 * Appelle l'API backend et transforme les résultats au format attendu par l'UI
 */

import { useState, useCallback } from 'react'
import { API_ENDPOINTS, type LMNPResult } from '../_types/api-types'

// Types pour l'input du formulaire LMNP
export interface LMNPFormInput {
  // Profil client
  situationFamiliale: 'CELIBATAIRE' | 'MARIE_PACSE' | 'VEUF'
  enfantsACharge: number
  enfantsGardeAlternee: number
  parentIsole: boolean
  revenusSalaires: number
  revenusFonciersExistants: number
  revenusBICExistants: number
  autresRevenus: number
  patrimoineImmobilierExistant: number
  dettesImmobilieres: number
  valeurRP: number

  // Bien immobilier
  dateAcquisition: string
  prixAchat: number
  fraisNotaire: number
  travaux: number
  mobilier: number
  partTerrain: number
  dpe: string

  // Financement
  apport: number
  tauxCredit: number
  dureeCredit: number
  assuranceCredit: number

  // Revenus locatifs
  loyerMensuel: number
  vacanceSemaines: number
  revalorisationLoyer: number
  typeMeuble: string

  // Charges
  taxeFonciere: number
  chargesCopro: number
  assurancePNO: number
  fraisGestion: number
  cfe: number
  comptabilite: number

  // Fiscalité
  regimeFiscal: 'MICRO_BIC' | 'REEL'
  deficitAnterieur: number
  amortDiffereAnterieur: number

  // Projection
  dureeDetention: number
  revalorisationBien: number
  fraisRevente: number
}

// Type pour les résultats transformés (format attendu par l'UI existante)
export interface LMNPTransformedResult {
  synthese: {
    investTotal: number
    apport: number
    montantEmprunte: number
    mensualite: number
    amortAnnuel: number
    totAmort: number
    amortDiffRest: number
    rendBrut: number
    tri: number
    cfMoyMois: number
    cfCum: number
    totIR: number
    totPS: number
    valRev: number
    pvBrute: number
    pvCalc: any
    capFinal: number
    gainTotal: number
    amortReintegres: number
    profilClient: {
      nombreParts: number
      revenuTotalAvant: number
      irAvant: number
      tmiAvant: number
      ifiAvant: number
      assujettiIFIAvant: boolean
      irApres: number
      ifiApres: number
      assujettiIFIApres: boolean
      impactIFI: number
    }
  }
  projections: Array<{
    annee: number
    numAnnee: number
    loyerNet: number
    charges: number
    interets: number
    assEmp: number
    resAvantAmort: number
    amortDispo: number
    amortUtil: number
    amortDiffere: number
    resultat: number
    baseImp: number
    impotIR: number
    ps: number
    cfAvant: number
    cfApres: number
    capRestant: number
    valBien: number
    capNet: number
  }>
  alertes: Array<{ type: string; message: string }>
  conseils: string[]
  explications: string[]
  explicationPV: string[]
}

export function useLMNPSimulator() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<LMNPTransformedResult | null>(null)
  const [apiResult, setApiResult] = useState<LMNPResult | null>(null)

  const simulate = useCallback(async (input: LMNPFormInput): Promise<LMNPTransformedResult | null> => {
    setIsLoading(true)
    setError(null)

    try {
      // Préparer l'input pour l'API
      const apiInput = {
        situationFamiliale: input.situationFamiliale,
        enfantsACharge: input.enfantsACharge,
        enfantsGardeAlternee: input.enfantsGardeAlternee,
        parentIsole: input.parentIsole,
        revenusSalaires: input.revenusSalaires,
        revenusFonciersExistants: input.revenusFonciersExistants,
        revenusBICExistants: input.revenusBICExistants,
        autresRevenus: input.autresRevenus,
        patrimoineImmobilierExistant: input.patrimoineImmobilierExistant,
        dettesImmobilieres: input.dettesImmobilieres,
        valeurRP: input.valeurRP,
        dateAcquisition: input.dateAcquisition,
        prixAchat: input.prixAchat,
        fraisNotaire: input.fraisNotaire,
        travaux: input.travaux,
        mobilier: input.mobilier,
        partTerrain: input.partTerrain,
        dpe: input.dpe,
        apport: input.apport,
        tauxCredit: input.tauxCredit,
        dureeCredit: input.dureeCredit,
        assuranceCredit: input.assuranceCredit,
        loyerMensuel: input.loyerMensuel,
        vacanceSemaines: input.vacanceSemaines,
        revalorisationLoyer: input.revalorisationLoyer,
        typeMeuble: input.typeMeuble,
        taxeFonciere: input.taxeFonciere,
        chargesCopro: input.chargesCopro,
        assurancePNO: input.assurancePNO,
        fraisGestion: input.fraisGestion,
        cfe: input.cfe,
        comptabilite: input.comptabilite,
        regimeFiscal: input.regimeFiscal,
        deficitAnterieur: input.deficitAnterieur,
        amortDiffereAnterieur: input.amortDiffereAnterieur,
        dureeDetention: input.dureeDetention,
        revalorisationBien: input.revalorisationBien,
        fraisRevente: input.fraisRevente,
      }

      const response = await fetch(API_ENDPOINTS.LMNP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(apiInput),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la simulation')
      }

      const apiData: LMNPResult = data.data
      setApiResult(apiData)

      // Transformer les résultats au format attendu par l'UI
      const transformed = transformApiResult(apiData, input)
      setResult(transformed)
      setIsLoading(false)
      return transformed

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur réseau'
      setError(errorMessage)
      setIsLoading(false)
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setApiResult(null)
    setError(null)
  }, [])

  return {
    simulate,
    reset,
    isLoading,
    error,
    result,
    apiResult, // Résultat brut de l'API pour debug
  }
}

/**
 * Transforme les résultats de l'API au format attendu par l'UI existante
 */
function transformApiResult(api: LMNPResult, input: LMNPFormInput): LMNPTransformedResult {
  const [anneeAcq] = input.dateAcquisition.split('-').map(Number)

  // Transformer les projections
  const projections = api.projections.map((p, idx) => ({
    annee: p.annee,
    numAnnee: idx + 1,
    loyerNet: p.loyerNet || p.loyer || 0,
    charges: p.charges || 0,
    interets: p.interets || 0,
    assEmp: 0, // Inclus dans charges côté API
    resAvantAmort: (p.loyerNet || p.loyer || 0) - (p.charges || 0) - (p.interets || 0),
    amortDispo: p.amortissement || 0,
    amortUtil: p.amortUtilise || 0,
    amortDiffere: 0, // Calculé côté API
    resultat: p.baseImposable || 0,
    baseImp: p.baseImposable || 0,
    impotIR: p.ir,
    ps: p.ps,
    cfAvant: p.cfAvantImpots,
    cfApres: p.cfApresImpots,
    capRestant: p.capitalRestant,
    valBien: p.valeurBien,
    capNet: p.capitalNet,
  }))

  // Calculer les alertes
  const alertes = api.alertes.map(a => ({
    type: a.type,
    message: a.message,
  }))

  // Générer les conseils
  const conseils: string[] = []
  if (api.fiscalite.alerteLMP) {
    conseils.push('⚠️ Attention au seuil LMP (23 000 €). Surveillez vos recettes.')
  }
  conseils.push('⚠️ LF 2024 : Depuis le 01/02/2025, les amortissements LMNP sont RÉINTÉGRÉS dans le calcul de la plus-value à la revente.')
  if (api.synthese.amortCumule > 0) {
    conseils.push(`📊 Impact sur votre projet : ${api.synthese.amortCumule.toLocaleString('fr-FR')} € d'amortissements seront réintégrés.`)
  }
  conseils.push('💡 Exonération IR après 22 ans, PS après 30 ans.')
  if (api.synthese.amortDiffereRestant > 0) {
    conseils.push(`📋 Amortissement différé : ${api.synthese.amortDiffereRestant.toLocaleString('fr-FR')} € déductible sans limite de temps.`)
  }

  // Générer les explications
  const explications = [
    `═══ CALCUL ${api.fiscalite.regimeFiscal} - SYNTHÈSE ═══`,
    ``,
    `① REVENUS BIC : ${api.synthese.loyerAnnuel.toLocaleString('fr-FR')} €`,
    `② RENDEMENT BRUT : ${api.synthese.rentaBrute}%`,
    `③ TRI : ${api.synthese.tri}%`,
    `④ CASH-FLOW CUMULÉ : ${api.synthese.cashFlowCumule.toLocaleString('fr-FR')} €`,
    `⑤ IR CUMULÉ : ${api.synthese.irCumule.toLocaleString('fr-FR')} €`,
    `⑥ GAIN TOTAL : ${api.synthese.gainTotal.toLocaleString('fr-FR')} €`,
  ]

  // Explication plus-value
  const explicationPV = [
    `Plus-value brute : ${api.plusValue.plusValueBrute.toLocaleString('fr-FR')} €`,
    `Abattement IR (${api.plusValue.dureeDetention} ans) : ${api.plusValue.abattementIR}%`,
    `Abattement PS : ${api.plusValue.abattementPS}%`,
    `Impôt IR : ${api.plusValue.impotIR.toLocaleString('fr-FR')} €`,
    `Impôt PS : ${api.plusValue.impotPS.toLocaleString('fr-FR')} €`,
    `Total impôt PV : ${api.plusValue.impotTotal.toLocaleString('fr-FR')} €`,
  ]

  const revenuTotalAvant = input.revenusSalaires + input.revenusFonciersExistants + 
    input.revenusBICExistants + input.autresRevenus

  return {
    synthese: {
      investTotal: api.synthese.investTotal,
      apport: input.apport,
      montantEmprunte: api.synthese.montantEmprunte,
      mensualite: api.synthese.mensualite,
      amortAnnuel: api.amortissements.total,
      totAmort: api.synthese.amortCumule,
      amortDiffRest: api.synthese.amortDiffereRestant,
      rendBrut: api.synthese.rentaBrute,
      tri: api.synthese.tri,
      cfMoyMois: api.synthese.cashFlowMoyenMensuel,
      cfCum: api.synthese.cashFlowCumule,
      totIR: api.synthese.irCumule,
      totPS: api.synthese.psCumule,
      valRev: api.synthese.plusValueBrute + api.synthese.investTotal, // Valeur revente estimée
      pvBrute: api.plusValue.plusValueBrute,
      pvCalc: {
        plusValueBrute: api.plusValue.plusValueBrute,
        impotTotal: api.plusValue.impotTotal,
        impotIR: api.plusValue.impotIR,
        impotPS: api.plusValue.impotPS,
        abattementIR: api.plusValue.abattementIR,
        abattementPS: api.plusValue.abattementPS,
        explication: explicationPV,
        alertes: [],
        amortissementsReintegres: 0, // À ajouter dans l'API
      },
      capFinal: api.synthese.gainTotal + input.apport,
      gainTotal: api.synthese.gainTotal,
      amortReintegres: 0, // À ajouter dans l'API
      profilClient: {
        nombreParts: api.profilClient.nombreParts,
        revenuTotalAvant,
        irAvant: api.profilClient.irAvant,
        tmiAvant: api.profilClient.tmi,
        ifiAvant: api.profilClient.ifiAvant,
        assujettiIFIAvant: api.profilClient.assujettiIFIAvant,
        irApres: api.profilClient.irAvant + api.synthese.irCumule / input.dureeDetention,
        ifiApres: api.profilClient.ifiApres,
        assujettiIFIApres: api.profilClient.assujettiIFIApres,
        impactIFI: api.profilClient.ifiApres - api.profilClient.ifiAvant,
      },
    },
    projections,
    alertes,
    conseils,
    explications,
    explicationPV,
  }
}

export default useLMNPSimulator
