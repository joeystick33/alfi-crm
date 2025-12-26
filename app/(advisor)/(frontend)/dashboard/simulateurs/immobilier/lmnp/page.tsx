'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { SimulatorGate } from '@/app/_common/components/FeatureGate'
import { usePlotlyReady } from '../_hooks/usePlotlyReady'

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTES D'AFFICHAGE UNIQUEMENT (pas de formules de calcul)
// Les calculs sont effectués côté serveur via l'API
// ══════════════════════════════════════════════════════════════════════════════
// Réforme LF 2024 pour revenus 2025
const LMNP_DISPLAY = {
  MICRO_BIC: {
    ABATTEMENT_CLASSIQUE: 30,
    ABATTEMENT_TOURISME_CLASSE: 50,
    ABATTEMENT_TOURISME_NON_CLASSE: 30,
    ABATTEMENT_CHAMBRE_HOTES: 71,
    PLAFOND_RECETTES_CLASSIQUE: 15000,
    PLAFOND_RECETTES_TOURISME_CLASSE: 77700,
    PLAFOND_RECETTES_TOURISME_NON_CLASSE: 15000,
    PLAFOND_RECETTES_CHAMBRE_HOTES: 188700,
  }
}

const safeNumber = (value: number | null | undefined) => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  return 0
}

const fmtEur = (n: number | null | undefined) => safeNumber(n).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
const fmtPct = (n: number | null | undefined) => safeNumber(n).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + '%'

// Types
import type { 
  SituationFamilialeSimulateur, 
  ClasseDPE, 
  ProjectionAnnuelle, 
  SyntheseSimulation,
  SimulateurAlerte 
} from '@/app/_common/types/simulateurs.types'

// ══════════════════════════════════════════════════════════════════════════════
// FONCTIONS D'AFFICHAGE SIMPLIFIÉES (pas de calculs fiscaux sensibles)
// Ces fonctions servent uniquement à l'aperçu dans le formulaire
// Les vrais calculs sont effectués côté serveur
// ══════════════════════════════════════════════════════════════════════════════

// Nombre de parts (règle générale publique - art. 194 CGI)
function getDisplayNombreParts(params: { situationFamiliale: string; enfantsACharge: number; enfantsGardeAlternee: number; parentIsole: boolean }): number {
  let parts = params.situationFamiliale === 'CELIBATAIRE' ? 1 : 2
  parts += params.enfantsACharge * (params.enfantsACharge <= 2 ? 0.5 : 1)
  parts += params.enfantsGardeAlternee * 0.25
  if (params.parentIsole && params.enfantsACharge > 0) parts += 0.5
  return parts
}

// Estimation amortissement annuel (formule simplifiée pour aperçu)
function getDisplayAmortissement(prixAchat: number, travaux: number, mobilier: number, partTerrain: number) {
  const valeurAmortissable = (prixAchat + travaux) * (100 - partTerrain) / 100
  const amortImmo = valeurAmortissable / 25 // Moyenne simplifiée
  const amortMob = mobilier / 7
  return {
    amortissementAnnuelTotal: Math.round(amortImmo + amortMob),
    valeurTerrain: Math.round(prixAchat * partTerrain / 100),
  }
}

// Abattements PV (barème public art. 150 VC CGI)
function getDisplayAbattementPVIR(duree: number): number {
  if (duree <= 5) return 0
  if (duree >= 22) return 100
  return Math.min(100, (duree - 5) * 6)
}

function getDisplayAbattementPVPS(duree: number): number {
  if (duree <= 5) return 0
  if (duree >= 30) return 100
  if (duree <= 21) return (duree - 5) * 1.65
  return 28.05 + (duree - 21) * 9
}

// Composants amortissables (pour affichage informatif uniquement)
const COMPOSANTS_AMORTISSEMENT = {
  IMMEUBLE: [
    { nom: 'Gros œuvre', part: 40, duree: 50 },
    { nom: 'Façade/étanchéité', part: 15, duree: 30 },
    { nom: 'IGT (électricité/plomberie)', part: 15, duree: 25 },
    { nom: 'Agencements intérieurs', part: 20, duree: 15 },
    { nom: 'Équipements techniques', part: 10, duree: 20 },
  ],
  MOBILIER: [
    { nom: 'Électroménager', part: 30, duree: 5 },
    { nom: 'Mobilier courant', part: 50, duree: 7 },
    { nom: 'Literie/textiles', part: 20, duree: 10 },
  ]
}

export default function LMNPPage() {
  const { plotlyReady, handlePlotlyLoad } = usePlotlyReady()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showDetailedTable, setShowDetailedTable] = useState(false) // Toggle détail tableau projection
  const [showDetailPV, setShowDetailPV] = useState(false) // Toggle détail calcul plus-value
  const [showScoreDetail, setShowScoreDetail] = useState(false) // Toggle détail scoring

  // ══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 1 : PROFIL CLIENT (NOUVEAU - OBLIGATOIRE)
  // ══════════════════════════════════════════════════════════════════════════
  const [situationFamiliale, setSituationFamiliale] = useState<SituationFamilialeSimulateur>('MARIE_PACSE')
  const [enfantsACharge, setEnfantsACharge] = useState(2)
  const [enfantsGardeAlternee, setEnfantsGardeAlternee] = useState(0)
  const [parentIsole, setParentIsole] = useState(false)
  
  // Revenus existants du foyer fiscal
  const [revenusSalaires, setRevenusSalaires] = useState(70000)
  const [revenusFonciersExistants, setRevenusFonciersExistants] = useState(0)
  const [revenusBICExistants, setRevenusBICExistants] = useState(0)
  const [autresRevenus, setAutresRevenus] = useState(0)
  
  // Patrimoine existant (pour IFI)
  const [patrimoineImmobilierExistant, setPatrimoineImmobilierExistant] = useState(350000) // RP par ex
  const [dettesImmobilieres, setDettesImmobilieres] = useState(150000)
  const [valeurRP, setValeurRP] = useState(350000) // Résidence principale (abattement 30%)
  
  // Autres dispositifs fiscaux utilisés
  const [reductionsIRUtilisees, setReductionsIRUtilisees] = useState(0)
  
  // ══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 2-7 : INVESTISSEMENT (existant)
  // ══════════════════════════════════════════════════════════════════════════
  // ══════════════════════════════════════════════════════════════════════════
  // BIEN IMMOBILIER
  // ══════════════════════════════════════════════════════════════════════════
  const [dateAcquisition, setDateAcquisition] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [prixAchat, setPrixAchat] = useState(180000)
  const [fraisNotaire, setFraisNotaire] = useState(14400)
  const [travaux, setTravaux] = useState(10000)
  const [mobilier, setMobilier] = useState(8000)
  const [partTerrain, setPartTerrain] = useState(15)
  const [dpe, setDpe] = useState<ClasseDPE>('D')
  
  // ══════════════════════════════════════════════════════════════════════════
  // FINANCEMENT DÉTAILLÉ
  // ══════════════════════════════════════════════════════════════════════════
  const [sansFinancement, setSansFinancement] = useState(false) // Achat comptant
  const [apport, setApport] = useState(30000)
  const [tauxCredit, setTauxCredit] = useState(3.5)
  const [dureeCredit, setDureeCredit] = useState(20)
  const [assuranceCredit, setAssuranceCredit] = useState(0.30)
  const [typeGarantie, setTypeGarantie] = useState<'CREDIT_LOGEMENT' | 'HYPOTHEQUE' | 'CAUTION_MUTUELLE'>('CREDIT_LOGEMENT')
  const [differePaiement, setDifferePaiement] = useState(0) // Mois de différé
  const [loyerMensuel, setLoyerMensuel] = useState(700)
  const [chargesLocatives, setChargesLocatives] = useState(0)
  const [vacanceSemaines, setVacanceSemaines] = useState(2)
  const [revalorisationLoyer, setRevalorisationLoyer] = useState(2)
  const [typeMeuble, setTypeMeuble] = useState('CLASSIQUE')
  // CHARGES COURANTES ANNUELLES
  const [fraisGestionPct, setFraisGestionPct] = useState(0) // % des loyers si gestion déléguée
  const [taxeFonciere, setTaxeFonciere] = useState(800)
  const [chargesCopro, setChargesCopro] = useState(1200)
  const [assurancePNO, setAssurancePNO] = useState(180)
  const [travauxEntretien, setTravauxEntretien] = useState(500) // Provision travaux courants
  const [cfe, setCfe] = useState(200)
  const [comptabilite, setComptabilite] = useState(500)
  const [autresCharges, setAutresCharges] = useState(0)
  
  // CHARGES EXCEPTIONNELLES ANNÉE 1
  const [fraisGarantie, setFraisGarantie] = useState(0) // Crédit logement ou hypothèque
  const [fraisDossierBancaire, setFraisDossierBancaire] = useState(500)
  const [fraisAdministratifs, setFraisAdministratifs] = useState(0) // Frais divers année 1
  const [regimeFiscal, setRegimeFiscal] = useState('REEL')
  const [deficitAnterieur, setDeficitAnterieur] = useState(0)
  const [amortDiffereAnt, setAmortDiffereAnt] = useState(0)
  const [dureeDetention, setDureeDetention] = useState(20)
  const [revalorisationBien, setRevalorisationBien] = useState(2)
  const [fraisRevente, setFraisRevente] = useState(5)

  // Résultats
  const [projections, setProjections] = useState<ProjectionAnnuelle[]>([])
  const [synthese, setSynthese] = useState<SyntheseSimulation | null>(null)
  const [explications, setExplications] = useState<string[]>([])
  const [alertes, setAlertes] = useState<SimulateurAlerte[]>([])
  const [conseils, setConseils] = useState<string[]>([])
  const [explicationPV, setExplicationPV] = useState<string[]>([])

  const chartRef1 = useRef<HTMLDivElement>(null)
  const chartRef2 = useRef<HTMLDivElement>(null)

  // ══════════════════════════════════════════════════════════════════════════
  // CALCULS DE BASE
  // ══════════════════════════════════════════════════════════════════════════
  const investTotal = prixAchat + fraisNotaire + travaux + mobilier
  const montantEmprunte = Math.max(0, investTotal - apport)
  const loyerAnnuel = loyerMensuel * 12 * (1 - vacanceSemaines / 52)
  const abattMicro = typeMeuble === 'TOURISME_CLASSE' ? 71 : typeMeuble === 'TOURISME_NON_CLASSE' ? 30 : 50
  const plafondMicro = typeMeuble === 'TOURISME_CLASSE' ? LMNP_DISPLAY.MICRO_BIC.PLAFOND_RECETTES_TOURISME_CLASSE : LMNP_DISPLAY.MICRO_BIC.PLAFOND_RECETTES_CLASSIQUE
  const eligibleMicro = loyerAnnuel <= plafondMicro
  
  // ══════════════════════════════════════════════════════════════════════════
  // CALCUL DÉTAILLÉ DES CHARGES
  // ══════════════════════════════════════════════════════════════════════════
  const fraisGestionAnnuel = loyerAnnuel * fraisGestionPct / 100
  const chargesCourantesAnnuelles = fraisGestionAnnuel + taxeFonciere + chargesCopro + assurancePNO + travauxEntretien + cfe + comptabilite + autresCharges
  const chargesExceptionnellesAn1 = fraisGarantie + fraisDossierBancaire + fraisAdministratifs
  const totalCharges = chargesCourantesAnnuelles
  
  // ══════════════════════════════════════════════════════════════════════════
  // CALCUL DÉTAILLÉ DU CRÉDIT
  // ══════════════════════════════════════════════════════════════════════════
  const tauxMens = tauxCredit / 100 / 12
  const nbMens = dureeCredit * 12
  const mensHorsAss = montantEmprunte > 0 && tauxMens > 0 ? montantEmprunte * (tauxMens * Math.pow(1 + tauxMens, nbMens)) / (Math.pow(1 + tauxMens, nbMens) - 1) : montantEmprunte / nbMens
  const assMens = montantEmprunte * assuranceCredit / 100 / 12
  const mensualite = mensHorsAss + assMens
  
  // Coût total du crédit
  const coutTotalCredit = mensualite * nbMens - montantEmprunte
  const interetsTotaux = mensHorsAss * nbMens - montantEmprunte
  const assuranceTotale = assMens * nbMens
  const taegEstime = montantEmprunte > 0 ? ((Math.pow((mensualite * nbMens) / montantEmprunte, 1/dureeCredit) - 1) * 100) : 0
  
  // Calcul frais de garantie automatique selon type
  const fraisGarantieAuto = typeGarantie === 'CREDIT_LOGEMENT' 
    ? Math.round(montantEmprunte * 0.012) // ~1.2% crédit logement
    : typeGarantie === 'HYPOTHEQUE' 
      ? Math.round(montantEmprunte * 0.02) // ~2% hypothèque
      : Math.round(montantEmprunte * 0.008) // ~0.8% caution mutuelle
  
  // Date de fin de crédit
  const [anneeAcq, moisAcq] = dateAcquisition.split('-').map(Number)
  const dateFinCredit = new Date(anneeAcq, moisAcq - 1 + nbMens)
  const anneeFinCredit = dateFinCredit.getFullYear()
  
  // Années clés pour abattements PV
  const anneeExonerationIR = anneeAcq + 22 // Exonération IR après 22 ans
  const anneeExonerationPS = anneeAcq + 30 // Exonération PS après 30 ans

  // ══════════════════════════════════════════════════════════════════════════
  // APPEL API BACKEND POUR LA SIMULATION
  // Tous les calculs sensibles sont effectués côté serveur
  // ══════════════════════════════════════════════════════════════════════════
  const lancerSimulation = useCallback(async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/advisor/simulators/immobilier/lmnp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          // Profil client
          situationFamiliale,
          enfantsACharge,
          enfantsGardeAlternee,
          parentIsole,
          revenusSalaires,
          revenusFonciersExistants,
          revenusBICExistants,
          autresRevenus,
          patrimoineImmobilierExistant,
          dettesImmobilieres,
          valeurRP,
          reductionsIRUtilisees,
          // Bien immobilier
          dateAcquisition,
          prixAchat,
          fraisNotaire,
          travaux,
          mobilier,
          partTerrain,
          dpe,
          // Financement
          apport,
          tauxCredit,
          dureeCredit,
          assuranceCredit,
          // Revenus locatifs
          loyerMensuel,
          chargesLocatives,
          vacanceSemaines,
          revalorisationLoyer,
          typeMeuble,
          // Charges
          taxeFonciere,
          chargesCopro,
          assurancePNO,
          fraisGestion: fraisGestionPct,
          cfe,
          comptabilite,
          autresCharges,
          // Fiscalité
          regimeFiscal,
          deficitAnterieur,
          amortDiffereAnterieur: amortDiffereAnt,
          // Projection
          dureeDetention,
          revalorisationBien,
          fraisRevente,
          fraisGarantie,
          fraisDossierBancaire,
          fraisAdministratifs,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la simulation')
      }

      const result = data.data
      
      // Transformer les résultats API au format attendu par l'UI
      const newAlertes = result.alertes || []
      const newConseils: string[] = []
      const newExpl: string[] = []
      
      // Générer les conseils
      newConseils.push('⚠️ LF 2024 : Depuis le 01/02/2025, les amortissements LMNP sont RÉINTÉGRÉS dans le calcul de la plus-value à la revente.')
      if (result.synthese.amortCumule > 0) {
        newConseils.push(`📊 Impact sur votre projet : ${fmtEur(result.synthese.amortCumule)} d'amortissements seront réintégrés.`)
      }
      newConseils.push('💡 Exonération IR après 22 ans, PS après 30 ans.')
      if (result.synthese.amortDiffereRestant > 0) {
        newConseils.push(`📋 Amortissement différé : ${fmtEur(result.synthese.amortDiffereRestant)} déductible sans limite de temps.`)
      }
      
      // Générer les explications détaillées
      newExpl.push(`═══════════════════════════════════════════════════════════`)
      newExpl.push(`          CALCUL DÉTAILLÉ - RÉGIME ${result.fiscalite.regimeFiscal}`)
      newExpl.push(`═══════════════════════════════════════════════════════════`)
      newExpl.push('')
      newExpl.push(`▸ INVESTISSEMENT`)
      newExpl.push(`  Prix d'achat :           ${fmtEur(prixAchat)}`)
      newExpl.push(`  Frais notaire :          ${fmtEur(fraisNotaire)}`)
      newExpl.push(`  Travaux :                ${fmtEur(travaux)}`)
      newExpl.push(`  Mobilier :               ${fmtEur(mobilier)}`)
      newExpl.push(`  ────────────────────────────────────`)
      newExpl.push(`  TOTAL INVESTISSEMENT :   ${fmtEur(result.synthese.investTotal)}`)
      newExpl.push('')
      newExpl.push(`▸ FINANCEMENT`)
      newExpl.push(`  Apport :                 ${fmtEur(apport)} (${fmtPct(apport/result.synthese.investTotal*100)})`)
      newExpl.push(`  Montant emprunté :       ${fmtEur(result.synthese.montantEmprunte)}`)
      newExpl.push(`  Mensualité :             ${fmtEur(result.synthese.mensualite)}/mois`)
      newExpl.push(`  Durée crédit :           ${dureeCredit} ans`)
      newExpl.push('')
      newExpl.push(`▸ REVENUS LOCATIFS`)
      newExpl.push(`  Loyer mensuel brut :     ${fmtEur(loyerMensuel)}`)
      newExpl.push(`  Vacance :                ${vacanceSemaines} semaines/an`)
      newExpl.push(`  Loyer annuel net :       ${fmtEur(result.synthese.loyerAnnuel)}`)
      newExpl.push('')
      newExpl.push(`▸ FISCALITÉ (${result.fiscalite.regimeFiscal})`)
      if (result.fiscalite.regimeFiscal === 'REEL') {
        newExpl.push(`  Amortissement annuel :   ${fmtEur(result.amortissements?.total || 0)}`)
        newExpl.push(`    - Immeuble (30 ans) :  ${fmtEur(result.amortissements?.immeuble || 0)}`)
        newExpl.push(`    - Mobilier (7 ans) :   ${fmtEur(result.amortissements?.mobilier || 0)}`)
        newExpl.push(`    - Travaux (10 ans) :   ${fmtEur(result.amortissements?.travaux || 0)}`)
        newExpl.push(`  Amortissement utilisé :  ${fmtEur(result.synthese.amortCumule || 0)} sur ${dureeDetention} ans`)
        newExpl.push(`  Amortissement différé :  ${fmtEur(result.synthese.amortDiffereRestant || 0)} (reportable)`)
      } else {
        newExpl.push(`  Plafond micro-BIC :      ${fmtEur(result.fiscalite.plafondMicroBIC || 77700)}`)
        newExpl.push(`  Abattement :             ${result.fiscalite.abattementMicroBIC || 50}%`)
        newExpl.push(`  Base imposable :         ${fmtEur(Math.round(result.synthese.loyerAnnuel * (1 - (result.fiscalite.abattementMicroBIC || 50) / 100)))}`)
      }
      newExpl.push(`  TMI :                    ${result.profilClient.tmi}%`)
      newExpl.push(`  IR cumulé (${dureeDetention} ans) :    ${fmtEur(result.synthese.irCumule)}`)
      newExpl.push(`  PS cumulés (${dureeDetention} ans) :   ${fmtEur(result.synthese.psCumule)}`)
      newExpl.push('')
      newExpl.push(`▸ PERFORMANCE`)
      newExpl.push(`  Rendement brut :         ${fmtPct(result.synthese.rentaBrute)}`)
      newExpl.push(`  Rendement net :          ${fmtPct(result.synthese.rentaNette)}`)
      newExpl.push(`  TRI (rendement global) : ${fmtPct(result.synthese.tri)}`)
      newExpl.push(`  Cash-flow moyen :        ${fmtEur(result.synthese.cashFlowMoyen)}/an (${fmtEur(result.synthese.cashFlowMoyenMensuel)}/mois)`)
      newExpl.push('')
      newExpl.push(`▸ BILAN À ${dureeDetention} ANS`)
      newExpl.push(`  Cash-flow cumulé :       ${fmtEur(result.synthese.cashFlowCumule)}`)
      newExpl.push(`  Valeur du bien :         ${fmtEur(result.plusValue?.valeurRevente || 0)}`)
      newExpl.push(`  Plus-value brute :       ${fmtEur(result.plusValue?.plusValueBrute || 0)}`)
      newExpl.push(`  Impôt sur PV :           ${fmtEur(result.plusValue?.impotTotal || 0)}`)
      newExpl.push(`  Capital final net :      ${fmtEur(result.plusValue?.capitalFinal || result.synthese.gainTotal + apport)}`)
      newExpl.push(`  ────────────────────────────────────`)
      newExpl.push(`  GAIN TOTAL :             ${fmtEur(result.synthese.gainTotal)}`)

      // Transformer les projections
       
      const projTransformed = result.projections.map((p: any, idx: number) => ({
        annee: p.annee,
        numAnnee: idx + 1,
        loyerNet: p.loyer || 0,
        charges: p.charges || 0,
        interets: p.interets || 0,
        assEmp: p.assuranceCredit || 0,
        resAvantAmort: p.resultatAvantAmort || 0,
        amortAnnuel: p.amortAnnuel || 0,    // Amortissement annuel constant
        amortDispo: p.amortDispo || 0,       // Amortissement disponible (annuel + stock)
        amortUtil: p.amortUtilise || 0,
        amortDiffere: p.amortDiffere || 0,   // Stock d'amortissements différés
        resultat: p.baseImposable || 0,
        baseImp: p.baseImposable || 0,
        impotIR: p.ir || 0,
        ps: p.ps || 0,
        cfAvant: p.cfAvantImpots || 0,
        cfApres: p.cfApresImpots || 0,
        capRestant: p.capitalRestant || 0,
        valBien: p.valeurBien || 0,
        capNet: p.capitalNet || 0,
      }))

      // Construire la synthèse au format attendu par l'UI
      const revenuTotalAvant = revenusSalaires + revenusFonciersExistants + revenusBICExistants + autresRevenus
      
      // Récupérer les données de plus-value avec valeurs par défaut
      const pv = result.plusValue || {}
      const amort = result.amortissements || {}
      
      setSynthese({
        investTotal: result.synthese.investTotal,
        apport,
        montantEmprunte: result.synthese.montantEmprunte,
        mensualite: result.synthese.mensualite,
        amortAnnuel: amort.total || 0,
        amortissementComposants: [
          { label: 'Immeuble', montant: amort.immeuble || 0, duree: 30 },
          { label: 'Mobilier', montant: amort.mobilier || 0, duree: 7 },
          { label: 'Travaux', montant: amort.travaux || 0, duree: 10 },
        ],
        totAmort: result.synthese.amortCumule || 0,
        amortDiffRest: result.synthese.amortDiffereRestant || 0,
        rendBrut: result.synthese.rentaBrute,
        tri: result.synthese.tri,
        cfMoyMois: result.synthese.cashFlowMoyenMensuel,
        cfCum: result.synthese.cashFlowCumule,
        totIR: result.synthese.irCumule,
        totPS: result.synthese.psCumule,
        valRev: pv.valeurRevente || 0,
        pvBrute: pv.plusValueBrute || 0,
        pvCalc: pv,
        capFinal: pv.capitalFinal || result.synthese.capitalFinal,
        gainTotal: result.synthese.gainTotal,
        produitNetVente: pv.capitalFinal || 0,
        amortReintegres: result.synthese.amortCumule || 0,
        profilClient: {
          nombreParts: result.profilClient.nombreParts,
          revenuTotalAvant,
          irAvant: result.profilClient.irAvant,
          irBrut: result.profilClient.irBrut || result.profilClient.irAvant,
          plafonnementQF: result.profilClient.plafonnementQF || 0,
          tmi: result.profilClient.tmi,
          tmiAvant: result.profilClient.tmi,
          ifiAvant: result.profilClient.ifiAvant,
          assujettiIFIAvant: result.profilClient.assujettiIFIAvant,
          irApres: result.profilClient.irApres || result.profilClient.irAvant,
          ifiApres: result.profilClient.ifiApres,
          assujettiIFIApres: result.profilClient.assujettiIFIApres,
          impactIFI: result.profilClient.ifiApres - result.profilClient.ifiAvant,
        },
        fiscalite: {
          regimeFiscal: result.fiscalite?.regimeFiscal || regimeFiscal,
          typeMeuble: result.fiscalite?.typeMeuble || typeMeuble,
          plafondMicroBIC: result.fiscalite?.plafondMicroBIC || 15000,
          abattementMicroBIC: result.fiscalite?.abattementMicroBIC || 30,
        },
      })

      // Explication PV
      setExplicationPV([
        `Plus-value brute : ${fmtEur(pv.plusValueBrute || 0)}`,
        `Abattement IR (${pv.dureeDetention || dureeDetention} ans) : ${pv.abattementIR || 0}%`,
        `Abattement PS : ${pv.abattementPS || 0}%`,
        `Impôt IR : ${fmtEur(pv.impotIR || 0)}`,
        `Impôt PS : ${fmtEur(pv.impotPS || 0)}`,
        `Total impôt PV : ${fmtEur(pv.impotTotal || 0)}`,
      ])

      setProjections(projTransformed)
      setExplications(newExpl)
      setAlertes(newAlertes)
      setConseils(newConseils)
      setShowResults(true)
      
    } catch (error) {
      console.error('Erreur simulation:', error)
      setAlertes([{ type: 'error', message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` }])
    } finally {
      setLoading(false)
    }
  }, [
    // Profil client
    situationFamiliale, enfantsACharge, enfantsGardeAlternee, parentIsole,
    revenusSalaires, revenusFonciersExistants, revenusBICExistants, autresRevenus,
    patrimoineImmobilierExistant, dettesImmobilieres, valeurRP,
    // Investissement
    dateAcquisition, prixAchat, fraisNotaire, travaux, mobilier, partTerrain, dpe,
    apport, tauxCredit, dureeCredit, assuranceCredit,
    loyerMensuel, chargesLocatives, vacanceSemaines, revalorisationLoyer, typeMeuble,
    // Charges
    fraisGestionPct, taxeFonciere, chargesCopro, assurancePNO, cfe, comptabilite,
    // Fiscalité
    regimeFiscal, deficitAnterieur, amortDiffereAnt, dureeDetention, revalorisationBien, fraisRevente,
  ])

  useEffect(() => {
    if (!plotlyReady || !showResults || !projections.length) return
    const P = (window as unknown as { Plotly?: { newPlot: (el: HTMLElement, data: unknown[], layout: unknown, config?: unknown) => void } }).Plotly
    if (!P) return
    const years = projections.map(p => p.annee)

    if (chartRef1.current) {
      P.newPlot(chartRef1.current, [
        {
          x: years,
          y: projections.map(p => p.cfApres),
          type: 'bar',
          marker: { color: projections.map(p => p.cfApres >= 0 ? '#059669' : '#dc2626') },
          name: 'Cash-flow après impôts',
        },
        {
          x: years,
          y: projections.map(p => p.loyerNet),
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Loyers nets',
          line: { color: '#2563eb', width: 3 },
        },
      ], {
        title: 'Cash-flow vs loyers',
        height: 280,
        margin: { t: 40, b: 40, l: 60, r: 20 },
        paper_bgcolor: 'transparent',
        xaxis: { title: 'Année', tickangle: -45 },
        legend: { orientation: 'h', y: -0.15 },
      }, { displayModeBar: false })
    }

    if (chartRef2.current) {
      P.newPlot(chartRef2.current, [
        {
          x: years,
          y: projections.map(p => p.valBien),
          name: 'Valeur du bien',
          line: { color: '#4c1d95', width: 3 },
        },
        {
          x: years,
          y: projections.map(p => p.capRestant),
          name: 'Capital restant',
          line: { color: '#ef4444', width: 2 },
          fill: 'tonexty',
        },
        {
          x: years,
          y: projections.map(p => p.capNet),
          name: 'Capital net',
          line: { color: '#10b981', width: 3 },
        },
      ], {
        title: 'Évolution du patrimoine net',
        height: 280,
        margin: { t: 40, b: 40, l: 60, r: 20 },
        paper_bgcolor: 'transparent',
        xaxis: { title: 'Année', tickangle: -45 },
        legend: { orientation: 'h', y: -0.15 },
      }, { displayModeBar: false })
    }
  }, [plotlyReady, showResults, projections])

  return (
    <SimulatorGate simulator="IMMOBILIER" showTeaser>
      <Script src="https://cdn.plot.ly/plotly-2.27.0.min.js" strategy="afterInteractive" onLoad={handlePlotlyLoad} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50">
        <main className="container mx-auto px-4 py-6 max-w-6xl">
          <Link href="/dashboard/simulateurs/immobilier" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center">← Simulateurs immobilier</Link>
          <div className="sim-card mb-6"><div className="flex items-center gap-4"><span className="text-4xl">🛋️</span><div><h1 className="text-2xl font-bold">Simulateur LMNP</h1><p className="text-gray-600">Loueur Meublé Non Professionnel • Amortissement comptable</p></div></div><div className="flex gap-2 mt-3"><span className="badge-blue">BIC</span><span className="badge-green">Amortissement</span></div></div>

          {!showResults ? (
            <div className="sim-card">
              <div className="mb-6"><div className="flex justify-between text-sm mb-2"><span>Étape {step}/7</span><span>{Math.round(step/7*100)}%</span></div><div className="h-2 bg-gray-200 rounded-full"><div className="h-full bg-blue-600 rounded-full transition-all" style={{width:`${step/7*100}%`}}/></div></div>

              {step === 1 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4">👤 Profil client</h2>
                <p className="text-gray-600 mb-4">Pour calculer l'impact fiscal réel, nous avons besoin de votre situation actuelle.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="form-group"><label>Situation familiale</label><select value={situationFamiliale} onChange={e=>setSituationFamiliale(e.target.value as SituationFamilialeSimulateur)}><option value="CELIBATAIRE">Célibataire</option><option value="MARIE_PACSE">Marié / Pacsé</option><option value="VEUF">Veuf</option></select></div>
                  <div className="form-group"><label>Enfants à charge</label><input type="number" value={enfantsACharge} onChange={e=>setEnfantsACharge(+e.target.value)} min={0}/></div>
                  <div className="form-group"><label>Revenus salaires (€/an)</label><input type="number" value={revenusSalaires} onChange={e=>setRevenusSalaires(+e.target.value)}/></div>
                  <div className="form-group"><label>Revenus BIC existants (€)</label><input type="number" value={revenusBICExistants} onChange={e=>setRevenusBICExistants(+e.target.value)}/><span className="form-hint">Autres LMNP...</span></div>
                  <div className="form-group"><label>Patrimoine immo existant (€)</label><input type="number" value={patrimoineImmobilierExistant} onChange={e=>setPatrimoineImmobilierExistant(+e.target.value)}/><span className="form-hint">Pour calcul IFI</span></div>
                  <div className="form-group"><label>Dettes immobilières (€)</label><input type="number" value={dettesImmobilieres} onChange={e=>setDettesImmobilieres(+e.target.value)}/></div>
                  <div className="form-group"><label>Valeur résidence principale (€)</label><input type="number" value={valeurRP} onChange={e=>setValeurRP(+e.target.value)}/><span className="form-hint">Abattement 30% IFI</span></div>
                  <div className="form-group"><label>Réductions IR utilisées (€)</label><input type="number" value={reductionsIRUtilisees} onChange={e=>setReductionsIRUtilisees(+e.target.value)}/><span className="form-hint">Plafond niches</span></div>
                </div>
                <div className="info-box mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div><span className="text-gray-500">Parts fiscales</span><div className="font-bold text-lg">{getDisplayNombreParts({situationFamiliale, enfantsACharge, enfantsGardeAlternee, parentIsole})}</div></div>
                  <div><span className="text-gray-500">Revenu imposable</span><div className="font-bold text-lg">{fmtEur(revenusSalaires + revenusBICExistants)}</div></div>
                  <div><span className="text-gray-500">Patrimoine net IFI</span><div className={`font-bold text-lg ${(patrimoineImmobilierExistant - dettesImmobilieres) > 1300000 ? 'text-orange-600' : 'text-green-600'}`}>{fmtEur(patrimoineImmobilierExistant - dettesImmobilieres)}</div></div>
                </div>
                <div className="pedagogy-box mt-4"><p className="text-sm text-blue-700"><strong>Pourquoi ces informations ?</strong> Elles permettent de calculer l'impact RÉEL sur votre IR (barème progressif) et votre IFI, pas juste une estimation avec un TMI fixe.</p></div>
              </div>}

              {step === 2 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4">🛋️ Bien meublé</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="form-group col-span-2 md:col-span-1"><label>📅 Date d'acquisition</label><input type="month" value={dateAcquisition} onChange={e=>setDateAcquisition(e.target.value)} className="w-full"/><span className="form-hint">Pour calcul abattements PV</span></div>
                  <div className="form-group"><label>Prix d'achat (€)</label><input type="number" value={prixAchat} onChange={e=>setPrixAchat(+e.target.value)}/></div>
                  <div className="form-group"><label>Frais notaire (€)</label><input type="number" value={fraisNotaire} onChange={e=>setFraisNotaire(+e.target.value)}/><span className="form-hint">~8% ancien, ~3% neuf</span></div>
                  <div className="form-group"><label>Travaux (€)</label><input type="number" value={travaux} onChange={e=>setTravaux(+e.target.value)}/></div>
                  <div className="form-group"><label>Mobilier (€)</label><input type="number" value={mobilier} onChange={e=>setMobilier(+e.target.value)}/><span className="form-hint">Amort. 5-10 ans</span></div>
                  <div className="form-group"><label>Part terrain (%)</label><input type="number" value={partTerrain} onChange={e=>setPartTerrain(+e.target.value)} min={5} max={40}/><span className="form-hint">Non amortissable</span></div>
                  <div className="form-group"><label>DPE</label><select value={dpe} onChange={e=>setDpe(e.target.value as ClasseDPE)}><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F⚠️</option><option value="G">G🚨</option></select></div>
                </div>
                
                <div className="info-box mt-4 grid grid-cols-4 gap-4 text-sm">
                  <div><span className="text-gray-500">Investissement total</span><div className="font-bold text-lg">{fmtEur(investTotal)}</div></div>
                  <div><span className="text-gray-500">Amortissement/an</span><div className="font-bold text-lg text-blue-600">{fmtEur(getDisplayAmortissement(prixAchat, travaux, mobilier, partTerrain).amortissementAnnuelTotal)}</div></div>
                  <div><span className="text-gray-500">Terrain (non amort.)</span><div className="font-bold">{fmtEur(getDisplayAmortissement(prixAchat, travaux, mobilier, partTerrain).valeurTerrain)}</div></div>
                  <div><span className="text-gray-500">Exonération PV IR</span><div className="font-bold text-blue-600">{anneeExonerationIR}</div></div>
                </div>
                
                <div className="pedagogy-box mt-4"><p className="text-sm text-blue-700"><strong>📚 Mobilier obligatoire :</strong> literie, plaques, frigo, table, chaises, rangements, luminaires....</p></div></div>}

              {step === 3 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4">💳 Financement</h2>
                
                {/* Option achat comptant */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sansFinancement}
                      onChange={(e) => {
                        setSansFinancement(e.target.checked)
                        if (e.target.checked) {
                          setApport(investTotal)
                        }
                      }}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-semibold text-slate-800">💵 Achat au comptant (sans financement)</span>
                      <p className="text-sm text-slate-500">Cochez cette case si le client ne passe pas par un crédit immobilier</p>
                    </div>
                  </label>
                </div>
                
                {sansFinancement ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
                    <div className="text-4xl mb-3">💰</div>
                    <h3 className="font-bold text-emerald-800 text-lg mb-2">Achat au comptant</h3>
                    <p className="text-emerald-700">Investissement total : <strong className="text-xl">{fmtEur(investTotal)}</strong></p>
                    <p className="text-sm text-emerald-600 mt-2">Pas de crédit, pas d'intérêts, pas de mensualités. Cash-flow simplifié.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="form-group"><label>Apport personnel (€)</label><input type="number" value={apport} onChange={e=>setApport(+e.target.value)}/><span className="form-hint">{fmtPct(apport/investTotal*100)} du bien</span></div>
                      <div className="form-group"><label>Taux nominal (%)</label><input type="number" value={tauxCredit} onChange={e=>setTauxCredit(+e.target.value)} step={0.1}/></div>
                      <div className="form-group"><label>Durée (ans)</label><input type="number" value={dureeCredit} onChange={e=>setDureeCredit(+e.target.value)} min={5} max={30}/></div>
                      <div className="form-group"><label>Assurance (%/an CI)</label><input type="number" value={assuranceCredit} onChange={e=>setAssuranceCredit(+e.target.value)} step={0.05}/></div>
                      <div className="form-group"><label>Type de garantie</label><select value={typeGarantie} onChange={e=>setTypeGarantie(e.target.value as 'CREDIT_LOGEMENT' | 'HYPOTHEQUE' | 'CAUTION_MUTUELLE')}><option value="CREDIT_LOGEMENT">Crédit Logement (~1.2%)</option><option value="HYPOTHEQUE">Hypothèque (~2%)</option><option value="CAUTION_MUTUELLE">Caution mutuelle (~0.8%)</option></select></div>
                      <div className="form-group"><label>Différé (mois)</label><input type="number" value={differePaiement} onChange={e=>setDifferePaiement(+e.target.value)} min={0} max={24}/><span className="form-hint">Paiement intérêts seuls</span></div>
                    </div>
                    
                    {/* DÉTAIL DU CRÉDIT */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                      <h3 className="font-semibold text-blue-800 mb-3">📊 SYNTHÈSE DU CRÉDIT</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="bg-white p-3 rounded-lg"><div className="text-gray-500 text-xs">Montant emprunté</div><div className="font-bold text-lg">{fmtEur(montantEmprunte)}</div></div>
                        <div className="bg-white p-3 rounded-lg"><div className="text-gray-500 text-xs">Mensualité totale</div><div className="font-bold text-lg text-blue-600">{fmtEur(Math.round(mensualite))}</div><div className="text-xs text-gray-400">{fmtEur(Math.round(mensHorsAss))} + {fmtEur(Math.round(assMens))} ass.</div></div>
                        <div className="bg-white p-3 rounded-lg"><div className="text-gray-500 text-xs">Coût total crédit</div><div className="font-bold text-lg text-orange-600">{fmtEur(Math.round(coutTotalCredit))}</div><div className="text-xs text-gray-400">Intérêts + assurance</div></div>
                        <div className="bg-white p-3 rounded-lg"><div className="text-gray-500 text-xs">Fin du crédit</div><div className="font-bold text-lg">{anneeFinCredit}</div><div className="text-xs text-gray-400">{dureeCredit} ans</div></div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                        <div className="text-center p-2 bg-white rounded"><div className="text-gray-500 text-xs">Intérêts totaux</div><div className="font-semibold text-orange-500">{fmtEur(Math.round(interetsTotaux))}</div></div>
                        <div className="text-center p-2 bg-white rounded"><div className="text-gray-500 text-xs">Assurance totale</div><div className="font-semibold">{fmtEur(Math.round(assuranceTotale))}</div></div>
                        <div className="text-center p-2 bg-white rounded"><div className="text-gray-500 text-xs">Frais garantie estimés</div><div className="font-semibold">{fmtEur(fraisGarantieAuto)}</div></div>
                      </div>
                    </div>
                    
                    <div className="pedagogy-box mt-4">
                      <h4 className="font-semibold text-blue-800 mb-2">💡 ANALYSE DU FINANCEMENT</h4>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p>• <strong>LTV {fmtPct(montantEmprunte/investTotal*100)}</strong> : {montantEmprunte/investTotal > 0.9 ? '⚠️ Levier élevé, risque accru mais potentiel de rentabilité maximisé' : montantEmprunte/investTotal > 0.7 ? '✅ Bon équilibre entre effet de levier et sécurité' : '📊 Apport confortable, risque maîtrisé'}</p>
                        <p>• <strong>Coût du crédit</strong> : Le crédit vous coûtera {fmtEur(Math.round(coutTotalCredit))} sur {dureeCredit} ans, soit {fmtPct(coutTotalCredit/montantEmprunte*100)} du capital emprunté.</p>
                        <p>• <strong>Effort mensuel</strong> : {mensualite > loyerMensuel ? `⚠️ Mensualité (${fmtEur(Math.round(mensualite))}) > loyer (${fmtEur(loyerMensuel)}) = effort de ${fmtEur(Math.round(mensualite - loyerMensuel))}/mois` : `✅ Loyer (${fmtEur(loyerMensuel)}) > mensualité (${fmtEur(Math.round(mensualite))}) = cash-flow positif potentiel`}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>}

              {step === 4 && (
                <div className="animate-fadeIn">
                  <h2 className="text-lg font-bold mb-4">💰 Revenus</h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="form-group">
                      <label>Type meublé</label>
                      <select value={typeMeuble} onChange={e=>setTypeMeuble(e.target.value)}>
                        <option value="CLASSIQUE">Classique (30%)</option>
                        <option value="TOURISME_CLASSE">Tourisme classé (50%)</option>
                        <option value="TOURISME_NON_CLASSE">Tourisme non classé (30%)</option>
                        <option value="CHAMBRE_HOTES">Chambre d'hôtes (71%)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Loyer/mois (€)</label>
                      <input type="number" value={loyerMensuel} onChange={e=>setLoyerMensuel(+e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Vacance (sem.)</label>
                      <input type="number" value={vacanceSemaines} onChange={e=>setVacanceSemaines(+e.target.value)} min={0} max={52} />
                    </div>
                    <div className="form-group">
                      <label>Charges locatives (€)</label>
                      <input type="number" value={chargesLocatives} onChange={e=>setChargesLocatives(+e.target.value)} />
                      <span className="form-hint">Charges récupérées auprès du locataire</span>
                    </div>
                    <div className="form-group">
                      <label>Revalo (%/an)</label>
                      <input type="number" value={revalorisationLoyer} onChange={e=>setRevalorisationLoyer(+e.target.value)} step={0.1} />
                    </div>
                  </div>
                  <div className="info-box mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Recettes</span>
                      <div className="font-bold text-lg text-green-600">{fmtEur(Math.round(loyerAnnuel))}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Rdt brut</span>
                      <div className="font-bold text-lg">{fmtPct(loyerMensuel*12/prixAchat*100)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Seuil LMNP</span>
                      <div className={`font-bold ${loyerAnnuel > 23000 ? 'text-orange-600' : 'text-green-600'}`}>
                        {loyerAnnuel > 23000 ? '⚠️ Dépassé' : '✅ OK'}
                      </div>
                      <div className="text-xs text-gray-400">Max 23 000 €</div>
                    </div>
                  </div>
                  {loyerAnnuel > 23000 && (
                    <div className="alert-warning mt-4">
                      <p className="text-sm">
                        ⚠️ Recettes &gt; 23 000 € : si elles dépassent aussi vos revenus d'activité ({fmtEur(revenusSalaires)}),
                        vous basculez en <strong>LMP</strong> (régime professionnel).
                      </p>
                    </div>
                  )}
                </div>
              )}

              {step === 5 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4">📋 Charges détaillées</h2>
                
                {/* CHARGES COURANTES ANNUELLES */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-green-800 mb-3">💚 CHARGES COURANTES ANNUELLES</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="form-group"><label>Frais gestion (%)</label><input type="number" value={fraisGestionPct} onChange={e=>setFraisGestionPct(+e.target.value)} step={0.5} min={0} max={15}/><span className="form-hint">Si gestion déléguée (6-10%)</span></div>
                    <div className="form-group"><label>Taxe foncière (€)</label><input type="number" value={taxeFonciere} onChange={e=>setTaxeFonciere(+e.target.value)}/></div>
                    <div className="form-group"><label>Charges copro (€)</label><input type="number" value={chargesCopro} onChange={e=>setChargesCopro(+e.target.value)}/></div>
                    <div className="form-group"><label>Assurance PNO (€)</label><input type="number" value={assurancePNO} onChange={e=>setAssurancePNO(+e.target.value)}/></div>
                    <div className="form-group"><label>Travaux entretien (€)</label><input type="number" value={travauxEntretien} onChange={e=>setTravauxEntretien(+e.target.value)}/><span className="form-hint">Provision annuelle</span></div>
                    <div className="form-group"><label>CFE (€)</label><input type="number" value={cfe} onChange={e=>setCfe(+e.target.value)}/></div>
                    <div className="form-group"><label>Comptabilité (€)</label><input type="number" value={comptabilite} onChange={e=>setComptabilite(+e.target.value)}/></div>
                    <div className="form-group"><label>Autres charges (€)</label><input type="number" value={autresCharges} onChange={e=>setAutresCharges(+e.target.value)}/></div>
                  </div>
                  <div className="mt-3 p-2 bg-green-100 rounded-lg flex justify-between items-center">
                    <span className="text-green-700">Total charges courantes/an</span>
                    <span className="font-bold text-green-800 text-lg">{fmtEur(Math.round(chargesCourantesAnnuelles))}</span>
                  </div>
                </div>
                
                {/* CHARGES EXCEPTIONNELLES ANNÉE 1 */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-800 mb-3">🟠 CHARGES EXCEPTIONNELLES ANNÉE 1</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="form-group"><label>Frais garantie (€)</label><input type="number" value={fraisGarantie} onChange={e=>setFraisGarantie(+e.target.value)}/><span className="form-hint">Crédit logement ou hypothèque</span></div>
                    <div className="form-group"><label>Frais dossier bancaire (€)</label><input type="number" value={fraisDossierBancaire} onChange={e=>setFraisDossierBancaire(+e.target.value)}/></div>
                    <div className="form-group"><label>Frais administratifs (€)</label><input type="number" value={fraisAdministratifs} onChange={e=>setFraisAdministratifs(+e.target.value)}/><span className="form-hint">Frais divers année 1</span></div>
                  </div>
                  <div className="mt-3 p-2 bg-orange-100 rounded-lg flex justify-between items-center">
                    <span className="text-orange-700">Total charges exceptionnelles</span>
                    <span className="font-bold text-orange-800 text-lg">{fmtEur(chargesExceptionnellesAn1)}</span>
                  </div>
                </div>
                
                {/* RÉCAPITULATIF */}
                <div className="info-box mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div><span className="text-gray-500">Frais gestion</span><div className="font-bold">{fmtEur(Math.round(fraisGestionAnnuel))}/an</div></div>
                  <div><span className="text-gray-500">Charges AN 1</span><div className="font-bold text-orange-600">{fmtEur(Math.round(chargesCourantesAnnuelles + chargesExceptionnellesAn1))}</div></div>
                  <div><span className="text-gray-500">Charges AN 2+</span><div className="font-bold text-green-600">{fmtEur(Math.round(chargesCourantesAnnuelles))}</div></div>
                </div>
              </div>}

              {step === 6 && (
                <div className="animate-fadeIn">
                  <h2 className="text-lg font-bold mb-4">🏛️ Fiscalité BIC</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="form-group">
                      <label>Régime fiscal</label>
                      <select value={regimeFiscal} onChange={e=>setRegimeFiscal(e.target.value)}>
                        <option value="MICRO_BIC" disabled={!eligibleMicro}>Micro-BIC ({abattMicro}%){!eligibleMicro?' ❌':''}</option>
                        <option value="REEL">Réel simplifié</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Déficit BIC antérieur (€)</label>
                      <input type="number" value={deficitAnterieur} onChange={e=>setDeficitAnterieur(+e.target.value)}/>
                      <span className="form-hint">Report 10 ans</span>
                    </div>
                    <div className="form-group">
                      <label>Amort. différé antérieur (€)</label>
                      <input type="number" value={amortDiffereAnt} onChange={e=>setAmortDiffereAnt(+e.target.value)}/>
                      <span className="form-hint">Sans limite</span>
                    </div>
                  </div>
                  <div className="alert-info mt-4">
                    <p className="text-sm">
                      Vous restez en LMNP tant que vos recettes meublées <strong>≤ 23 000 €</strong> et <strong>≤ vos autres revenus d'activité (salaires)</strong>.
                      Au-delà, contactez-nous pour une analyse dédiée.
                    </p>
                    <ul className="mt-2 text-xs text-blue-700 space-y-1">
                      <li>Recettes annuelles : {fmtEur(Math.round(loyerAnnuel))}</li>
                      <li>Revenus d'activité déclarés : {fmtEur(revenusSalaires)}</li>
                    </ul>
                  </div>
                  <div className="pedagogy-box mt-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Comparaison An 1</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="font-medium">Micro-BIC</div>
                        <div>Base : {fmtEur(Math.round(loyerAnnuel * (100 - abattMicro) / 100))}</div>
                        <div className="text-orange-600">IR+PS calculés selon profil</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <div className="font-medium">Réel</div>
                        <div>Amort : {fmtEur(getDisplayAmortissement(prixAchat, travaux, mobilier, partTerrain).amortissementAnnuelTotal)}</div>
                        <div className="text-blue-600 font-medium">Souvent 0€ d'impôt !</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 7 && <div className="animate-fadeIn"><h2 className="text-lg font-bold mb-4">📈 Projection & Revente</h2><div className="grid grid-cols-3 gap-4"><div className="form-group"><label>Durée (ans)</label><input type="number" value={dureeDetention} onChange={e=>setDureeDetention(+e.target.value)} min={1} max={40}/></div><div className="form-group"><label>Revalo bien (%)</label><input type="number" value={revalorisationBien} onChange={e=>setRevalorisationBien(+e.target.value)} step={0.1}/></div><div className="form-group"><label>Frais revente (%)</label><input type="number" value={fraisRevente} onChange={e=>setFraisRevente(+e.target.value)} step={0.5}/></div></div><div className="alert-warning mt-4"><h4 className="font-semibold mb-2">⚠️ NOUVEAUTÉ LF 2024 - PLUS-VALUE LMNP</h4><p className="text-sm">Depuis le <strong>1er février 2025</strong>, les amortissements pratiqués en LMNP sont <strong>RÉINTÉGRÉS</strong> dans le calcul de la plus-value à la revente.</p><p className="text-sm mt-2">Concrètement : votre plus-value imposable sera majorée du montant total des amortissements déduits pendant la location.</p><div className="mt-3 p-3 bg-white/50 rounded-lg text-sm"><div className="grid grid-cols-2 gap-2"><div><span className="text-gray-600">Abattement IR ({dureeDetention} ans) :</span></div><div className="font-bold">{getDisplayAbattementPVIR(dureeDetention)}% {getDisplayAbattementPVIR(dureeDetention) >= 100 ? '✅ Exonéré' : ''}</div><div><span className="text-gray-600">Abattement PS ({dureeDetention} ans) :</span></div><div className="font-bold">{getDisplayAbattementPVPS(dureeDetention).toFixed(1)}% {getDisplayAbattementPVPS(dureeDetention) >= 100 ? '✅ Exonéré' : ''}</div></div></div></div><div className="pedagogy-box mt-4"><h4 className="font-semibold text-blue-800 mb-2">📚 Références juridiques</h4><ul className="text-xs text-blue-700 space-y-1"><li>• CGI art. 150 VB modifié (prix d'acquisition)</li><li>• CGI art. 150 VC (abattements durée détention)</li><li>• LF 2024 art. 30 (réintégration amortissements)</li></ul></div></div>}

              <div className="flex justify-between mt-8">
                <button onClick={()=>setStep(Math.max(1,step-1))} disabled={step===1} className="btn-secondary disabled:opacity-50">← Précédent</button>
                {step < 7 ? <button onClick={()=>setStep(step+1)} className="btn-primary">Suivant →</button> : <button onClick={lancerSimulation} disabled={loading} className="btn-primary">{loading?'⏳':'🧮 Analyser'}</button>}
              </div>
            </div>
          ) : synthese && (
            <div className="space-y-6 animate-fadeIn">
              {alertes.map((a,i)=><div key={i} className={`alert-${a.type}`}>{a.message}</div>)}
              {conseils.length>0 && <div className="alert-info">{conseils.map((c,i)=><p key={i}>{c}</p>)}</div>}
              
              {/* IMPACT FISCAL GLOBAL */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Impact fiscal sur votre situation personnelle</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-xs mb-1">IR actuel (hors LMNP)</div>
                    <div className="font-bold text-lg text-slate-800">{fmtEur(synthese.profilClient?.irAvant || 0)}</div>
                    <div className="text-xs text-slate-400">Sur {fmtEur(synthese.profilClient?.revenuTotalAvant || 0)}/an</div>
                    <div className="text-xs text-slate-400">TMI : {synthese.profilClient?.tmiAvant || 0}%</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-xs mb-1">IR + PS supplémentaires</div>
                    <div className="font-bold text-lg text-amber-600">{fmtEur(Math.round((synthese.totIR + synthese.totPS) / dureeDetention))}/an</div>
                    <div className="text-xs text-slate-400">Total : {fmtEur(synthese.totIR + synthese.totPS)} sur {dureeDetention} ans</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-xs mb-1">IFI avant investissement</div>
                    <div className={`font-bold text-lg ${synthese.profilClient?.assujettiIFIAvant ? 'text-amber-600' : 'text-emerald-600'}`}>{synthese.profilClient?.assujettiIFIAvant ? fmtEur(synthese.profilClient.ifiAvant) : 'Non assujetti'}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-xs mb-1">IFI après investissement</div>
                    <div className={`font-bold text-lg ${synthese.profilClient?.assujettiIFIApres ? 'text-amber-600' : 'text-emerald-600'}`}>{synthese.profilClient?.assujettiIFIApres ? fmtEur(synthese.profilClient.ifiApres) : 'Non assujetti'}</div>
                    {synthese.profilClient?.impactIFI > 0 && <div className="text-xs text-red-500">+{fmtEur(synthese.profilClient.impactIFI)}/an</div>}
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">📊 Comprendre votre fiscalité LMNP</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• <strong>IR actuel</strong> : {synthese.profilClient?.irAvant > 0 ? `Vous payez déjà ${fmtEur(synthese.profilClient.irAvant)} d'IR sur vos revenus existants de ${fmtEur(synthese.profilClient.revenuTotalAvant)}.` : `Vous n'avez pas d'IR à payer car vos revenus déclarés (${fmtEur(synthese.profilClient?.revenuTotalAvant || 0)}) sont sous le seuil d'imposition.`}</p>
                    {synthese.profilClient?.plafonnementQF > 0 && (
                      <p>• <strong>Plafonnement QF</strong> : Le quotient familial est plafonné, +{fmtEur(synthese.profilClient.plafonnementQF)} d'IR (limite 1 759 €/demi-part en 2025).</p>
                    )}
                    <p>• <strong>IR LMNP</strong> : {synthese.totIR > 0 ? `L'activité LMNP génère ${fmtEur(Math.round(synthese.totIR / dureeDetention))}/an d'IR supplémentaire sur le bénéfice BIC.` : `L'amortissement comptable neutralise l'IR sur le bénéfice LMNP (résultat BIC = 0).`}</p>
                    <p>• <strong>PS 17.2%</strong> : {synthese.totPS > 0 ? `Prélèvements sociaux de ${fmtEur(Math.round(synthese.totPS / dureeDetention))}/an sur le bénéfice imposable.` : `Pas de PS car le résultat fiscal est nul grâce à l'amortissement.`}</p>
                    <p>• <strong>Parts fiscales</strong> : {synthese.profilClient?.nombreParts || 0} parts utilisées pour le calcul du quotient familial.</p>
                    {regimeFiscal === 'MICRO_BIC' && (
                      <p>• <strong>Micro-BIC 2025</strong> : Plafond {fmtEur(synthese.fiscalite?.plafondMicroBIC || 15000)}, abattement {synthese.fiscalite?.abattementMicroBIC || 30}% ({typeMeuble === 'CLASSIQUE' ? 'meublé classique' : typeMeuble === 'TOURISME_CLASSE' ? 'tourisme classé' : 'chambres d\'hôtes'}).</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* INDICATEURS CLÉS AVEC EXPLICATIONS */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Indicateurs clés de performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-xs text-slate-500 mb-1">Rendement brut</div>
                    <div className="text-xl font-bold text-slate-800">{fmtPct(synthese.rendBrut)}</div>
                    <div className="text-xs text-slate-400 mt-1">{synthese.rendBrut > 6 ? 'Excellent' : synthese.rendBrut > 4 ? 'Correct' : 'Faible'}</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <div className="text-xs text-blue-600 mb-1">TRI</div>
                    <div className="text-xl font-bold text-blue-700">{fmtPct(synthese.tri)}</div>
                    <div className="text-xs text-slate-400 mt-1">{synthese.tri > 8 ? 'Très bon' : synthese.tri > 5 ? 'Satisfaisant' : 'À surveiller'}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-xs text-slate-500 mb-1">Cash-flow/mois</div>
                    <div className={`text-xl font-bold ${synthese.cfMoyMois >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{synthese.cfMoyMois >= 0 ? '+' : ''}{fmtEur(synthese.cfMoyMois)}</div>
                    <div className="text-xs text-slate-400 mt-1">{synthese.cfMoyMois > 100 ? 'Autofinancé' : synthese.cfMoyMois >= 0 ? 'Équilibré' : 'Effort mensuel'}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-xs text-slate-500 mb-1">IR total payé</div>
                    <div className="text-xl font-bold text-amber-600">{fmtEur(synthese.totIR)}</div>
                    <div className="text-xs text-slate-400 mt-1">{synthese.totIR === 0 ? 'Optimisé' : `${fmtEur(Math.round(synthese.totIR / dureeDetention))}/an`}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-xs text-slate-500 mb-1">Amort. utilisé</div>
                    <div className="text-xl font-bold text-slate-700">{fmtEur(synthese.totAmort)}</div>
                    <div className="text-xs text-slate-400 mt-1">Défiscalisation</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <div className="text-xs text-blue-600 mb-1">Gain total</div>
                    <div className="text-xl font-bold text-blue-700">{fmtEur(synthese.gainTotal)}</div>
                    <div className="text-xs text-slate-400 mt-1">Sur {dureeDetention} ans</div>
                  </div>
                </div>
                
                {/* ANALYSE PÉDAGOGIQUE */}
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold text-slate-700 mb-2">Analyse de l'opération</h4>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>• <strong>Rendement brut {fmtPct(synthese.rendBrut)}</strong> : {synthese.rendBrut > 6 ? 'Performance supérieure à la moyenne du marché (5-6%).' : synthese.rendBrut > 4 ? 'Rendement dans la moyenne du marché.' : 'Rendement faible, vérifiez le prix d\'achat ou le loyer.'}</p>
                    <p>• <strong>TRI {fmtPct(synthese.tri)}</strong> : Intègre tous les flux (loyers, charges, impôts, plus-value). {synthese.tri > 8 ? 'Excellente performance globale.' : synthese.tri > 5 ? 'Rentabilité satisfaisante.' : 'Rentabilité à optimiser.'}</p>
                    <p>• <strong>Cash-flow {synthese.cfMoyMois >= 0 ? 'positif' : 'négatif'}</strong> : {synthese.cfMoyMois > 0 ? `L'opération génère ${fmtEur(synthese.cfMoyMois)}/mois de revenus nets.` : `Effort d'épargne de ${fmtEur(Math.abs(synthese.cfMoyMois))}/mois à prévoir.`}</p>
                    <p>• <strong>Amortissement</strong> : {synthese.totAmort > 0 ? `${fmtEur(synthese.totAmort)} déduits fiscalement, permettant ${synthese.totIR === 0 ? 'une imposition nulle' : `de réduire l'IR de ${fmtEur(Math.round(synthese.totAmort * 0.3))}`}.` : 'Aucun amortissement utilisé.'}</p>
                  </div>
                </div>
              </div>
              
              {/* TIMELINE DES ÉVÉNEMENTS */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Jalons clés de l'investissement</h3>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                  <div className="space-y-4 pl-10">
                    <div className="relative"><div className="absolute -left-6 w-4 h-4 bg-blue-600 rounded-full border-2 border-white"></div><div className="bg-slate-50 border border-slate-200 p-3 rounded-lg"><div className="font-semibold text-slate-800">{dateAcquisition.split('-').reverse().join('/')}</div><div className="text-sm text-slate-600">Acquisition du bien • Investissement {fmtEur(investTotal)}</div></div></div>
                    <div className="relative"><div className="absolute -left-6 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div><div className="bg-slate-50 border border-slate-200 p-3 rounded-lg"><div className="font-semibold text-slate-800">{anneeFinCredit}</div><div className="text-sm text-slate-600">Fin du crédit • {dureeCredit} ans • Cash-flow libéré</div></div></div>
                    <div className="relative"><div className="absolute -left-6 w-4 h-4 bg-blue-400 rounded-full border-2 border-white"></div><div className="bg-slate-50 border border-slate-200 p-3 rounded-lg"><div className="font-semibold text-slate-800">{anneeExonerationIR}</div><div className="text-sm text-slate-600">Exonération IR sur plus-value • 22 ans de détention</div></div></div>
                    <div className="relative"><div className="absolute -left-6 w-4 h-4 bg-blue-300 rounded-full border-2 border-white"></div><div className="bg-slate-50 border border-slate-200 p-3 rounded-lg"><div className="font-semibold text-slate-800">{anneeExonerationPS}</div><div className="text-sm text-slate-600">Exonération totale PV (IR+PS) • 30 ans de détention</div></div></div>
                    <div className="relative"><div className="absolute -left-6 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div><div className="bg-blue-50 border border-blue-200 p-3 rounded-lg"><div className="font-semibold text-blue-800">{anneeAcq + dureeDetention}</div><div className="text-sm text-blue-600">Revente simulée • Capital net {fmtEur(synthese.capFinal)}</div></div></div>
                  </div>
                </div>
              </div>
              
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              {/* GRAPHIQUE 1 : CASH-FLOW ANNUEL */}
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              <div className="sim-card">
                <h3 className="font-bold mb-2 text-slate-800">Évolution du cash-flow après impôts</h3>
                <p className="text-sm text-slate-500 mb-4">Ce graphique illustre votre trésorerie nette année par année, après déduction de toutes les charges et impôts.</p>
                <div ref={chartRef1} className="mb-4"/>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 mb-2">Analyse du cash-flow</h4>
                  <div className="text-sm text-slate-600 space-y-2">
                    {synthese.cfMoyMois >= 0 ? (
                      <>
                        <p>L'opération génère un <strong className="text-emerald-600">cash-flow positif moyen de {fmtEur(synthese.cfMoyMois)}/mois</strong>. Cela signifie que les loyers perçus couvrent l'ensemble des charges (crédit, fiscalité, gestion) et dégagent un excédent.</p>
                        <p>Ce surplus peut être réinvesti ou constituer un complément de revenus. {synthese.cfMoyMois > 200 ? "L'autofinancement est excellent, vous pourriez envisager un second investissement." : "L'équilibre est satisfaisant."}</p>
                      </>
                    ) : (
                      <>
                        <p>L'opération présente un <strong className="text-red-600">effort d'épargne de {fmtEur(Math.abs(synthese.cfMoyMois))}/mois</strong>. Cet effort est nécessaire pour compenser l'écart entre les loyers et les charges totales.</p>
                        <p>Cet effort est {Math.abs(synthese.cfMoyMois) < 150 ? "modéré et reste acceptable pour un investissement patrimonial" : "significatif, assurez-vous de votre capacité d'épargne mensuelle"}. À noter : cet effort diminuera après le remboursement du crédit ({anneeFinCredit}).</p>
                      </>
                    )}
                    <p className="text-slate-500 text-xs mt-2"><em>Scénario optimal : une revente en {anneeAcq + Math.max(dureeCredit, 22) - 1} (après {Math.max(dureeCredit, 22)} ans) maximiserait le capital net (crédit remboursé + abattement PV significatif).</em></p>
                  </div>
                </div>
              </div>
              
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              {/* GRAPHIQUE 2 : ÉVOLUTION DU CAPITAL */}
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              <div className="sim-card">
                <h3 className="font-bold mb-2 text-slate-800">Constitution du patrimoine net</h3>
                <p className="text-sm text-slate-500 mb-4">Ce graphique montre l'évolution de votre capital net (valeur du bien - capital restant dû) au fil des années.</p>
                <div ref={chartRef2} className="mb-4"/>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 mb-2">Analyse patrimoniale</h4>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>Votre patrimoine net atteindra <strong className="text-blue-600">{fmtEur(synthese.capFinal)}</strong> en {anneeAcq + dureeDetention - 1} (soit {dureeDetention} ans), contre un apport initial de {fmtEur(apport)}. Cela représente une multiplication par <strong>{(synthese.capFinal / apport).toFixed(1)}x</strong> de votre mise de départ.</p>
                    <p>La croissance du capital s'accélère avec le temps grâce à deux effets combinés : le remboursement progressif du crédit (qui augmente votre part de propriété) et la revalorisation du bien ({fmtPct(revalorisationBien)}/an estimée).</p>
                    <p className="text-slate-500 text-xs mt-2"><em>Point d'inflexion : à partir de {anneeFinCredit}, le crédit étant soldé, votre patrimoine net correspondra à la valeur totale du bien.</em></p>
                  </div>
                </div>
              </div>
              
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              {/* PLUS-VALUE À LA REVENTE */}
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              <div className="sim-card">
                <h3 className="font-bold mb-2 text-slate-800">Simulation de revente en {anneeAcq + dureeDetention - 1} ({dureeDetention} ans de détention)</h3>
                <p className="text-sm text-slate-500 mb-4">Calcul de la plus-value immobilière LMNP intégrant la <strong>réforme LF 2024</strong> (réintégration des amortissements).</p>
                
                {/* Indicateurs clés */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mb-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg"><div className="text-slate-500 text-xs">Valeur estimée</div><div className="font-bold text-slate-800">{fmtEur(synthese.valRev)}</div></div>
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg"><div className="text-amber-600 text-xs font-medium">⚠️ Amort. réintégrés</div><div className="font-bold text-amber-700">{fmtEur(synthese.amortReintegres || 0)}</div></div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg"><div className="text-slate-500 text-xs">PV brute</div><div className="font-bold text-emerald-600">+{fmtEur(synthese.pvBrute)}</div></div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><div className="text-red-500 text-xs">Impôt PV total</div><div className="font-bold text-red-600">{fmtEur(synthese.pvCalc.impotTotal)}</div></div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg"><div className="text-blue-600 text-xs">Capital net final</div><div className="font-bold text-blue-700">{fmtEur(synthese.capFinal)}</div></div>
                </div>
                
                {/* RÉSUMÉ DU CALCUL DE LA PLUS-VALUE */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-slate-500 text-xs">Prix cession</div>
                      <div className="font-semibold">{fmtEur(synthese.valRev)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs">Prix acquis. rectifié</div>
                      <div className="font-semibold">{fmtEur(synthese.pvCalc?.prixAcquisitionRectifie || 0)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs">PV brute</div>
                      <div className="font-semibold text-emerald-600">+{fmtEur(synthese.pvBrute)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs">Abattements IR/PS</div>
                      <div className="font-semibold text-blue-600">{synthese.pvCalc?.abattementIR || 0}% / {synthese.pvCalc?.abattementPS || 0}%</div>
                    </div>
                  </div>
                  
                  {/* Bouton toggle pour afficher le détail */}
                  <button
                    onClick={() => setShowDetailPV(!showDetailPV)}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {showDetailPV ? '▼ Masquer le détail du calcul' : '▶ Afficher le détail du calcul (CGI art. 150 VB)'}
                  </button>
                  
                  {/* Détail du calcul (masqué par défaut) */}
                  {showDetailPV && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                      {/* Prix d'acquisition majoré */}
                      <div className="bg-white rounded-lg p-3 border border-slate-200 text-sm space-y-2">
                        <div className="font-semibold text-slate-700 mb-2">Prix d'acquisition majoré</div>
                        <div className="flex justify-between"><span>Prix d'achat</span><span>{fmtEur(synthese.pvCalc?.prixAchat || prixAchat)}</span></div>
                        <div className="flex justify-between">
                          <span>+ Frais acquisition {synthese.pvCalc?.utiliseForfaitAcquisition ? <span className="text-blue-600 text-xs">(forfait 7.5%)</span> : <span className="text-emerald-600 text-xs">(réel)</span>}</span>
                          <span>+{fmtEur(synthese.pvCalc?.majorationAcquisition || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>+ Travaux {synthese.pvCalc?.utiliseForfaitTravaux ? <span className="text-blue-600 text-xs">(forfait 15%)</span> : <span className="text-emerald-600 text-xs">(réel)</span>}</span>
                          <span>+{fmtEur(synthese.pvCalc?.majorationTravaux || 0)}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t pt-2"><span>= Prix acquisition majoré</span><span>{fmtEur(synthese.pvCalc?.prixAcquisitionMajore || 0)}</span></div>
                      </div>
                      
                      {/* Réintégration amortissements */}
                      <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 text-sm space-y-2">
                        <div className="font-semibold text-amber-800 mb-2">Réintégration amortissements (LF 2024)</div>
                        <div className="flex justify-between"><span>Prix acquisition majoré</span><span>{fmtEur(synthese.pvCalc?.prixAcquisitionMajore || 0)}</span></div>
                        <div className="flex justify-between text-amber-700"><span>− Amortissements réintégrés</span><span>−{fmtEur(synthese.amortReintegres || 0)}</span></div>
                        <div className="flex justify-between font-semibold border-t border-amber-200 pt-2"><span>= Prix acquisition rectifié</span><span>{fmtEur(synthese.pvCalc?.prixAcquisitionRectifie || 0)}</span></div>
                      </div>
                      
                      {/* Calcul impôt PV */}
                      <div className="bg-white rounded-lg p-3 border border-slate-200 text-sm space-y-2">
                        <div className="font-semibold text-slate-700 mb-2">Calcul de l'impôt sur PV</div>
                        <div className="flex justify-between"><span>PV brute</span><span className="text-emerald-600">+{fmtEur(synthese.pvBrute)}</span></div>
                        <div className="flex justify-between"><span>Abattement IR ({dureeDetention} ans)</span><span>{synthese.pvCalc?.abattementIR || 0}%</span></div>
                        <div className="flex justify-between"><span>Abattement PS ({dureeDetention} ans)</span><span>{synthese.pvCalc?.abattementPS || 0}%</span></div>
                        <div className="flex justify-between"><span>→ IR (19%)</span><span className="text-red-600">{fmtEur(synthese.pvCalc?.impotIR || 0)}</span></div>
                        <div className="flex justify-between"><span>→ PS (17.2%)</span><span className="text-red-600">{fmtEur(synthese.pvCalc?.impotPS || 0)}</span></div>
                        <div className="flex justify-between font-bold border-t pt-2"><span>= Impôt total PV</span><span className="text-red-600">{fmtEur(synthese.pvCalc?.impotTotal || 0)}</span></div>
                      </div>
                      
                      {/* Capital net */}
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 text-sm space-y-2">
                        <div className="font-semibold text-blue-800 mb-2">Capital net après revente</div>
                        <div className="flex justify-between"><span>Prix de vente</span><span>{fmtEur(synthese.valRev)}</span></div>
                        <div className="flex justify-between"><span>− Impôt PV</span><span>−{fmtEur(synthese.pvCalc?.impotTotal || 0)}</span></div>
                        <div className="flex justify-between"><span>− Frais vente ({fraisRevente}%)</span><span>−{fmtEur(Math.round(synthese.valRev * fraisRevente / 100))}</span></div>
                        <div className="flex justify-between font-bold border-t border-blue-200 pt-2"><span>= Capital net final</span><span className="text-blue-700">{fmtEur(synthese.capFinal)}</span></div>
                      </div>
                      
                      {/* Comparaison avec/sans réforme */}
                      {synthese.amortReintegres > 0 && (
                        <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg">
                          💡 <strong>Impact réforme LF 2024</strong> : Sans réintégration des amortissements, la PV brute aurait été de {fmtEur(synthese.pvCalc?.plusValueBruteSansReforme || 0)} au lieu de {fmtEur(synthese.pvBrute)} (surcoût fiscal estimé : ~{fmtEur(Math.round((synthese.pvBrute - (synthese.pvCalc?.plusValueBruteSansReforme || 0)) * 0.36))})
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Alerte réforme LF 2024 */}
                <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4">
                  <h4 className="font-bold text-amber-800 mb-2">⚠️ Impact de la réforme LF 2024 (art. 30)</h4>
                  <p className="text-sm text-amber-700 mb-2">
                    Depuis le <strong>1er février 2025</strong>, les amortissements comptables pratiqués en LMNP sont <strong>réintégrés</strong> au prix d'acquisition pour le calcul de la plus-value.
                  </p>
                  <div className="bg-white/50 rounded-lg p-3 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-amber-600 font-medium mb-1">Avant réforme</div>
                        <div className="text-slate-700">Prix d'acquisition = {fmtEur(prixAchat + fraisNotaire + travaux)}</div>
                        <div className="text-slate-700">PV brute = {fmtEur(synthese.valRev - (prixAchat + fraisNotaire + travaux))}</div>
                      </div>
                      <div>
                        <div className="text-amber-600 font-medium mb-1">Après réforme (applicable)</div>
                        <div className="text-slate-700">Prix corrigé = {fmtEur((prixAchat + fraisNotaire + travaux) - (synthese.amortReintegres || 0))}</div>
                        <div className="text-slate-700 font-bold">PV brute = {fmtEur(synthese.pvBrute)}</div>
                      </div>
                    </div>
                    {synthese.amortReintegres > 0 && (
                      <div className="mt-3 pt-3 border-t border-amber-200 text-amber-800">
                        <strong>Surcoût fiscal estimé :</strong> ~{fmtEur(Math.round((synthese.amortReintegres || 0) * 0.362))} (IR 19% + PS 17.2% avant abattements)
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              {/* TABLEAU DES PROJECTIONS */}
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              <div className="sim-card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800">Projection sur {dureeDetention} ans ({anneeAcq} → {anneeAcq + dureeDetention - 1})</h3>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={showDetailedTable} onChange={(e) => setShowDetailedTable(e.target.checked)} className="rounded" />
                    <span className="text-slate-600">Afficher le détail</span>
                  </label>
                </div>
                
                {/* Explication pédagogique (collapsible) */}
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm text-blue-600 font-medium">ℹ️ Comprendre l'amortissement LMNP</summary>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2 text-xs text-blue-700">
                    <p><strong>Amort. utilisé</strong> = portion imputée pour ramener le résultat fiscal à 0 (ne crée pas de déficit).</p>
                    <p><strong>Amort. différé</strong> = stock reportable indéfiniment si charges {">"} loyers.</p>
                  </div>
                </details>
                
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0">
                      <tr className="border-b border-slate-200 bg-slate-100">
                        <th className="py-2 px-1 text-left font-semibold text-slate-600">Année</th>
                        <th className="py-2 px-1 text-right font-semibold text-slate-600">Loyer</th>
                        {showDetailedTable && <th className="py-2 px-1 text-right font-semibold text-slate-600 bg-slate-50">Charges</th>}
                        {showDetailedTable && <th className="py-2 px-1 text-right font-semibold text-slate-600 bg-slate-50">Intérêts</th>}
                        {showDetailedTable && <th className="py-2 px-1 text-right font-semibold text-slate-600 bg-slate-50">Ass. crédit</th>}
                        {showDetailedTable && <th className="py-2 px-1 text-right font-semibold text-slate-600 bg-amber-50">Rés. av. amort.</th>}
                        <th className="py-2 px-1 text-right font-semibold text-slate-600 bg-blue-50" title="Dotation annuelle fixe">Amort.</th>
                        {showDetailedTable && <th className="py-2 px-1 text-right font-semibold text-slate-600 bg-emerald-50" title="Portion effectivement imputée">Utilisé</th>}
                        {showDetailedTable && <th className="py-2 px-1 text-right font-semibold text-slate-600 bg-amber-50" title="Stock reporté">Différé</th>}
                        <th className="py-2 px-1 text-right font-semibold text-slate-600">Résultat</th>
                        <th className="py-2 px-1 text-right font-semibold text-slate-600">IR+PS</th>
                        <th className="py-2 px-1 text-right font-semibold text-slate-600">Cash-flow</th>
                        <th className="py-2 px-1 text-right font-semibold text-slate-600">Capital</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projections.map(p => (
                        <tr key={p.annee} className={`border-b border-slate-100 ${p.cfApres >= 0 ? 'bg-emerald-50/30' : ''} hover:bg-slate-50`}>
                          <td className="py-1.5 px-1 font-medium text-slate-800">{p.annee}</td>
                          <td className="py-1.5 px-1 text-right text-slate-700">{fmtEur(p.loyerNet)}</td>
                          {showDetailedTable && <td className="py-1.5 px-1 text-right text-slate-500 bg-slate-50/50">{fmtEur(p.charges)}</td>}
                          {showDetailedTable && <td className="py-1.5 px-1 text-right text-slate-500 bg-slate-50/50">{fmtEur(p.interets)}</td>}
                          {showDetailedTable && <td className="py-1.5 px-1 text-right text-slate-500 bg-slate-50/50">{fmtEur(p.assEmp)}</td>}
                          {showDetailedTable && <td className={`py-1.5 px-1 text-right bg-amber-50/50 ${p.resAvantAmort >= 0 ? 'text-slate-700' : 'text-red-500'}`}>{fmtEur(p.resAvantAmort)}</td>}
                          <td className="py-1.5 px-1 text-right text-blue-600 font-medium bg-blue-50/50">{fmtEur(p.amortAnnuel)}</td>
                          {showDetailedTable && <td className="py-1.5 px-1 text-right text-emerald-600 bg-emerald-50/50">{fmtEur(p.amortUtil)}</td>}
                          {showDetailedTable && <td className="py-1.5 px-1 text-right text-amber-600 bg-amber-50/50">{fmtEur(p.amortDiffere)}</td>}
                          <td className="py-1.5 px-1 text-right text-slate-700">{fmtEur(p.resultat)}</td>
                          <td className="py-1.5 px-1 text-right text-amber-600">{fmtEur(p.impotIR + p.ps)}</td>
                          <td className={`py-1.5 px-1 text-right font-semibold ${p.cfApres >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{p.cfApres >= 0 ? '+' : ''}{fmtEur(p.cfApres)}</td>
                          <td className="py-1.5 px-1 text-right text-blue-600 font-medium">{fmtEur(p.capNet)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Résumé amortissement (compact) */}
                {projections.length > 0 && regimeFiscal === 'REEL' && (
                  <div className="mt-3 flex gap-3 text-xs">
                    <div className="flex-1 p-2 bg-blue-50 border border-blue-200 rounded text-center">
                      <span className="text-blue-600">Amort./an : </span>
                      <span className="font-bold text-blue-700">{fmtEur(projections[0]?.amortAnnuel || synthese.amortAnnuel || 0)}</span>
                    </div>
                    <div className="flex-1 p-2 bg-emerald-50 border border-emerald-200 rounded text-center">
                      <span className="text-emerald-600">Utilisé : </span>
                      <span className="font-bold text-emerald-700">{fmtEur(synthese.totAmort || 0)}</span>
                    </div>
                    <div className="flex-1 p-2 bg-amber-50 border border-amber-200 rounded text-center">
                      <span className="text-amber-600">Différé : </span>
                      <span className="font-bold text-amber-700">{fmtEur(projections[projections.length - 1]?.amortDiffere || synthese.amortDiffRest || 0)}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              {/* AVIS PROFESSIONNEL FINAL */}
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              <div className="sim-card">
                <h3 className="font-bold mb-6 text-xl text-slate-800">🎯 Synthèse et avis professionnel</h3>
                
                {/* Score global - Système de notation équilibré (base 0) */}
                {(() => {
                  // Calcul du score sur 10 - BASE 0
                  // Critères pondérés selon leur importance pour un investissement LMNP
                  
                  const levier = synthese.capFinal / apport
                  
                  // === CALCUL DES POINTS PAR CRITÈRE ===
                  
                  // 1. TRI (max 3 points) - Critère principal de rentabilité globale
                  let ptsTRI = 0
                  if (synthese.tri >= 10) ptsTRI = 3
                  else if (synthese.tri >= 8) ptsTRI = 2.5
                  else if (synthese.tri >= 6) ptsTRI = 2
                  else if (synthese.tri >= 5) ptsTRI = 1.5
                  else if (synthese.tri >= 4) ptsTRI = 1
                  else if (synthese.tri >= 3) ptsTRI = 0.5
                  
                  // 2. Cash-flow (max 2.5 points) - Capacité d'autofinancement
                  let ptsCF = 0
                  if (synthese.cfMoyMois >= 200) ptsCF = 2.5
                  else if (synthese.cfMoyMois >= 100) ptsCF = 2
                  else if (synthese.cfMoyMois >= 0) ptsCF = 1.5
                  else if (synthese.cfMoyMois >= -150) ptsCF = 1
                  else if (synthese.cfMoyMois >= -300) ptsCF = 0.5
                  
                  // 3. Fiscalité (max 1.5 points) - Optimisation fiscale
                  let ptsFisc = 0
                  if (synthese.totIR === 0) ptsFisc = 1.5
                  else if (synthese.totIR < 2000) ptsFisc = 1
                  else if (synthese.totIR < 5000) ptsFisc = 0.5
                  
                  // 4. Effet de levier (max 1.5 points) - Multiplication du capital
                  let ptsLevier = 0
                  if (levier >= 8) ptsLevier = 1.5
                  else if (levier >= 5) ptsLevier = 1
                  else if (levier >= 3) ptsLevier = 0.5
                  
                  // 5. Rendement brut (max 1.5 points) - Indicateur de marché
                  let ptsRend = 0
                  if (synthese.rendBrut >= 7) ptsRend = 1.5
                  else if (synthese.rendBrut >= 5) ptsRend = 1
                  else if (synthese.rendBrut >= 4) ptsRend = 0.5
                  
                  // 6. Pénalités (malus)
                  let penalites = 0
                  if (dpe === 'G') penalites = -1
                  else if (dpe === 'F') penalites = -0.5
                  
                  // Score total
                  const scoreTotal = ptsTRI + ptsCF + ptsFisc + ptsLevier + ptsRend + penalites
                  const score = Math.min(10, Math.max(0, Math.round(scoreTotal * 10) / 10))
                  
                  const getScoreColor = (s: number) => s >= 7 ? 'text-emerald-600' : s >= 5 ? 'text-blue-600' : s >= 3 ? 'text-amber-600' : 'text-red-600'
                  const getScoreBg = (s: number) => s >= 7 ? 'bg-emerald-50 border-emerald-200' : s >= 5 ? 'bg-blue-50 border-blue-200' : s >= 3 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
                  const getScoreLabel = (s: number) => s >= 8 ? 'Excellent investissement' : s >= 7 ? 'Très bon investissement' : s >= 6 ? 'Bon investissement' : s >= 5 ? 'Investissement satisfaisant' : s >= 4 ? 'Investissement correct' : s >= 3 ? 'Investissement à optimiser' : 'Investissement à reconsidérer'
                  
                  return (
                    <>
                      {/* Score principal */}
                      <div className={`rounded-xl p-6 mb-4 border-2 ${getScoreBg(score)}`}>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className={`text-5xl font-black ${getScoreColor(score)}`}>{score.toFixed(1)}</div>
                            <div className="text-slate-500 text-sm font-medium">/10</div>
                          </div>
                          <div className="flex-1">
                            <div className={`text-xl font-bold mb-3 ${getScoreColor(score)}`}>{getScoreLabel(score)}</div>
                            
                            {/* Barres de critères avec points */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">TRI</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${ptsTRI >= 2 ? 'bg-emerald-500' : ptsTRI >= 1 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{width: `${(ptsTRI / 3) * 100}%`}}></div>
                                </div>
                                <span className="w-20 text-right text-xs text-slate-500">{ptsTRI}/3 pts</span>
                                <span className={`w-14 text-right font-semibold ${ptsTRI >= 2 ? 'text-emerald-600' : ptsTRI >= 1 ? 'text-blue-600' : 'text-amber-600'}`}>{fmtPct(synthese.tri)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">Cash-flow</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${ptsCF >= 1.5 ? 'bg-emerald-500' : ptsCF >= 0.5 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{width: `${(ptsCF / 2.5) * 100}%`}}></div>
                                </div>
                                <span className="w-20 text-right text-xs text-slate-500">{ptsCF}/2.5 pts</span>
                                <span className={`w-14 text-right font-semibold ${ptsCF >= 1.5 ? 'text-emerald-600' : ptsCF >= 0.5 ? 'text-blue-600' : 'text-amber-600'}`}>{synthese.cfMoyMois >= 0 ? '+' : ''}{fmtEur(synthese.cfMoyMois)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">Fiscalité</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${ptsFisc >= 1 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${(ptsFisc / 1.5) * 100}%`}}></div>
                                </div>
                                <span className="w-20 text-right text-xs text-slate-500">{ptsFisc}/1.5 pts</span>
                                <span className={`w-14 text-right font-semibold ${ptsFisc >= 1 ? 'text-emerald-600' : 'text-blue-600'}`}>{synthese.totIR === 0 ? '0€' : fmtEur(synthese.totIR)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">Levier</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full bg-blue-500" style={{width: `${(ptsLevier / 1.5) * 100}%`}}></div>
                                </div>
                                <span className="w-20 text-right text-xs text-slate-500">{ptsLevier}/1.5 pts</span>
                                <span className="w-14 text-right font-semibold text-blue-600">×{levier.toFixed(1)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">Rendement</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${ptsRend >= 1 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${(ptsRend / 1.5) * 100}%`}}></div>
                                </div>
                                <span className="w-20 text-right text-xs text-slate-500">{ptsRend}/1.5 pts</span>
                                <span className={`w-14 text-right font-semibold ${ptsRend >= 1 ? 'text-emerald-600' : 'text-blue-600'}`}>{fmtPct(synthese.rendBrut)}</span>
                              </div>
                              {penalites < 0 && (
                                <div className="flex items-center gap-3 text-sm">
                                  <span className="w-20 text-red-600">Pénalité</span>
                                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-red-500" style={{width: '100%'}}></div>
                                  </div>
                                  <span className="w-20 text-right text-xs text-red-500">{penalites} pts</span>
                                  <span className="w-14 text-right font-semibold text-red-600">DPE {dpe}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Toggle explication du scoring */}
                      <div className="mb-6">
                        <button
                          onClick={() => setShowScoreDetail(!showScoreDetail)}
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          {showScoreDetail ? '▼ Masquer' : '▶ Comprendre'} le calcul du score
                        </button>
                        
                        {showScoreDetail && (
                          <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm">
                            <h5 className="font-bold text-slate-700 mb-3">📊 Méthode de calcul du score (base 0, max 10)</h5>
                            <p className="text-slate-600 mb-3">Le score est calculé en additionnant des points selon 5 critères clés d'un investissement LMNP :</p>
                            
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-100">
                                    <th className="text-left p-2 border border-slate-200">Critère</th>
                                    <th className="text-center p-2 border border-slate-200">Max</th>
                                    <th className="text-left p-2 border border-slate-200">Barème</th>
                                    <th className="text-center p-2 border border-slate-200">Votre valeur</th>
                                    <th className="text-center p-2 border border-slate-200">Points</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td className="p-2 border border-slate-200 font-medium">TRI</td>
                                    <td className="p-2 border border-slate-200 text-center">3 pts</td>
                                    <td className="p-2 border border-slate-200 text-slate-500">≥10%→3 | ≥8%→2.5 | ≥6%→2 | ≥5%→1.5 | ≥4%→1 | ≥3%→0.5</td>
                                    <td className="p-2 border border-slate-200 text-center font-semibold">{fmtPct(synthese.tri)}</td>
                                    <td className={`p-2 border border-slate-200 text-center font-bold ${ptsTRI >= 2 ? 'text-emerald-600' : ptsTRI >= 1 ? 'text-blue-600' : 'text-amber-600'}`}>{ptsTRI}</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 border border-slate-200 font-medium">Cash-flow</td>
                                    <td className="p-2 border border-slate-200 text-center">2.5 pts</td>
                                    <td className="p-2 border border-slate-200 text-slate-500">≥200€→2.5 | ≥100€→2 | ≥0€→1.5 | ≥-150€→1 | ≥-300€→0.5</td>
                                    <td className="p-2 border border-slate-200 text-center font-semibold">{fmtEur(synthese.cfMoyMois)}/mois</td>
                                    <td className={`p-2 border border-slate-200 text-center font-bold ${ptsCF >= 1.5 ? 'text-emerald-600' : ptsCF >= 0.5 ? 'text-blue-600' : 'text-amber-600'}`}>{ptsCF}</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 border border-slate-200 font-medium">Fiscalité IR</td>
                                    <td className="p-2 border border-slate-200 text-center">1.5 pts</td>
                                    <td className="p-2 border border-slate-200 text-slate-500">0€→1.5 | &lt;2k€→1 | &lt;5k€→0.5</td>
                                    <td className="p-2 border border-slate-200 text-center font-semibold">{fmtEur(synthese.totIR)}</td>
                                    <td className={`p-2 border border-slate-200 text-center font-bold ${ptsFisc >= 1 ? 'text-emerald-600' : 'text-blue-600'}`}>{ptsFisc}</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 border border-slate-200 font-medium">Effet de levier</td>
                                    <td className="p-2 border border-slate-200 text-center">1.5 pts</td>
                                    <td className="p-2 border border-slate-200 text-slate-500">≥8×→1.5 | ≥5×→1 | ≥3×→0.5</td>
                                    <td className="p-2 border border-slate-200 text-center font-semibold">×{levier.toFixed(1)}</td>
                                    <td className={`p-2 border border-slate-200 text-center font-bold text-blue-600`}>{ptsLevier}</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 border border-slate-200 font-medium">Rendement brut</td>
                                    <td className="p-2 border border-slate-200 text-center">1.5 pts</td>
                                    <td className="p-2 border border-slate-200 text-slate-500">≥7%→1.5 | ≥5%→1 | ≥4%→0.5</td>
                                    <td className="p-2 border border-slate-200 text-center font-semibold">{fmtPct(synthese.rendBrut)}</td>
                                    <td className={`p-2 border border-slate-200 text-center font-bold ${ptsRend >= 1 ? 'text-emerald-600' : 'text-blue-600'}`}>{ptsRend}</td>
                                  </tr>
                                  {penalites < 0 && (
                                    <tr className="bg-red-50">
                                      <td className="p-2 border border-slate-200 font-medium text-red-700">Pénalité DPE</td>
                                      <td className="p-2 border border-slate-200 text-center text-red-600">malus</td>
                                      <td className="p-2 border border-slate-200 text-slate-500">G→-1 | F→-0.5</td>
                                      <td className="p-2 border border-slate-200 text-center font-semibold text-red-600">{dpe}</td>
                                      <td className="p-2 border border-slate-200 text-center font-bold text-red-600">{penalites}</td>
                                    </tr>
                                  )}
                                  <tr className="bg-slate-100 font-bold">
                                    <td className="p-2 border border-slate-200" colSpan={3}>TOTAL</td>
                                    <td className="p-2 border border-slate-200 text-center"></td>
                                    <td className={`p-2 border border-slate-200 text-center text-lg ${getScoreColor(score)}`}>{score.toFixed(1)}/10</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            
                            <div className="mt-4 grid grid-cols-4 gap-2 text-xs text-center">
                              <div className="bg-red-100 text-red-700 rounded p-2">0-3 : À reconsidérer</div>
                              <div className="bg-amber-100 text-amber-700 rounded p-2">3-5 : À optimiser</div>
                              <div className="bg-blue-100 text-blue-700 rounded p-2">5-7 : Satisfaisant</div>
                              <div className="bg-emerald-100 text-emerald-700 rounded p-2">7-10 : Bon/Excellent</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )
                })()}
                
                {/* Points forts et vigilance */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <h4 className="font-bold text-emerald-700 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm">✓</span>
                      Points forts
                    </h4>
                    <ul className="space-y-2 text-sm">
                      {synthese.totIR === 0 && <li className="flex items-start gap-2"><span className="text-emerald-500">•</span><span className="text-slate-700">Fiscalité <strong className="text-emerald-600">optimisée</strong> grâce aux amortissements</span></li>}
                      {(synthese.capFinal / apport) > 2 && <li className="flex items-start gap-2"><span className="text-emerald-500">•</span><span className="text-slate-700">Effet de levier : <strong className="text-emerald-600">×{(synthese.capFinal / apport).toFixed(1)}</strong> sur l'apport</span></li>}
                      {synthese.rendBrut > 4 && <li className="flex items-start gap-2"><span className="text-emerald-500">•</span><span className="text-slate-700">Rendement brut : <strong className="text-emerald-600">{fmtPct(synthese.rendBrut)}</strong></span></li>}
                      {synthese.cfMoyMois >= 0 && <li className="flex items-start gap-2"><span className="text-emerald-500">•</span><span className="text-slate-700">Opération <strong className="text-emerald-600">autofinancée</strong></span></li>}
                      {synthese.tri > 4 && <li className="flex items-start gap-2"><span className="text-emerald-500">•</span><span className="text-slate-700">TRI de <strong className="text-emerald-600">{fmtPct(synthese.tri)}</strong> sur {dureeDetention} ans</span></li>}
                      {dureeDetention >= 22 && <li className="flex items-start gap-2"><span className="text-emerald-500">•</span><span className="text-slate-700"><strong className="text-emerald-600">Exonération d'IR</strong> sur la plus-value</span></li>}
                      {synthese.capFinal > 100000 && <li className="flex items-start gap-2"><span className="text-emerald-500">•</span><span className="text-slate-700">Capital final de <strong className="text-emerald-600">{fmtEur(synthese.capFinal)}</strong></span></li>}
                    </ul>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <h4 className="font-bold text-amber-700 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">!</span>
                      Points d'attention
                    </h4>
                    <ul className="space-y-2 text-sm">
                      {synthese.cfMoyMois < 0 && <li className="flex items-start gap-2"><span className="text-amber-500">•</span><span className="text-slate-700">Effort d'épargne de <strong className="text-amber-600">{fmtEur(Math.abs(synthese.cfMoyMois))}/mois</strong></span></li>}
                      {synthese.amortReintegres > 0 && <li className="flex items-start gap-2"><span className="text-amber-500">•</span><span className="text-slate-700">Réintégration des amortissements (LF 2024)</span></li>}
                      {synthese.rendBrut < 4 && <li className="flex items-start gap-2"><span className="text-amber-500">•</span><span className="text-slate-700">Rendement brut modéré ({fmtPct(synthese.rendBrut)})</span></li>}
                      {(dpe === 'F' || dpe === 'G') && <li className="flex items-start gap-2"><span className="text-amber-500">•</span><span className="text-slate-700">DPE <strong className="text-amber-600">{dpe}</strong> - travaux à prévoir</span></li>}
                      {synthese.profilClient?.impactIFI > 0 && <li className="flex items-start gap-2"><span className="text-amber-500">•</span><span className="text-slate-700">Impact IFI : {fmtEur(synthese.profilClient.impactIFI)}/an</span></li>}
                      {synthese.cfMoyMois >= 0 && synthese.rendBrut >= 4 && !(dpe === 'F' || dpe === 'G') && synthese.profilClient?.impactIFI <= 0 && (
                        <li className="flex items-start gap-2 text-slate-500 italic"><span>•</span><span>Pas de point d'attention majeur</span></li>
                      )}
                    </ul>
                  </div>
                </div>
                
                {/* Recommandation finale */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <span className="text-lg">📋</span> Recommandation personnalisée
                  </h4>
                  <div className="text-sm text-slate-700 leading-relaxed space-y-3">
                    {synthese.tri >= 6 && synthese.cfMoyMois >= 0 ? (
                      <>
                        <p>Cette opération présente un <strong className="text-emerald-600">excellent profil rendement/risque</strong>. Avec un TRI de <strong>{fmtPct(synthese.tri)}</strong> et un cash-flow positif, elle s'autofinance tout en constituant un patrimoine de <strong>{fmtEur(synthese.capFinal)}</strong>.</p>
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          <strong className="text-blue-700">👉 Stratégie recommandée :</strong> Conserver le bien au minimum <strong>{Math.max(22, dureeCredit)} ans</strong> pour bénéficier de l'exonération d'IR sur la plus-value et du remboursement complet du crédit.
                        </div>
                      </>
                    ) : synthese.tri >= 4 ? (
                      <>
                        <p>Cette opération présente un <strong className="text-blue-600">bon potentiel patrimonial</strong> avec un TRI de <strong>{fmtPct(synthese.tri)}</strong>. {synthese.cfMoyMois < 0 ? <>L'effort mensuel de <strong>{fmtEur(Math.abs(synthese.cfMoyMois))}</strong> est à prévoir mais reste gérable sur la durée.</> : <>Le cash-flow est équilibré.</>}</p>
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          <strong className="text-blue-700">👉 Stratégie recommandée :</strong> Privilégier une détention longue (22+ ans) pour optimiser la fiscalité. Capital potentiel à terme : <strong>{fmtEur(synthese.capFinal)}</strong>.
                        </div>
                      </>
                    ) : (
                      <>
                        <p>Cette opération peut être <strong className="text-amber-600">optimisée</strong>. Avec un TRI de <strong>{fmtPct(synthese.tri)}</strong>, des ajustements permettraient d'améliorer la rentabilité.</p>
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          <strong className="text-blue-700">👉 Pistes d'amélioration :</strong>
                          <ul className="mt-2 space-y-1 ml-4">
                            <li>• Renégocier le prix d'achat (-5 à -10%)</li>
                            <li>• Vérifier le potentiel locatif du bien</li>
                            <li>• Comparer avec d'autres opportunités</li>
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              {/* DÉTAIL DES CALCULS (optionnel) */}
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              <details className="sim-card">
                <summary className="cursor-pointer font-bold text-slate-700">Détail des calculs</summary>
                <pre className="text-xs bg-slate-50 p-4 rounded-lg mt-4 whitespace-pre-wrap font-mono border border-slate-200">{explications.join('\n')}</pre>
              </details>
              
              <div className="flex justify-center gap-4 mt-6">
                <button onClick={() => setShowResults(false)} className="btn-primary">Nouvelle simulation</button>
              </div>
            </div>
          )}
        </main>
      </div>
      <style jsx global>{`
        :root { --pri: #1e40af; --pril: #3b82f6; --suc: #059669; --warn: #d97706; --err: #dc2626; }
        .sim-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.05)}
        .btn-primary{background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:12px 24px;border-radius:8px;font-weight:600;border:none;cursor:pointer;transition:all .2s}
        .btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(30,64,175,.25)}
        .btn-primary{background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:10px 20px;border-radius:8px;font-weight:600;border:none;cursor:pointer}
        .btn-primary:hover{transform:translateY(-1px)}
        .btn-secondary{background:#f1f5f9;color:#475569;padding:10px 20px;border-radius:8px;font-weight:600;border:1px solid #e2e8f0;cursor:pointer}
        .badge-blue{background:#eff6ff;color:#1e40af;padding:4px 10px;border-radius:99px;font-size:12px}
        .badge-green{background:#dcfce7;color:#166534;padding:4px 10px;border-radius:99px;font-size:12px}
        .form-group{display:flex;flex-direction:column;gap:4px}
        .form-group label{font-size:13px;font-weight:500;color:#374151}
        .form-group input,.form-group select{border:2px solid #e2e8f0;border-radius:8px;padding:10px 12px;font-size:14px}
        .form-group input:focus,.form-group select:focus{border-color:#3b82f6;outline:none}.form-hint{font-size:11px;color:#9ca3af}.info-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px}.pedagogy-box{background:#eff6ff;border:1px solid #93c5fd;border-radius:12px;padding:16px}.alert-error{background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;color:#991b1b}.alert-warning{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;color:#92400e}.alert-info{background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;color:#1e40af}.animate-fadeIn{animation:fadeIn .3s ease-out}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1}}`}</style>
    </SimulatorGate>
  )
}
