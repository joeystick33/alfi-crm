'use client'

/**
 * TabActivitesPro - Historique activités (design épuré V2)
 */

import { useState } from 'react'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/_common/components/ui/Dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { History, Plus, Phone, Mail, Calendar, FileText, Users, MessageSquare, CheckSquare, Clock, Trash2, Check } from 'lucide-react'
import { useToast } from '@/app/_common/hooks/use-toast'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'

const TYPES = [
  { value: 'APPEL', label: 'Appel', icon: Phone, color: 'bg-blue-100 text-blue-600' },
  { value: 'EMAIL', label: 'Email', icon: Mail, color: 'bg-green-100 text-green-600' },
  { value: 'RDV', label: 'Rendez-vous', icon: Calendar, color: 'bg-purple-100 text-purple-600' },
  { value: 'REUNION', label: 'Réunion', icon: Users, color: 'bg-amber-100 text-amber-600' },
  { value: 'NOTE', label: 'Note', icon: MessageSquare, color: 'bg-gray-100 text-gray-600' },
  { value: 'DOCUMENT', label: 'Document', icon: FileText, color: 'bg-indigo-100 text-indigo-600' },
  { value: 'TACHE', label: 'Tâche', icon: CheckSquare, color: 'bg-pink-100 text-pink-600' },
]

interface Activite {
  id: string
  type: string
  titre: string
  description?: string
  date: string
  duree?: number
  interlocuteur?: string
  estTache?: boolean
  terminee?: boolean
}

interface Props { clientId: string; client: ClientDetail; wealthSummary?: WealthSummary }

export default function TabActivitesPro({ client }: Props) {
  const { toast } = useToast()
  const [showDialog, setShowDialog] = useState(false)
  const [filter, setFilter] = useState<string | null>(null)
  const [activites, setActivites] = useState<Activite[]>([])
  const [form, setForm] = useState({ type: 'NOTE', titre: '', description: '', date: new Date().toISOString().split('T')[0], duree: '', interlocuteur: '' })

  const handleAdd = () => {
    if (!form.titre) { toast({ title: 'Titre requis', variant: 'destructive' }); return }
    const a: Activite = {
      id: Date.now().toString(),
      type: form.type,
      titre: form.titre,
      description: form.description || undefined,
      date: form.date || new Date().toISOString(),
      duree: form.duree ? Number(form.duree) : undefined,
      interlocuteur: form.interlocuteur || undefined,
      estTache: form.type === 'TACHE',
      terminee: false,
    }
    setActivites([a, ...activites])
    setForm({ type: 'NOTE', titre: '', description: '', date: new Date().toISOString().split('T')[0], duree: '', interlocuteur: '' })
    setShowDialog(false)
    toast({ title: 'Activité ajoutée' })
  }

  const handleDelete = (id: string) => {
    setActivites(activites.filter(a => a.id !== id))
    toast({ title: 'Activité supprimée' })
  }

  const toggleTache = (id: string) => {
    setActivites(activites.map(a => a.id === id ? { ...a, terminee: !a.terminee } : a))
  }

  const getType = (t: string) => TYPES.find(x => x.value === t) || TYPES[4]
  const filtered = filter ? activites.filter(a => a.type === filter) : activites
  const tachesPending = activites.filter(a => a.estTache && !a.terminee).length
  const thisMonth = activites.filter(a => {
    const d = new Date(a.date)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  // Grouper par date
  const grouped = filtered.reduce((acc, a) => {
    const key = new Date(a.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {} as Record<string, Activite[]>)

  return (
    <div className="space-y-6">
      {/* KPIs compacts */}
      <div className="grid gap-3 grid-cols-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total</p>
          <p className="text-lg font-bold text-gray-900">{activites.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Ce mois</p>
          <p className="text-lg font-bold text-indigo-600">{thisMonth}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Tâches en cours</p>
          <p className="text-lg font-bold text-amber-600">{tachesPending}</p>
        </div>
      </div>

      {/* Actions + Filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          <Button variant={filter === null ? 'default' : 'outline'} size="sm" onClick={() => setFilter(null)}>Tous</Button>
          {TYPES.slice(0, 5).map(t => (
            <Button key={t.value} variant={filter === t.value ? 'default' : 'outline'} size="sm" onClick={() => setFilter(t.value)}>
              {t.label}
            </Button>
          ))}
        </div>
        <Button onClick={() => setShowDialog(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />Nouvelle
        </Button>
      </div>

      {/* Timeline */}
      {Object.keys(grouped).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <p className="text-sm font-medium text-gray-500 mb-3 capitalize">{date}</p>
              <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                {items.map(a => {
                  const type = getType(a.type)
                  const Icon = type.icon
                  return (
                    <div key={a.id} className="relative group">
                      <div className={`absolute -left-[21px] w-4 h-4 rounded-full border-2 border-white ${type.color}`} />
                      <Card className="border-gray-200 ml-2">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${type.color}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className={`font-medium ${a.terminee ? 'line-through text-gray-400' : 'text-gray-900'}`}>{a.titre}</p>
                                  {a.estTache && (
                                    <button onClick={() => toggleTache(a.id)} className={`w-5 h-5 rounded border flex items-center justify-center ${a.terminee ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-emerald-500'}`}>
                                      {a.terminee && <Check className="w-3 h-3 text-white" />}
                                    </button>
                                  )}
                                </div>
                                {a.description && <p className="text-sm text-gray-500 mt-0.5">{a.description}</p>}
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(a.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                  {a.duree && <span>{a.duree} min</span>}
                                  {a.interlocuteur && <span>{a.interlocuteur}</span>}
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-red-500" onClick={() => handleDelete(a.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <History className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Aucune activité</p>
          <p className="text-xs text-gray-400 mt-1">Ajoutez appels, emails, rendez-vous...</p>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle activité</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Titre" value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} />
            <Input placeholder="Description (optionnel)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              <Input placeholder="Durée (min)" type="number" value={form.duree} onChange={e => setForm({...form, duree: e.target.value})} />
            </div>
            <Input placeholder="Interlocuteur (optionnel)" value={form.interlocuteur} onChange={e => setForm({...form, interlocuteur: e.target.value})} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Annuler</Button>
            <Button onClick={handleAdd}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
