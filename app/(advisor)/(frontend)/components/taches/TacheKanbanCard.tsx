'use client'

import { LucideIcon } from 'lucide-react'

import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import Avatar from '@/app/_common/components/ui/Avatar'
import { 
  Phone, Mail, Calendar, FileText, UserCheck, MoreVertical,
  Clock, AlertCircle, Edit, Trash2, CheckCircle
} from 'lucide-react'
import { formatDate } from '@/app/_common/lib/utils'

// Types Prisma FR (migration 2024-12-10)
export interface TacheKanbanData {
  id: string
  title: string
  description?: string
  type: 'APPEL' | 'EMAIL' | 'REUNION' | 'REVUE_DOCUMENTS' | 'MISE_A_JOUR_KYC' | 'RENOUVELLEMENT_CONTRAT' | 'SUIVI' | 'ADMINISTRATIF' | 'AUTRE'
  priority: 'BASSE' | 'MOYENNE' | 'HAUTE' | 'URGENTE'
  status: 'A_FAIRE' | 'EN_COURS' | 'TERMINE' | 'ANNULE'
  dueDate?: Date | string | null
  completedAt?: Date | string | null
  assignedTo: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  }
  client?: {
    id: string
    firstName: string
    lastName: string
  } | null
  projet?: {
    id: string
    name: string
  } | null
  createdAt: Date | string
}

interface TacheKanbanCardProps {
  tache: TacheKanbanData
  isDragging: boolean
  onEdit?: (tache: TacheKanbanData) => void
  onComplete?: (tacheId: string) => void
  onDelete?: (tacheId: string) => void
}

const TYPE_CONFIG: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  // Nouvelles valeurs FR
  APPEL: { icon: Phone, label: 'Appel', color: 'text-blue-600 bg-blue-100' },
  EMAIL: { icon: Mail, label: 'Email', color: 'text-purple-600 bg-purple-100' },
  REUNION: { icon: Calendar, label: 'Réunion', color: 'text-green-600 bg-green-100' },
  REVUE_DOCUMENTS: { icon: FileText, label: 'Documents', color: 'text-orange-600 bg-orange-100' },
  MISE_A_JOUR_KYC: { icon: UserCheck, label: 'KYC', color: 'text-cyan-600 bg-cyan-100' },
  RENOUVELLEMENT_CONTRAT: { icon: FileText, label: 'Renouvellement', color: 'text-indigo-600 bg-indigo-100' },
  SUIVI: { icon: UserCheck, label: 'Suivi', color: 'text-cyan-600 bg-cyan-100' },
  ADMINISTRATIF: { icon: FileText, label: 'Administratif', color: 'text-slate-600 bg-slate-100' },
  AUTRE: { icon: MoreVertical, label: 'Autre', color: 'text-gray-600 bg-gray-100' },
  // Rétrocompatibilité anciennes valeurs EN
  CALL: { icon: Phone, label: 'Appel', color: 'text-blue-600 bg-blue-100' },
  MEETING: { icon: Calendar, label: 'Réunion', color: 'text-green-600 bg-green-100' },
  DOCUMENT: { icon: FileText, label: 'Document', color: 'text-orange-600 bg-orange-100' },
  FOLLOW_UP: { icon: UserCheck, label: 'Suivi', color: 'text-cyan-600 bg-cyan-100' },
  OTHER: { icon: MoreVertical, label: 'Autre', color: 'text-gray-600 bg-gray-100' },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  BASSE: { label: 'Basse', color: 'border-gray-300 bg-gray-50 text-gray-700' },
  MOYENNE: { label: 'Moyenne', color: 'border-blue-300 bg-blue-50 text-blue-700' },
  HAUTE: { label: 'Haute', color: 'border-orange-300 bg-orange-50 text-orange-700' },
  URGENTE: { label: 'Urgente', color: 'border-red-300 bg-red-50 text-red-700' },
}

export function TacheKanbanCard({ 
  tache, 
  isDragging, 
  onEdit, 
  onComplete, 
  onDelete 
}: TacheKanbanCardProps) {
  const typeConfig = TYPE_CONFIG[tache.type]
  const priorityConfig = PRIORITY_CONFIG[tache.priority]
  const TypeIcon = typeConfig.icon

  // Calculer si la tâche est en retard
  const isOverdue = tache.dueDate && tache.status !== 'TERMINE' && tache.status !== 'ANNULE'
    ? new Date(tache.dueDate) < new Date()
    : false

  // Calculer si la tâche est due aujourd'hui
  const isDueToday = tache.dueDate
    ? new Date(tache.dueDate).toDateString() === new Date().toDateString()
    : false

  return (
    <div
      className={`
        bg-white rounded-lg border-2 ${priorityConfig.color}
        shadow-sm hover:shadow-md transition-all
        ${isDragging ? 'opacity-50 rotate-2 scale-105' : ''}
        group relative
      `}
    >
      {/* Priority indicator bar */}
      <div className={`h-1 rounded-t-lg ${
        tache.priority === 'URGENTE' ? 'bg-red-500' :
        tache.priority === 'HAUTE' ? 'bg-orange-500' :
        tache.priority === 'MOYENNE' ? 'bg-blue-500' :
        'bg-gray-300'
      }`} />

      <div className="p-3 space-y-3">
        {/* Header: Type + Title */}
        <div className="flex items-start gap-2">
          <div className={`${typeConfig.color} p-1.5 rounded flex-shrink-0`}>
            <TypeIcon className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 line-clamp-2">
              {tache.title}
            </h4>
            {tache.description && (
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                {tache.description}
              </p>
            )}
          </div>
        </div>

        {/* Badges: Priority + Type label */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge 
            variant="outline" 
            className="text-xs border-current"
          >
            <span className={`w-2 h-2 rounded-full mr-1.5 ${
              tache.priority === 'URGENTE' ? 'bg-red-500' :
              tache.priority === 'HAUTE' ? 'bg-orange-500' :
              tache.priority === 'MOYENNE' ? 'bg-blue-500' :
              'bg-gray-400'
            }`} />
            {priorityConfig.label}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {typeConfig.label}
          </Badge>
        </div>

        {/* Due Date */}
        {tache.dueDate && (
          <div className={`flex items-center gap-2 text-xs ${
            isOverdue ? 'text-red-600 font-semibold' :
            isDueToday ? 'text-orange-600 font-medium' :
            'text-slate-600'
          }`}>
            {isOverdue ? (
              <AlertCircle className="h-3.5 w-3.5" />
            ) : (
              <Clock className="h-3.5 w-3.5" />
            )}
            <span>
              {isOverdue ? 'En retard : ' : isDueToday ? 'Aujourd\'hui' : 'Échéance : '}
              {!isDueToday && formatDate(new Date(tache.dueDate))}
            </span>
          </div>
        )}

        {/* Client info */}
        {tache.client && (
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <span className="font-medium">Client:</span>
            <span className="text-slate-900">
              {tache.client.firstName} {tache.client.lastName}
            </span>
          </div>
        )}

        {/* Projet info */}
        {tache.projet && (
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <span className="font-medium">Projet:</span>
            <span className="text-slate-900">
              {tache.projet.name}
            </span>
          </div>
        )}

        {/* Footer: Assigned to + Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Avatar
              src={tache.assignedTo.avatar || ''}
              name={`${tache.assignedTo.firstName} ${tache.assignedTo.lastName}`}
              alt={`${tache.assignedTo.firstName} ${tache.assignedTo.lastName}`}
              size="xs"
              status={undefined}
              className="flex-shrink-0"
            />
            <span className="text-xs text-slate-600 truncate">
              {tache.assignedTo.firstName}
            </span>
          </div>

          {/* Quick actions - shown on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {tache.status !== 'TERMINE' && onComplete && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onComplete(tache.id)
                }}
                title="Marquer comme terminée"
              >
                <CheckCircle className="h-3.5 w-3.5 text-green-600" />
              </Button>
            )}
            {onEdit && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(tache)
                }}
                title="Éditer"
              >
                <Edit className="h-3.5 w-3.5 text-blue-600" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(tache.id)
                }}
                title="Supprimer"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-600" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
