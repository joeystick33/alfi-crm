 
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/app/_common/lib/logger'
/**
 * API Simulateur Épargne Flexible
 * Migration du backend Java vers Next.js
 * 
 * Types de calculs :
 * - capital_final : calcul du capital final avec évolution
 * - versement_initial : versement initial nécessaire pour atteindre un objectif
 * - duree_necessaire : durée pour atteindre un objectif
 * - comparer_scenarios : comparaison multi-scénarios
 */

// Types
interface EvolutionAnnuelle {
  annee: number
  capital: number
  versementsCumules: number
  interetsCumules: number
  interetsAnnee: number
}

interface CapitalFinalResult {
  capitalFinal: number
  totalVerse: number
  interetsGeneres: number
  tauxRendementGlobal: number
  evolutionAnnuelle: EvolutionAnnuelle[]
  // Données pédagogiques
  effetComposes: {
    interetsSimples: number
    interetsComposes: number
    gainComposes: number
    pourcentageGainComposes: number
  }
  multiplicateur: number
  partInterets: number
}

interface VersementInitialResult {
  objectifAtteintSansVI: boolean
  versementInitialNecessaire?: number
  capitalProjeteSansVI?: number
  capitalObjectif?: number
  dureeAnnees?: number
  message: string
}

interface DureeNecessaireResult {
  objectifDejaAtteint: boolean
  dureeNecessaire?: number
  moisNecessaires?: number
  capitalObjectif?: number
  capitalFinalAtteint?: number
  message?: string
  error?: string
}

interface ScenarioRequest {
  nom: string
  versementInitial: number
  versementMensuel: number
  dureeAnnees: number
  tauxAnnuelNet: number
}

interface ScenarioResult {
  nomScenario: string
  capitalFinal: number
  totalVerse: number
  interetsGeneres: number
  tauxRendementGlobal: number
  estMeilleur: boolean
  ecartAvecMeilleur: number
}

interface Recommandation {
  priorite: 'haute' | 'moyenne' | 'basse'
  type: 'rendement' | 'versement' | 'duree' | 'objectif' | 'info'
  description: string
}

// ========== FONCTIONS DE CALCUL ==========

/**
 * Calcule le capital final avec évolution détaillée
 */
function calculerCapitalFinal(
  versementInitial: number,
  versementMensuel: number,
  dureeAnnees: number,
  tauxAnnuelNet: number
): CapitalFinalResult {
  const tauxMensuel = tauxAnnuelNet / 100 / 12
  const nombreMois = dureeAnnees * 12

  // Évolution mois par mois
  let capitalCourant = versementInitial
  let interetsCumules = 0
  let versementsCumules = versementInitial
  const evolutionAnnuelle: EvolutionAnnuelle[] = []

  // Ajouter l'année 0
  evolutionAnnuelle.push({
    annee: 0,
    capital: Math.round(versementInitial),
    versementsCumules: Math.round(versementInitial),
    interetsCumules: 0,
    interetsAnnee: 0
  })

  for (let annee = 1; annee <= dureeAnnees; annee++) {
    let interetsAnnee = 0
    for (let mois = 1; mois <= 12; mois++) {
      const interetsMois = capitalCourant * tauxMensuel
      interetsCumules += interetsMois
      interetsAnnee += interetsMois
      capitalCourant += interetsMois + versementMensuel
      versementsCumules += versementMensuel
    }
    evolutionAnnuelle.push({
      annee,
      capital: Math.round(capitalCourant),
      versementsCumules: Math.round(versementsCumules),
      interetsCumules: Math.round(interetsCumules),
      interetsAnnee: Math.round(interetsAnnee)
    })
  }

  const capitalFinal = Math.round(capitalCourant)
  const totalVerse = Math.round(versementsCumules)
  const interetsGeneres = Math.round(interetsCumules)
  const tauxRendementGlobal = totalVerse > 0 ? Math.round((interetsGeneres / totalVerse) * 1000) / 10 : 0

  // Calcul effet intérêts composés vs simples (pour pédagogie)
  // Intérêts simples = capital initial × taux × durée + moyenne des versements × taux × durée moyenne
  const interetsSimples = Math.round(
    versementInitial * (tauxAnnuelNet / 100) * dureeAnnees +
    versementMensuel * 12 * dureeAnnees * (tauxAnnuelNet / 100) * (dureeAnnees / 2)
  )
  const gainComposes = interetsGeneres - interetsSimples
  const pourcentageGainComposes = interetsSimples > 0 ? Math.round((gainComposes / interetsSimples) * 100) : 0

  return {
    capitalFinal,
    totalVerse,
    interetsGeneres,
    tauxRendementGlobal,
    evolutionAnnuelle,
    effetComposes: {
      interetsSimples,
      interetsComposes: interetsGeneres,
      gainComposes,
      pourcentageGainComposes
    },
    multiplicateur: totalVerse > 0 ? Math.round((capitalFinal / totalVerse) * 100) / 100 : 1,
    partInterets: capitalFinal > 0 ? Math.round((interetsGeneres / capitalFinal) * 1000) / 10 : 0
  }
}

/**
 * Calcule le versement initial nécessaire pour atteindre un objectif
 */
function calculerVersementInitial(
  versementMensuel: number,
  dureeAnnees: number,
  tauxAnnuelNet: number,
  capitalObjectif: number
): VersementInitialResult {
  const tauxMensuel = tauxAnnuelNet / 100 / 12
  const nombreMois = dureeAnnees * 12

  // Capital généré par les versements mensuels seuls
  let capitalMensuel = 0
  if (versementMensuel > 0 && tauxMensuel > 0) {
    capitalMensuel = versementMensuel * ((Math.pow(1 + tauxMensuel, nombreMois) - 1) / tauxMensuel)
  } else if (versementMensuel > 0 && tauxMensuel === 0) {
    capitalMensuel = versementMensuel * nombreMois
  }

  // Objectif déjà atteint sans versement initial ?
  if (capitalMensuel >= capitalObjectif) {
    return {
      objectifAtteintSansVI: true,
      capitalProjeteSansVI: Math.round(capitalMensuel),
      message: `Avec vos versements mensuels de ${versementMensuel.toLocaleString('fr-FR')} €, vous atteindrez ${Math.round(capitalMensuel).toLocaleString('fr-FR')} € en ${dureeAnnees} ans, soit plus que votre objectif de ${capitalObjectif.toLocaleString('fr-FR')} €.`
    }
  }

  // Calcul du versement initial nécessaire
  const capitalManquant = capitalObjectif - capitalMensuel
  const facteurCapitalisation = Math.pow(1 + tauxMensuel, nombreMois)
  const versementInitialNecessaire = Math.round(capitalManquant / facteurCapitalisation)

  return {
    objectifAtteintSansVI: false,
    versementInitialNecessaire,
    capitalObjectif: Math.round(capitalObjectif),
    dureeAnnees,
    message: `Pour atteindre ${capitalObjectif.toLocaleString('fr-FR')} € en ${dureeAnnees} ans avec ${versementMensuel.toLocaleString('fr-FR')} €/mois à ${tauxAnnuelNet}%, vous devez placer ${versementInitialNecessaire.toLocaleString('fr-FR')} € au départ.`
  }
}

/**
 * Calcule la durée nécessaire pour atteindre un objectif
 */
function calculerDureeNecessaire(
  versementInitial: number,
  versementMensuel: number,
  tauxAnnuelNet: number,
  capitalObjectif: number
): DureeNecessaireResult {
  // Objectif déjà atteint ?
  if (versementInitial >= capitalObjectif) {
    return {
      objectifDejaAtteint: true,
      message: `Votre versement initial de ${versementInitial.toLocaleString('fr-FR')} € atteint déjà votre objectif de ${capitalObjectif.toLocaleString('fr-FR')} €.`
    }
  }

  const tauxMensuel = tauxAnnuelNet / 100 / 12

  if (versementMensuel <= 0 && tauxMensuel <= 0) {
    return {
      objectifDejaAtteint: false,
      error: 'Des versements mensuels ou un rendement positif sont nécessaires pour atteindre votre objectif.'
    }
  }

  // Calcul itératif
  let capitalCourant = versementInitial
  let mois = 0
  const maxMois = 50 * 12 // Limite à 50 ans

  while (capitalCourant < capitalObjectif && mois < maxMois) {
    mois++
    const interetsMois = capitalCourant * tauxMensuel
    capitalCourant += interetsMois + versementMensuel
  }

  if (mois >= maxMois) {
    return {
      objectifDejaAtteint: false,
      error: `L'objectif de ${capitalObjectif.toLocaleString('fr-FR')} € ne peut pas être atteint dans un délai raisonnable (50 ans maximum).`
    }
  }

  const dureeAnnees = Math.ceil(mois / 12)

  return {
    objectifDejaAtteint: false,
    dureeNecessaire: dureeAnnees,
    moisNecessaires: mois,
    capitalObjectif: Math.round(capitalObjectif),
    capitalFinalAtteint: Math.round(capitalCourant),
    message: `Pour atteindre ${capitalObjectif.toLocaleString('fr-FR')} €, il faudra ${dureeAnnees} ans (${mois} mois) avec un capital final de ${Math.round(capitalCourant).toLocaleString('fr-FR')} €.`
  }
}

/**
 * Compare plusieurs scénarios
 */
function comparerScenarios(scenarios: ScenarioRequest[]): { scenarios: ScenarioResult[], meilleurScenario: string | null } {
  const resultats: ScenarioResult[] = []

  for (const scenario of scenarios) {
    if (!scenario.nom || scenario.dureeAnnees <= 0) continue

    const calcul = calculerCapitalFinal(
      scenario.versementInitial || 0,
      scenario.versementMensuel || 0,
      scenario.dureeAnnees,
      scenario.tauxAnnuelNet || 0
    )

    resultats.push({
      nomScenario: scenario.nom,
      capitalFinal: calcul.capitalFinal,
      totalVerse: calcul.totalVerse,
      interetsGeneres: calcul.interetsGeneres,
      tauxRendementGlobal: calcul.tauxRendementGlobal,
      estMeilleur: false,
      ecartAvecMeilleur: 0
    })
  }

  // Identifier le meilleur
  let meilleurScenario: string | null = null
  if (resultats.length > 0) {
    const meilleurCapital = Math.max(...resultats.map(r => r.capitalFinal))
    resultats.forEach(r => {
      r.estMeilleur = r.capitalFinal === meilleurCapital
      r.ecartAvecMeilleur = r.capitalFinal - meilleurCapital
      if (r.estMeilleur) meilleurScenario = r.nomScenario
    })
  }

  return { scenarios: resultats, meilleurScenario }
}

/**
 * Génère des recommandations personnalisées
 */
function genererRecommandations(
  calculationType: string,
  params: any,
  result: any
): Recommandation[] {
  const recommandations: Recommandation[] = []

  if (calculationType === 'capital_final') {
    const { tauxAnnuelNet, versementMensuel, dureeAnnees, objectif } = params
    const { capitalFinal, partInterets, multiplicateur } = result

    // Rendement faible
    if (tauxAnnuelNet < 2) {
      recommandations.push({
        priorite: 'haute',
        type: 'rendement',
        description: `Avec un rendement de ${tauxAnnuelNet}%, la performance reste limitée. Un placement plus dynamique (4-6%) pourrait significativement améliorer le résultat.`
      })
    }

    // Versements faibles
    if (versementMensuel < 100) {
      recommandations.push({
        priorite: 'moyenne',
        type: 'versement',
        description: `Des versements mensuels de ${versementMensuel} € sont modestes. Augmenter à 200-300 € accélérerait la constitution du capital.`
      })
    }

    // Durée courte
    if (dureeAnnees < 10) {
      recommandations.push({
        priorite: 'moyenne',
        type: 'duree',
        description: `Sur ${dureeAnnees} ans, l'effet des intérêts composés est encore limité. Un horizon de 15-20 ans démultiplierait les gains.`
      })
    }

    // Objectif non atteint
    if (objectif && capitalFinal < objectif) {
      const ecart = objectif - capitalFinal
      const versementSupp = Math.ceil(ecart / (dureeAnnees * 12))
      recommandations.push({
        priorite: 'haute',
        type: 'objectif',
        description: `L'objectif de ${objectif.toLocaleString('fr-FR')} € n'est pas atteint (manque ${ecart.toLocaleString('fr-FR')} €). Augmenter les versements de ~${versementSupp} €/mois comblerait l'écart.`
      })
    }

    // Part des intérêts
    if (partInterets > 30) {
      recommandations.push({
        priorite: 'basse',
        type: 'info',
        description: `Les intérêts représentent ${partInterets}% du capital final. L'effet des intérêts composés est bien exploité (multiplicateur ×${multiplicateur}).`
      })
    }
  }

  if (calculationType === 'versement_initial' && !result.objectifAtteintSansVI) {
    if (result.versementInitialNecessaire > 50000) {
      recommandations.push({
        priorite: 'haute',
        type: 'versement',
        description: `Le versement initial nécessaire (${result.versementInitialNecessaire.toLocaleString('fr-FR')} €) est élevé. Alternatives : allonger la durée, augmenter les versements mensuels, ou viser un rendement plus élevé.`
      })
    }
  }

  if (calculationType === 'duree_necessaire' && !result.objectifDejaAtteint && result.dureeNecessaire) {
    if (result.dureeNecessaire > 20) {
      recommandations.push({
        priorite: 'moyenne',
        type: 'duree',
        description: `La durée nécessaire (${result.dureeNecessaire} ans) est longue. Pour raccourcir : augmenter les versements ou choisir un placement plus performant.`
      })
    }
  }

  return recommandations
}

// ========== PROFILS DE RISQUE PRÉDÉFINIS ==========
const PROFILS_RISQUE = [
  { nom: 'Sécuritaire', rendement: 1.5, description: 'Fonds euros, livrets' },
  { nom: 'Prudent', rendement: 2.5, description: 'Fonds euros + 20% UC défensives' },
  { nom: 'Équilibré', rendement: 4, description: '50% fonds euros, 50% UC diversifiées' },
  { nom: 'Dynamique', rendement: 6, description: '30% fonds euros, 70% UC actions' },
  { nom: 'Agressif', rendement: 8, description: '100% UC actions, long terme' }
]

// ========== API ROUTES ==========

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: {
      name: 'Simulateur Épargne Flexible',
      version: '2.0',
      description: 'Simulateur de projection d\'épargne avec intérêts composés',
      profilsRisque: PROFILS_RISQUE,
      typesCalcul: [
        { code: 'capital_final', description: 'Calcul du capital final avec évolution détaillée' },
        { code: 'versement_initial', description: 'Versement initial nécessaire pour atteindre un objectif' },
        { code: 'duree_necessaire', description: 'Durée pour atteindre un objectif' },
        { code: 'comparer_scenarios', description: 'Comparaison de plusieurs scénarios' }
      ],
      parametresDefaut: {
        versementInitial: 10000,
        versementMensuel: 300,
        dureeAnnees: 15,
        tauxAnnuelNet: 4,
        objectif: 100000
      }
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      calculationType = 'capital_final',
      versementInitial = 0,
      versementMensuel = 0,
      dureeAnnees = 15,
      tauxAnnuelNet = 4,
      objectif = 0,
      scenarios = []
    } = body

    // Validation
    const validTypes = ['capital_final', 'versement_initial', 'duree_necessaire', 'comparer_scenarios']
    if (!validTypes.includes(calculationType)) {
      return NextResponse.json({
        success: false,
        error: `Type de calcul non reconnu: ${calculationType}. Types valides: ${validTypes.join(', ')}`
      }, { status: 400 })
    }

    let resultatPrincipal: any
    let recommandations: Recommandation[] = []

    switch (calculationType) {
      case 'capital_final':
        if (dureeAnnees <= 0) {
          return NextResponse.json({
            success: false,
            error: 'La durée doit être supérieure à 0'
          }, { status: 400 })
        }
        resultatPrincipal = calculerCapitalFinal(
          Math.max(0, versementInitial),
          Math.max(0, versementMensuel),
          Math.min(50, Math.max(1, dureeAnnees)),
          Math.max(0, Math.min(15, tauxAnnuelNet))
        )
        // Ajouter comparaison avec objectif
        if (objectif > 0) {
          resultatPrincipal.objectif = objectif
          resultatPrincipal.objectifAtteint = resultatPrincipal.capitalFinal >= objectif
          resultatPrincipal.ecartObjectif = resultatPrincipal.capitalFinal - objectif
        }
        recommandations = genererRecommandations(calculationType, { ...body, objectif }, resultatPrincipal)
        break

      case 'versement_initial':
        if (objectif <= 0) {
          return NextResponse.json({
            success: false,
            error: 'L\'objectif doit être supérieur à 0'
          }, { status: 400 })
        }
        resultatPrincipal = calculerVersementInitial(
          Math.max(0, versementMensuel),
          Math.min(50, Math.max(1, dureeAnnees)),
          Math.max(0, Math.min(15, tauxAnnuelNet)),
          objectif
        )
        recommandations = genererRecommandations(calculationType, body, resultatPrincipal)
        break

      case 'duree_necessaire':
        if (objectif <= 0) {
          return NextResponse.json({
            success: false,
            error: 'L\'objectif doit être supérieur à 0'
          }, { status: 400 })
        }
        resultatPrincipal = calculerDureeNecessaire(
          Math.max(0, versementInitial),
          Math.max(0, versementMensuel),
          Math.max(0, Math.min(15, tauxAnnuelNet)),
          objectif
        )
        recommandations = genererRecommandations(calculationType, body, resultatPrincipal)
        break

      case 'comparer_scenarios':
        if (!scenarios || scenarios.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'Aucun scénario fourni pour la comparaison'
          }, { status: 400 })
        }
        resultatPrincipal = comparerScenarios(scenarios)
        break

      default:
        return NextResponse.json({
          success: false,
          error: 'Type de calcul non reconnu'
        }, { status: 400 })
    }

    // Comparaison avec profils de risque (pour capital_final)
    let comparaisonProfils: any[] = []
    if (calculationType === 'capital_final' && dureeAnnees > 0) {
      comparaisonProfils = PROFILS_RISQUE.map(profil => {
        const calc = calculerCapitalFinal(versementInitial, versementMensuel, dureeAnnees, profil.rendement)
        return {
          ...profil,
          capitalFinal: calc.capitalFinal,
          interetsGeneres: calc.interetsGeneres,
          objectifAtteint: objectif > 0 ? calc.capitalFinal >= objectif : null
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        typeCalcul: calculationType,
        parametres: {
          versementInitial,
          versementMensuel,
          dureeAnnees,
          tauxAnnuelNet,
          objectif: objectif > 0 ? objectif : null
        },
        resultat: resultatPrincipal,
        recommandations,
        comparaisonProfils: comparaisonProfils.length > 0 ? comparaisonProfils : undefined,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    logger.error('Erreur simulateur épargne:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur lors du calcul'
    }, { status: 500 })
  }
}
