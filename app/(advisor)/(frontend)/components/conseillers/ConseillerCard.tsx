 
'use client'

import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import Avatar from '@/app/_common/components/ui/Avatar'
import {
  Mail,
  Phone,
  Calendar,
  Users,
  CheckSquare,
  TrendingUp,
  Edit,
  Trash2,
  BarChart3,
} from 'lucide-react'
import { formatDate } from '@/app/_common/lib/utils'

export interface ConseillerData {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  avatar?: string | null
  role: 'ADVISOR' | 'ASSISTANT' | 'ADMIN'
  permissions?: any
  isActive: boolean
  lastLogin?: Date | string | null
  createdAt: Date | string
  stats?: {
    totalClients: number
    clientsPrincipaux: number
    clientsRemplacants: number
    totalTasks: number
    totalAppointments: number
    totalOpportunities: number
  }
}

interface ConseillerCardProps {
  conseiller: ConseillerData
  onEdit?: (conseiller: ConseillerData) => void
  onDelete?: (conseillerId: string) => void
  onViewStats?: (conseillerId: string) => void
  currentUserId?: string
}

const ROLE_CONFIG = {
  ADVISOR: { label: 'Conseiller', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  ASSISTANT: { label: 'Assistant', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  ADMIN: { label: 'Administrateur', color: 'bg-green-100 text-green-700 border-green-200' },
}

export function ConseillerCard({
  conseiller,
  onEdit,
  onDelete,
  onViewStats,
  currentUserId,
}: ConseillerCardProps) {
  const roleConfig = ROLE_CONFIG[conseiller.role]
  const fullName = `${conseiller.firstName} ${conseiller.lastName}`
  const isCurrentUser = conseiller.id === currentUserId

  return (
    <Card className={`
      hover:shadow-lg transition-shadow duration-200
      ${!conseiller.isActive ? 'opacity-60 border-red-200 bg-red-50' : ''}
    `}>
      <CardContent className="p-6">
        {/* Header avec Avatar + Info principale */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar
            src={conseiller.avatar || ''}
            name={fullName}
            alt={fullName}
            size="lg"
            status={conseiller.isActive ? 'online' : 'offline'}
            className="flex-shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-slate-900 truncate">
                {fullName}
              </h3>
              {isCurrentUser && (
                <Badge variant="info" className="text-xs">
                  Vous
                </Badge>
              )}
              {!conseiller.isActive && (
                <Badge variant="destructive" className="text-xs">
                  Inactif
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${roleConfig.color} text-xs border`}>
                {roleConfig.label}
              </Badge>
            </div>

            {/* Contact Info */}
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{conseiller.email}</span>
              </div>
              
              {conseiller.phone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{conseiller.phone}</span>
                </div>
              )}

              {conseiller.lastLogin && (
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Dernière connexion : {formatDate(new Date(conseiller.lastLogin))}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {conseiller.stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 pt-4 border-t border-slate-200">
            <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Clients</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {conseiller.stats.totalClients}
              </p>
              <div className="text-xs text-blue-600 mt-1">
                {conseiller.stats.clientsPrincipaux} principaux
              </div>
            </div>

            <div className="text-center p-2 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckSquare className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">Tâches</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {conseiller.stats.totalTasks}
              </p>
              <div className="text-xs text-purple-600 mt-1">
                en cours
              </div>
            </div>

            <div className="text-center p-2 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">RDV</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {conseiller.stats.totalAppointments}
              </p>
              <div className="text-xs text-green-600 mt-1">
                planifiés
              </div>
            </div>

            <div className="text-center p-2 bg-orange-50 rounded-lg border border-orange-100 col-span-2 md:col-span-3">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <span className="text-xs font-medium text-orange-700">Opportunités</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">
                {conseiller.stats.totalOpportunities}
              </p>
              <div className="text-xs text-orange-600 mt-1">
                dans le pipeline
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
          {onViewStats && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewStats(conseiller.id)}
              className="flex-1"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Statistiques
            </Button>
          )}
          
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(conseiller)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          )}
          
          {onDelete && !isCurrentUser && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm(`Êtes-vous sûr de vouloir désactiver ${fullName} ?`)) {
                  onDelete(conseiller.id)
                }
              }}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Created date */}
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 text-center">
          Créé le {formatDate(new Date(conseiller.createdAt))}
        </div>
      </CardContent>
    </Card>
  )
}
