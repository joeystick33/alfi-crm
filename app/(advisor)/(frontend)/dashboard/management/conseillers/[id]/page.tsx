'use client'

/**
 * Détail Performance Conseiller
 * 
 * Vue détaillée des performances d'un conseiller:
 * - KPIs individuels
 * - Historique des performances
 * - Liste de ses clients et opportunités
 * - Notes de suivi 1-to-1
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Progress } from '@/app/_common/components/ui/Progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { Textarea } from '@/app/_common/components/ui/Textarea'
import {
  ArrowLeft,
  Euro,
  Users,
  Target,
  Calendar,
  CheckCircle,
  Mail,
  Phone,
  Activity,
  Briefcase,
  MessageSquare,
  Save,
  Plus,
} from 'lucide-react'

interface ConseillerDetail {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  createdAt: string
  lastLogin?: string
  stats: {
    clients: number
    clientsNew: number
    opportunities: number
    opportunitiesWon: number
    opportunitiesLost: number
    opportunitiesValue: number
    ca: number
    caObjectif: number
    tasks: number
    tasksDone: number
    tasksOverdue: number
  }
  monthlyPerformance: {
    month: string
    ca: number
    clients: number
    opportunities: number
  }[]
  recentClients: {
    id: string
    firstName: string
    lastName: string
    patrimony: number
    lastContact?: string
  }[]
  recentOpportunities: {
    id: string
    name: string
    value: number
    status: string
    client: string
  }[]
  notes: {
    id: string
    date: string
    content: string
    author: string
  }[]
}

export default function ConseillerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const conseillerId = params.id as string

  const [loading, setLoading] = useState(true)
  const [conseiller, setConseiller] = useState<ConseillerDetail | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => {
    loadConseiller()
  }, [conseillerId])

  const loadConseiller = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/advisor/management/conseillers/${conseillerId}`, {
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`)
      }
      const result = await response.json()
      const data = result.data || result
      setConseiller(data.conseiller || data)
    } catch (error) {
      setConseiller(null)
    } finally {
      setLoading(false)
    }
  }


  const handleSaveNote = async () => {
    if (!newNote.trim()) return
    setSavingNote(true)
    
    try {
      await fetch(`/api/advisor/management/conseillers/${conseillerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note: newNote }),
      })
      
      setConseiller(prev => prev ? {
        ...prev,
        notes: [
          { id: Date.now().toString(), date: new Date().toISOString().split('T')[0], content: newNote, author: 'Admin' },
          ...prev.notes
        ]
      } : null)
      setNewNote('')
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setSavingNote(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!conseiller) {
    return (
      <div className="p-6 text-center">
        <p>Conseiller non trouvé</p>
        <Button onClick={() => router.back()} className="mt-4">Retour</Button>
      </div>
    )
  }

  const objectifProgress = (conseiller.stats.ca / conseiller.stats.caObjectif) * 100
  const tasksProgress = (conseiller.stats.tasksDone / conseiller.stats.tasks) * 100
  const conversionRate = conseiller.stats.opportunities > 0 
    ? (conseiller.stats.opportunitiesWon / conseiller.stats.opportunities) * 100 
    : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {conseiller.firstName[0]}{conseiller.lastName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {conseiller.firstName} {conseiller.lastName}
              </h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {conseiller.email}
                </span>
                {conseiller.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {conseiller.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-700">{conseiller.role}</Badge>
          <Link href={`/dashboard/management/reunions/new?conseiller=${conseillerId}`}>
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Planifier 1-to-1
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Chiffre d'Affaires</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(conseiller.stats.ca)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={objectifProgress} className="h-2 flex-1" />
                  <span className="text-xs text-gray-500">{Math.round(objectifProgress)}%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Objectif: {formatCurrency(conseiller.stats.caObjectif)}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Euro className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Clients</p>
                <p className="text-2xl font-bold mt-1">{conseiller.stats.clients}</p>
                <p className="text-sm text-green-600 mt-2">
                  +{conseiller.stats.clientsNew} ce mois
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Taux de conversion</p>
                <p className="text-2xl font-bold mt-1">{Math.round(conversionRate)}%</p>
                <p className="text-sm text-gray-500 mt-2">
                  {conseiller.stats.opportunitiesWon}/{conseiller.stats.opportunities} gagnées
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Tâches</p>
                <p className="text-2xl font-bold mt-1">{conseiller.stats.tasksDone}/{conseiller.stats.tasks}</p>
                {conseiller.stats.tasksOverdue > 0 && (
                  <p className="text-sm text-red-600 mt-2">
                    {conseiller.stats.tasksOverdue} en retard
                  </p>
                )}
                {conseiller.stats.tasksOverdue === 0 && (
                  <p className="text-sm text-green-600 mt-2">À jour</p>
                )}
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="clients">Clients ({conseiller.stats.clients})</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunités ({conseiller.stats.opportunities})</TabsTrigger>
          <TabsTrigger value="notes">Notes de suivi ({conseiller.notes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance mensuelle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Performance Mensuelle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conseiller.monthlyPerformance.map((month, index) => (
                    <div key={month.month} className="flex items-center gap-4">
                      <span className="w-12 text-sm text-gray-500">{month.month}</span>
                      <div className="flex-1">
                        <Progress 
                          value={(month.ca / 50000) * 100} 
                          className="h-3" 
                        />
                      </div>
                      <span className="w-20 text-right font-medium text-sm">
                        {formatCurrency(month.ca)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Dernières opportunités */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Opportunités en Cours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conseiller.recentOpportunities.map(opp => (
                    <div key={opp.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{opp.name}</p>
                        <p className="text-sm text-gray-500">{opp.client}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(opp.value)}</p>
                        <Badge variant="outline" className="text-xs">{opp.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Clients Récents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {conseiller.recentClients.map(client => (
                  <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-medium">
                        {client.firstName[0]}{client.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium">{client.firstName} {client.lastName}</p>
                        <p className="text-sm text-gray-500">
                          Dernier contact: {client.lastContact ? formatDate(client.lastContact) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(client.patrimony)}</p>
                      <p className="text-sm text-gray-500">Patrimoine</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Toutes les Opportunités</CardTitle>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    {conseiller.stats.opportunitiesWon} gagnées
                  </span>
                  <span className="flex items-center gap-1 text-red-600">
                    {conseiller.stats.opportunitiesLost} perdues
                  </span>
                  <span className="flex items-center gap-1 text-blue-600">
                    {conseiller.stats.opportunities - conseiller.stats.opportunitiesWon - conseiller.stats.opportunitiesLost} en cours
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Valeur totale du pipeline: {formatCurrency(conseiller.stats.opportunitiesValue)}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-6 space-y-6">
          {/* Ajouter une note */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Ajouter une Note
              </CardTitle>
              <CardDescription>
                Notes de suivi après un point 1-to-1 ou une observation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Écrivez votre note de suivi..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
              />
              <Button 
                onClick={handleSaveNote} 
                disabled={!newNote.trim() || savingNote}
                className="mt-3"
              >
                <Save className="h-4 w-4 mr-2" />
                {savingNote ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </CardContent>
          </Card>

          {/* Historique des notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Historique des Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conseiller.notes.map(note => (
                  <div key={note.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">{note.author}</span>
                      <span className="text-sm text-gray-400">{formatDate(note.date)}</span>
                    </div>
                    <p className="text-gray-700">{note.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
