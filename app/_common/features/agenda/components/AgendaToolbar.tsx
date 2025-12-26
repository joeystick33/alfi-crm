 
import { Search, UserPlus, RefreshCcw } from 'lucide-react'
import { useMemo, ComponentPropsWithoutRef } from 'react'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Popover, PopoverContent, PopoverTrigger } from '@/app/_common/components/ui/Popover'
import { Badge } from '@/app/_common/components/ui/Badge'
import Avatar from '@/app/_common/components/ui/Avatar'
import { cn } from '@/app/_common/lib/utils'
import type { AgendaCollaborator } from '@/app/(advisor)/(backend)/lib/agenda-notes'

export type AgendaViewMode = 'day' | 'week' | 'month'


type AvatarStatus = 'online' | 'offline' | 'busy' | 'away'
type CollaboratorAvatarProps = Omit<ComponentPropsWithoutRef<typeof Avatar>, 'status'> & { status?: string }

const CollaboratorAvatar = ({ status, ...props }: CollaboratorAvatarProps) => {
  const validStatus = status && ['online', 'offline', 'busy', 'away'].includes(status) 
    ? status as AvatarStatus 
    : undefined
  return <Avatar status={validStatus} {...props} />
}

const PopoverPanel = PopoverContent as any

export interface AgendaToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  statusOptions: { value: string; label: string }[]
  typeOptions: { value: string; label: string }[]
  filters: { status: string; type: string }
  onStatusChange: (value: string) => void
  onTypeChange: (value: string) => void
  viewMode: AgendaViewMode
  onViewModeChange: (mode: AgendaViewMode) => void
  collaborators: AgendaCollaborator[]
  collaboratorsLoading: boolean
  collaboratorsError: string | null
  activeCollaborators: string[]
  onToggleCollaborator: (id: string) => void
  onSelectAllCollaborators: () => void
  onClearCollaborators: () => void
  onRefresh: () => void
  getCollaboratorDisplayName: (collaborator: AgendaCollaborator) => string
}

export function AgendaToolbar({
  search,
  onSearchChange,
  statusOptions,
  typeOptions,
  filters,
  onStatusChange,
  onTypeChange,
  viewMode,
  onViewModeChange,
  collaborators,
  collaboratorsLoading,
  collaboratorsError,
  activeCollaborators,
  onToggleCollaborator,
  onSelectAllCollaborators,
  onClearCollaborators,
  onRefresh,
  getCollaboratorDisplayName,
}: AgendaToolbarProps) {
  const viewToggleClasses = (mode: AgendaViewMode) =>
    cn(
      'px-3 py-1 text-xs font-semibold rounded-full transition-all duration-300',
      viewMode === mode
        ? 'bg-blue-600 text-white shadow-sm shadow-blue-300/40'
        : 'text-slate-500 hover:bg-slate-100'
    )

  const activeCollaboratorsLabel = useMemo(() => {
    if (activeCollaborators.length === 0) return 'Collaborateurs'
    const suffix = activeCollaborators.length > 1 ? 's' : ''
    return `${activeCollaborators.length} collaborateur${suffix}`
  }, [activeCollaborators])

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un client, un sujet, un lieu..."
            className="pl-9"
          />
        </div>

        <Select value={filters.status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[170px] border-slate-200 bg-white text-slate-700">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.type} onValueChange={onTypeChange}>
          <SelectTrigger className="w-[160px] border-slate-200 bg-white text-slate-700">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2 py-1">
          {(['day', 'week', 'month'] as AgendaViewMode[]).map((mode) => (
            <button key={mode} type="button" className={viewToggleClasses(mode)} onClick={() => onViewModeChange(mode)}>
              {mode === 'day' ? 'Jour' : mode === 'week' ? 'Semaine' : 'Mois'}
            </button>
          ))}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'border-slate-200 bg-white text-slate-600 hover:bg-slate-100',
                activeCollaborators.length > 0 && 'border-blue-200 bg-blue-50 text-blue-700'
              )}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {activeCollaboratorsLabel}
            </Button>
          </PopoverTrigger>
          <PopoverPanel align="end" className="w-80 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Collaborateurs</p>
                <p className="text-xs text-slate-500">Filtrez les événements par participants associés.</p>
              </div>
              {collaboratorsLoading ? (
                <Badge variant="secondary" className="bg-slate-100 text-slate-500">
                  Chargement
                </Badge>
              ) : (
                <div className="flex gap-2 text-xs">
                  <button type="button" onClick={onSelectAllCollaborators} className="text-blue-600 hover:text-blue-500">
                    Tout
                  </button>
                  <span className="text-slate-300">•</span>
                  <button type="button" onClick={onClearCollaborators} className="text-slate-500 hover:text-slate-400">
                    Effacer
                  </button>
                </div>
              )}
            </div>

            {collaboratorsError && (
              <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-xs text-red-600">{collaboratorsError}</p>
            )}

            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
              {collaboratorsLoading ? (
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  Chargement en cours...
                </div>
              ) : collaborators.length === 0 ? (
                <p className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                  Aucun collaborateur disponible.
                </p>
              ) : (
                collaborators.map((collaborator) => {
                  const isSelected = activeCollaborators.includes(collaborator.id)
                  const displayName = getCollaboratorDisplayName(collaborator)
                  return (
                    <button
                      key={collaborator.id}
                      type="button"
                      onClick={() => onToggleCollaborator(collaborator.id)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left transition',
                        isSelected
                          ? 'border-blue-300 bg-blue-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <CollaboratorAvatar
                          size="sm"
                          name={displayName}
                          src={collaborator.avatar || undefined}
                          alt={displayName}
                          className="ring-2 ring-slate-100"
                        />
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                          {collaborator.role && <p className="text-xs text-slate-500">{collaborator.role}</p>}
                          {collaborator.email && <p className="text-xs text-slate-400">{collaborator.email}</p>}
                        </div>
                      </div>
                      {isSelected ? <Badge className="bg-blue-100 text-blue-600">Actif</Badge> : <div className="h-2.5 w-2.5 rounded-full border border-slate-300" />}
                    </button>
                  )
                })
              )}
            </div>

            {activeCollaborators.length > 0 && (
              <p className="mt-3 text-xs text-slate-500">
                {activeCollaborators.length} collaborateur{activeCollaborators.length > 1 ? 's' : ''} sélectionné{activeCollaborators.length > 1 ? 's' : ''}.
              </p>
            )}
          </PopoverPanel>
        </Popover>

        <Button variant="ghost" className="text-slate-600 hover:bg-slate-100" onClick={onRefresh} aria-label="Actualiser">
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
