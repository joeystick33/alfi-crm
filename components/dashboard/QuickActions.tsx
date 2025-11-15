'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import {
  UserPlus,
  Users,
  FolderKanban,
  ListChecks,
  Calendar,
  Target,
  Mail,
  FileText,
  Calculator,
  Sparkles,
  Search,
  ArrowRight,
  Clock,
} from 'lucide-react'

interface QuickActionsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface QuickAction {
  id: string
  category: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  href?: string
  action?: () => void
  keywords: string[]
}

export function QuickActions({ open, onOpenChange }: QuickActionsProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const quickActions: QuickAction[] = [
    {
      id: 'nouveau-client',
      category: 'Portefeuille',
      title: 'Nouveau client',
      description: 'Créer une fiche client complète',
      icon: Users,
      color: 'cyan',
      href: '/dashboard/clients?action=new',
      keywords: ['client', 'personne', 'contact', 'nouveau'],
    },
    {
      id: 'nouveau-prospect',
      category: 'Portefeuille',
      title: 'Nouveau prospect',
      description: 'Ajouter un prospect au pipeline',
      icon: UserPlus,
      color: 'blue',
      href: '/dashboard/prospects/nouveau',
      keywords: ['prospect', 'lead', 'opportunité'],
    },
    {
      id: 'nouveau-dossier',
      category: 'Commercial',
      title: 'Nouveau dossier',
      description: 'Créer une mission client',
      icon: FolderKanban,
      color: 'emerald',
      href: '/dashboard/dossiers/nouveau',
      keywords: ['dossier', 'mission', 'projet', 'affaire'],
    },
    {
      id: 'nouvelle-tache',
      category: 'Organisation',
      title: 'Nouvelle tâche',
      description: 'Ajouter un to-do ou rappel',
      icon: ListChecks,
      color: 'violet',
      action: () => {
        onOpenChange(false)
        // TODO: Open task creation modal
      },
      keywords: ['tâche', 'todo', 'rappel', 'action'],
    },
    {
      id: 'nouveau-rdv',
      category: 'Organisation',
      title: 'Nouveau rendez-vous',
      description: 'Planifier un RDV client',
      icon: Calendar,
      color: 'violet',
      action: () => {
        onOpenChange(false)
        // TODO: Open appointment creation modal
      },
      keywords: ['rdv', 'rendez-vous', 'meeting', 'réunion'],
    },
    {
      id: 'action-commerciale',
      category: 'Commercial',
      title: 'Action commerciale',
      description: 'Lancer une campagne ou relance',
      icon: Target,
      color: 'emerald',
      href: '/dashboard/campagnes/nouveau',
      keywords: ['campagne', 'action', 'relance', 'commercial'],
    },
    {
      id: 'nouveau-email',
      category: 'Communication',
      title: 'Composer un email',
      description: 'Envoyer un email client',
      icon: Mail,
      color: 'blue',
      action: () => {
        onOpenChange(false)
        // TODO: Open email composer
      },
      keywords: ['email', 'mail', 'message', 'envoyer'],
    },
    {
      id: 'simulateur',
      category: 'Outils',
      title: 'Lancer un simulateur',
      description: 'PER, AV, Immo, Fiscalité',
      icon: Calculator,
      color: 'amber',
      href: '/dashboard/simulators',
      keywords: ['simulateur', 'calcul', 'simulation', 'per', 'av'],
    },
    {
      id: 'reclamation',
      category: 'Conformité',
      title: 'Déclarer une réclamation',
      description: 'Enregistrer une réclamation client',
      icon: FileText,
      color: 'red',
      href: '/dashboard/reclamations/nouveau',
      keywords: ['réclamation', 'plainte', 'litige', 'problème'],
    },
  ]

  const filteredActions = quickActions.filter((action) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      action.title.toLowerCase().includes(query) ||
      action.description.toLowerCase().includes(query) ||
      action.category.toLowerCase().includes(query) ||
      action.keywords.some((k) => k.includes(query))
    )
  })

  const groupedActions = filteredActions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = []
    }
    acc[action.category].push(action)
    return acc
  }, {} as Record<string, QuickAction[]>)

  const handleActionClick = (action: QuickAction) => {
    onOpenChange(false)

    if (action.href) {
      router.push(action.href)
    } else if (action.action) {
      action.action()
    }
  }

  const colorClasses = {
    cyan: {
      bg: 'bg-cyan-500/10 dark:bg-cyan-950/50',
      text: 'text-cyan-600 dark:text-cyan-400',
      hover: 'hover:bg-cyan-500/20 hover:border-cyan-500/40',
      border: 'border-cyan-500/30',
    },
    blue: {
      bg: 'bg-blue-500/10 dark:bg-blue-950/50',
      text: 'text-blue-600 dark:text-blue-400',
      hover: 'hover:bg-blue-500/20 hover:border-blue-500/40',
      border: 'border-blue-500/30',
    },
    emerald: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-950/50',
      text: 'text-emerald-600 dark:text-emerald-400',
      hover: 'hover:bg-emerald-500/20 hover:border-emerald-500/40',
      border: 'border-emerald-500/30',
    },
    violet: {
      bg: 'bg-violet-500/10 dark:bg-violet-950/50',
      text: 'text-violet-600 dark:text-violet-400',
      hover: 'hover:bg-violet-500/20 hover:border-violet-500/40',
      border: 'border-violet-500/30',
    },
    amber: {
      bg: 'bg-amber-500/10 dark:bg-amber-950/50',
      text: 'text-amber-600 dark:text-amber-400',
      hover: 'hover:bg-amber-500/20 hover:border-amber-500/40',
      border: 'border-amber-500/30',
    },
    red: {
      bg: 'bg-red-500/10 dark:bg-red-950/50',
      text: 'text-red-600 dark:text-red-400',
      hover: 'hover:bg-red-500/20 hover:border-red-500/40',
      border: 'border-red-500/30',
    },
  }

  const recentActions = [
    { id: 'nouveau-client', timestamp: Date.now() - 3600000 },
    { id: 'nouveau-dossier', timestamp: Date.now() - 7200000 },
  ]

  const recentActionItems = recentActions
    .map((recent) => quickActions.find((a) => a.id === recent.id))
    .filter(Boolean)
    .slice(0, 3) as QuickAction[]

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl max-h-[80vh] p-0 gap-0 overflow-hidden">
        <ModalHeader className="px-6 py-4 border-b">
          <ModalTitle className="text-lg font-bold">Actions rapides</ModalTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Créez rapidement un nouveau client, dossier, tâche ou autre élément
          </p>
        </ModalHeader>

        <div className="px-6 py-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher une action... (client, dossier, tâche...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-11"
              autoFocus
            />
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(80vh-180px)]">
          {!searchQuery && recentActionItems.length > 0 && (
            <div className="px-6 py-4 border-b">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Actions récentes
                </h3>
              </div>
              <div className="grid gap-2">
                {recentActionItems.map((action) => {
                  const Icon = action.icon
                  const colors = colorClasses[action.color as keyof typeof colorClasses]

                  return (
                    <button
                      key={action.id}
                      onClick={() => handleActionClick(action)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                        colors.hover
                      )}
                    >
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', colors.bg)}>
                        <Icon className={cn('h-5 w-5', colors.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{action.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="px-6 py-4 space-y-6">
            {Object.entries(groupedActions).map(([category, actions]) => (
              <div key={category}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  {category}
                </h3>
                <div className="grid gap-2">
                  {actions.map((action) => {
                    const Icon = action.icon
                    const colors = colorClasses[action.color as keyof typeof colorClasses]

                    return (
                      <motion.button
                        key={action.id}
                        onClick={() => handleActionClick(action)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={cn(
                          'flex items-center gap-3 p-4 rounded-xl border transition-all text-left group',
                          colors.hover
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-lg transition-colors',
                            colors.bg,
                            'group-hover:scale-110'
                          )}
                        >
                          <Icon className={cn('h-6 w-6', colors.text)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{action.title}</p>
                          <p className="text-sm text-muted-foreground truncate">{action.description}</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            ))}

            {filteredActions.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">Aucune action trouvée</p>
                <p className="text-sm text-muted-foreground mt-1">Essayez avec d'autres mots-clés</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-3 border-t bg-muted/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 rounded bg-background border font-mono">↑↓</kbd>
                <span>Naviguer</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 rounded bg-background border font-mono">↵</kbd>
                <span>Sélectionner</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 rounded bg-background border font-mono">Esc</kbd>
              <span>Fermer</span>
            </div>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}
