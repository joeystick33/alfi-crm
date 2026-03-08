'use client'

/**
 * Objectifs d'Équipe - Vue Admin
 * 
 * Gestion des objectifs:
 * - Objectifs globaux du cabinet
 * - Objectifs par conseiller
 * - Suivi de progression
 */

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Progress } from '@/app/_common/components/ui/Progress'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { useManagementObjectifs, useCreateObjectif } from '@/app/_common/hooks/use-api'
import {
  ArrowLeft,
  Target,
  Euro,
  Users,
  TrendingUp,
  TrendingDown,
  Plus,
  CheckCircle,
  AlertTriangle,
  Award,
  Save,
  X,
} from 'lucide-react'

interface ObjectifData {
  id: string
  type: 'CA' | 'CLIENTS' | 'OPPORTUNITIES' | 'TASKS'
  label: string
  target: number
  current: number
  unit: string
  period: string
  conseillerId?: string
  conseillerName?: string
  deadline?: string
  status: 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'ATTEINT'
}

const STATUS_CONFIG = {
  ON_TRACK: { label: 'En bonne voie', color: 'bg-green-100 text-green-700', icon: TrendingUp },
  AT_RISK: { label: 'À risque', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  BEHIND: { label: 'En retard', color: 'bg-red-100 text-red-700', icon: TrendingDown },
  ACHIEVED: { label: 'Atteint', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
}

const TYPE_ICONS = {
  CA: Euro,
  CLIENTS: Users,
  OPPORTUNITIES: Target,
  TASKS: CheckCircle,
}


export default function ObjectifsPage() {
  const [showNewForm, setShowNewForm] = useState(false)
  const [newObjectif, setNewObjectif] = useState({
    type: 'CA' as ObjectifData['type'],
    label: '',
    target: 0,
    period: 'month',
    conseillerId: '',
  })

  // Fetch objectifs from API
  const { data: apiData, isLoading } = useManagementObjectifs({ period: 'month' })
  const createObjectifMutation = useCreateObjectif()

  // Map API data to component format with fallback
  const objectifs: ObjectifData[] = useMemo(() => {
    if (apiData?.objectifs && apiData.objectifs.length > 0) {
      return apiData.objectifs.map((obj) => ({
        id: obj.id,
        type: obj.type as ObjectifData['type'],
        label: obj.label,
        target: obj.target,
        current: obj.current,
        unit: obj.unit,
        period: obj.period,
        conseillerId: obj.conseillerId,
        conseillerName: obj.conseillerName,
        status: obj.status as ObjectifData['status'],
      }))
    }
    return []
  }, [apiData])

  const handleCreateObjectif = () => {
    createObjectifMutation.mutate({
      type: newObjectif.type,
      label: newObjectif.label,
      target: newObjectif.target,
      period: newObjectif.period,
      conseillerId: newObjectif.conseillerId || undefined,
      current: 0,
      unit: newObjectif.type === 'CA' ? '€' : 'unités',
      status: 'ON_TRACK',
    }, {
      onSuccess: () => {
        setShowNewForm(false)
        setNewObjectif({ type: 'CA', label: '', target: 0, period: 'month', conseillerId: '' })
      }
    })
  }

  const formatValue = (value: number, unit: string) => {
    if (unit === '€') {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
    }
    return `${value} ${unit}`
  }

  const getProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  const cabinetObjectifs = objectifs.filter(o => !o.conseillerId)
  const conseillerObjectifs = objectifs.filter(o => o.conseillerId)

  // Grouper par conseiller
  const objectifsByConseiller = conseillerObjectifs.reduce((acc, obj) => {
    const key = obj.conseillerId!
    if (!acc[key]) {
      acc[key] = { name: obj.conseillerName!, objectifs: [] }
    }
    acc[key].objectifs.push(obj)
    return acc
  }, {} as Record<string, { name: string; objectifs: ObjectifData[] }>)

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/management">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="h-7 w-7 text-blue-600" />
              Objectifs
            </h1>
            <p className="text-gray-500 mt-1">Suivi des objectifs cabinet et conseillers</p>
          </div>
        </div>
        
        <Button onClick={() => setShowNewForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel objectif
        </Button>
      </div>

      {objectifs.length === 0 && (
        <Card className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
            <Target className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Aucun objectif défini</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Définissez des objectifs pour le cabinet et vos conseillers afin de suivre les performances commerciales.
          </p>
          <Button onClick={() => setShowNewForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer un objectif
          </Button>
        </Card>
      )}

      {objectifs.length > 0 && (
      <>
      {/* Objectifs Cabinet */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-purple-600" />
          Objectifs Cabinet
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cabinetObjectifs.map(obj => {
            const progress = getProgress(obj.current, obj.target)
            const StatusIcon = STATUS_CONFIG[obj.status].icon
            const TypeIcon = TYPE_ICONS[obj.type]
            
            return (
              <Card key={obj.id} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <TypeIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{obj.label}</p>
                        <p className="text-sm text-gray-500">{obj.period}</p>
                      </div>
                    </div>
                    <Badge className={STATUS_CONFIG[obj.status].color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {STATUS_CONFIG[obj.status].label}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-end justify-between">
                      <span className="text-3xl font-bold">{formatValue(obj.current, obj.unit)}</span>
                      <span className="text-sm text-gray-500">/ {formatValue(obj.target, obj.unit)}</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                    <div className="flex items-center justify-between text-sm">
                      <span className={progress >= 80 ? 'text-green-600' : progress >= 50 ? 'text-orange-600' : 'text-red-600'}>
                        {Math.round(progress)}% atteint
                      </span>
                      <span className="text-gray-500">
                        Reste {formatValue(obj.target - obj.current, obj.unit)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Objectifs par Conseiller */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-green-600" />
          Objectifs par Conseiller
        </h2>
        <div className="space-y-4">
          {Object.entries(objectifsByConseiller).map(([conseillerId, data]) => (
            <Card key={conseillerId}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {data.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{data.name}</CardTitle>
                      <CardDescription>{data.objectifs.length} objectifs actifs</CardDescription>
                    </div>
                  </div>
                  <Link href={`/dashboard/management/conseillers/${conseillerId}`}>
                    <Button variant="outline" size="sm">
                      Voir détail
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.objectifs.map(obj => {
                    const progress = getProgress(obj.current, obj.target)
                    const TypeIcon = TYPE_ICONS[obj.type]
                    
                    return (
                      <div key={obj.id} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TypeIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">{obj.label}</span>
                        </div>
                        <div className="flex items-end gap-2 mb-2">
                          <span className="text-xl font-bold">{formatValue(obj.current, obj.unit)}</span>
                          <span className="text-sm text-gray-500">/ {formatValue(obj.target, obj.unit)}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex items-center justify-between mt-1">
                          <Badge className={STATUS_CONFIG[obj.status].color + ' text-xs'}>
                            {Math.round(progress)}%
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      </>
      )}

      {/* Modal Nouvel Objectif */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Nouvel Objectif</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowNewForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Type d'objectif</Label>
                <select
                  value={newObjectif.type}
                  onChange={(e) => setNewObjectif({ ...newObjectif, type: e.target.value as ObjectifData['type'] })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                >
                  <option value="CA">Chiffre d'affaires</option>
                  <option value="CLIENTS">Nouveaux clients</option>
                  <option value="OPPORTUNITIES">Opportunités</option>
                  <option value="TASKS">Tâches</option>
                </select>
              </div>
              
              <div>
                <Label>Libellé</Label>
                <Input
                  value={newObjectif.label}
                  onChange={(e) => setNewObjectif({ ...newObjectif, label: e.target.value })}
                  placeholder="Ex: CA Mensuel"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Objectif cible</Label>
                <Input
                  type="number"
                  value={newObjectif.target}
                  onChange={(e) => setNewObjectif({ ...newObjectif, target: parseInt(e.target.value) })}
                  placeholder="100000"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Période</Label>
                <select
                  value={newObjectif.period}
                  onChange={(e) => setNewObjectif({ ...newObjectif, period: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                >
                  <option value="month">Mensuel</option>
                  <option value="quarter">Trimestriel</option>
                  <option value="year">Annuel</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowNewForm(false)} className="flex-1">
                  Annuler
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleCreateObjectif}
                  disabled={createObjectifMutation.isPending || !newObjectif.label || !newObjectif.target}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {createObjectifMutation.isPending ? 'Création...' : 'Créer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
