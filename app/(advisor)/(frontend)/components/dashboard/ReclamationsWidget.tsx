'use client'

import { useState, useEffect } from 'react'
import { apiCall } from '@/app/_common/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface ReclamationItem {
  _id: string
  objet: string
  gravite: string
  slaDeadline?: string
  recueAt?: string
  particulierId?: {
    _id: string
    firstName: string
    lastName: string
  }
}

export default function ReclamationsWidget() {
  const [reclamations, setReclamations] = useState<ReclamationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReclamations()
  }, [])

  const loadReclamations = async () => {
    try {
      setLoading(true)
      const data = (await apiCall('/api/advisor/reclamations?filter=urgentes')) as {
        reclamations?: ReclamationItem[]
      }
      setReclamations(data.reclamations || [])
    } catch {
      setReclamations([])
    } finally {
      setLoading(false)
    }
  }

  const getTempsRestant = (rec: ReclamationItem) => {
    if (!rec.slaDeadline) return '-'
    const now = new Date()
    const deadline = new Date(rec.slaDeadline)
    const timeRemaining = deadline.getTime() - now.getTime()
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60))

    if (hoursRemaining < 0) {
      return `Dépassé de ${Math.abs(hoursRemaining)}h`
    } else if (hoursRemaining < 24) {
      return `${hoursRemaining}h`
    } else {
      const daysRemaining = Math.floor(hoursRemaining / 24)
      return `${daysRemaining}j`
    }
  }

  const getRelativeTime = (date?: string) => {
    if (!date) return '-'
    const now = new Date()
    const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      return `il y a ${diffMins}min`
    } else if (diffHours < 24) {
      return `il y a ${diffHours}h`
    } else {
      const diffDays = Math.floor(diffHours / 24)
      return `il y a ${diffDays}j`
    }
  }

  const getGraviteBadge = (gravite: string) => {
    switch (gravite) {
      case 'URGENT':
        return <Badge variant="destructive" className="text-xs">Urgent</Badge>
      case 'MOYEN':
        return <Badge variant="default" className="bg-amber-500 text-xs">Moyen</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">Normal</Badge>
    }
  }

  return (
    <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            Réclamations Urgentes
          </CardTitle>
          <Badge variant="destructive">{reclamations.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-center py-6">
            <div className="animate-spin h-6 w-6 border-2 border-red-600 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <>
            {reclamations.slice(0, 3).map((reclamation) => (
              <Link key={reclamation._id} href={`/dashboard/reclamations/${reclamation._id}`}>
                <div className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getGraviteBadge(reclamation.gravite)}
                        <span className="text-sm font-medium text-slate-900 truncate">
                          {reclamation.particulierId?.firstName} {reclamation.particulierId?.lastName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mb-2">{reclamation.objet}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          SLA: {getTempsRestant(reclamation)}
                        </span>
                        <span>•</span>
                        <span>{getRelativeTime(reclamation.recueAt)}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </>
        )}

        {!loading && reclamations.length === 0 && (
          <div className="text-center py-6 text-sm text-slate-500">
            Aucune réclamation urgente
          </div>
        )}

        <Link href="/dashboard/reclamations">
          <Button variant="outline" className="w-full mt-2" size="sm">
            Voir toutes les réclamations
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
