/**
 * Simulateur Immobilier Locatif - API Route
 * Calcul TRI, cash-flow, fiscalité et rentabilité
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'

// Plafonds légaux 2025
const PLAFONDS = {
  MICRO_FONCIER: 15000, // Plafond annuel revenus fonciers
  MICRO_BIC: 77700, // Plafond micro-BIC meublé classique (2024)
  MICRO_BIC_TOURISME: 15000, // Plafond micro-BIC meublé tourisme non classé (2024)
  LMP_SEUIL_RECETTES: 23000, // Seuil de recettes pour LMP
  DEFICIT_FONCIER_IMPUTABLE: 10700, // Déficit foncier imputable sur revenu global par an
}

// Schéma de validation des entrées
const immobilierInputSchema = z.object({
  // Bien immobilier
  prixAchat: z.number().min(10000).max(10000000),
  fraisNotaire: z.number().min(0).max(20).default(8), // pourcentage
  travauxInitiaux: z.number().min(0).default(0),
  fraisAgence: z.number().min(0).max(15).default(0), // pourcentage du prix
  
  // Financement
  apportPersonnel: z.number().min(0),
  tauxCredit: z.number().min(0).max(10).default(3.5), // pourcentage annuel
  dureeCredit: z.number().min(5).max(30).default(20), // années
  assuranceCredit: z.number().min(0).max(1).default(0.36), // pourcentage annuel du capital
  
  // Revenus locatifs
  loyerMensuelHC: z.number().min(0),
  chargesLocataire: z.number().min(0).default(0), // charges récupérables
  tauxOccupation: z.number().min(0).max(100).default(95), // pourcentage
  revalorisationLoyer: z.number().min(-2).max(5).default(1.5), // pourcentage annuel
  
  // Charges propriétaire
  chargesNonRecuperables: z.number().min(0).default(0),
  taxeFonciere: z.number().min(0).default(0),
  assurancePNO: z.number().min(0).default(0), // propriétaire non occupant
  fraisGestion: z.number().min(0).max(20).default(0), // pourcentage des loyers si agence
  provisionTravaux: z.number().min(0).max(20).default(3), // pourcentage des loyers
  
  // Fiscalité
  regimeFiscal: z.enum(['MICRO_FONCIER', 'REEL', 'LMNP_MICRO', 'LMNP_REEL', 'LMP']).default('REEL'),
  trancheMarginalImposition: z.number().min(0).max(45).default(30),
  deficitFoncierAnterieur: z.number().min(0).default(0), // Déficit foncier reportable (10 ans max)
  
  // LMNP spécifique
  pourcentageTerrain: z.number().min(0).max(50).default(15), // % du prix = terrain (non amortissable)
  valeurMobilier: z.number().min(0).default(0), // Mobilier pour LMNP
  
  // Projection
  dureeDetention: z.number().min(1).max(40).default(20), // années
  revalorisationBien: z.number().min(-5).max(10).default(2), // pourcentage annuel
  
  // Revente
  fraisRevente: z.number().min(0).max(10).default(5), // pourcentage
})

// Types
interface ProjectionAnnuelle {
  annee: number
  
  // Revenus
  loyerBrut: number
  loyerNet: number // après vacance locative
  
  // Charges
  chargesProprietaire: number
  taxeFonciere: number
  assurance: number
  fraisGestion: number
  provisionTravaux: number
  
  // Crédit
  mensualiteCredit: number
  capitalRembourse: number
  interets: number
  assuranceCredit: number
  capitalRestantDu: number
  
  // Cash-flow
  cashFlowBrutMensuel: number
  cashFlowNetMensuel: number
  cashFlowAnnuel: number
  
  // Fiscalité
  revenuImposable: number
  impotsFonciers: number
  prelevementsSociaux: number
  
  // Cash-flow après impôts
  cashFlowApresImpots: number
  
  // Patrimoine
  valeurBien: number
  capitalConstitue: number // valeur bien - capital restant dû
}

interface ResultatSimulation {
  // Synthèse investissement
  investissementTotal: number
  apportPersonnel: number
  montantEmprunte: number
  mensualiteCredit: number
  coutTotalCredit: number
  
  // Rentabilités
  rentabiliteBrute: number
  rentabiliteNette: number
  rentabiliteNetteNette: number // après impôts
  tri: number // Taux de Rentabilité Interne
  
  // Cash-flows
  cashFlowMoyenMensuel: number
  cashFlowCumule: number
  effortEpargneMoyen: number
  
  // Projections
  projections: ProjectionAnnuelle[]
  
  // Revente
  valeurRevente: number
  plusValueBrute: number
  impotPlusValue: number
  plusValueNette: number
  capitalFinal: number
  
  // Fiscalité synthèse
  fiscalite: {
    regime: string
    totalImpotsPayes: number
    totalPrelevementsSociaux: number
    economieImpots: number // si déficit foncier
  }
  
  // Indicateurs
  indicateurs: {
    multiplicateurLoyer: number // prix / loyer annuel
    rendementCapitauxPropres: number
    cashOnCash: number
    delaiRecuperationApport: number // en années
  }
}

// Fonctions de calcul
function calculerMensualiteCredit(capital: number, tauxAnnuel: number, dureeAnnees: number): number {
  if (capital <= 0 || dureeAnnees <= 0) return 0
  const tauxMensuel = tauxAnnuel / 100 / 12
  const nbMensualites = dureeAnnees * 12
  if (tauxMensuel === 0) return capital / nbMensualites
  return capital * (tauxMensuel * Math.pow(1 + tauxMensuel, nbMensualites)) / 
    (Math.pow(1 + tauxMensuel, nbMensualites) - 1)
}

function calculerTableauAmortissement(
  capital: number, 
  tauxAnnuel: number, 
  dureeAnnees: number, 
  assuranceTaux: number
): Array<{ annee: number; capitalRembourse: number; interets: number; assurance: number; capitalRestant: number }> {
  const tableau: Array<{ annee: number; capitalRembourse: number; interets: number; assurance: number; capitalRestant: number }> = []
  const tauxMensuel = tauxAnnuel / 100 / 12
  const assuranceMensuelle = capital * (assuranceTaux / 100) / 12
  const mensualiteHorsAssurance = calculerMensualiteCredit(capital, tauxAnnuel, dureeAnnees)
  
  let capitalRestant = capital
  
  for (let annee = 1; annee <= dureeAnnees; annee++) {
    let capitalAnnee = 0
    let interetsAnnee = 0
    
    for (let mois = 1; mois <= 12; mois++) {
      if (capitalRestant <= 0) break
      const interetsMois = capitalRestant * tauxMensuel
      const capitalMois = Math.min(mensualiteHorsAssurance - interetsMois, capitalRestant)
      capitalRestant -= capitalMois
      capitalAnnee += capitalMois
      interetsAnnee += interetsMois
    }
    
    tableau.push({
      annee,
      capitalRembourse: Math.round(capitalAnnee),
      interets: Math.round(interetsAnnee),
      assurance: Math.round(assuranceMensuelle * 12),
      capitalRestant: Math.max(0, Math.round(capitalRestant)),
    })
  }
  
  return tableau
}

/**
 * Calcul de l'impôt sur plus-value immobilière
 * Barème 2025 (CGI art. 150 U à 150 VH)
 * 
 * Abattement IR :
 * - 0% les 5 premières années
 * - 6% par an de la 6e à la 21e année (16 ans = 96%)
 * - 4% la 22e année = 100% exonération
 * 
 * Abattement PS :
 * - 0% les 5 premières années
 * - 1.65% par an de la 6e à la 21e année (16 ans = 26.4%)
 * - 1.60% la 22e année (cumul = 28%)
 * - 9% par an de la 23e à la 30e année (8 ans = 72%)
 * - 100% exonération après 30 ans
 */
function calculerImpotPlusValue(plusValue: number, dureeDetention: number): number {
  if (plusValue <= 0) return 0
  
  const annees = Math.floor(dureeDetention)
  
  // Abattement IR (exonération totale après 22 ans)
  let abattementIR = 0
  if (annees >= 22) {
    abattementIR = 100
  } else if (annees > 5) {
    // 6% par an de la 6e à la 21e année
    abattementIR = Math.min(100, 6 * (annees - 5))
  }
  
  // Abattement PS (exonération totale après 30 ans)
  let abattementPS = 0
  if (annees >= 30) {
    abattementPS = 100
  } else if (annees > 5) {
    if (annees <= 21) {
      // 1.65% par an de la 6e à la 21e année
      abattementPS = 1.65 * (annees - 5)
    } else if (annees === 22) {
      // 1.65% * 16 + 1.60% = 28%
      abattementPS = 1.65 * 16 + 1.60
    } else {
      // 1.65% * 16 + 1.60% + 9% * (années - 22)
      abattementPS = 1.65 * 16 + 1.60 + 9 * (annees - 22)
    }
    abattementPS = Math.min(100, abattementPS)
  }
  
  const plusValueImposableIR = plusValue * (1 - abattementIR / 100)
  const plusValueImposablePS = plusValue * (1 - abattementPS / 100)
  
  // Impôt IR (19%)
  const impotIR = plusValueImposableIR * 0.19
  
  // Prélèvements sociaux (17.2%)
  const prelevementsSociaux = plusValueImposablePS * 0.172
  
  // Surtaxe sur plus-values immobilières élevées (CGI art. 1609 nonies G)
  // Calcul par tranches progressives
  let surtaxe = 0
  const pvi = plusValueImposableIR
  if (pvi > 50000) {
    // Tranche 50 001 à 60 000 : 2% sur (PV - 50 000)
    if (pvi <= 60000) {
      surtaxe = (pvi - 50000) * 0.02
    } 
    // Tranche 60 001 à 100 000 : 2% de base + 2% sur excédent
    else if (pvi <= 100000) {
      surtaxe = 10000 * 0.02 + (pvi - 60000) * 0.02
    }
    // Tranche 100 001 à 110 000 : formule de lissage
    else if (pvi <= 110000) {
      surtaxe = pvi * 0.03 - 3000 // Formule de lissage
    }
    // Tranche 110 001 à 150 000 : 3%
    else if (pvi <= 150000) {
      surtaxe = pvi * 0.03
    }
    // Tranche 150 001 à 160 000 : formule de lissage
    else if (pvi <= 160000) {
      surtaxe = pvi * 0.04 - 1500 // Formule de lissage
    }
    // Tranche 160 001 à 200 000 : 4%
    else if (pvi <= 200000) {
      surtaxe = pvi * 0.04
    }
    // Tranche 200 001 à 210 000 : formule de lissage
    else if (pvi <= 210000) {
      surtaxe = pvi * 0.05 - 2000 // Formule de lissage
    }
    // Tranche 210 001 à 250 000 : 5%
    else if (pvi <= 250000) {
      surtaxe = pvi * 0.05
    }
    // Tranche 250 001 à 260 000 : formule de lissage
    else if (pvi <= 260000) {
      surtaxe = pvi * 0.06 - 2500 // Formule de lissage
    }
    // Au-delà de 260 000 : 6%
    else {
      surtaxe = pvi * 0.06
    }
  }
  
  return Math.round(impotIR + prelevementsSociaux + surtaxe)
}

function calculerTRI(fluxTresorerie: number[]): number {
  // Newton-Raphson pour calculer le TRI
  let tri = 0.05 // estimation initiale 5%
  const maxIterations = 100
  const tolerance = 0.0001
  
  for (let i = 0; i < maxIterations; i++) {
    let van = 0
    let derivee = 0
    
    for (let t = 0; t < fluxTresorerie.length; t++) {
      van += fluxTresorerie[t] / Math.pow(1 + tri, t)
      derivee -= t * fluxTresorerie[t] / Math.pow(1 + tri, t + 1)
    }
    
    if (Math.abs(derivee) < 1e-10) break
    
    const nouveauTri = tri - van / derivee
    
    if (Math.abs(nouveauTri - tri) < tolerance) {
      return Math.round(nouveauTri * 10000) / 100
    }
    
    tri = nouveauTri
  }
  
  return Math.round(tri * 10000) / 100
}

function simulerImmobilier(input: z.infer<typeof immobilierInputSchema>): ResultatSimulation {
  // Calculs initiaux
  const fraisNotaireEuros = input.prixAchat * (input.fraisNotaire / 100)
  const fraisAgenceEuros = input.prixAchat * (input.fraisAgence / 100)
  const investissementTotal = input.prixAchat + fraisNotaireEuros + fraisAgenceEuros + input.travauxInitiaux
  const montantEmprunte = investissementTotal - input.apportPersonnel
  
  // Crédit
  const mensualiteHorsAssurance = calculerMensualiteCredit(montantEmprunte, input.tauxCredit, input.dureeCredit)
  const assuranceMensuelle = montantEmprunte * (input.assuranceCredit / 100) / 12
  const mensualiteCredit = mensualiteHorsAssurance + assuranceMensuelle
  const coutTotalCredit = (mensualiteCredit * input.dureeCredit * 12) - montantEmprunte
  
  const amortissement = calculerTableauAmortissement(
    montantEmprunte, 
    input.tauxCredit, 
    input.dureeCredit, 
    input.assuranceCredit
  )
  
  // Projections annuelles
  const projections: ProjectionAnnuelle[] = []
  let loyerActuel = input.loyerMensuelHC
  let valeurBien = input.prixAchat
  let cashFlowCumule = 0
  let totalImpotsPayes = 0
  let totalPrelevementsSociaux = 0
  const fluxTresorerie: number[] = [-input.apportPersonnel]
  
  for (let annee = 1; annee <= input.dureeDetention; annee++) {
    // Revalorisation loyer
    if (annee > 1) {
      loyerActuel *= (1 + input.revalorisationLoyer / 100)
      valeurBien *= (1 + input.revalorisationBien / 100)
    }
    
    // Revenus
    const loyerBrutAnnuel = loyerActuel * 12
    const loyerNetAnnuel = loyerBrutAnnuel * (input.tauxOccupation / 100)
    
    // Charges
    const fraisGestionAnnuel = loyerNetAnnuel * (input.fraisGestion / 100)
    const provisionTravauxAnnuel = loyerNetAnnuel * (input.provisionTravaux / 100)
    const chargesProprietaire = input.chargesNonRecuperables
    
    // Crédit (si encore en cours)
    const amort = amortissement.find(a => a.annee === annee)
    const creditAnnuel = annee <= input.dureeCredit 
      ? (mensualiteCredit * 12)
      : 0
    const interetsAnnuels = amort?.interets || 0
    const capitalRembourse = amort?.capitalRembourse || 0
    const assuranceCreditAnnuel = amort?.assurance || 0
    const capitalRestant = amort?.capitalRestant || 0
    
    // Cash-flow avant impôts
    const chargesTotal = chargesProprietaire + input.taxeFonciere + input.assurancePNO + 
      fraisGestionAnnuel + provisionTravauxAnnuel
    const cashFlowAvantImpots = loyerNetAnnuel - chargesTotal - creditAnnuel
    
    // Fiscalité
    let revenuImposable = 0
    let impotsFonciers = 0
    let prelevementsSociaux = 0
    
    // Calcul de l'amortissement LMNP (hors terrain)
    const valeurAmortissable = input.prixAchat * (1 - (input.pourcentageTerrain || 15) / 100)
    const amortissementBatiment = valeurAmortissable / 30 // 30 ans pour le bâti
    const amortissementMobilier = (input.valeurMobilier || 0) / 7 // 7 ans pour le mobilier
    const amortissementTotal = amortissementBatiment + amortissementMobilier
    
    switch (input.regimeFiscal) {
      case 'MICRO_FONCIER':
        // Abattement 30% - vérifier plafond 15 000 €
        revenuImposable = loyerNetAnnuel * 0.7
        impotsFonciers = revenuImposable * (input.trancheMarginalImposition / 100)
        prelevementsSociaux = revenuImposable * 0.172
        break
        
      case 'REEL':
        // Déduction des charges réelles + intérêts + déficit antérieur
        let resultatFoncier = loyerNetAnnuel - chargesTotal - interetsAnnuels - assuranceCreditAnnuel
        
        // Imputation du déficit foncier antérieur (si bénéfice)
        if (annee === 1 && input.deficitFoncierAnterieur > 0 && resultatFoncier > 0) {
          const deficitImpute = Math.min(input.deficitFoncierAnterieur, resultatFoncier)
          resultatFoncier -= deficitImpute
        }
        
        revenuImposable = resultatFoncier
        
        // Si déficit foncier, peut être imputé sur revenu global (max 10 700 €/an)
        if (resultatFoncier < 0) {
          // Le déficit lié aux intérêts ne s'impute que sur revenus fonciers futurs
          // Le déficit lié aux autres charges s'impute sur revenu global (max 10 700 €)
          const deficitHorsInterets = Math.min(0, loyerNetAnnuel - chargesTotal - assuranceCreditAnnuel)
          const deficitImputableRG = Math.min(PLAFONDS.DEFICIT_FONCIER_IMPUTABLE, Math.abs(deficitHorsInterets))
          // Économie d'impôt potentielle (comptabilisée comme impôt négatif)
          impotsFonciers = -deficitImputableRG * (input.trancheMarginalImposition / 100)
        } else if (resultatFoncier > 0) {
          impotsFonciers = resultatFoncier * (input.trancheMarginalImposition / 100)
          prelevementsSociaux = resultatFoncier * 0.172
        }
        break
        
      case 'LMNP_MICRO':
        // Abattement 50% - plafonné à 77 700 € de recettes
        revenuImposable = loyerNetAnnuel * 0.5
        impotsFonciers = revenuImposable * (input.trancheMarginalImposition / 100)
        prelevementsSociaux = revenuImposable * 0.172
        break
        
      case 'LMNP_REEL':
        // Amortissement du bien + mobilier + charges + intérêts
        // L'amortissement ne peut pas créer de déficit (report possible)
        const resultatAvantAmort = loyerNetAnnuel - chargesTotal - interetsAnnuels
        const amortissementUtilise = Math.min(amortissementTotal, Math.max(0, resultatAvantAmort))
        revenuImposable = Math.max(0, resultatAvantAmort - amortissementUtilise)
        
        if (revenuImposable > 0) {
          impotsFonciers = revenuImposable * (input.trancheMarginalImposition / 100)
          prelevementsSociaux = revenuImposable * 0.172
        }
        break
        
      case 'LMP':
        // Comme LMNP réel mais avec cotisations sociales TNS
        // Conditions LMP : recettes > 23 000 € ET > revenus d'activité du foyer
        const resultatLMP = loyerNetAnnuel - chargesTotal - interetsAnnuels
        const amortLMP = Math.min(amortissementTotal, Math.max(0, resultatLMP))
        revenuImposable = Math.max(0, resultatLMP - amortLMP)
        
        if (revenuImposable > 0) {
          impotsFonciers = revenuImposable * (input.trancheMarginalImposition / 100)
          // Cotisations sociales TNS : environ 45% (URSSAF + retraite + CSG/CRDS)
          prelevementsSociaux = revenuImposable * 0.45
        }
        break
    }
    
    totalImpotsPayes += Math.max(0, impotsFonciers)
    totalPrelevementsSociaux += Math.max(0, prelevementsSociaux)
    
    const cashFlowApresImpots = cashFlowAvantImpots - Math.max(0, impotsFonciers) - Math.max(0, prelevementsSociaux)
    cashFlowCumule += cashFlowApresImpots
    
    fluxTresorerie.push(cashFlowApresImpots)
    
    const capitalConstitue = valeurBien - capitalRestant
    
    projections.push({
      annee,
      loyerBrut: Math.round(loyerBrutAnnuel),
      loyerNet: Math.round(loyerNetAnnuel),
      chargesProprietaire: Math.round(chargesProprietaire),
      taxeFonciere: input.taxeFonciere,
      assurance: input.assurancePNO,
      fraisGestion: Math.round(fraisGestionAnnuel),
      provisionTravaux: Math.round(provisionTravauxAnnuel),
      mensualiteCredit: Math.round(creditAnnuel / 12),
      capitalRembourse,
      interets: interetsAnnuels,
      assuranceCredit: assuranceCreditAnnuel,
      capitalRestantDu: capitalRestant,
      cashFlowBrutMensuel: Math.round((loyerNetAnnuel - chargesTotal) / 12),
      cashFlowNetMensuel: Math.round(cashFlowAvantImpots / 12),
      cashFlowAnnuel: Math.round(cashFlowAvantImpots),
      revenuImposable: Math.round(revenuImposable),
      impotsFonciers: Math.round(Math.max(0, impotsFonciers)),
      prelevementsSociaux: Math.round(Math.max(0, prelevementsSociaux)),
      cashFlowApresImpots: Math.round(cashFlowApresImpots),
      valeurBien: Math.round(valeurBien),
      capitalConstitue: Math.round(capitalConstitue),
    })
  }
  
  // Revente
  const dernierCapitalRestant = projections[projections.length - 1]?.capitalRestantDu || 0
  const valeurRevente = projections[projections.length - 1]?.valeurBien || input.prixAchat
  const fraisReventeEuros = valeurRevente * (input.fraisRevente / 100)
  const plusValueBrute = valeurRevente - investissementTotal
  const impotPlusValue = calculerImpotPlusValue(plusValueBrute, input.dureeDetention)
  const plusValueNette = plusValueBrute - impotPlusValue - fraisReventeEuros
  const capitalFinal = valeurRevente - dernierCapitalRestant - fraisReventeEuros - impotPlusValue
  
  // Ajouter le flux de la revente
  fluxTresorerie[fluxTresorerie.length - 1] += capitalFinal
  
  // Rentabilités
  const loyerAnnuel = input.loyerMensuelHC * 12
  const rentabiliteBrute = (loyerAnnuel / input.prixAchat) * 100
  
  const chargesAnnuelles = input.chargesNonRecuperables + input.taxeFonciere + input.assurancePNO +
    (loyerAnnuel * input.fraisGestion / 100) + (loyerAnnuel * input.provisionTravaux / 100)
  const loyerNetCharges = loyerAnnuel * (input.tauxOccupation / 100) - chargesAnnuelles
  const rentabiliteNette = (loyerNetCharges / investissementTotal) * 100
  
  const impotsMoyens = totalImpotsPayes / input.dureeDetention
  const psMoyens = totalPrelevementsSociaux / input.dureeDetention
  const rentabiliteNetteNette = ((loyerNetCharges - impotsMoyens - psMoyens) / investissementTotal) * 100
  
  // TRI
  const tri = calculerTRI(fluxTresorerie)
  
  // Indicateurs
  const cashFlowMoyenMensuel = cashFlowCumule / input.dureeDetention / 12
  const multiplicateurLoyer = input.prixAchat / loyerAnnuel
  const rendementCapitauxPropres = input.apportPersonnel > 0 
    ? ((cashFlowCumule + plusValueNette) / input.apportPersonnel) * 100 / input.dureeDetention
    : 0
  const cashOnCash = input.apportPersonnel > 0
    ? ((projections[0]?.cashFlowApresImpots || 0) / input.apportPersonnel) * 100
    : 0
  const delaiRecuperationApport = input.apportPersonnel > 0 && cashFlowMoyenMensuel > 0
    ? input.apportPersonnel / (cashFlowMoyenMensuel * 12)
    : 999
  
  return {
    investissementTotal: Math.round(investissementTotal),
    apportPersonnel: input.apportPersonnel,
    montantEmprunte: Math.round(montantEmprunte),
    mensualiteCredit: Math.round(mensualiteCredit),
    coutTotalCredit: Math.round(coutTotalCredit),
    rentabiliteBrute: Math.round(rentabiliteBrute * 100) / 100,
    rentabiliteNette: Math.round(rentabiliteNette * 100) / 100,
    rentabiliteNetteNette: Math.round(rentabiliteNetteNette * 100) / 100,
    tri,
    cashFlowMoyenMensuel: Math.round(cashFlowMoyenMensuel),
    cashFlowCumule: Math.round(cashFlowCumule),
    effortEpargneMoyen: Math.round(-Math.min(0, cashFlowMoyenMensuel)),
    projections,
    valeurRevente: Math.round(valeurRevente),
    plusValueBrute: Math.round(plusValueBrute),
    impotPlusValue: Math.round(impotPlusValue),
    plusValueNette: Math.round(plusValueNette),
    capitalFinal: Math.round(capitalFinal),
    fiscalite: {
      regime: input.regimeFiscal,
      totalImpotsPayes: Math.round(totalImpotsPayes),
      totalPrelevementsSociaux: Math.round(totalPrelevementsSociaux),
      economieImpots: 0, // À calculer si déficit foncier
    },
    indicateurs: {
      multiplicateurLoyer: Math.round(multiplicateurLoyer * 10) / 10,
      rendementCapitauxPropres: Math.round(rendementCapitauxPropres * 100) / 100,
      cashOnCash: Math.round(cashOnCash * 100) / 100,
      delaiRecuperationApport: Math.round(delaiRecuperationApport * 10) / 10,
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request)
    
    const body = await request.json()
    const input = immobilierInputSchema.parse(body)
    
    // Validations métier
    if (input.apportPersonnel < 0) {
      return createErrorResponse('L\'apport personnel ne peut pas être négatif', 400)
    }
    
    const fraisNotaireEuros = input.prixAchat * (input.fraisNotaire / 100)
    const investissementMin = input.prixAchat + fraisNotaireEuros
    
    if (input.apportPersonnel > investissementMin + input.travauxInitiaux) {
      return createErrorResponse('L\'apport personnel ne peut pas dépasser l\'investissement total', 400)
    }
    
    const resultat = simulerImmobilier(input)
    
    // Générer les alertes et conseils
    const alertes: string[] = []
    const conseils: string[] = []
    const loyerAnnuel = input.loyerMensuelHC * 12
    
    // Vérification des plafonds régimes micro
    if (input.regimeFiscal === 'MICRO_FONCIER' && loyerAnnuel > PLAFONDS.MICRO_FONCIER) {
      alertes.push(`⚠️ Loyers (${loyerAnnuel.toLocaleString('fr-FR')} €) > plafond micro-foncier (15 000 €). Régime réel obligatoire.`)
    }
    
    if (input.regimeFiscal === 'LMNP_MICRO' && loyerAnnuel > PLAFONDS.MICRO_BIC) {
      alertes.push(`⚠️ Recettes (${loyerAnnuel.toLocaleString('fr-FR')} €) > plafond micro-BIC (77 700 €). Régime réel obligatoire.`)
    }
    
    if (input.regimeFiscal === 'LMP' && loyerAnnuel < PLAFONDS.LMP_SEUIL_RECETTES) {
      alertes.push(`⚠️ Recettes (${loyerAnnuel.toLocaleString('fr-FR')} €) < seuil LMP (23 000 €). Le statut LMP n'est pas applicable.`)
    }
    
    // Conseils d'optimisation
    if (resultat.cashFlowMoyenMensuel < 0) {
      conseils.push(`💸 Cash-flow négatif : effort d'épargne de ${Math.abs(resultat.cashFlowMoyenMensuel)} €/mois nécessaire.`)
    } else if (resultat.cashFlowMoyenMensuel > 200) {
      conseils.push(`✅ Excellent cash-flow de +${resultat.cashFlowMoyenMensuel} €/mois. Projet autofinancé.`)
    }
    
    if (resultat.rentabiliteBrute < 4) {
      conseils.push(`📉 Rendement brut faible (${resultat.rentabiliteBrute}%). Négociez le prix ou cherchez un meilleur ratio loyer/prix.`)
    } else if (resultat.rentabiliteBrute >= 7) {
      conseils.push(`📈 Excellent rendement brut de ${resultat.rentabiliteBrute}%. Opportunité intéressante.`)
    }
    
    if (input.regimeFiscal === 'REEL' && resultat.fiscalite.totalImpotsPayes > 2000) {
      conseils.push(`💡 Fiscalité élevée en régime réel. Considérez le passage en LMNP pour bénéficier de l'amortissement.`)
    }
    
    if (input.dureeDetention >= 22) {
      conseils.push(`✅ Détention ≥ 22 ans : plus-value exonérée d'IR. ${input.dureeDetention >= 30 ? 'Exonération totale (PS inclus).' : ''}`)
    }
    
    // Effet de levier
    const levier = input.prixAchat > 0 ? (input.prixAchat - input.apportPersonnel) / input.prixAchat : 0
    if (levier > 0.8) {
      conseils.push(`🚀 Fort effet de levier (${Math.round(levier * 100)}% financé). Optimise le rendement des capitaux propres.`)
    }
    
    return createSuccessResponse({
      simulation: resultat,
      alertes,
      conseils,
      input: {
        prixAchat: input.prixAchat,
        apportPersonnel: input.apportPersonnel,
        loyerMensuel: input.loyerMensuelHC,
        dureeDetention: input.dureeDetention,
        regimeFiscal: input.regimeFiscal,
      },
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Erreur validation Zod:', error.issues)
      return createErrorResponse(`Données invalides: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`, 400)
    }
    console.error('Erreur simulateur immobilier:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    return createErrorResponse(`Erreur lors de la simulation: ${errorMessage}`, 500)
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)
    
    return createSuccessResponse({
      parametresDefaut: {
        prixAchat: 200000,
        fraisNotaire: 8,
        travauxInitiaux: 0,
        apportPersonnel: 40000,
        tauxCredit: 3.5,
        dureeCredit: 20,
        assuranceCredit: 0.36,
        loyerMensuelHC: 800,
        tauxOccupation: 95,
        revalorisationLoyer: 1.5,
        taxeFonciere: 1500,
        assurancePNO: 200,
        fraisGestion: 0,
        provisionTravaux: 3,
        regimeFiscal: 'REEL',
        trancheMarginalImposition: 30,
        dureeDetention: 20,
        revalorisationBien: 2,
      },
      regimesFiscaux: [
        { value: 'MICRO_FONCIER', label: 'Micro-foncier (abattement 30%)', condition: 'Revenus < 15 000 €' },
        { value: 'REEL', label: 'Régime réel', condition: 'Déduction charges réelles' },
        { value: 'LMNP_MICRO', label: 'LMNP Micro-BIC (abattement 50%)', condition: 'Location meublée' },
        { value: 'LMNP_REEL', label: 'LMNP Réel', condition: 'Amortissement du bien' },
        { value: 'LMP', label: 'LMP', condition: 'Recettes > 23 000 € + activité principale' },
      ],
      indicateursReference: {
        rentabiliteBruteMin: 5,
        rentabiliteBruteMax: 12,
        rentabiliteNetteMin: 3,
        rentabiliteNetteMax: 8,
        triMin: 4,
        triMax: 10,
      },
    })
    
  } catch (error) {
    console.error('Erreur GET simulateur immobilier:', error)
    return createErrorResponse('Erreur lors de la récupération des paramètres', 500)
  }
}
