'use client'

import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import Avatar from '@/app/_common/components/ui/Avatar'
import { DollarSign, Calendar, 
  Edit, Trash2, ArrowRight, Sparkles, AlertCircle
} from 'lucide-react'
import { formatDate } from '@/app/_common/lib/utils'

export interface OpportuniteKanbanData {
  id: string
  name: string
  description?: string
  type: 'ASSURANCE_VIE' | 'EPARGNE_RETRAITE' | 'INVESTISSEMENT_IMMOBILIER' | 'INVESTISSEMENT_FINANCIER' | 'OPTIMISATION_FISCALE' | 'RESTRUCTURATION_CREDIT' | 'TRANSMISSION' | 'AUDIT_ASSURANCES' | 'AUTRE'
  priority: 'BASSE' | 'MOYENNE' | 'HAUTE' | 'URGENTE'
  status: 'DETECTEE' | 'CONTACTEE' | 'QUALIFIEE' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'WON' | 'PERDUE'
  estimatedValue?: number
  confidence?: number
  probability?: number
  score?: number
  expectedCloseDate?: Date | string | null
  client: {
    id: string
    firstName: string
    lastName: string
  }
  conseiller: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  }
  detectedAt: Date | string
  convertedToProjetId?: string | null
}

interface OpportuniteKanbanCardProps {
  opportunite: OpportuniteKanbanData
  isDragging: boolean
  onEdit?: (opportunite: OpportuniteKanbanData) => void
  onConvert?: (opportuniteId: string) => void
  onDelete?: (opportuniteId: string) => void
}

const TYPE_CONFIG = {
  LIFE_INSURANCE: { label: 'Assurance vie', color: 'text-blue-600 bg-blue-100', icon: '🛡️' },
  RETIREMENT_SAVINGS: { label: 'Épargne retraite', color: 'text-purple-600 bg-purple-100', icon: '💼' },
  REAL_ESTATE_INVESTMENT: { label: 'Immobilier', color: 'text-green-600 bg-green-100', icon: '🏠' },
  SECURITIES_INVESTMENT: { label: 'Titres', color: 'text-indigo-600 bg-indigo-100', icon: '📈' },
  TAX_OPTIMIZATION: { label: 'Fiscalité', color: 'text-orange-600 bg-orange-100', icon: '💰' },
  LOAN_RESTRUCTURING: { label: 'Crédit', color: 'text-cyan-600 bg-cyan-100', icon: '🏦' },
  WEALTH_TRANSMISSION: { label: 'Transmission', color: 'text-pink-600 bg-pink-100', icon: '👨‍👩‍👧' },
  INSURANCE_REVIEW: { label: 'Assurances', color: 'text-teal-600 bg-teal-100', icon: '📋' },
  OTHER: { label: 'Autre', color: 'text-gray-600 bg-gray-100', icon: '📌' },
}

const PRIORITY_CONFIG = {
  BASSE: { label: 'Basse', color: 'border-gray-300 bg-gray-50 text-gray-700' },
  MOYENNE: { label: 'Moyenne', color: 'border-blue-300 bg-blue-50 text-blue-700' },
  HAUTE: { label: 'Haute', color: 'border-orange-300 bg-orange-50 text-orange-700' },
  URGENTE: { label: 'Urgente', color: 'border-red-300 bg-red-50 text-red-700' },
}

const STATUS_COLOR_MAP = {
  DETECTED: 'bg-gray-500',
  CONTACTED: 'bg-purple-500',
  QUALIFIED: 'bg-blue-500',
  PROPOSAL_SENT: 'bg-indigo-500',
  NEGOTIATION: 'bg-yellow-500',
  WON: 'bg-green-500',
  LOST: 'bg-red-500',
}

export function OpportuniteKanbanCard({ 
  opportunite, 
  isDragging, 
  onEdit, 
  onConvert, 
  onDelete 
}: OpportuniteKanbanCardProps) {
  const typeConfig = TYPE_CONFIG[opportunite.type]
  const priorityConfig = PRIORITY_CONFIG[opportunite.priority]

  // Formatter la valeur
  const formatCurrency = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Calculer valeur pondérée (estimatedValue × probability)
  const weightedValue = opportunite.estimatedValue && opportunite.probability
    ? opportunite.estimatedValue * (opportunite.probability / 100)
    : opportunite.estimatedValue

  // Déterminer si proche de la date de clôture
  const isClosingSoon = opportunite.expectedCloseDate
    ? new Date(opportunite.expectedCloseDate).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 // 7 jours
    : false

  // Actions possibles selon statut
  const canConvert = ['NEGOTIATION', 'PROPOSAL_SENT'].includes(opportunite.status)

  return (
    <div
      className={`
        bg-white rounded-lg border-2 ${priorityConfig.color}
        shadow-sm hover:shadow-md transition-all
        ${isDragging ? 'opacity-50 rotate-2 scale-105' : ''}
        group relative overflow-hidden
      `}
    >
      {/* Priority indicator bar */}
      <div className={`h-1 ${
        opportunite.priority === 'URGENTE' ? 'bg-red-500' :
        opportunite.priority === 'HAUTE' ? 'bg-orange-500' :
        opportunite.priority === 'MOYENNE' ? 'bg-blue-500' :
        'bg-gray-300'
      }`} />

      <div className="p-3 space-y-3">
        {/* Header: Type emoji + Name */}
        <div className="flex items-start gap-2">
          <div className="text-2xl flex-shrink-0">
            {typeConfig.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 line-clamp-2">
              {opportunite.name}
            </h4>
            {opportunite.description && (
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                {opportunite.description}
              </p>
            )}
          </div>
          {/* Score badge */}
          {opportunite.score !== undefined && opportunite.score !== null && (
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="text-lg font-bold text-blue-600">
                {opportunite.score}
              </div>
              <div className="text-[10px] text-slate-500">score</div>
            </div>
          )}
        </div>

        {/* Badges: Priority + Type */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            <span className={`w-2 h-2 rounded-full mr-1.5 ${
              opportunite.priority === 'URGENTE' ? 'bg-red-500' :
              opportunite.priority === 'HAUTE' ? 'bg-orange-500' :
              opportunite.priority === 'MOYENNE' ? 'bg-blue-500' :
              'bg-gray-400'
            }`} />
            {priorityConfig.label}
          </Badge>
          <Badge variant="secondary" className={`text-xs ${typeConfig.color}`}>
            {typeConfig.label}
          </Badge>
        </div>

        {/* Estimated Value + Confidence */}
        {(opportunite.estimatedValue || opportunite.confidence !== undefined) && (
          <div className="space-y-2">
            {opportunite.estimatedValue && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="text-xs">Valeur:</span>
                </div>
                <span className="font-semibold text-green-600">
                  {formatCurrency(opportunite.estimatedValue)}
                </span>
              </div>
            )}

            {opportunite.confidence !== undefined && opportunite.confidence !== null && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Confiance</span>
                  <span className="font-semibold text-slate-900">{opportunite.confidence}%</span>
                </div>
                {/* Barre de progression */}
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      opportunite.confidence >= 75 ? 'bg-green-500' :
                      opportunite.confidence >= 50 ? 'bg-blue-500' :
                      opportunite.confidence >= 25 ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${opportunite.confidence}%` }}
                  />
                </div>
              </div>
            )}

            {/* Valeur pondérée */}
            {weightedValue && opportunite.probability && (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Pondéré ({opportunite.probability}%)</span>
                <span className="font-medium">{formatCurrency(weightedValue)}</span>
              </div>
            )}
          </div>
        )}

        {/* Expected Close Date */}
        {opportunite.expectedCloseDate && (
          <div className={`flex items-center gap-2 text-xs ${
            isClosingSoon ? 'text-orange-600 font-medium' : 'text-slate-600'
          }`}>
            {isClosingSoon && <AlertCircle className="h-3.5 w-3.5" />}
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Clôture prévue: {formatDate(new Date(opportunite.expectedCloseDate))}
            </span>
          </div>
        )}

        {/* Client */}
        <div className="text-xs text-slate-600 flex items-center gap-1.5">
          <span className="font-medium">Client:</span>
          <span className="text-slate-900 font-semibold">
            {opportunite.client.firstName} {opportunite.client.lastName}
          </span>
        </div>

        {/* Footer: Conseiller + Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Avatar
              src={opportunite.conseiller.avatar || ''}
              name={`${opportunite.conseiller.firstName} ${opportunite.conseiller.lastName}`}
              alt={`${opportunite.conseiller.firstName} ${opportunite.conseiller.lastName}`}
              size="xs"
              status={undefined}
              className="flex-shrink-0"
            />
            <span className="text-xs text-slate-600 truncate">
              {opportunite.conseiller.firstName}
            </span>
          </div>

          {/* Quick actions - shown on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {canConvert && onConvert && !opportunite.convertedToProjetId && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onConvert(opportunite.id)
                }}
                title="Convertir en projet"
              >
                <ArrowRight className="h-3.5 w-3.5 text-purple-600" />
              </Button>
            )}
            {onEdit && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(opportunite)
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
                  onDelete(opportunite.id)
                }}
                title="Supprimer"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-600" />
              </Button>
            )}
          </div>
        </div>

        {/* Converted badge */}
        {opportunite.convertedToProjetId && (
          <div className="absolute top-8 right-2">
            <Badge className="bg-green-600 text-white text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Convertie
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}
