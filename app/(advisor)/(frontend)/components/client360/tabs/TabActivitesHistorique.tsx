 
'use client'

/**
 * TabActivitesHistorique - Activités & Historique
 * Historique des interactions, timeline chronologique
 */

import { useState, useMemo, useId } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/_common/components/ui/Dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { formatDate } from '@/app/_common/lib/utils'
import { useToast } from '@/app/_common/hooks/use-toast'
import { History, Plus, Phone, Mail, Calendar, FileText, Video, Clock, User, Filter, Search, Edit, Trash2, StickyNote, CheckSquare, AlertCircle } from 'lucide-react'
import type { ClientDetail } from '@/app/_common/lib/api-types'

interface TabActivitesHistoriqueProps {
  clientId: string
  client: ClientDetail
}

interface Activity {
  id: string
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'VIDEO' | 'DOCUMENT' | 'NOTE' | 'TASK' | 'SYSTEME'
  title: string
  description: string
  date: string
  duration?: number
  outcome?: string
  createdBy: string
}

interface RendezVous {
  id: string
  title: string
  date: string
  duration: number
  type: string
  status: 'PLANIFIE' | 'TERMINE' | 'ANNULE'
  notes: string
}

interface Tache {
  id: string
  title: string
  dueDate: string
  priority: 'HAUTE' | 'MOYENNE' | 'BASSE'
  status: 'A_FAIRE' | 'EN_COURS' | 'DONE'
}

const ACTIVITY_TYPES = [
  { value: 'CALL', label: 'Appel', icon: Phone, color: 'blue' },
  { value: 'EMAIL', label: 'Email', icon: Mail, color: 'green' },
  { value: 'MEETING', label: 'Rendez-vous', icon: Calendar, color: 'purple' },
  { value: 'VIDEO', label: 'Visio', icon: Video, color: 'cyan' },
  { value: 'DOCUMENT', label: 'Document', icon: FileText, color: 'amber' },
  { value: 'NOTE', label: 'Note', icon: StickyNote, color: 'pink' },
  { value: 'TASK', label: 'Tâche', icon: CheckSquare, color: 'orange' },
  { value: 'SYSTEME', label: 'Système', icon: AlertCircle, color: 'gray' },
]

export function TabActivitesHistorique({ clientId, client }: TabActivitesHistoriqueProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('timeline')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string | null>(null)
  const addActivityDescriptionId = useId()
  const addRdvDescriptionId = useId()
  const editActivityDescriptionId = useId()
  const editRdvDescriptionId = useId()
  
  // Modal states - Activities
  const [showAddActivityModal, setShowAddActivityModal] = useState(false)
  const [showEditActivityModal, setShowEditActivityModal] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  
  // Modal states - RDV
  const [showAddRdvModal, setShowAddRdvModal] = useState(false)
  const [showEditRdvModal, setShowEditRdvModal] = useState(false)
  const [selectedRdv, setSelectedRdv] = useState<RendezVous | null>(null)

  // Extract from client
  const activities: Activity[] = useMemo(() => {
    const timelineEvents = (client.timelineEvents || []).map((e: any) => ({
      id: e.id,
      type: e.type || 'NOTE',
      title: e.title || e.type,
      description: e.description || '',
      date: e.date || e.createdAt,
      duration: e.duration,
      outcome: e.outcome,
      createdBy: e.createdBy || 'Système',
    }))
    return timelineEvents.sort((a: Activity, b: Activity) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [client.timelineEvents])

  const rendezvous: RendezVous[] = useMemo(() => {
    return (client.rendezvous || []).map((r: any) => ({
      id: r.id,
      title: r.title || '',
      date: r.date || r.startDate,
      duration: r.duration || 60,
      type: r.type || 'MEETING',
      status: r.status || 'PLANIFIE',
      notes: r.notes || '',
    }))
  }, [client.rendezvous])

  const taches: Tache[] = useMemo(() => {
    return (client.taches || []).map((t: any) => ({
      id: t.id,
      title: t.title || '',
      dueDate: t.dueDate,
      priority: t.priority || 'MOYENNE',
      status: t.status || 'A_FAIRE',
    }))
  }, [client.taches])

  // Stats
  const stats = useMemo(() => ({
    totalActivities: activities.length,
    calls: activities.filter(a => a.type === 'CALL').length,
    emails: activities.filter(a => a.type === 'EMAIL').length,
    meetings: rendezvous.length,
    pendingTasks: taches.filter(t => t.status !== 'DONE').length,
  }), [activities, rendezvous, taches])

  // Filter activities
  const filteredActivities = useMemo(() => {
    let filtered = activities
    if (searchQuery) {
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    if (filterType) {
      filtered = filtered.filter(a => a.type === filterType)
    }
    return filtered
  }, [activities, searchQuery, filterType])

  // Upcoming appointments
  const upcomingRdv = useMemo(() => {
    const now = new Date()
    return rendezvous.filter(r => new Date(r.date) > now && r.status === 'PLANIFIE')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [rendezvous])

  const handleAddActivity = async (data: Partial<Activity>) => {
    try {
      await fetch(`/api/advisor/clients/${clientId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      toast({ title: 'Activité ajoutée' })
      setShowAddActivityModal(false)
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  const handleAddRdv = async (data: Partial<RendezVous>) => {
    setLoading(true)
    try {
      await fetch(`/api/advisor/clients/${clientId}/rendezvous`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      toast({ title: 'Rendez-vous planifié' })
      setShowAddRdvModal(false)
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Edit/Delete Activity
  const openEditActivityModal = (activity: Activity) => {
    setSelectedActivity(activity)
    setShowEditActivityModal(true)
  }

  const handleEditActivity = async (data: Partial<Activity>) => {
    if (!selectedActivity?.id) return
    setLoading(true)
    try {
      await fetch(`/api/advisor/clients/${clientId}/timeline/${selectedActivity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      toast({ title: 'Activité mise à jour' })
      setShowEditActivityModal(false)
      setSelectedActivity(null)
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteActivity = async (activity: Activity) => {
    if (!confirm(`Supprimer l'activité "${activity.title}" ?`)) return
    setLoading(true)
    try {
      await fetch(`/api/advisor/clients/${clientId}/timeline/${activity.id}`, { method: 'DELETE' })
      toast({ title: 'Activité supprimée' })
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Edit/Delete RDV
  const openEditRdvModal = (rdv: RendezVous) => {
    setSelectedRdv(rdv)
    setShowEditRdvModal(true)
  }

  const handleEditRdv = async (data: Partial<RendezVous>) => {
    if (!selectedRdv?.id) return
    setLoading(true)
    try {
      await fetch(`/api/advisor/clients/${clientId}/rendezvous/${selectedRdv.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      toast({ title: 'Rendez-vous mis à jour' })
      setShowEditRdvModal(false)
      setSelectedRdv(null)
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRdv = async (rdv: RendezVous) => {
    if (!confirm(`Supprimer le rendez-vous "${rdv.title}" ?`)) return
    setLoading(true)
    try {
      await fetch(`/api/advisor/clients/${clientId}/rendezvous/${rdv.id}`, { method: 'DELETE' })
      toast({ title: 'Rendez-vous supprimé' })
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Toggle Task status
  const handleToggleTache = async (tache: Tache) => {
    const newStatus = tache.status === 'DONE' ? 'A_FAIRE' : 'DONE'
    setLoading(true)
    try {
      await fetch(`/api/advisor/clients/${clientId}/taches/${tache.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      toast({ title: newStatus === 'DONE' ? 'Tâche terminée' : 'Tâche réouverte' })
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: Activity['type']) => {
    const config = ACTIVITY_TYPES.find(t => t.value === type)
    return config || ACTIVITY_TYPES[0]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg">
              <History className="h-6 w-6 text-primary-600" />
            </div>
            Activités & Historique
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-14">Historique des interactions et suivi chronologique</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddRdvModal(true)}><Calendar className="h-4 w-4 mr-2" />Planifier RDV</Button>
          <Button onClick={() => setShowAddActivityModal(true)}><Plus className="h-4 w-4 mr-2" />Ajouter activité</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 rounded-xl">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.calls}</p>
                <p className="text-xs text-gray-500">Appels</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-100 rounded-xl">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.emails}</p>
                <p className="text-xs text-gray-500">Emails</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 rounded-xl">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.meetings}</p>
                <p className="text-xs text-gray-500">RDV</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 rounded-xl">
                <CheckSquare className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingTasks}</p>
                <p className="text-xs text-gray-500">Tâches</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gray-100 rounded-xl">
                <History className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalActivities}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming appointments */}
      {upcomingRdv.length > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5 text-purple-600" />Prochains rendez-vous</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingRdv.slice(0, 3).map((rdv) => (
                <div key={rdv.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium">{rdv.title}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(rdv.date)} • {rdv.duration}min</p>
                  </div>
                  <Badge variant="outline">{rdv.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border">
          <TabsTrigger value="timeline"><History className="h-4 w-4 mr-2" />Timeline</TabsTrigger>
          <TabsTrigger value="rendezvous"><Calendar className="h-4 w-4 mr-2" />Rendez-vous</TabsTrigger>
          <TabsTrigger value="taches"><CheckSquare className="h-4 w-4 mr-2" />Tâches</TabsTrigger>
          <TabsTrigger value="notes"><StickyNote className="h-4 w-4 mr-2" />Notes</TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="mt-4 space-y-4">
          {/* Search & Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select value={filterType ?? 'ALL'} onValueChange={(v) => setFilterType(v === 'ALL' ? null : v)}>
              <SelectTrigger className="w-40"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous</SelectItem>
                {ACTIVITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Timeline */}
          {filteredActivities.length > 0 ? (
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {filteredActivities.map((activity, i) => {
                  const config = getActivityIcon(activity.type)
                  const Icon = config.icon
                  return (
                    <div key={activity.id} className="relative flex gap-4 pl-4">
                      <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-${config.color}-100 border-2 border-white`}>
                        <Icon className={`h-4 w-4 text-${config.color}-600`} />
                      </div>
                      <Card className="flex-1">
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{activity.title}</h4>
                                <Badge variant="outline">{config.label}</Badge>
                              </div>
                              {activity.description && <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>}
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(activity.date)}</span>
                                {activity.duration && <span>{activity.duration}min</span>}
                                <span className="flex items-center gap-1"><User className="h-3 w-3" />{activity.createdBy}</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => openEditActivityModal(activity)} disabled={loading}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteActivity(activity)} disabled={loading}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <Card><CardContent className="py-12 text-center"><History className="h-12 w-12 mx-auto mb-4 opacity-50" /><p className="text-muted-foreground">Aucune activité trouvée</p></CardContent></Card>
          )}
        </TabsContent>

        {/* RDV Tab */}
        <TabsContent value="rendezvous" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddRdvModal(true)}><Plus className="h-4 w-4 mr-2" />Nouveau RDV</Button>
          </div>
          {rendezvous.length > 0 ? (
            <div className="space-y-3">
              {rendezvous.map((rdv) => (
                <Card key={rdv.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-purple-100"><Calendar className="h-5 w-5 text-purple-600" /></div>
                        <div>
                          <h4 className="font-medium">{rdv.title}</h4>
                          <p className="text-sm text-muted-foreground">{formatDate(rdv.date)} • {rdv.duration}min</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={rdv.status === 'TERMINE' ? 'bg-green-100 text-green-700' : rdv.status === 'ANNULE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
                          {rdv.status === 'TERMINE' ? 'Terminé' : rdv.status === 'ANNULE' ? 'Annulé' : 'Planifié'}
                        </Badge>
                        <Button size="sm" variant="ghost" onClick={() => openEditRdvModal(rdv)} disabled={loading}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteRdv(rdv)} disabled={loading}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">Aucun rendez-vous</p>
                <Button onClick={() => setShowAddRdvModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />Planifier un RDV
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tâches Tab */}
        <TabsContent value="taches" className="mt-4">
          {taches.length > 0 ? (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {taches.map((tache) => (
                    <div key={tache.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={tache.status === 'DONE'} 
                          onChange={() => handleToggleTache(tache)}
                          disabled={loading}
                          className="rounded cursor-pointer h-4 w-4" 
                        />
                        <div>
                          <p className={`font-medium ${tache.status === 'DONE' ? 'line-through text-muted-foreground' : ''}`}>{tache.title}</p>
                          {tache.dueDate && <p className="text-xs text-muted-foreground">Échéance: {formatDate(tache.dueDate)}</p>}
                        </div>
                      </div>
                      <Badge variant="outline" className={tache.priority === 'HAUTE' ? 'border-red-500 text-red-500' : tache.priority === 'BASSE' ? 'border-green-500 text-green-500' : ''}>
                        {tache.priority === 'HAUTE' ? 'Haute' : tache.priority === 'BASSE' ? 'Basse' : 'Moyenne'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="py-12 text-center"><CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" /><p className="text-muted-foreground">Aucune tâche</p></CardContent></Card>
          )}
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {activities.filter(a => a.type === 'NOTE').map((note) => (
                  <div key={note.id} className="p-4 rounded-lg border bg-amber-50">
                    <p className="font-medium">{note.title}</p>
                    <p className="text-sm mt-1">{note.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">{formatDate(note.date)} • {note.createdBy}</p>
                  </div>
                ))}
                {activities.filter(a => a.type === 'NOTE').length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">Aucune note</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Activity Modal */}
      <Dialog open={showAddActivityModal} onOpenChange={setShowAddActivityModal}>
        <DialogContent aria-describedby={addActivityDescriptionId}>
          <DialogHeader>
            <DialogTitle>Nouvelle activité</DialogTitle>
            <DialogDescription id={addActivityDescriptionId}>Ajoutez une interaction ou une note liée à ce client.</DialogDescription>
          </DialogHeader>
          <AddActivityForm onAdd={handleAddActivity} onClose={() => setShowAddActivityModal(false)} />
        </DialogContent>
      </Dialog>

      {/* Add RDV Modal */}
      <Dialog open={showAddRdvModal} onOpenChange={setShowAddRdvModal}>
        <DialogContent aria-describedby={addRdvDescriptionId}>
          <DialogHeader>
            <DialogTitle>Planifier un rendez-vous</DialogTitle>
            <DialogDescription id={addRdvDescriptionId}>Définissez la date, la durée et le sujet du rendez-vous.</DialogDescription>
          </DialogHeader>
          <AddRdvForm onAdd={handleAddRdv} onClose={() => setShowAddRdvModal(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Activity Modal */}
      <Dialog open={showEditActivityModal} onOpenChange={(o) => { setShowEditActivityModal(o); if (!o) setSelectedActivity(null) }}>
        <DialogContent aria-describedby={editActivityDescriptionId}>
          <DialogHeader>
            <DialogTitle>Modifier l'activité</DialogTitle>
            <DialogDescription id={editActivityDescriptionId}>Mettez à jour les informations de l'activité sélectionnée.</DialogDescription>
          </DialogHeader>
          {selectedActivity && (
            <EditActivityForm 
              activity={selectedActivity} 
              onSave={handleEditActivity} 
              onClose={() => { setShowEditActivityModal(false); setSelectedActivity(null) }}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit RDV Modal */}
      <Dialog open={showEditRdvModal} onOpenChange={(o) => { setShowEditRdvModal(o); if (!o) setSelectedRdv(null) }}>
        <DialogContent aria-describedby={editRdvDescriptionId}>
          <DialogHeader>
            <DialogTitle>Modifier le rendez-vous</DialogTitle>
            <DialogDescription id={editRdvDescriptionId}>Actualisez les détails du rendez-vous sélectionné.</DialogDescription>
          </DialogHeader>
          {selectedRdv && (
            <EditRdvForm 
              rdv={selectedRdv} 
              onSave={handleEditRdv} 
              onClose={() => { setShowEditRdvModal(false); setSelectedRdv(null) }}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AddActivityForm({ onAdd, onClose }: { onAdd: (d: Partial<Activity>) => void; onClose: () => void }) {
  const [data, setData] = useState({ type: 'NOTE' as Activity['type'], title: '', description: '' })
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2"><Label>Type</Label><Select value={data.type} onValueChange={(v: Activity['type']) => setData({...data, type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ACTIVITY_TYPES.filter(t => t.value !== 'SYSTEME').map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Titre</Label><Input value={data.title} onChange={(e) => setData({...data, title: e.target.value})} /></div>
      <div className="space-y-2"><Label>Description</Label><Input value={data.description} onChange={(e) => setData({...data, description: e.target.value})} /></div>
      <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={() => onAdd({...data, date: new Date().toISOString(), createdBy: 'Conseiller'})} disabled={!data.title}>Ajouter</Button></DialogFooter>
    </div>
  )
}

function AddRdvForm({ onAdd, onClose }: { onAdd: (d: Partial<RendezVous>) => void; onClose: () => void }) {
  const [data, setData] = useState({ title: '', date: '', duration: '60', type: 'MEETING' })
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2"><Label>Titre</Label><Input value={data.title} onChange={(e) => setData({...data, title: e.target.value})} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Date et heure</Label><Input type="datetime-local" value={data.date} onChange={(e) => setData({...data, date: e.target.value})} /></div>
        <div className="space-y-2"><Label>Durée (min)</Label><Input type="number" value={data.duration} onChange={(e) => setData({...data, duration: e.target.value})} /></div>
      </div>
      <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={() => onAdd({...data, duration: Number(data.duration), status: 'PLANIFIE'})} disabled={!data.title || !data.date}>Planifier</Button></DialogFooter>
    </div>
  )
}

function EditActivityForm({ activity, onSave, onClose, loading }: { 
  activity: Activity
  onSave: (d: Partial<Activity>) => void
  onClose: () => void
  loading: boolean
}) {
  const [data, setData] = useState({
    type: activity.type,
    title: activity.title,
    description: activity.description,
    outcome: activity.outcome || '',
  })
  
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={data.type} onValueChange={(v: Activity['type']) => setData({...data, type: v})}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {ACTIVITY_TYPES.filter(t => t.value !== 'SYSTEME').map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Titre *</Label>
        <Input value={data.title} onChange={(e) => setData({...data, title: e.target.value})} />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input value={data.description} onChange={(e) => setData({...data, description: e.target.value})} />
      </div>
      <div className="space-y-2">
        <Label>Résultat / Issue</Label>
        <Input value={data.outcome} onChange={(e) => setData({...data, outcome: e.target.value})} placeholder="Ex: RDV confirmé, Proposition envoyée..." />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button onClick={() => onSave(data)} disabled={!data.title || loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </div>
  )
}

function EditRdvForm({ rdv, onSave, onClose, loading }: { 
  rdv: RendezVous
  onSave: (d: Partial<RendezVous>) => void
  onClose: () => void
  loading: boolean
}) {
  const [data, setData] = useState({
    title: rdv.title,
    date: rdv.date?.split('.')[0] || '',
    duration: String(rdv.duration),
    type: rdv.type,
    status: rdv.status,
    notes: rdv.notes,
  })
  
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Titre *</Label>
        <Input value={data.title} onChange={(e) => setData({...data, title: e.target.value})} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date et heure</Label>
          <Input type="datetime-local" value={data.date} onChange={(e) => setData({...data, date: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label>Durée (min)</Label>
          <Input type="number" value={data.duration} onChange={(e) => setData({...data, duration: e.target.value})} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Statut</Label>
        <Select value={data.status} onValueChange={(v: RendezVous['status']) => setData({...data, status: v})}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="SCHEDULED">Planifié</SelectItem>
            <SelectItem value="COMPLETED">Terminé</SelectItem>
            <SelectItem value="CANCELLED">Annulé</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Input value={data.notes} onChange={(e) => setData({...data, notes: e.target.value})} placeholder="Notes sur le rendez-vous..." />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button onClick={() => onSave({...data, duration: Number(data.duration)})} disabled={!data.title || loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </div>
  )
}

export default TabActivitesHistorique
