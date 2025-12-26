'use client'

import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import Avatar from '@/app/_common/components/ui/Avatar'
import {
  User,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  Edit,
  CheckCircle2,
  Building2,
} from 'lucide-react'
import { formatDate } from '@/app/_common/lib/utils'

export interface ProspectData {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  mobile?: string | null
  clientType: 'PARTICULIER' | 'PROFESSIONNEL'
  companyName?: string | null
  status: 'PROSPECT' | 'PERDU'
  createdAt: Date | string
  lastContactDate?: Date | string | null
  conseiller: {
    id: string
    firstName: string
    lastName: string
  }
  _count?: {
    opportunites: number
    taches: number
    rendezvous: number
  }
}

interface ProspectCardProps {
  prospect: ProspectData
  onEdit?: (prospect: ProspectData) => void
  onConvert?: (prospectId: string) => void
  onReactivate?: (prospectId: string) => void
}

export function ProspectCard({ prospect, onEdit, onConvert, onReactivate }: ProspectCardProps) {
  const fullName = `${prospect.firstName} ${prospect.lastName}`
  const isProfessionnel = prospect.clientType === 'PROFESSIONNEL'
  const isLost = prospect.status === 'PERDU'
  
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar
            src=""
            name={fullName}
            alt={fullName}
            size="lg"
            status="online"
            className="flex-shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-slate-900 truncate">
                {fullName}
              </h3>
              <Badge variant={isLost ? 'danger' : 'warning'} className="text-xs">
                {isLost ? 'Perdu' : 'Prospect'}
              </Badge>
              {isProfessionnel && (
                <Badge variant="info" className="text-xs">
                  <Building2 className="h-3 w-3 mr-1" />
                  Pro
                </Badge>
              )}
            </div>
            
            {isProfessionnel && prospect.companyName && (
              <p className="text-sm text-slate-600 mb-2">
                {prospect.companyName}
              </p>
            )}

            {/* Contact Info */}
            <div className="space-y-1 text-sm">
              {prospect.email && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{prospect.email}</span>
                </div>
              )}
              
              {(prospect.phone || prospect.mobile) && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{prospect.mobile || prospect.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        {prospect._count && (
          <div className="grid grid-cols-3 gap-2 mb-4 pt-4 border-t border-slate-200">
            <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-xs text-blue-700 font-medium mb-1">Opportunités</div>
              <p className="text-xl font-bold text-blue-900">
                {prospect._count.opportunites}
              </p>
            </div>

            <div className="text-center p-2 bg-purple-50 rounded-lg border border-purple-100">
              <div className="text-xs text-purple-700 font-medium mb-1">Tâches</div>
              <p className="text-xl font-bold text-purple-900">
                {prospect._count.taches}
              </p>
            </div>

            <div className="text-center p-2 bg-green-50 rounded-lg border border-green-100">
              <div className="text-xs text-green-700 font-medium mb-1">RDV</div>
              <p className="text-xl font-bold text-green-900">
                {prospect._count.rendezvous}
              </p>
            </div>
          </div>
        )}

        {/* Meta */}
        <div className="text-xs text-slate-500 mb-4 space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>Créé le {formatDate(new Date(prospect.createdAt))}</span>
          </div>
          
          {prospect.lastContactDate && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Dernier contact : {formatDate(new Date(prospect.lastContactDate))}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5" />
            <span>Conseiller : {prospect.conseiller.firstName} {prospect.conseiller.lastName}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
          {onConvert && !isLost && (
            <Button
              onClick={() => onConvert(prospect.id)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Convertir en client
            </Button>
          )}

          {onReactivate && isLost && (
            <Button
              onClick={() => onReactivate(prospect.id)}
              className="flex-1"
              size="sm"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Réactiver
            </Button>
          )}
          
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(prospect)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
