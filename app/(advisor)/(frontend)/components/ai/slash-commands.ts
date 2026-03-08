/**
 * AURA V2 — Slash Commands CGP
 *
 * 10 commandes /slash qui déclenchent des workflows spécialisés.
 * Chaque commande est mappée à un assistant mode existant et génère
 * un prompt automatique structuré pour déclencher le workflow complet.
 *
 * Architecture :
 * 1. L'utilisateur tape /commande [args optionnels] dans le chat
 * 2. Le système détecte la commande et bascule dans le mode spécialisé
 * 3. Un prompt automatique est envoyé pour déclencher le workflow
 * 4. L'agent suit la méthodologie étape par étape du mode
 */

import {
  BarChart3, Calculator, Scale, PiggyBank, Building2,
  ShieldCheck, CalendarClock, FileEdit, Newspaper, Users,
} from 'lucide-react'
import type React from 'react'

// ── Types ──

export interface SlashCommand {
  /** Commande sans le / (ex: 'bilan') */
  command: string
  /** Nom affiché dans l'UI */
  label: string
  /** Description courte pour l'autocomplete */
  description: string
  /** Icône Lucide */
  icon: React.ElementType
  /** Couleur gradient pour l'UI */
  gradient: string
  /** ID du mode assistant correspondant */
  modeId: string
  /** Prompt automatique envoyé quand la commande est déclenchée */
  autoPrompt: string
  /** Prompt avec argument client (quand un clientId est détecté) */
  autoPromptWithClient: string
  /** Catégorie pour le regroupement UI */
  category: 'analyse' | 'expertise' | 'conformite' | 'productivite' | 'crm'
  /** Nécessite un client actif pour fonctionner pleinement */
  requiresClient: boolean
  /** Exemples d'utilisation avec arguments */
  examples: string[]
}

// ── Les 10 Slash Commands ──

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: 'bilan',
    label: 'Bilan Patrimonial',
    description: 'Bilan patrimonial complet du client actif',
    icon: BarChart3,
    gradient: 'from-blue-600 to-indigo-600',
    modeId: 'bilan',
    autoPrompt: 'Réalise un bilan patrimonial complet : actifs, passifs, ratios clés, points forts/faibles, et plan d\'action prioritaire.',
    autoPromptWithClient: 'Réalise un bilan patrimonial complet de ce client : actifs, passifs, revenus/charges, ratios clés (endettement, liquidité, concentration), points forts/faibles, et propose un plan d\'action prioritaire à court, moyen et long terme.',
    category: 'analyse',
    requiresClient: true,
    examples: [
      '/bilan',
      '/bilan complet avec ratios',
      '/bilan focus endettement',
    ],
  },
  {
    command: 'fiscalite',
    label: 'Diagnostic Fiscal',
    description: 'Diagnostic fiscal + optimisations IR/IFI',
    icon: Calculator,
    gradient: 'from-violet-600 to-purple-600',
    modeId: 'fiscalite',
    autoPrompt: 'Réalise un diagnostic fiscal complet : calcul IR via simulateur, TMI, identification des leviers d\'optimisation (PER, déficit foncier, AV, donation), et chiffre chaque scénario.',
    autoPromptWithClient: 'Réalise un diagnostic fiscal complet de ce client : calcule l\'IR via le simulateur, identifie la TMI, liste les leviers d\'optimisation fiscale disponibles (PER, déficit foncier, AV, donation, CEHR/CDHR), et chiffre chaque scénario avec un tableau comparatif.',
    category: 'expertise',
    requiresClient: true,
    examples: [
      '/fiscalite',
      '/fiscalite optimisation IFI',
      '/fiscalite compare PFU vs barème',
    ],
  },
  {
    command: 'succession',
    label: 'Simulation Succession',
    description: 'Simulation succession + stratégies de transmission',
    icon: Scale,
    gradient: 'from-indigo-600 to-blue-600',
    modeId: 'juridique',
    autoPrompt: 'Simule la succession : dévolution légale au 1er et 2nd décès, droits par héritier, et propose des stratégies d\'optimisation (donation, démembrement, AV, Dutreil).',
    autoPromptWithClient: 'Simule la succession de ce client : récupère la situation familiale et le patrimoine, calcule la dévolution légale au 1er et 2nd décès, chiffre les droits par héritier, et propose des stratégies d\'optimisation (donation au dernier vivant, démembrement, assurance-vie art. 990I, Dutreil le cas échéant).',
    category: 'expertise',
    requiresClient: true,
    examples: [
      '/succession',
      '/succession avec donation au dernier vivant',
      '/succession impact démembrement',
    ],
  },
  {
    command: 'retraite',
    label: 'Projection Retraite',
    description: 'Projection retraite + épargne PER optimale',
    icon: PiggyBank,
    gradient: 'from-cyan-600 to-blue-600',
    modeId: 'retraite',
    autoPrompt: 'Réalise une projection retraite : estime le gap de revenus, calcule le plafond PER disponible (avec reports et mutualisation), et simule l\'impact fiscal d\'un versement optimal.',
    autoPromptWithClient: 'Réalise une projection retraite pour ce client : identifie le statut professionnel, estime la pension base + complémentaire, calcule le gap de revenus, détermine le plafond PER disponible (année N + reports 5 ans + mutualisation conjoint), et simule l\'impact fiscal du versement optimal via le simulateur.',
    category: 'expertise',
    requiresClient: true,
    examples: [
      '/retraite',
      '/retraite gap revenus',
      '/retraite plafond PER TNS',
    ],
  },
  {
    command: 'immobilier',
    label: 'Analyse Immobilier',
    description: 'Analyse investissement immobilier + simulation',
    icon: Building2,
    gradient: 'from-amber-600 to-orange-600',
    modeId: 'immobilier',
    autoPrompt: 'Analyse l\'investissement immobilier : prix de marché DVF, simulation de rendement via backend, comparaison des dispositifs éligibles (LMNP, déficit foncier, Denormandie), et impact fiscal.',
    autoPromptWithClient: 'Analyse l\'investissement immobilier pour ce client : récupère le patrimoine immobilier existant, consulte les prix DVF, simule le rendement via le backend, compare les dispositifs éligibles (LMNP réel, déficit foncier, Denormandie, SCPI démembrement), et chiffre l\'impact fiscal selon la TMI.',
    category: 'expertise',
    requiresClient: true,
    examples: [
      '/immobilier',
      '/immobilier LMNP vs location nue',
      '/immobilier SCPI démembrement 10 ans',
    ],
  },
  {
    command: 'conformite',
    label: 'Audit Conformité',
    description: 'Audit conformité complet KYC/DDA/MiFID II',
    icon: ShieldCheck,
    gradient: 'from-rose-600 to-red-600',
    modeId: 'kyc',
    autoPrompt: 'Réalise un audit conformité complet du cabinet : vérifie les KYC à jour, les DER signés, les rapports d\'adéquation, les réclamations en cours, et identifie les non-conformités avec un plan de remédiation priorisé.',
    autoPromptWithClient: 'Réalise un audit conformité complet pour ce client : vérifie les données KYC (identité, bénéficiaire effectif, PPE, origine des fonds), la date de dernière mise à jour, le profil de risque MiFID II, l\'adéquation produit/profil pour chaque contrat, et liste les actions correctives avec priorité.',
    category: 'conformite',
    requiresClient: false,
    examples: [
      '/conformite',
      '/conformite KYC expirants',
      '/conformite adéquation MiFID II',
    ],
  },
  {
    command: 'rdv',
    label: 'Brief Pré-RDV',
    description: 'Brief structuré pour préparer un rendez-vous client',
    icon: CalendarClock,
    gradient: 'from-green-600 to-emerald-600',
    modeId: 'rdv',
    autoPrompt: 'Prépare un brief pré-RDV complet pour mes prochains rendez-vous : situation client, patrimoine synthèse, contrats, alertes KYC, points à aborder, compliance check, et questions à poser.',
    autoPromptWithClient: 'Prépare un brief pré-RDV complet pour ce client : identité et situation familiale, patrimoine synthèse (actifs/passifs/net), contrats en cours (AV, PER, PEA, crédits), alertes (KYC, tâches en retard, échéances), points à aborder (optimisations, arbitrages), compliance check (DER, adéquation), et questions à poser.',
    category: 'productivite',
    requiresClient: true,
    examples: [
      '/rdv',
      '/rdv avec focus succession',
      '/rdv entretien annuel',
    ],
  },
  {
    command: 'redaction',
    label: 'Rédaction Document',
    description: 'Génération de document professionnel (CR, rapport, email)',
    icon: FileEdit,
    gradient: 'from-lime-600 to-green-600',
    modeId: 'redaction',
    autoPrompt: 'Quel type de document souhaites-tu rédiger ?\n\n1. **Email professionnel** — suivi, relance, proposition\n2. **Compte-rendu d\'entretien** — structuré avec actions\n3. **Lettre de mission** — CGP art. L541-8-1 CMF\n4. **Rapport d\'adéquation** — MiFID II\n5. **Synthèse patrimoniale** — bilan annuel client\n\nPrécise le type et le contexte.',
    autoPromptWithClient: 'Quel type de document souhaites-tu rédiger pour ce client ?\n\n1. **Email professionnel** — suivi post-RDV, relance, proposition\n2. **Compte-rendu d\'entretien** — structuré avec points d\'action\n3. **Lettre de mission** — CGP art. L541-8-1 CMF\n4. **Rapport d\'adéquation** — MiFID II pour la dernière recommandation\n5. **Synthèse patrimoniale** — bilan annuel\n\nPrécise le type et je génère un brouillon personnalisé.',
    category: 'productivite',
    requiresClient: false,
    examples: [
      '/redaction email suivi post-RDV',
      '/redaction CR entretien',
      '/redaction rapport adéquation',
    ],
  },
  {
    command: 'veille',
    label: 'Veille Réglementaire',
    description: 'Actualités fiscales, juridiques et marchés',
    icon: Newspaper,
    gradient: 'from-sky-600 to-blue-600',
    modeId: 'veille',
    autoPrompt: 'Fais un point de veille réglementaire et marchés : dernières évolutions LF/LFSS 2026, actualités ACPR/AMF, taux et indices du jour, et impact concret pour mes clients.',
    autoPromptWithClient: 'Fais un point de veille réglementaire et marchés avec un focus sur ce client : évolutions LF/LFSS 2026 impactant sa situation, taux et indices du jour, prix immobiliers DVF dans sa zone, et actions à envisager.',
    category: 'productivite',
    requiresClient: false,
    examples: [
      '/veille',
      '/veille fiscalité LF 2026',
      '/veille marchés financiers',
    ],
  },
  {
    command: 'portefeuille',
    label: 'Analyse Portefeuille',
    description: 'Analyse du portefeuille cabinet : KPIs, alertes, segmentation',
    icon: Users,
    gradient: 'from-amber-600 to-yellow-600',
    modeId: 'portefeuille',
    autoPrompt: 'Analyse mon portefeuille cabinet : KPIs globaux (AuM, clients actifs/inactifs, taux de rétention), alertes critiques (KYC expirés, réclamations, tâches en retard), clients dormants, et opportunités commerciales détectées.',
    autoPromptWithClient: 'Analyse mon portefeuille cabinet : KPIs globaux (AuM, clients actifs/inactifs, taux de rétention), alertes critiques (KYC expirés, réclamations, tâches en retard), clients dormants, et opportunités commerciales. Puis fais un focus sur le client actif : poids dans le portefeuille, potentiel, actions à mener.',
    category: 'crm',
    requiresClient: false,
    examples: [
      '/portefeuille',
      '/portefeuille clients dormants',
      '/portefeuille top 10 patrimoine',
    ],
  },
]

// ── Fonctions utilitaires ──

/**
 * Détecte une slash command dans le texte utilisateur.
 * Retourne la commande et les arguments restants, ou null si pas de commande.
 */
export function parseSlashCommand(text: string): { command: SlashCommand; args: string } | null {
  const trimmed = text.trim()
  if (!trimmed.startsWith('/')) return null

  const firstSpace = trimmed.indexOf(' ')
  const commandStr = (firstSpace > 0 ? trimmed.slice(1, firstSpace) : trimmed.slice(1)).toLowerCase()
  const args = firstSpace > 0 ? trimmed.slice(firstSpace + 1).trim() : ''

  const command = SLASH_COMMANDS.find(c => c.command === commandStr)
  if (!command) return null

  return { command, args }
}

/**
 * Retourne le prompt automatique pour une commande, contextualisé selon la présence d'un client.
 */
export function getSlashCommandPrompt(command: SlashCommand, hasClient: boolean, args?: string): string {
  const basePrompt = hasClient ? command.autoPromptWithClient : command.autoPrompt

  if (args && args.length > 0) {
    return `${basePrompt}\n\nPrécisions supplémentaires : ${args}`
  }

  return basePrompt
}

/**
 * Filtre les commandes pour l'autocomplete basé sur le texte tapé.
 */
export function filterSlashCommands(partial: string): SlashCommand[] {
  if (!partial.startsWith('/')) return []

  const search = partial.slice(1).toLowerCase()
  if (search.length === 0) return SLASH_COMMANDS

  return SLASH_COMMANDS.filter(c =>
    c.command.startsWith(search) ||
    c.label.toLowerCase().includes(search) ||
    c.description.toLowerCase().includes(search)
  )
}

/**
 * Retourne les commandes groupées par catégorie.
 */
export function getSlashCommandsByCategory(): Record<string, SlashCommand[]> {
  const groups: Record<string, SlashCommand[]> = {}
  for (const cmd of SLASH_COMMANDS) {
    if (!groups[cmd.category]) groups[cmd.category] = []
    groups[cmd.category].push(cmd)
  }
  return groups
}

/** Labels de catégorie pour l'UI */
export const SLASH_CATEGORY_LABELS: Record<string, string> = {
  analyse: 'Analyse',
  expertise: 'Expertise',
  conformite: 'Conformité',
  productivite: 'Productivité',
  crm: 'CRM & Données',
}
