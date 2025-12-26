'use client'

/**
 * TabOpportunitesPro - Opportunités commerciales (design épuré V2)
 */

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/_common/components/ui/Dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Lightbulb, Plus, Euro, PiggyBank, Shield, Building, Zap, X } from 'lucide-react'
import { useToast } from '@/app/_common/hooks/use-toast'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'

const TYPES = [
  { value: 'EPARGNE_SALARIALE', label: 'Épargne salariale', icon: PiggyBank, color: 'bg-green-100 text-green-600' },
  { value: 'PROTECTION', label: 'Protection', icon: Shield, color: 'bg-blue-100 text-blue-600' },
  { value: 'FINANCEMENT', label: 'Financement', icon: Euro, color: 'bg-purple-100 text-purple-600' },
  { value: 'IMMOBILIER', label: 'Immobilier', icon: Building, color: 'bg-amber-100 text-amber-600' },
  { value: 'AUTRE', label: 'Autre', icon: Lightbulb, color: 'bg-gray-100 text-gray-600' },
]

const STATUTS = [
  { value: 'DETECTEE', label: 'Détectée', color: 'bg-slate-100 text-slate-700' },
  { value: 'QUALIFIEE', label: 'Qualifiée', color: 'bg-blue-100 text-blue-700' },
  { value: 'PROPOSEE', label: 'Proposée', color: 'bg-amber-100 text-amber-700' },
  { value: 'EN_COURS', label: 'En cours', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'GAGNEE', label: 'Gagnée', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'PERDUE', label: 'Perdue', color: 'bg-red-100 text-red-700' },
]

interface Opp {
  id: string
  type: string
  titre: string
  description: string
  montant?: number
  statut: string
  dateCreation: string
  priorite: 'haute' | 'moyenne' | 'basse'
  auto: boolean
}

interface Props { clientId: string; client: ClientDetail; wealthSummary?: WealthSummary }

export default function TabOpportunitesPro({ clientId, client }: Props) {
  const { toast } = useToast()
  const [showDialog, setShowDialog] = useState(false)
  const [filter, setFilter] = useState<string | null>(null)
  const [opps, setOpps] = useState<Opp[]>([])
  const [form, setForm] = useState<{ type: string; titre: string; description: string; montant: string; priorite: 'haute' | 'moyenne' | 'basse' }>({ type: 'EPARGNE_SALARIALE', titre: '', description: '', montant: '', priorite: 'moyenne' })

  useEffect(() => {
    if (opps.length === 0) {
      setOpps([
        { id: 'auto-1', type: 'EPARGNE_SALARIALE', titre: 'Mise en place PEE + PER Collectif', description: 'Opportunité de mise en place dispositif épargne salariale', montant: 50000, statut: 'DETECTEE', dateCreation: new Date().toISOString(), priorite: 'haute', auto: true },
        { id: 'auto-2', type: 'PROTECTION', titre: 'Audit prévoyance collective', description: 'Vérifier conformité contrats prévoyance', montant: 15000, statut: 'DETECTEE', dateCreation: new Date().toISOString(), priorite: 'moyenne', auto: true },
      ])
    }
  }, [])

  const fmt = (n?: number) => n ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n) : '-'

  const handleAdd = () => {
    if (!form.titre) { toast({ title: 'Titre requis', variant: 'destructive' }); return }
    setOpps([...opps, { id: Date.now().toString(), ...form, montant: form.montant ? Number(form.montant) : undefined, statut: 'DETECTEE', dateCreation: new Date().toISOString(), auto: false }])
    setForm({ type: 'EPARGNE_SALARIALE', titre: '', description: '', montant: '', priorite: 'moyenne' })
    setShowDialog(false)
    toast({ title: 'Opportunité créée' })
  }

  const updateStatut = (id: string, statut: string) => {
    setOpps(opps.map(o => o.id === id ? { ...o, statut } : o))
    toast({ title: 'Statut mis à jour' })
  }

  const handleDelete = (id: string) => {
    setOpps(opps.filter(o => o.id !== id))
    toast({ title: 'Opportunité supprimée' })
  }

  const getType = (t: string) => TYPES.find(x => x.value === t) || TYPES[4]
  const getStatut = (s: string) => STATUTS.find(x => x.value === s) || STATUTS[0]
  
  const filtered = filter ? opps.filter(o => o.statut === filter) : opps
  const actives = opps.filter(o => !['GAGNEE', 'PERDUE'].includes(o.statut))
  const totalPipeline = actives.reduce((s, o) => s + (o.montant || 0), 0)
  const gagnees = opps.filter(o => o.statut === 'GAGNEE')
  const totalGagne = gagnees.reduce((s, o) => s + (o.montant || 0), 0)

  return (
    <div className="space-y-6">
      {/* KPIs compacts */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Pipeline actif</p>
          <p className="text-lg font-bold text-gray-900">{actives.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Potentiel</p>
          <p className="text-lg font-bold text-indigo-600">{fmt(totalPipeline)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Gagnées</p>
          <p className="text-lg font-bold text-emerald-600">{gagnees.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">CA généré</p>
          <p className="text-lg font-bold text-emerald-600">{fmt(totalGagne)}</p>
        </div>
      </div>

      {/* Actions + Filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          <Button variant={filter === null ? 'default' : 'outline'} size="sm" onClick={() => setFilter(null)}>Tous</Button>
          {STATUTS.slice(0, 4).map(s => (
            <Button key={s.value} variant={filter === s.value ? 'default' : 'outline'} size="sm" onClick={() => setFilter(s.value)}>
              {s.label}
            </Button>
          ))}
        </div>
        <Button onClick={() => setShowDialog(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />Nouvelle
        </Button>
      </div>

      {/* Liste */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(opp => {
            const type = getType(opp.type)
            const statut = getStatut(opp.statut)
            const Icon = type.icon
            return (
              <Card key={opp.id} className="border-gray-200 group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${type.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900">{opp.titre}</p>
                        {opp.auto && <Badge variant="outline" className="text-xs"><Zap className="w-3 h-3 mr-1" />Auto</Badge>}
                        <Badge className={statut.color}>{statut.label}</Badge>
                        {opp.priorite === 'haute' && <Badge className="bg-red-100 text-red-700">Haute</Badge>}
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{opp.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        {opp.montant && <span className="font-medium text-indigo-600">{fmt(opp.montant)}</span>}
                        <span className="text-gray-400">{new Date(opp.dateCreation).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={opp.statut} onValueChange={v => updateStatut(opp.id, v)}>
                        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-red-500"
                        onClick={() => handleDelete(opp.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Lightbulb className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Aucune opportunité</p>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle opportunité</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Titre" value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} />
            <Input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            <Input placeholder="Montant estimé (€)" type="number" value={form.montant} onChange={e => setForm({...form, montant: e.target.value})} />
            <Select value={form.priorite} onValueChange={v => setForm({...form, priorite: v as 'haute' | 'moyenne' | 'basse'})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="haute">Haute</SelectItem>
                <SelectItem value="moyenne">Moyenne</SelectItem>
                <SelectItem value="basse">Basse</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Annuler</Button>
            <Button onClick={handleAdd}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
