/**
 * ══════════════════════════════════════════════════════════════════════════════
 * API SIMULATEUR CAPACITÉ D'EMPRUNT 2025
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Endpoint : POST /api/advisor/simulators/capacite-emprunt
 * 
 * Calcul complet de la capacité d'emprunt avec :
 * - Multi-lignes de crédit
 * - Revenus pondérés selon type
 * - Calcul HCSF (35%)
 * - Reste à vivre
 * - Faisabilité du projet
 * - Tableau d'amortissement
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/app/_common/lib/logger'
// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTES 2025
// ══════════════════════════════════════════════════════════════════════════════

const PARAMS = {
  // Taux d'endettement HCSF
  TAUX_ENDETTEMENT_MAX: 35,
  
  // Reste à vivre minimum
  RESTE_A_VIVRE: {
    SEUL: 700,
    COUPLE: 1000,
    PAR_ENFANT: 150,
  },
  
  // Coefficients de pondération des revenus
  PONDERATION_REVENUS: {
    salaire_cdi: 1.00,
    salaire_cdd: 0.70,
    benefices_tns: 0.85,
    revenus_locatifs: 0.70,
    revenus_locatifs_futurs: 0.70,
    pension: 1.00,
    dividendes: 0.50,
    allocations: 0.00,
    autre: 0.50,
  } as Record<string, number>,
  
  // Taux de référence par durée
  TAUX_REFERENCE: {
    10: 3.20,
    15: 3.35,
    20: 3.50,
    25: 3.65,
  } as Record<number, number>,
  
  // Taux assurance par tranche d'âge
  TAUX_ASSURANCE: {
    30: 0.10,
    45: 0.25,
    55: 0.36,
    100: 0.50,
  } as Record<number, number>,
  
  // Frais de notaire
  FRAIS_NOTAIRE: {
    ancien: 0.08,
    neuf: 0.03,
  },
} as const

// ══════════════════════════════════════════════════════════════════════════════
// SCHÉMA DE VALIDATION ZOD
// ══════════════════════════════════════════════════════════════════════════════

const RevenuSchema = z.object({
  type: z.string(),
  montant: z.number().min(0),
  description: z.string().optional(),
})

const ChargeSchema = z.object({
  type: z.string(),
  montant: z.number().min(0),
  description: z.string().optional(),
})

const LigneCreditSchema = z.object({
  type: z.enum([
    // Classiques
    'amortissable',
    'in_fine',
    'relais',
    'lissage',
    // Prêts aidés nationaux
    'ptz',
    'eco_ptz',
    'pret_pas',      // PAS - Prêt Accession Sociale
    'pret_pc',       // PC - Prêt Conventionné
    'action_logement',
    'patronal',      // Alias Action Logement
    'pas',           // Alias Action Logement (ancien)
    'familial',
    // Épargne logement
    'pel',
    'cel',
    // Spéciaux
    'scpi',
    'regional',      // Prêts locaux/régionaux
  ]),
  montant: z.number().min(0),
  dureeAnnees: z.number().min(1).max(30),
  tauxAnnuel: z.number().min(0).max(15),
  tauxAssurance: z.number().min(0).max(2).optional().default(0.36),
  differe: z.enum(['aucun', 'partiel', 'total']).optional().default('aucun'),
  dureeDiffereMois: z.number().min(0).max(60).optional().default(0),
})

const CapaciteEmpruntInputSchema = z.object({
  // Revenus
  revenus: z.array(RevenuSchema),
  
  // Charges existantes
  charges: z.array(ChargeSchema),
  
  // Situation familiale
  situationFamiliale: z.enum(['seul', 'couple']).optional().default('seul'),
  nbEnfants: z.number().min(0).max(10).optional().default(0),
  ageEmprunteur: z.number().min(18).max(85).optional().default(35),
  
  // Projet immobilier (optionnel)
  projet: z.object({
    prixBien: z.number().min(0),
    typeAchat: z.enum(['ancien', 'neuf']).default('ancien'),
    fraisNotaire: z.number().min(0).optional(),
    fraisAgence: z.number().min(0).optional().default(0),
    travaux: z.number().min(0).optional().default(0),
    apportPersonnel: z.number().min(0).optional().default(0),
  }).optional(),
  
  // Lignes de crédit du projet
  lignesCredit: z.array(LigneCreditSchema).optional().default([]),
  
  // Paramètres de simulation
  dureeEmpruntSouhaitee: z.number().min(5).max(30).optional().default(20),
  tauxSouhaite: z.number().min(0).max(10).optional(),
  supprimerLoyerActuel: z.boolean().optional().default(true),
})

type CapaciteEmpruntInput = z.infer<typeof CapaciteEmpruntInputSchema>

// ══════════════════════════════════════════════════════════════════════════════
// FONCTIONS DE CALCUL
// ══════════════════════════════════════════════════════════════════════════════

function calculerMensualite(capital: number, tauxAnnuel: number, dureeAnnees: number): number {
  const tauxMensuel = tauxAnnuel / 100 / 12
  const nbMensualites = dureeAnnees * 12
  
  if (tauxMensuel === 0) {
    return capital / nbMensualites
  }
  
  return capital * (tauxMensuel * Math.pow(1 + tauxMensuel, nbMensualites)) / 
         (Math.pow(1 + tauxMensuel, nbMensualites) - 1)
}

function calculerCapitalEmpruntable(mensualiteMax: number, tauxAnnuel: number, dureeAnnees: number): number {
  const tauxMensuel = tauxAnnuel / 100 / 12
  const nbMensualites = dureeAnnees * 12
  
  if (tauxMensuel === 0 || mensualiteMax <= 0) {
    return mensualiteMax * nbMensualites
  }
  
  return mensualiteMax * (Math.pow(1 + tauxMensuel, nbMensualites) - 1) / 
         (tauxMensuel * Math.pow(1 + tauxMensuel, nbMensualites))
}

function getTauxParDuree(duree: number): number {
  if (duree <= 10) return PARAMS.TAUX_REFERENCE[10]
  if (duree <= 15) return PARAMS.TAUX_REFERENCE[15]
  if (duree <= 20) return PARAMS.TAUX_REFERENCE[20]
  return PARAMS.TAUX_REFERENCE[25]
}

function getTauxAssuranceParAge(age: number): number {
  if (age < 30) return PARAMS.TAUX_ASSURANCE[30]
  if (age < 45) return PARAMS.TAUX_ASSURANCE[45]
  if (age < 55) return PARAMS.TAUX_ASSURANCE[55]
  return PARAMS.TAUX_ASSURANCE[100]
}

function calculerRevenusPonderes(revenus: Array<{ type: string; montant: number }>): {
  total: number
  detail: Array<{ type: string; brut: number; coef: number; pondere: number }>
} {
  const detail = revenus.map(r => {
    const coef = PARAMS.PONDERATION_REVENUS[r.type] ?? 0.5
    return {
      type: r.type,
      brut: r.montant,
      coef,
      pondere: Math.round(r.montant * coef),
    }
  })
  
  const total = detail.reduce((sum, d) => sum + d.pondere, 0)
  return { total, detail }
}

function calculerResteAVivreMinimum(situation: 'seul' | 'couple', nbEnfants: number): number {
  const base = situation === 'couple' ? PARAMS.RESTE_A_VIVRE.COUPLE : PARAMS.RESTE_A_VIVRE.SEUL
  return base + (nbEnfants * PARAMS.RESTE_A_VIVRE.PAR_ENFANT)
}

function calculerLigneCredit(ligne: z.infer<typeof LigneCreditSchema>) {
  const mensualiteHorsAssurance = calculerMensualite(ligne.montant, ligne.tauxAnnuel, ligne.dureeAnnees)
  const assuranceMensuelle = (ligne.montant * (ligne.tauxAssurance / 100)) / 12
  const mensualiteTotale = mensualiteHorsAssurance + assuranceMensuelle
  const coutTotal = (mensualiteTotale * ligne.dureeAnnees * 12) - ligne.montant
  
  return {
    type: ligne.type,
    montant: ligne.montant,
    dureeAnnees: ligne.dureeAnnees,
    tauxAnnuel: ligne.tauxAnnuel,
    tauxAssurance: ligne.tauxAssurance,
    mensualiteHorsAssurance: Math.round(mensualiteHorsAssurance),
    assuranceMensuelle: Math.round(assuranceMensuelle),
    mensualiteTotale: Math.round(mensualiteTotale),
    coutTotal: Math.round(coutTotal),
  }
}

function genererTableauAmortissement(
  capital: number,
  tauxAnnuel: number,
  dureeAnnees: number,
  assuranceMensuelle: number = 0
): Array<{
  annee: number
  capitalRestant: number
  capitalRembourse: number
  interets: number
  assurance: number
  total: number
}> {
  const mensualite = calculerMensualite(capital, tauxAnnuel, dureeAnnees)
  const tauxMensuel = tauxAnnuel / 100 / 12
  
  const tableau: Array<{
    annee: number
    capitalRestant: number
    capitalRembourse: number
    interets: number
    assurance: number
    total: number
  }> = []
  let capitalRestant = capital
  
  for (let annee = 1; annee <= dureeAnnees; annee++) {
    let capitalAnnee = 0
    let interetsAnnee = 0
    
    for (let mois = 0; mois < 12 && capitalRestant > 0; mois++) {
      const interetsMois = capitalRestant * tauxMensuel
      const capitalMois = Math.min(mensualite - interetsMois, capitalRestant)
      
      capitalAnnee += capitalMois
      interetsAnnee += interetsMois
      capitalRestant = Math.max(0, capitalRestant - capitalMois)
    }
    
    tableau.push({
      annee,
      capitalRestant: Math.round(capitalRestant),
      capitalRembourse: Math.round(capitalAnnee),
      interets: Math.round(interetsAnnee),
      assurance: Math.round(assuranceMensuelle * 12),
      total: Math.round(capitalAnnee + interetsAnnee + assuranceMensuelle * 12),
    })
  }
  
  return tableau
}

// ══════════════════════════════════════════════════════════════════════════════
// HANDLER API
// ══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation Zod
    const validation = CapaciteEmpruntInputSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Données invalides', 
          details: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      )
    }
    
    const input = validation.data
    
    // 1. Calcul des revenus pondérés
    const { total: revenusPonderes, detail: detailRevenus } = calculerRevenusPonderes(input.revenus)
    const revenus = {
      brut: input.revenus.reduce((sum, r) => sum + r.montant, 0),
      pondere: revenusPonderes,
      detail: detailRevenus,
    }
    
    // 2. Calcul des charges existantes (hors loyer si suppression demandée)
    let chargesExistantes = input.charges
    if (input.supprimerLoyerActuel) {
      chargesExistantes = chargesExistantes.filter(c => c.type !== 'loyer')
    }
    const totalChargesExistantes = chargesExistantes.reduce((sum, c) => sum + c.montant, 0)
    
    // 3. Paramètres du crédit
    const duree = input.dureeEmpruntSouhaitee
    const tauxAnnuel = input.tauxSouhaite ?? getTauxParDuree(duree)
    const tauxAssurance = getTauxAssuranceParAge(input.ageEmprunteur)
    
    // 4. Calcul de la capacité maximale (sans projet)
    const mensualiteMaxHCSF = (revenusPonderes * PARAMS.TAUX_ENDETTEMENT_MAX / 100) - totalChargesExistantes
    const capaciteMaxTheorique = calculerCapitalEmpruntable(
      Math.max(0, mensualiteMaxHCSF),
      tauxAnnuel,
      duree
    )
    
    // 5. Calcul reste à vivre minimum
    const resteAVivreMinimum = calculerResteAVivreMinimum(input.situationFamiliale, input.nbEnfants)
    
    // 6. Analyse du projet si fourni
    let projet = null
    let lignesCreditAnalysees: Array<{
      type: string
      montant: number
      dureeAnnees: number
      tauxAnnuel: number
      tauxAssurance: number
      mensualiteHorsAssurance: number
      assuranceMensuelle: number
      mensualiteTotale: number
      coutTotal: number
    }> = []
    let analyseProjet = null
    
    if (input.projet && input.projet.prixBien > 0) {
      const fraisNotaire = input.projet.fraisNotaire ?? 
        Math.round(input.projet.prixBien * PARAMS.FRAIS_NOTAIRE[input.projet.typeAchat])
      
      const budgetTotal = input.projet.prixBien + fraisNotaire + 
        input.projet.fraisAgence + input.projet.travaux
      const montantAFinancer = Math.max(0, budgetTotal - input.projet.apportPersonnel)
      
      projet = {
        prixBien: input.projet.prixBien,
        typeAchat: input.projet.typeAchat,
        fraisNotaire,
        fraisAgence: input.projet.fraisAgence,
        travaux: input.projet.travaux,
        budgetTotal,
        apportPersonnel: input.projet.apportPersonnel,
        montantAFinancer,
      }
      
      // Analyse des lignes de crédit du projet
      if (input.lignesCredit.length > 0) {
        lignesCreditAnalysees = input.lignesCredit.map(l => calculerLigneCredit(l))
      } else {
        // Créer une ligne de crédit par défaut
        const ligneParDefaut: z.infer<typeof LigneCreditSchema> = {
          type: 'amortissable',
          montant: montantAFinancer,
          dureeAnnees: duree,
          tauxAnnuel,
          tauxAssurance,
          differe: 'aucun',
          dureeDiffereMois: 0,
        }
        lignesCreditAnalysees = [calculerLigneCredit(ligneParDefaut)]
      }
      
      const mensualiteProjet = lignesCreditAnalysees.reduce((sum, l) => sum + l.mensualiteTotale, 0)
      const totalChargesAvecProjet = totalChargesExistantes + mensualiteProjet
      const tauxEndettementProjet = revenusPonderes > 0 
        ? (totalChargesAvecProjet / revenusPonderes) * 100 
        : 100
      const resteAVivre = revenusPonderes - totalChargesAvecProjet
      
      // Faisabilité
      const alertes: string[] = []
      const recommandations: string[] = []
      
      if (tauxEndettementProjet > 35) {
        alertes.push(`Taux d'endettement (${tauxEndettementProjet.toFixed(1)}%) supérieur au seuil HCSF de 35%`)
        recommandations.push('Augmentez votre apport personnel ou réduisez le montant emprunté')
        recommandations.push('Allongez la durée du prêt pour réduire les mensualités')
      } else if (tauxEndettementProjet > 33) {
        alertes.push(`Taux d'endettement (${tauxEndettementProjet.toFixed(1)}%) proche du seuil HCSF`)
      }
      
      if (resteAVivre < resteAVivreMinimum) {
        alertes.push(`Reste à vivre (${Math.round(resteAVivre)}€) insuffisant (minimum: ${resteAVivreMinimum}€)`)
        recommandations.push('Réduisez le montant du projet ou augmentez vos revenus')
      }
      
      const faisable = tauxEndettementProjet <= 35 && resteAVivre >= resteAVivreMinimum
      
      if (faisable) {
        recommandations.push('Votre projet est finançable selon les normes bancaires')
        if (tauxEndettementProjet <= 30) {
          recommandations.push('Bon profil, marge de négociation pour le taux')
        }
      }
      
      // Coût total du crédit
      const coutTotalCredit = lignesCreditAnalysees.reduce((sum, l) => sum + l.coutTotal, 0)
      const montantTotalCredit = lignesCreditAnalysees.reduce((sum, l) => sum + l.montant, 0)
      
      analyseProjet = {
        mensualiteProjet,
        tauxEndettementProjet: Math.round(tauxEndettementProjet * 10) / 10,
        resteAVivre: Math.round(resteAVivre),
        faisable,
        alertes,
        recommandations,
        coutTotalCredit,
        montantTotalCredit,
      }
    }
    
    // 7. Générer tableau d'amortissement si une seule ligne de crédit
    let tableauAmortissement: Array<{
      annee: number
      capitalRestant: number
      capitalRembourse: number
      interets: number
      assurance: number
      total: number
    }> = []
    if (lignesCreditAnalysees.length === 1) {
      const ligne = lignesCreditAnalysees[0]
      tableauAmortissement = genererTableauAmortissement(
        ligne.montant,
        ligne.tauxAnnuel,
        ligne.dureeAnnees,
        ligne.assuranceMensuelle
      )
    }
    
    // 8. Construction de la réponse
    const result = {
      // Revenus
      revenus,
      
      // Charges
      charges: {
        existantes: totalChargesExistantes,
        detail: chargesExistantes,
      },
      
      // Capacité maximale théorique
      capacite: {
        mensualiteMaxHCSF: Math.round(Math.max(0, mensualiteMaxHCSF)),
        capaciteMaxTheorique: Math.round(capaciteMaxTheorique),
        tauxReference: tauxAnnuel,
        duree,
        tauxAssuranceEstime: tauxAssurance,
      },
      
      // Reste à vivre
      resteAVivre: {
        minimum: resteAVivreMinimum,
        situation: input.situationFamiliale,
        nbEnfants: input.nbEnfants,
      },
      
      // Projet si fourni
      projet,
      lignesCredit: lignesCreditAnalysees,
      analyseProjet,
      tableauAmortissement,
      
      // Paramètres de référence
      parametres: {
        tauxEndettementMax: PARAMS.TAUX_ENDETTEMENT_MAX,
        tauxReference: PARAMS.TAUX_REFERENCE,
        ponderationRevenus: PARAMS.PONDERATION_REVENUS,
      },
    }
    
    return NextResponse.json({
      success: true,
      data: result,
    })
    
  } catch (error) {
    logger.error('Erreur API simulateur capacité emprunt:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors du calcul de la capacité d\'emprunt',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}
