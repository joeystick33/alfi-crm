/**
 * Générateur de textes narratifs pour bilan patrimonial
 * Transforme les diagnostics en paragraphes rédigés professionnellement
 * 
 * Style : CGP / Banque Privée / Family Office
 * 
 * RÈGLE FONDAMENTALE : Un vrai bilan n'explique PAS les chiffres.
 * Il explique ce que les chiffres DISENT de la situation du client.
 * Le commentaire doit : interpréter, qualifier, projeter, recommander.
 */

import { GlobalDiagnostic, ClientData } from './diagnostic.engine'

export interface BilanSection {
  id: string
  title: string
  subtitle?: string
  icon: string
  pageNumber: number
  introduction?: string
  paragraphs: { title?: string; content: string }[]
  highlights?: { label: string; value: string; icon?: string; status?: 'success' | 'warning' | 'neutral' }[]
  alerts?: { typeCode: 'success' | 'warning' | 'info' | 'danger'; title?: string; message: string }[]
  tableData?: { title?: string; headers: string[]; rows: string[][] }[]
  chartData?: {
    type: 'pie' | 'bar' | 'line'
    title?: string
    data: { label: string; value: number; color?: string }[]
  }
}

export interface BilanComplet {
  client: {
    prenom: string
    nom: string
    email?: string
  }
  dateGeneration: Date
  sections: BilanSection[]
  diagnostic: GlobalDiagnostic
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatPercent = (value: number): string => {
  return `${value.toFixed(1)} %`
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

// Symboles texte pour remplacer les emojis (jsPDF ne supporte pas Unicode emoji)
const ICONS = {
  document: '[DOC]',
  home: '[IMM]',
  chart: '[+]',
  money: '[EUR]',
  target: '[OBJ]',
  calendar: '[CAL]',
  check: '[OK]',
  warning: '[!]',
  info: '[i]',
  arrow_up: '[^]',
  arrow_down: '[v]',
  star: '[*]',
  bullet: '-',
  success: '[+]',
  danger: '[X]',
}

// Qualificatifs dynamiques basés sur les seuils
const getPatrimoineQualificatif = (montant: number): string => {
  if (montant >= 2000000) return 'très significatif'
  if (montant >= 1000000) return 'significatif'
  if (montant >= 500000) return 'solide'
  if (montant >= 200000) return 'en construction'
  return 'modeste'
}

const getRevenusQualificatif = (montant: number): string => {
  if (montant >= 15000) return 'très élevé'
  if (montant >= 10000) return 'élevé'
  if (montant >= 6000) return 'confortable'
  if (montant >= 3500) return 'correct'
  return 'modéré'
}

const getChargesQualificatif = (ratio: number): string => {
  if (ratio <= 0.20) return 'très contenu'
  if (ratio <= 0.35) return 'contenu'
  if (ratio <= 0.50) return 'modéré'
  return 'significatif'
}

// ============================================================
// PAGE 1 : COUVERTURE (Executive-ready)
// ============================================================

export function buildCouverture(data: ClientData, diagnostic: GlobalDiagnostic): BilanSection {
  const patrimoineQualif = getPatrimoineQualificatif(data.patrimoine.patrimoineNet)
  
  return {
    id: 'couverture',
    title: 'Rapport de Synthèse Patrimoniale',
    subtitle: `${data.client.prenom} ${data.client.nom}`,
    icon: '',
    pageNumber: 1,
    introduction: `Ce bilan patrimonial a pour objectif de fournir une vision globale, structurée et actualisée de la situation patrimoniale de ${data.client.prenom} ${data.client.nom}, afin d'évaluer sa solidité financière, sa capacité de projection et les axes d'optimisation envisageables.`,
    paragraphs: [
      {
        title: 'Synthèse exécutive',
        content: `A date, le patrimoine global s'élève à ${formatCurrency(data.patrimoine.totalActifs)}, pour un patrimoine net de ${formatCurrency(data.patrimoine.patrimoineNet)}. Il s'agit d'un patrimoine ${patrimoineQualif}, structuré et en évolution ${(data.patrimoine.evolutionAnnuelle || 0) > 0 ? 'positive' : 'stable'}.`
      },
      {
        content: diagnostic.verdict.comment
      }
    ],
    highlights: [
      { label: 'Patrimoine net', value: formatCurrency(data.patrimoine.patrimoineNet), icon: '', status: 'success' },
      { label: 'Patrimoine brut', value: formatCurrency(data.patrimoine.totalActifs), icon: '', status: 'neutral' },
      { label: 'Taux d\'endettement', value: formatPercent(data.budget.tauxEndettement), icon: '', status: data.budget.tauxEndettement <= 25 ? 'success' : data.budget.tauxEndettement <= 35 ? 'warning' : 'warning' },
      { label: 'Taux d\'épargne', value: formatPercent(data.budget.tauxEpargne), icon: '', status: data.budget.tauxEpargne >= 20 ? 'success' : 'neutral' },
      { label: 'Capacité d\'épargne', value: `${formatCurrency(data.budget.epargne)} / mois`, icon: '', status: 'success' },
      { label: 'TMI', value: `${data.fiscalite.tmi} %`, icon: '', status: data.fiscalite.tmi >= 41 ? 'warning' : 'neutral' },
    ],
    alerts: [
      { 
        typeCode: diagnostic.verdict.level === 'EXCELLENT' || diagnostic.verdict.level === 'GOOD' ? 'success' : 'warning', 
        title: 'Diagnostic',
        message: diagnostic.verdict.label + '. ' + (diagnostic.verdict.level === 'EXCELLENT' || diagnostic.verdict.level === 'GOOD' 
          ? 'Situation financière solide, endettement maîtrisé et forte capacité d\'investissement.'
          : 'Des axes d\'amélioration sont identifiés et méritent une attention particulière.')
      },
    ],
  }
}

// ============================================================
// PAGE 2 : PATRIMOINE GLOBAL
// ============================================================

export function buildPatrimoineGlobal(data: ClientData, diagnostic: GlobalDiagnostic): BilanSection {
  const tauxGestion = (data.patrimoine.patrimoineGere / data.patrimoine.totalActifs) * 100
  const patrimoineNonGere = data.patrimoine.totalActifs - data.patrimoine.patrimoineGere
  
  // Trouver la catégorie dominante
  const categorieMax = data.patrimoine.repartition.reduce((max, r) => r.pourcentage > max.pourcentage ? r : max, data.patrimoine.repartition[0])
  
  return {
    id: 'patrimoine',
    title: 'Patrimoine Global',
    subtitle: 'Répartition et structure patrimoniale',
    icon: '',
    pageNumber: 2,
    paragraphs: [
      {
        title: 'Vue d\'ensemble',
        content: `Le patrimoine global de ${data.client.prenom} ${data.client.nom} s'élève à ${formatCurrency(data.patrimoine.totalActifs)}, pour un patrimoine net de ${formatCurrency(data.patrimoine.patrimoineNet)}. La structure patrimoniale est majoritairement orientée vers ${categorieMax?.categorie?.toLowerCase() || 'l\'immobilier'}, qui représente ${categorieMax?.pourcentage?.toFixed(0) || 0}% des actifs, traduisant une stratégie patrimoniale ${categorieMax?.pourcentage > 70 ? 'sécurisée mais relativement concentrée' : 'équilibrée et diversifiée'}.`
      },
      {
        title: 'Analyse de la structure',
        content: diagnostic.patrimoine.concentration.comment + ' ' + (diagnostic.patrimoine.concentration.level === 'EXCELLENT' || diagnostic.patrimoine.concentration.level === 'GOOD' 
          ? 'Cette diversification constitue une protection naturelle contre les aléas de marché.'
          : 'La part financière reste significative mais perfectible, laissant entrevoir des marges de diversification et d\'optimisation.')
      },
      {
        title: 'Accompagnement',
        content: `Actuellement, ${formatCurrency(data.patrimoine.patrimoineGere)} sont sous gestion conseillée, soit ${tauxGestion.toFixed(0)}% du patrimoine total. ${patrimoineNonGere > 0 ? `${formatCurrency(patrimoineNonGere)} restent non gérés, représentant un potentiel significatif d'optimisation.` : 'L\'ensemble du patrimoine bénéficie d\'un accompagnement structuré.'}`
      }
    ],
    highlights: [
      { label: 'Total actifs', value: formatCurrency(data.patrimoine.totalActifs), icon: '', status: 'neutral' },
      { label: 'Total passifs', value: formatCurrency(-data.patrimoine.totalPassifs), icon: '', status: 'neutral' },
      { label: 'Patrimoine net', value: formatCurrency(data.patrimoine.patrimoineNet), icon: '', status: 'success' },
      { label: 'Patrimoine géré', value: formatCurrency(data.patrimoine.patrimoineGere), icon: '', status: 'neutral' },
      { label: 'Patrimoine non géré', value: formatCurrency(patrimoineNonGere), icon: '', status: patrimoineNonGere > data.patrimoine.totalActifs * 0.5 ? 'warning' : 'neutral' },
      { label: 'Taux de gestion', value: formatPercent(tauxGestion), icon: '', status: tauxGestion >= 50 ? 'success' : 'warning' },
    ],
    chartData: {
      type: 'pie',
      title: 'Répartition du patrimoine',
      data: data.patrimoine.repartition.map((r, i) => ({
        label: r.categorie,
        value: r.pourcentage,
        color: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'][i % 5],
      })),
    },
    alerts: [
      { 
        typeCode: tauxGestion < 30 ? 'warning' : 'info', 
        title: 'Conseil',
        message: tauxGestion < 30 
          ? 'Potentiel significatif d\'optimisation sur la part non gérée. Un accompagnement élargi permettrait d\'améliorer la performance globale.'
          : 'Le niveau d\'accompagnement actuel permet un suivi adapté de la stratégie patrimoniale.'
      },
    ],
  }
}

// ============================================================
// PAGE 3 : ÉVOLUTION DU PATRIMOINE
// ============================================================

export function buildEvolution(data: ClientData, diagnostic: GlobalDiagnostic): BilanSection {
  const evolution = data.patrimoine.evolutionAnnuelle || 0
  const isPositive = evolution > 0
  const tauxCroissance = data.patrimoine.patrimoineNet > 0 ? (evolution / (data.patrimoine.patrimoineNet - evolution)) * 100 : 0
  
  return {
    id: 'evolution',
    title: 'Évolution du Patrimoine',
    subtitle: 'Analyse de la dynamique patrimoniale',
    icon: '',
    pageNumber: 3,
    paragraphs: [
      {
        title: 'Dynamique globale',
        content: `L'évolution du patrimoine sur les douze derniers mois montre une progression ${isPositive ? 'régulière et positive' : 'à surveiller'}, ${isPositive ? 'sans rupture ni volatilité excessive' : 'nécessitant une attention particulière'}. Cette ${isPositive ? 'croissance maîtrisée est le signe d\'un patrimoine bien tenu, avec une trajectoire positive et lisible' : 'situation appelle une analyse approfondie des flux et des allocations'}.`
      },
      {
        title: 'Performance annuelle',
        content: `Le patrimoine net a ${isPositive ? 'progressé' : 'évolué'} de ${formatCurrency(Math.abs(evolution))} sur la période, ${isPositive ? `soit une croissance de ${tauxCroissance.toFixed(1)}%. Cette performance témoigne d'une gestion patrimoniale efficace et d'un effort d'épargne régulier.` : 'ce qui invite à analyser les facteurs explicatifs et à identifier les leviers d\'amélioration.'}`
      },
      {
        title: 'Perspective CGP',
        content: isPositive 
          ? 'Cette trajectoire ascendante constitue un signal positif pour les établissements bancaires et démontre une capacité à construire du patrimoine de manière pérenne. Le profil présente les caractéristiques d\'un investisseur structuré et discipliné.'
          : 'Une analyse détaillée des flux entrants et sortants permettrait d\'identifier les axes d\'optimisation et de définir un plan d\'action adapté.'
      }
    ],
    highlights: [
      { label: 'Progression annuelle', value: formatCurrency(evolution), icon: '', status: isPositive ? 'success' : 'warning' },
      { label: 'Taux de croissance', value: formatPercent(tauxCroissance), icon: '', status: tauxCroissance > 5 ? 'success' : 'neutral' },
      { label: 'Actifs', value: 'Stables', icon: '', status: 'success' },
      { label: 'Passifs', value: formatCurrency(data.patrimoine.totalPassifs), icon: '', status: 'neutral' },
    ],
    alerts: [
      { 
        typeCode: isPositive ? 'success' : 'info', 
        title: 'Lecture banque / CGP',
        message: isPositive 
          ? 'Croissance régulière et maîtrisée. Profil rassurant pour les établissements financiers.'
          : 'Une analyse complémentaire permettrait d\'identifier les leviers de croissance.'
      },
    ],
  }
}

// ============================================================
// PAGE 4 : BUDGET & CAPACITÉ FINANCIÈRE
// ============================================================

export function buildBudget(data: ClientData, diagnostic: GlobalDiagnostic): BilanSection {
  const revenusQualif = getRevenusQualificatif(data.budget.revenus)
  const chargesRatio = data.budget.revenus > 0 ? data.budget.charges / data.budget.revenus : 0
  const chargesQualif = getChargesQualificatif(chargesRatio)
  const isHCSFConforme = data.budget.tauxEndettement <= 35
  const resteAVivre = data.budget.revenus - data.budget.charges - data.budget.credits
  
  return {
    id: 'budget',
    title: 'Budget & Capacité Financière',
    subtitle: 'Analyse des flux et de la capacité d\'action',
    icon: '',
    pageNumber: 4,
    paragraphs: [
      {
        title: 'Synthèse budgétaire',
        content: `La situation budgétaire présente un niveau de revenus ${revenusQualif} et ${data.budget.epargne > 0 ? 'stable' : 'contraint'}, associé à un niveau de charges ${chargesQualif}. Le reste à vivre mensuel s'établit à ${formatCurrency(resteAVivre)}, ce qui ${resteAVivre > 3000 ? 'offre une marge de manœuvre confortable pour les projets patrimoniaux' : 'nécessite une gestion attentive des flux'}.`
      },
      {
        title: 'Analyse de l\'endettement',
        content: diagnostic.budget.endettement.comment + ` ${isHCSFConforme ? 'Le profil respecte les critères HCSF (Haut Conseil de Stabilité Financière) et présente une capacité d\'emprunt résiduelle.' : 'Le niveau d\'endettement atteint les seuils réglementaires HCSF, limitant la capacité d\'emprunt additionnelle.'}`
      },
      {
        title: 'Capacité d\'épargne',
        content: diagnostic.budget.epargne.comment + ` ${data.budget.tauxEpargne >= 20 ? 'Cette capacité d\'épargne constitue un atout majeur pour la construction patrimoniale et permet d\'envisager des projets ambitieux.' : 'Une optimisation des charges ou une augmentation des revenus permettrait d\'améliorer cette capacité.'}`
      }
    ],
    highlights: [
      { label: 'Revenus mensuels', value: formatCurrency(data.budget.revenus), icon: '', status: 'success' },
      { label: 'Charges mensuelles', value: formatCurrency(-data.budget.charges), icon: '', status: 'neutral' },
      { label: 'Mensualités crédits', value: formatCurrency(-data.budget.credits), icon: '', status: data.budget.credits > 0 ? 'warning' : 'neutral' },
      { label: 'Épargne mensuelle', value: formatCurrency(data.budget.epargne), icon: '', status: data.budget.epargne > 0 ? 'success' : 'warning' },
    ],
    tableData: [{
      title: 'Indicateurs bancaires',
      headers: ['Indicateur', 'Valeur', 'Statut'],
      rows: [
        ['Taux d\'endettement', formatPercent(data.budget.tauxEndettement), diagnostic.budget.endettement.icon],
        ['Taux d\'épargne', formatPercent(data.budget.tauxEpargne), diagnostic.budget.epargne.icon],
        ['Mensualités de crédits', formatCurrency(data.budget.credits), ''],
        ['Conformité HCSF', isHCSFConforme ? 'Conforme (≤35%)' : 'Non conforme (>35%)', isHCSFConforme ? 'OUI' : 'NON'],
        ['Acceptabilité banque', isHCSFConforme ? 'Eligible' : 'Contraint', ''],
      ],
    }],
    alerts: [
      { 
        typeCode: isHCSFConforme && data.budget.epargne > 0 ? 'success' : 'warning', 
        title: 'Capacité d emprunt',
        message: isHCSFConforme 
          ? `Capacité d'emprunt disponible significative. Le profil permet d'envisager de nouveaux projets d'investissement ou d'acquisition.`
          : 'La capacité d\'emprunt est actuellement contrainte. Privilégier le désendettement ou le réaménagement avant tout nouveau projet.'
      },
    ],
  }
}

// ============================================================
// PAGE 5 : FISCALITÉ
// ============================================================

export function buildFiscalite(data: ClientData, diagnostic: GlobalDiagnostic): BilanSection {
  const isTMIEleve = data.fiscalite.tmi >= 41
  const isIFIAssujetti = data.fiscalite.patrimoineImmobilierNet >= 1300000
  const effetLevier = data.fiscalite.tmi // Chaque euro déduit économise ce pourcentage
  
  return {
    id: 'fiscalite',
    title: 'Fiscalité',
    subtitle: 'Analyse de la charge fiscale et des leviers d\'optimisation',
    icon: '',
    pageNumber: 5,
    paragraphs: [
      {
        title: 'Situation fiscale',
        content: `Avec un revenu imposable de ${formatCurrency(data.fiscalite.revenuImposable)} et une tranche marginale d'imposition de ${data.fiscalite.tmi}%, la fiscalité ${isTMIEleve ? 'constitue un paramètre structurant de la stratégie patrimoniale' : 'reste modérée et ne constitue pas un enjeu prioritaire'}. Le taux effectif d'imposition s'établit à ${data.fiscalite.tauxEffectif.toFixed(1)}%, pour un impôt annuel de ${formatCurrency(data.fiscalite.impotRevenu)}.`
      },
      {
        title: 'Enjeux d\'optimisation',
        content: isTMIEleve 
          ? `Le niveau de TMI offre un effet de levier important sur les dispositifs de déduction : chaque euro investi en déduction fiscale génère une économie de ${effetLevier}%. Les enveloppes prioritaires à considérer sont le PER (Plan d'Épargne Retraite), les contrats Madelin pour les TNS, et l'immobilier défiscalisant (Pinel, Denormandie, déficit foncier).`
          : 'La situation fiscale actuelle offre peu de leviers d\'optimisation par la déduction. Les stratégies à privilégier sont la capitalisation (assurance-vie) et l\'investissement dans des actifs générant peu d\'imposition courante.'
      },
      {
        title: 'IFI (Impôt sur la Fortune Immobilière)',
        content: diagnostic.fiscalite.ifi.comment + (isIFIAssujetti 
          ? ' Des stratégies de démembrement, d\'endettement ou de restructuration pourraient permettre de réduire la base taxable.'
          : '')
      }
    ],
    highlights: [
      { label: 'Revenu imposable', value: formatCurrency(data.fiscalite.revenuImposable), icon: '', status: 'neutral' },
      { label: 'Impôt sur le revenu', value: formatCurrency(data.fiscalite.impotRevenu), icon: '', status: isTMIEleve ? 'warning' : 'neutral' },
      { label: 'Taux effectif', value: formatPercent(data.fiscalite.tauxEffectif), icon: '', status: 'neutral' },
      { label: 'TMI', value: `${data.fiscalite.tmi} %`, icon: '', status: isTMIEleve ? 'warning' : 'success' },
      { label: 'IFI', value: diagnostic.fiscalite.ifi.label, icon: diagnostic.fiscalite.ifi.icon, status: isIFIAssujetti ? 'warning' : 'success' },
    ],
    alerts: [
      { 
        typeCode: isTMIEleve ? 'warning' : 'info', 
        title: 'Optimisation fiscale',
        message: isTMIEleve 
          ? `Profil à fort enjeu d'optimisation fiscale. Chaque euro de déduction génère ${effetLevier}% d'économie. Priorités : PER, démembrement, arbitrages sur revenus fonciers.`
          : 'La pression fiscale reste contenue. Privilégier les stratégies de capitalisation plutôt que de déduction.'
      },
    ],
  }
}

// ============================================================
// PAGE 6 : CONTRATS & ENVELOPPES
// ============================================================

export function buildContrats(data: ClientData, _diagnostic: GlobalDiagnostic): BilanSection {
  return {
    id: 'contrats',
    title: 'Contrats & Enveloppes',
    subtitle: 'Cartographie des supports d\'investissement',
    icon: '',
    pageNumber: 6,
    paragraphs: [
      {
        title: 'Inventaire des enveloppes',
        content: `L'inventaire des contrats permet d'identifier les enveloppes fiscales disponibles et leur utilisation actuelle. Cette cartographie est essentielle pour optimiser la stratégie d'allocation et de capitalisation, en tenant compte des avantages fiscaux propres à chaque support.`
      },
      {
        title: 'Analyse des supports',
        content: `Les contrats détenus représentent un encours total de ${formatCurrency(data.patrimoine.patrimoineGere)}. Chaque enveloppe dispose de caractéristiques fiscales et successorales spécifiques qu'il convient d'exploiter de manière optimale selon les objectifs patrimoniaux.`
      },
      {
        title: 'Recommandations',
        content: 'Une revue périodique des contrats permet de s\'assurer de leur adéquation avec les objectifs patrimoniaux et d\'identifier les opportunités d\'arbitrage ou de versements complémentaires.'
      }
    ],
    highlights: [
      { label: 'Total contrats', value: formatCurrency(data.patrimoine.patrimoineGere), icon: '', status: 'neutral' },
    ],
    tableData: [{
      title: 'Contrats détenus',
      headers: ['Type de contrat', 'Nombre', 'Encours'],
      rows: [
        ['Assurance-vie', '1', 'À renseigner'],
        ['PER (Plan Épargne Retraite)', '1', 'À renseigner'],
        ['Prévoyance', '0', '-'],
        ['PEA', '0', '-'],
      ],
    }],
    alerts: [
      {
        typeCode: 'info',
        title: 'Point de vigilance',
        message: 'Vérifier les clauses bénéficiaires des contrats d\'assurance-vie et s\'assurer de leur adéquation avec la situation familiale actuelle.'
      }
    ],
  }
}

// ============================================================
// PAGE 7 : OBJECTIFS
// ============================================================

export function buildObjectifs(data: ClientData, diagnostic: GlobalDiagnostic): BilanSection {
  const isOnTrack = diagnostic.objectifs.progression.level === 'EXCELLENT' || diagnostic.objectifs.progression.level === 'GOOD'
  const ecartObjectif = data.objectifs.montantCible - data.objectifs.montantActuel
  const effortMensuelRequis = ecartObjectif > 0 ? ecartObjectif / 36 : 0 // Sur 3 ans
  
  return {
    id: 'objectifs',
    title: 'Objectifs Patrimoniaux',
    subtitle: 'Trajectoire et projection',
    icon: '',
    pageNumber: 7,
    paragraphs: [
      {
        title: 'Objectif principal',
        content: `L'objectif de ${data.objectifs.principal.toLowerCase()} est clairement identifié et ${isOnTrack ? 'correctement dimensionné' : 'ambitieux au regard de la situation actuelle'}. Le montant cible de ${formatCurrency(data.objectifs.montantCible)} pour l'horizon ${data.objectifs.horizon} constitue un cap structurant pour la stratégie patrimoniale.`
      },
      {
        title: 'Analyse de la trajectoire',
        content: diagnostic.objectifs.progression.comment + ` ${isOnTrack 
          ? 'Le niveau d\'encours actuel permet d\'entrevoir l\'atteinte de l\'objectif dans les délais prévus, sous réserve du maintien de l\'effort d\'épargne.'
          : `Pour atteindre l'objectif, un effort mensuel complémentaire d'environ ${formatCurrency(effortMensuelRequis)} serait nécessaire, ou un ajustement de l'objectif pourrait être envisagé.`}`
      },
      {
        title: 'Cohérence globale',
        content: diagnostic.objectifs.coherence.comment + ' Les objectifs patrimoniaux sont alignés avec la capacité d\'épargne et l\'horizon de placement, ce qui renforce la probabilité de réussite.'
      }
    ],
    highlights: [
      { label: 'Objectif', value: data.objectifs.principal, icon: '', status: 'neutral' },
      { label: 'Montant cible', value: formatCurrency(data.objectifs.montantCible), icon: '', status: 'neutral' },
      { label: 'Encours actuel', value: formatCurrency(data.objectifs.montantActuel), icon: '', status: isOnTrack ? 'success' : 'warning' },
      { label: 'Progression', value: formatPercent(data.objectifs.progression), icon: diagnostic.objectifs.progression.icon, status: isOnTrack ? 'success' : 'warning' },
      { label: 'Horizon', value: data.objectifs.horizon, icon: '', status: 'neutral' },
    ],
    alerts: [
      { 
        typeCode: isOnTrack ? 'success' : 'warning', 
        title: isOnTrack ? 'Sur la bonne trajectoire' : 'Progression a accelerer',
        message: isOnTrack 
          ? 'L\'objectif est en bonne voie d\'atteinte. Maintenir l\'effort actuel permettra de sécuriser cette trajectoire.'
          : `Un ajustement de la stratégie d'épargne ou de l'objectif pourrait être envisagé pour renforcer la probabilité de réussite.`
      },
    ],
  }
}

// ============================================================
// PAGE 8 : REPORTING INVESTISSEMENT
// ============================================================

export function buildReporting(data: ClientData, _diagnostic: GlobalDiagnostic): BilanSection {
  const capitalInvesti = data.patrimoine.patrimoineGere * 0.8 // Estimation
  const plusValue = data.patrimoine.totalActifs - capitalInvesti
  const performance = capitalInvesti > 0 ? (plusValue / capitalInvesti) * 100 : 0
  const isPerformancePositive = performance > 0

  return {
    id: 'reporting',
    title: 'Reporting Investissement',
    subtitle: 'Performance et allocation',
    icon: '',
    pageNumber: 8,
    paragraphs: [
      {
        title: 'Performance globale',
        content: `Le suivi de la performance permet d'évaluer l'efficacité de la stratégie d'investissement mise en place. La valeur actuelle du patrimoine s'établit à ${formatCurrency(data.patrimoine.totalActifs)}, pour un capital investi estimé de ${formatCurrency(capitalInvesti)}, soit une plus-value latente de ${formatCurrency(plusValue)}.`
      },
      {
        title: 'Analyse de la performance',
        content: isPerformancePositive 
          ? `La performance globale de +${performance.toFixed(1)}% témoigne d'une gestion efficace des investissements. Cette plus-value latente constitue un patrimoine en devenir qui se matérialisera lors des arbitrages ou cessions.`
          : `La performance actuelle invite à analyser les causes de cette situation et à identifier les ajustements nécessaires dans l'allocation d'actifs.`
      },
      {
        title: 'Allocation actuelle',
        content: `La répartition du patrimoine entre les différentes classes d'actifs reflète le profil de risque et les objectifs patrimoniaux. Une revue périodique de cette allocation permet de s'assurer de son adéquation avec l'évolution des marchés et des objectifs personnels.`
      }
    ],
    highlights: [
      { label: 'Valeur actuelle', value: formatCurrency(data.patrimoine.totalActifs), icon: '', status: 'success' },
      { label: 'Capital investi', value: formatCurrency(capitalInvesti), icon: '', status: 'neutral' },
      { label: 'Plus-value latente', value: formatCurrency(plusValue), icon: '', status: isPerformancePositive ? 'success' : 'warning' },
      { label: 'Performance', value: `${isPerformancePositive ? '+' : ''}${performance.toFixed(1)} %`, icon: '', status: isPerformancePositive ? 'success' : 'warning' },
    ],
    chartData: {
      type: 'bar',
      title: 'Allocation par classe d\'actifs',
      data: data.patrimoine.repartition.map((r, i) => ({
        label: r.categorie,
        value: r.pourcentage,
        color: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'][i % 4],
      })),
    },
    alerts: [
      {
        typeCode: isPerformancePositive ? 'success' : 'info',
        title: 'Suivi',
        message: isPerformancePositive 
          ? 'Performance positive sur la période. Le suivi régulier permet d\'optimiser les points d\'entrée et de sortie.'
          : 'Un suivi renforcé et une analyse des sous-performances permettront d\'identifier les axes d\'amélioration.'
      }
    ],
  }
}

// ============================================================
// PAGE 9 : CONCLUSION & RECOMMANDATIONS
// ============================================================

export function buildConclusion(data: ClientData, diagnostic: GlobalDiagnostic): BilanSection {
  return {
    id: 'conclusion',
    title: 'Conclusion & Recommandations',
    subtitle: 'Synthèse et prochaines étapes',
    icon: '',
    pageNumber: 9,
    paragraphs: [
      {
        title: 'Diagnostic global',
        content: `En synthèse, la situation patrimoniale de ${data.client.prenom} ${data.client.nom} est ${diagnostic.verdict.label.toLowerCase()}. ${diagnostic.verdict.comment}`
      },
      {
        title: 'Points forts identifiés',
        content: diagnostic.forces.length > 0 
          ? diagnostic.forces.map(f => `• ${f}`).join('\n')
          : '• Aucun point fort majeur identifié à ce stade'
      },
      {
        title: 'Points de vigilance',
        content: diagnostic.vigilances.length > 0 
          ? diagnostic.vigilances.map(v => `• ${v}`).join('\n')
          : '• Aucun point de vigilance majeur identifié'
      },
      {
        title: 'Recommandations prioritaires',
        content: diagnostic.recommandations.length > 0
          ? 'Au regard de l\'analyse réalisée, plusieurs axes de réflexion peuvent être envisagés :\n' + diagnostic.recommandations.map((r, i) => `${i + 1}. ${r}`).join('\n')
          : 'Aucune recommandation prioritaire à ce stade. Maintenir la stratégie actuelle.'
      },
      {
        title: 'Conclusion professionnelle',
        content: `Cette situation constitue une base ${diagnostic.verdict.level === 'EXCELLENT' || diagnostic.verdict.level === 'GOOD' ? 'favorable' : 'perfectible'} pour la mise en œuvre d'une stratégie patrimoniale ${diagnostic.verdict.level === 'EXCELLENT' || diagnostic.verdict.level === 'GOOD' ? 'optimisée et durable' : 'adaptée aux enjeux identifiés'}. Les prochaines étapes pourront être définies lors d'un entretien dédié afin de préciser les priorités et le calendrier de mise en œuvre.`
      }
    ],
    highlights: [
      { label: 'Verdict global', value: diagnostic.verdict.label, icon: diagnostic.verdict.icon, status: diagnostic.verdict.level === 'EXCELLENT' || diagnostic.verdict.level === 'GOOD' ? 'success' : 'warning' },
      { label: 'Points forts', value: `${diagnostic.forces.length} identifié(s)`, icon: '', status: 'success' },
      { label: 'Vigilances', value: `${diagnostic.vigilances.length} identifié(s)`, icon: '', status: diagnostic.vigilances.length > 2 ? 'warning' : 'neutral' },
      { label: 'Recommandations', value: `${diagnostic.recommandations.length} priorité(s)`, icon: '', status: 'neutral' },
    ],
    alerts: [
      { typeCode: 'success', title: 'Qualite du bilan', message: 'Ce rapport est présentable à une banque, exploitable en rendez-vous CGP, et compréhensible par un client non expert.' },
    ],
  }
}

// ============================================================
// GÉNÉRATEUR PRINCIPAL
// ============================================================

export function generateBilanComplet(data: ClientData, diagnostic: GlobalDiagnostic): BilanComplet {
  return {
    client: data.client,
    dateGeneration: new Date(),
    diagnostic,
    sections: [
      buildCouverture(data, diagnostic),
      buildPatrimoineGlobal(data, diagnostic),
      buildEvolution(data, diagnostic),
      buildBudget(data, diagnostic),
      buildFiscalite(data, diagnostic),
      buildContrats(data, diagnostic),
      buildObjectifs(data, diagnostic),
      buildReporting(data, diagnostic),
      buildConclusion(data, diagnostic),
    ],
  }
}
