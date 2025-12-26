 
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Modal,
  ModalContent,
  ModalHeader,
} from '@/app/_common/components/ui/Modal'
import { Input } from '@/app/_common/components/ui/Input'
import { Badge } from '@/app/_common/components/ui/Badge'
import {
  Users,
  FileText,
  CheckSquare,
  Calendar,
  TrendingUp,
  Calculator,
  Shield,
  Search,
} from 'lucide-react'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Command {
  id: string
  label: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  keywords: string[]
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const commands: Command[] = [
    {
      id: 'clients',
      label: 'Clients',
      description: 'Voir tous les clients',
      icon: Users,
      action: () => router.push('/dashboard/clients'),
      keywords: ['clients', 'portefeuille', 'particuliers', 'professionnels'],
    },
    {
      id: 'new-client',
      label: 'Nouveau client',
      description: 'Créer un nouveau client',
      icon: Users,
      action: () => router.push('/dashboard/clients?action=new'),
      keywords: ['nouveau', 'créer', 'client', 'ajouter'],
    },
    {
      id: 'tasks',
      label: 'Tâches',
      description: 'Voir toutes les tâches',
      icon: CheckSquare,
      action: () => router.push('/dashboard/taches'),
      keywords: ['tâches', 'todo', 'à faire'],
    },
    {
      id: 'calendar',
      label: 'Agenda',
      description: 'Voir le calendrier',
      icon: Calendar,
      action: () => router.push('/dashboard/agenda'),
      keywords: ['agenda', 'calendrier', 'rendez-vous', 'rdv'],
    },
    {
      id: 'opportunities',
      label: 'Opportunités',
      description: 'Voir les opportunités',
      icon: TrendingUp,
      action: () => router.push('/dashboard/opportunites'),
      keywords: ['opportunités', 'commercial', 'pipeline'],
    },
    {
      id: 'calculators',
      label: 'Calculateurs',
      description: 'Outils de calcul',
      icon: Calculator,
      action: () => router.push('/dashboard/calculators'),
      keywords: ['calculateurs', 'simulateurs', 'outils', 'calcul'],
    },
    {
      id: 'documents',
      label: 'Documents',
      description: 'Gestion documentaire',
      icon: FileText,
      action: () => router.push('/dashboard/documents'),
      keywords: ['documents', 'ged', 'fichiers'],
    },
    {
      id: 'kyc',
      label: 'KYC',
      description: 'Conformité KYC',
      icon: Shield,
      action: () => router.push('/dashboard/kyc'),
      keywords: ['kyc', 'conformité', 'mifid'],
    },
  ]

  const filteredCommands = commands.filter((command) => {
    const searchLower = search.toLowerCase()
    return (
      command.label.toLowerCase().includes(searchLower) ||
      command.description?.toLowerCase().includes(searchLower) ||
      command.keywords.some((keyword) => keyword.includes(searchLower))
    )
  })

  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        onOpenChange(!open)
      }

      if (!open) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
          onOpenChange(false)
          setSearch('')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, selectedIndex, filteredCommands, onOpenChange])

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl p-0 gap-0">
        <ModalHeader className="border-b border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Rechercher une commande..."
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-900 placeholder:text-gray-400"
              autoFocus
            />
            <Badge variant="default" size="xs">
              ⌘K
            </Badge>
          </div>
        </ModalHeader>

        <div className="max-h-96 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Aucun résultat trouvé
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((command: any, index: any) => {
                const Icon = command.icon
                const isSelected = index === selectedIndex

                return (
                  <button
                    key={command.id}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      isSelected
                        ? 'bg-[#7373FF]/10 text-[#5c5ce6]'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                    onClick={() => {
                      command.action()
                      onOpenChange(false)
                      setSearch('')
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${isSelected ? 'text-[#7373FF]' : 'text-gray-400'}`} />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{command.label}</div>
                      {command.description && (
                        <div className="text-xs text-gray-500">
                          {command.description}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 p-3 bg-gray-50">
          <div className="flex items-center justify-between px-2 text-xs text-gray-500">
            <span>Utilisez <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded font-mono">↑↓</kbd> pour naviguer</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded font-mono">↵</kbd> pour sélectionner</span>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}
