/**
 * Moteur de diagnostic patrimonial
 * Transforme les données brutes en qualificatifs métier CGP
 * 
 * Ce fichier contient UNIQUEMENT des règles métier, aucune UI, aucun PDF
 */

export type DiagnosticLevel = 'EXCELLENT' | 'GOOD' | 'MEDIUM' | 'LOW' | 'CRITICAL'
export type DiagnosticColor = 'green' | 'blue' | 'orange' | 'red'

export interface DiagnosticResult {
  level: DiagnosticLevel
  label: string
  comment: string
  color: DiagnosticColor
  icon: string // emoji
}

export interface PatrimoineDiagnostic {
  global: DiagnosticResult
  concentration: DiagnosticResult
  diversification: DiagnosticResult
  evolution: DiagnosticResult
  gestion: DiagnosticResult
}

export interface BudgetDiagnostic {
  endettement: DiagnosticResult
  epargne: DiagnosticResult
  capaciteEmprunt: DiagnosticResult
  equilibre: DiagnosticResult
}

export interface FiscaliteDiagnostic {
  charge: DiagnosticResult
  optimisation: DiagnosticResult
  ifi: DiagnosticResult
}

export interface ObjectifsDiagnostic {
  progression: DiagnosticResult
  coherence: DiagnosticResult
  horizon: DiagnosticResult
}

export interface GlobalDiagnostic {
  patrimoine: PatrimoineDiagnostic
  budget: BudgetDiagnostic
  fiscalite: FiscaliteDiagnostic
  objectifs: ObjectifsDiagnostic
  forces: string[]
  vigilances: string[]
  recommandations: string[]
  verdict: DiagnosticResult
}

// ============================================================
// SEUILS MÉTIER (standards CGP / HCSF / AMF)
// ============================================================

const SEUILS = {
  endettement: {
    excellent: 20,
    bon: 25,
    acceptable: 33,
    eleve: 35,
  },
  epargne: {
    excellent: 30, // % des revenus
    bon: 20,
    moyen: 10,
    faible: 5,
  },
  concentration: {
    acceptable: 50, // % max d'une classe d'actifs
    elevee: 70,
    critique: 85,
  },
  tmi: {
    faible: 11,
    moyen: 30,
    eleve: 41,
    tres_eleve: 45,
  },
  objectifProgression: {
    excellent: 80,
    bon: 60,
    moyen: 40,
    faible: 20,
  },
  tauxGestion: {
    excellent: 80,
    bon: 50,
    moyen: 30,
  },
}

// ============================================================
// DIAGNOSTIC ENDETTEMENT
// ============================================================

export function analyzeEndettement(tauxEndettement: number): DiagnosticResult {
  if (tauxEndettement <= SEUILS.endettement.excellent) {
    return {
      level: 'EXCELLENT',
      label: 'Endettement très maîtrisé',
      comment: `Le taux d'endettement de ${tauxEndettement.toFixed(1)}% est largement inférieur aux seuils réglementaires, offrant une marge de manœuvre significative pour de nouveaux projets d'investissement ou d'acquisition.`,
      color: 'green',
      icon: '',
    }
  }

  if (tauxEndettement <= SEUILS.endettement.bon) {
    return {
      level: 'GOOD',
      label: 'Endettement maîtrisé',
      comment: `Le taux d'endettement de ${tauxEndettement.toFixed(1)}% reste confortable et conforme aux bonnes pratiques patrimoniales, laissant une capacité d'emprunt disponible.`,
      color: 'green',
      icon: '',
    }
  }

  if (tauxEndettement <= SEUILS.endettement.acceptable) {
    return {
      level: 'MEDIUM',
      label: 'Endettement sous contrôle',
      comment: `Le taux d'endettement de ${tauxEndettement.toFixed(1)}% approche les seuils de vigilance HCSF mais reste dans les limites acceptables. Une attention particulière est recommandée avant tout nouvel engagement.`,
      color: 'orange',
      icon: '',
    }
  }

  if (tauxEndettement <= SEUILS.endettement.eleve) {
    return {
      level: 'LOW',
      label: 'Endettement élevé',
      comment: `Le taux d'endettement de ${tauxEndettement.toFixed(1)}% atteint le seuil réglementaire HCSF de 35%. La capacité d'emprunt est désormais contrainte, privilégier le désendettement ou le réaménagement.`,
      color: 'orange',
      icon: '',
    }
  }

  return {
    level: 'CRITICAL',
    label: 'Surendettement',
    comment: `Le taux d'endettement de ${tauxEndettement.toFixed(1)}% dépasse les seuils réglementaires. Une restructuration des dettes ou un accompagnement spécialisé est recommandé.`,
    color: 'red',
    icon: '',
  }
}

// ============================================================
// DIAGNOSTIC ÉPARGNE
// ============================================================

export function analyzeEpargne(tauxEpargne: number, capaciteMensuelle: number): DiagnosticResult {
  if (tauxEpargne >= SEUILS.epargne.excellent) {
    return {
      level: 'EXCELLENT',
      label: 'Capacité d\'épargne exceptionnelle',
      comment: `Avec un taux d'épargne de ${tauxEpargne.toFixed(1)}% et une capacité mensuelle de ${formatCurrency(capaciteMensuelle)}, la situation permet d'envisager des projets patrimoniaux ambitieux à court et moyen terme.`,
      color: 'green',
      icon: '',
    }
  }

  if (tauxEpargne >= SEUILS.epargne.bon) {
    return {
      level: 'GOOD',
      label: 'Bonne capacité d\'épargne',
      comment: `Le taux d'épargne de ${tauxEpargne.toFixed(1)}% traduit une gestion budgétaire saine et permet de constituer progressivement un patrimoine financier.`,
      color: 'green',
      icon: '',
    }
  }

  if (tauxEpargne >= SEUILS.epargne.moyen) {
    return {
      level: 'MEDIUM',
      label: 'Capacité d\'épargne modérée',
      comment: `Le taux d'épargne de ${tauxEpargne.toFixed(1)}% permet une épargne régulière mais limitée. Une optimisation des charges pourrait dégager des marges supplémentaires.`,
      color: 'orange',
      icon: '',
    }
  }

  if (tauxEpargne >= SEUILS.epargne.faible) {
    return {
      level: 'LOW',
      label: 'Capacité d\'épargne faible',
      comment: `Le taux d'épargne de ${tauxEpargne.toFixed(1)}% reste limité. Il conviendrait d'analyser la structure des charges pour identifier des leviers d'optimisation.`,
      color: 'orange',
      icon: '',
    }
  }

  return {
    level: 'CRITICAL',
    label: 'Épargne insuffisante',
    comment: `Le taux d'épargne actuel ne permet pas de constituer une réserve financière suffisante. Un travail sur le budget est recommandé en priorité.`,
    color: 'red',
    icon: '',
  }
}

// ============================================================
// DIAGNOSTIC CONCENTRATION PATRIMONIALE
// ============================================================

export function analyzeConcentration(repartition: { categorie: string; pourcentage: number }[]): DiagnosticResult {
  const maxConcentration = Math.max(...repartition.map(r => r.pourcentage))
  const categorieMax = repartition.find(r => r.pourcentage === maxConcentration)?.categorie || 'Non identifié'

  if (maxConcentration <= SEUILS.concentration.acceptable) {
    return {
      level: 'EXCELLENT',
      label: 'Patrimoine diversifié',
      comment: `La répartition patrimoniale est équilibrée avec aucune classe d'actifs dépassant ${maxConcentration.toFixed(0)}%. Cette diversification constitue une protection naturelle contre les aléas de marché.`,
      color: 'green',
      icon: '',
    }
  }

  if (maxConcentration <= SEUILS.concentration.elevee) {
    return {
      level: 'MEDIUM',
      label: 'Concentration modérée',
      comment: `Le patrimoine est orienté à ${maxConcentration.toFixed(0)}% vers ${categorieMax}. Cette concentration reste acceptable mais mériterait une diversification progressive.`,
      color: 'orange',
      icon: '',
    }
  }

  if (maxConcentration <= SEUILS.concentration.critique) {
    return {
      level: 'LOW',
      label: 'Concentration élevée',
      comment: `Avec ${maxConcentration.toFixed(0)}% du patrimoine concentré sur ${categorieMax}, l'exposition au risque sectoriel est significative. Une stratégie de diversification serait pertinente.`,
      color: 'orange',
      icon: '',
    }
  }

  return {
    level: 'CRITICAL',
    label: 'Concentration critique',
    comment: `Le patrimoine est très concentré (${maxConcentration.toFixed(0)}% sur ${categorieMax}). Cette situation expose à un risque de perte significatif en cas de retournement sectoriel.`,
    color: 'red',
    icon: '',
  }
}

// ============================================================
// DIAGNOSTIC FISCALITÉ
// ============================================================

export function analyzeFiscalite(tmi: number, tauxEffectif: number, revenuImposable: number): DiagnosticResult {
  if (tmi <= SEUILS.tmi.faible) {
    return {
      level: 'EXCELLENT',
      label: 'Fiscalité légère',
      comment: `Avec une TMI de ${tmi}% et un taux effectif de ${tauxEffectif.toFixed(1)}%, la pression fiscale reste modérée et ne constitue pas un enjeu prioritaire.`,
      color: 'green',
      icon: '',
    }
  }

  if (tmi <= SEUILS.tmi.moyen) {
    return {
      level: 'GOOD',
      label: 'Fiscalité modérée',
      comment: `La tranche marginale de ${tmi}% place la situation dans une zone intermédiaire. Des optimisations ciblées peuvent être envisagées selon les objectifs.`,
      color: 'green',
      icon: '',
    }
  }

  if (tmi <= SEUILS.tmi.eleve) {
    return {
      level: 'MEDIUM',
      label: 'Enjeu fiscal significatif',
      comment: `Avec une TMI de ${tmi}% et un revenu imposable de ${formatCurrency(revenuImposable)}, la fiscalité constitue un paramètre structurant. Des stratégies d'optimisation (PER, démembrement, capitalisation) méritent d'être étudiées.`,
      color: 'orange',
      icon: '',
    }
  }

  return {
    level: 'LOW',
    label: 'Enjeu fiscal majeur',
    comment: `La tranche marginale de ${tmi}% impose une réflexion approfondie sur l'optimisation fiscale. Chaque euro investi en déduction génère un effet de levier de ${tmi}%.`,
    color: 'red',
    icon: '',
  }
}

// ============================================================
// DIAGNOSTIC IFI
// ============================================================

export function analyzeIFI(patrimoineImmobilierNet: number): DiagnosticResult {
  const seuilIFI = 1300000

  if (patrimoineImmobilierNet < seuilIFI) {
    return {
      level: 'EXCELLENT',
      label: 'Non assujetti à l\'IFI',
      comment: `Le patrimoine immobilier net de ${formatCurrency(patrimoineImmobilierNet)} reste en dessous du seuil d'assujettissement à l'IFI (1,3 M€).`,
      color: 'green',
      icon: '',
    }
  }

  const margeIFI = patrimoineImmobilierNet - seuilIFI

  if (margeIFI < 500000) {
    return {
      level: 'MEDIUM',
      label: 'Assujetti à l\'IFI (tranche basse)',
      comment: `Le patrimoine immobilier net dépasse le seuil IFI de ${formatCurrency(margeIFI)}. Des stratégies de démembrement ou de dette peuvent être envisagées.`,
      color: 'orange',
      icon: '',
    }
  }

  return {
    level: 'LOW',
    label: 'Assujetti à l\'IFI (tranche haute)',
    comment: `L'IFI représente un enjeu fiscal significatif. Une optimisation de la structure patrimoniale immobilière serait pertinente.`,
    color: 'red',
    icon: '',
  }
}

// ============================================================
// DIAGNOSTIC OBJECTIFS
// ============================================================

export function analyzeObjectifProgression(progression: number, horizon: string): DiagnosticResult {
  if (progression >= SEUILS.objectifProgression.excellent) {
    return {
      level: 'EXCELLENT',
      label: 'Objectif quasi atteint',
      comment: `Avec ${progression.toFixed(0)}% de l'objectif réalisé, la trajectoire est excellente. Le cap fixé pour ${horizon} sera probablement dépassé.`,
      color: 'green',
      icon: '',
    }
  }

  if (progression >= SEUILS.objectifProgression.bon) {
    return {
      level: 'GOOD',
      label: 'Sur la bonne trajectoire',
      comment: `L'avancement de ${progression.toFixed(0)}% place l'objectif sur une trajectoire favorable, sous réserve de maintenir l'effort d'épargne actuel.`,
      color: 'green',
      icon: '',
    }
  }

  if (progression >= SEUILS.objectifProgression.moyen) {
    return {
      level: 'MEDIUM',
      label: 'Progression modérée',
      comment: `Avec ${progression.toFixed(0)}% réalisé, l'objectif reste atteignable mais nécessite une accélération de l'effort ou un réajustement du cap.`,
      color: 'orange',
      icon: '',
    }
  }

  if (progression >= SEUILS.objectifProgression.faible) {
    return {
      level: 'LOW',
      label: 'Progression insuffisante',
      comment: `La progression actuelle de ${progression.toFixed(0)}% risque de ne pas permettre d'atteindre l'objectif dans les délais. Un plan d'action correctif est recommandé.`,
      color: 'orange',
      icon: '',
    }
  }

  return {
    level: 'CRITICAL',
    label: 'Objectif compromis',
    comment: `Avec seulement ${progression.toFixed(0)}% de l'objectif atteint, il convient de revoir soit l'objectif, soit la stratégie d'épargne.`,
    color: 'red',
    icon: '',
  }
}

// ============================================================
// DIAGNOSTIC TAUX DE GESTION
// ============================================================

export function analyzeTauxGestion(tauxGestion: number, patrimoineGere: number, patrimoineTotal: number): DiagnosticResult {
  if (tauxGestion >= SEUILS.tauxGestion.excellent) {
    return {
      level: 'EXCELLENT',
      label: 'Patrimoine bien accompagné',
      comment: `Avec ${tauxGestion.toFixed(0)}% du patrimoine sous gestion, le suivi est optimal et permet une réactivité maximale face aux opportunités.`,
      color: 'green',
      icon: '',
    }
  }

  if (tauxGestion >= SEUILS.tauxGestion.bon) {
    return {
      level: 'GOOD',
      label: 'Accompagnement partiel',
      comment: `${formatCurrency(patrimoineGere)} sont sous gestion conseillée (${tauxGestion.toFixed(0)}%). Une extension de l'accompagnement pourrait optimiser la performance globale.`,
      color: 'green',
      icon: '',
    }
  }

  if (tauxGestion >= SEUILS.tauxGestion.moyen) {
    return {
      level: 'MEDIUM',
      label: 'Potentiel d\'accompagnement',
      comment: `Seul ${tauxGestion.toFixed(0)}% du patrimoine bénéficie d'un accompagnement structuré. ${formatCurrency(patrimoineTotal - patrimoineGere)} restent non gérés.`,
      color: 'orange',
      icon: '',
    }
  }

  return {
    level: 'LOW',
    label: 'Patrimoine peu accompagné',
    comment: `La majorité du patrimoine (${(100 - tauxGestion).toFixed(0)}%) n'est pas sous gestion conseillée. Un accompagnement élargi permettrait d'optimiser la stratégie globale.`,
    color: 'orange',
    icon: '',
  }
}

// ============================================================
// DIAGNOSTIC GLOBAL
// ============================================================

export interface ClientData {
  patrimoine: {
    totalActifs: number
    totalPassifs: number
    patrimoineNet: number
    patrimoineGere: number
    repartition: { categorie: string; montant: number; pourcentage: number }[]
    evolutionAnnuelle?: number
  }
  budget: {
    revenus: number
    charges: number
    credits: number
    epargne: number
    tauxEndettement: number
    tauxEpargne: number
  }
  fiscalite: {
    revenuImposable: number
    impotRevenu: number
    tauxEffectif: number
    tmi: number
    patrimoineImmobilierNet: number
  }
  objectifs: {
    principal: string
    montantCible: number
    montantActuel: number
    progression: number
    horizon: string
  }
  client: {
    prenom: string
    nom: string
    email?: string
  }
}

export function generateGlobalDiagnostic(data: ClientData): GlobalDiagnostic {
  // Diagnostics individuels
  const endettement = analyzeEndettement(data.budget.tauxEndettement)
  const epargne = analyzeEpargne(data.budget.tauxEpargne, data.budget.epargne)
  const concentration = analyzeConcentration(data.patrimoine.repartition)
  const fiscalite = analyzeFiscalite(data.fiscalite.tmi, data.fiscalite.tauxEffectif, data.fiscalite.revenuImposable)
  const ifi = analyzeIFI(data.fiscalite.patrimoineImmobilierNet)
  const objectifProgression = analyzeObjectifProgression(data.objectifs.progression, data.objectifs.horizon)
  const tauxGestion = analyzeTauxGestion(
    (data.patrimoine.patrimoineGere / data.patrimoine.totalActifs) * 100,
    data.patrimoine.patrimoineGere,
    data.patrimoine.totalActifs
  )

  // Calcul du score global
  const scores: Record<DiagnosticLevel, number> = {
    EXCELLENT: 5,
    GOOD: 4,
    MEDIUM: 3,
    LOW: 2,
    CRITICAL: 1,
  }

  const allDiagnostics = [endettement, epargne, concentration, fiscalite, objectifProgression]
  const averageScore = allDiagnostics.reduce((sum, d) => sum + scores[d.level], 0) / allDiagnostics.length

  // Forces et vigilances
  const forces: string[] = []
  const vigilances: string[] = []

  if (endettement.level === 'EXCELLENT' || endettement.level === 'GOOD') {
    forces.push('Endettement maîtrisé')
  } else if (endettement.level === 'LOW' || endettement.level === 'CRITICAL') {
    vigilances.push('Niveau d\'endettement à surveiller')
  }

  if (epargne.level === 'EXCELLENT' || epargne.level === 'GOOD') {
    forces.push('Forte capacité d\'épargne')
  } else if (epargne.level === 'LOW' || epargne.level === 'CRITICAL') {
    vigilances.push('Capacité d\'épargne limitée')
  }

  if (concentration.level === 'EXCELLENT') {
    forces.push('Patrimoine diversifié')
  } else if (concentration.level === 'LOW' || concentration.level === 'CRITICAL') {
    vigilances.push('Concentration patrimoniale élevée')
  }

  if (data.patrimoine.patrimoineNet > 500000) {
    forces.push('Patrimoine net significatif')
  }

  if (fiscalite.level === 'LOW' || fiscalite.level === 'CRITICAL') {
    vigilances.push('Enjeu fiscal important')
  }

  if (tauxGestion.level === 'LOW') {
    vigilances.push('Part non gérée importante')
  }

  // Recommandations automatiques
  const recommandations: string[] = []

  if (concentration.level !== 'EXCELLENT') {
    recommandations.push('Renforcer la diversification patrimoniale')
  }

  if (fiscalite.level === 'MEDIUM' || fiscalite.level === 'LOW') {
    recommandations.push('Étudier les stratégies d\'optimisation fiscale (PER, AV)')
  }

  if (objectifProgression.level !== 'EXCELLENT' && objectifProgression.level !== 'GOOD') {
    recommandations.push('Accélérer l\'effort d\'épargne retraite')
  }

  if (tauxGestion.level === 'LOW' || tauxGestion.level === 'MEDIUM') {
    recommandations.push('Élargir l\'accompagnement sur le patrimoine non géré')
  }

  if (epargne.level === 'EXCELLENT' && endettement.level === 'EXCELLENT') {
    recommandations.push('Opportunité d\'investissement supplémentaire')
  }

  // Verdict global
  let verdict: DiagnosticResult
  if (averageScore >= 4.5) {
    verdict = {
      level: 'EXCELLENT',
      label: 'Situation patrimoniale excellente',
      comment: 'La situation patrimoniale est solide, cohérente et évolutive. Elle constitue une base favorable pour mettre en place une stratégie patrimoniale optimisée et durable.',
      color: 'green',
      icon: '',
    }
  } else if (averageScore >= 3.5) {
    verdict = {
      level: 'GOOD',
      label: 'Situation patrimoniale saine',
      comment: 'La situation patrimoniale présente de nombreux atouts et quelques axes d\'amélioration identifiés. Une optimisation ciblée permettrait de renforcer encore la solidité globale.',
      color: 'green',
      icon: '',
    }
  } else if (averageScore >= 2.5) {
    verdict = {
      level: 'MEDIUM',
      label: 'Situation patrimoniale correcte',
      comment: 'La situation patrimoniale nécessite une attention particulière sur plusieurs points. Un plan d\'action structuré permettrait d\'améliorer significativement la trajectoire.',
      color: 'orange',
      icon: '',
    }
  } else {
    verdict = {
      level: 'LOW',
      label: 'Situation patrimoniale à consolider',
      comment: 'La situation patrimoniale présente des fragilités importantes nécessitant des mesures correctives prioritaires.',
      color: 'red',
      icon: '',
    }
  }

  return {
    patrimoine: {
      global: {
        level: data.patrimoine.patrimoineNet > 500000 ? 'EXCELLENT' : data.patrimoine.patrimoineNet > 200000 ? 'GOOD' : 'MEDIUM',
        label: `Patrimoine net de ${formatCurrency(data.patrimoine.patrimoineNet)}`,
        comment: `Le patrimoine global s'élève à ${formatCurrency(data.patrimoine.totalActifs)}, pour un patrimoine net de ${formatCurrency(data.patrimoine.patrimoineNet)}. Il s'agit d'un patrimoine ${data.patrimoine.patrimoineNet > 500000 ? 'significatif' : 'en construction'}, structuré et en évolution.`,
        color: data.patrimoine.patrimoineNet > 500000 ? 'green' : 'blue',
        icon: '',
      },
      concentration,
      diversification: concentration,
      evolution: {
        level: (data.patrimoine.evolutionAnnuelle || 0) > 0 ? 'GOOD' : 'MEDIUM',
        label: 'Évolution positive',
        comment: `Le patrimoine a progressé de ${formatCurrency(data.patrimoine.evolutionAnnuelle || 0)} sur les 12 derniers mois, traduisant une dynamique de croissance régulière.`,
        color: 'green',
        icon: '',
      },
      gestion: tauxGestion,
    },
    budget: {
      endettement,
      epargne,
      capaciteEmprunt: endettement.level === 'EXCELLENT' || endettement.level === 'GOOD' 
        ? { level: 'GOOD', label: 'Capacité disponible', comment: 'La capacité d\'emprunt reste significative.', color: 'green', icon: '' }
        : { level: 'LOW', label: 'Capacité limitée', comment: 'La capacité d\'emprunt est contrainte.', color: 'orange', icon: '' },
      equilibre: {
        level: data.budget.epargne > 0 ? 'GOOD' : 'LOW',
        label: data.budget.epargne > 0 ? 'Budget équilibré' : 'Budget tendu',
        comment: data.budget.epargne > 0 
          ? `Le budget dégage un excédent mensuel de ${formatCurrency(data.budget.epargne)}.`
          : 'Le budget est actuellement déficitaire.',
        color: data.budget.epargne > 0 ? 'green' : 'red',
        icon: '',
      },
    },
    fiscalite: {
      charge: fiscalite,
      optimisation: {
        level: fiscalite.level === 'LOW' ? 'EXCELLENT' : fiscalite.level === 'MEDIUM' ? 'GOOD' : 'MEDIUM',
        label: fiscalite.level === 'LOW' ? 'Fort potentiel' : 'Potentiel modéré',
        comment: fiscalite.level === 'LOW' 
          ? 'Le niveau de TMI offre un effet de levier important sur les dispositifs de déduction.'
          : 'Des optimisations ciblées restent possibles.',
        color: fiscalite.level === 'LOW' ? 'green' : 'blue',
        icon: '',
      },
      ifi,
    },
    objectifs: {
      progression: objectifProgression,
      coherence: {
        level: 'GOOD',
        label: 'Objectifs cohérents',
        comment: 'Les objectifs patrimoniaux sont clairement identifiés et cohérents avec la situation financière.',
        color: 'green',
        icon: '',
      },
      horizon: {
        level: 'GOOD',
        label: `Horizon ${data.objectifs.horizon}`,
        comment: `L'horizon de projection permet de mettre en place une stratégie structurée.`,
        color: 'blue',
        icon: '',
      },
    },
    forces,
    vigilances,
    recommandations,
    verdict,
  }
}

// ============================================================
// UTILITAIRES
// ============================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}
