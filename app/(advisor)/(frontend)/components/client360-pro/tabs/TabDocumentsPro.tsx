'use client'

/**
 * TabDocumentsPro - Documents entreprise (design épuré V2)
 */

import { useState } from 'react'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/_common/components/ui/Dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { FolderOpen, Plus, FileText, Upload, Trash2, AlertCircle, Clock, Building2, Shield, Euro } from 'lucide-react'
import { useToast } from '@/app/_common/hooks/use-toast'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'

const CATEGORIES = [
  { value: 'LEGAL', label: 'Légaux', icon: Building2, color: 'bg-blue-100 text-blue-600' },
  { value: 'COMPTABLE', label: 'Comptables', icon: Euro, color: 'bg-green-100 text-green-600' },
  { value: 'CONTRAT', label: 'Contrats', icon: FileText, color: 'bg-purple-100 text-purple-600' },
  { value: 'KYB', label: 'KYB', icon: Shield, color: 'bg-amber-100 text-amber-600' },
]

const TYPES: Record<string, string[]> = {
  LEGAL: ['Kbis', 'Statuts', 'PV AG', 'RIB', 'Attestation URSSAF'],
  COMPTABLE: ['Bilan', 'Compte de résultat', 'Liasse fiscale'],
  CONTRAT: ['Lettre de mission', 'Contrat épargne salariale', 'Contrat prévoyance', 'Bail'],
  KYB: ['Pièce identité dirigeant', 'Justificatif domicile', 'Registre BE'],
}

const DOCS_REQUIS = ['Kbis', 'Statuts', 'Pièce identité dirigeant', 'RIB']

interface Doc {
  id: string
  categorie: string
  type: string
  nom: string
  dateUpload: string
  dateExpiration?: string
}

interface Props { clientId: string; client: ClientDetail; wealthSummary?: WealthSummary }

export default function TabDocumentsPro({ clientId, client }: Props) {
  const { toast } = useToast()
  const [showDialog, setShowDialog] = useState(false)
  const [filter, setFilter] = useState<string | null>(null)
  const [docs, setDocs] = useState<Doc[]>([])
  const [form, setForm] = useState({ categorie: 'LEGAL', type: 'Kbis', nom: '', dateExpiration: '' })

  const handleAdd = () => {
    if (!form.nom) { toast({ title: 'Nom requis', variant: 'destructive' }); return }
    setDocs([...docs, { id: Date.now().toString(), ...form, dateUpload: new Date().toISOString() }])
    setForm({ categorie: 'LEGAL', type: 'Kbis', nom: '', dateExpiration: '' })
    setShowDialog(false)
    toast({ title: 'Document ajouté' })
  }

  const handleDelete = (id: string) => {
    setDocs(docs.filter(d => d.id !== id))
    toast({ title: 'Document supprimé' })
  }

  const getCat = (c: string) => CATEGORIES.find(x => x.value === c) || CATEGORIES[0]
  const filtered = filter ? docs.filter(d => d.categorie === filter) : docs
  
  // Conformité
  const conformite = DOCS_REQUIS.map(type => ({
    type,
    present: docs.some(d => d.type === type),
  }))
  const score = Math.round((conformite.filter(c => c.present).length / DOCS_REQUIS.length) * 100)

  return (
    <div className="space-y-6">
      {/* Barre conformité + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg
            ${score === 100 ? 'bg-emerald-100 text-emerald-700' : score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
            {score}%
          </div>
          <div>
            <p className="font-medium text-gray-900">Conformité documentaire</p>
            <p className="text-sm text-gray-500">{conformite.filter(c => c.present).length}/{DOCS_REQUIS.length} documents requis</p>
          </div>
        </div>
        <Button onClick={() => setShowDialog(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />Ajouter
        </Button>
      </div>

      {/* Documents requis manquants */}
      {conformite.some(c => !c.present) && (
        <div className="flex flex-wrap gap-2">
          {conformite.filter(c => !c.present).map(c => (
            <Badge key={c.type} variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
              <AlertCircle className="w-3 h-3 mr-1" />{c.type}
            </Badge>
          ))}
        </div>
      )}

      {/* Filtres catégories */}
      <div className="flex gap-2 flex-wrap">
        <Button variant={filter === null ? 'default' : 'outline'} size="sm" onClick={() => setFilter(null)}>
          Tous ({docs.length})
        </Button>
        {CATEGORIES.map(cat => {
          const count = docs.filter(d => d.categorie === cat.value).length
          return (
            <Button key={cat.value} variant={filter === cat.value ? 'default' : 'outline'} size="sm"
              onClick={() => setFilter(cat.value)}>
              {cat.label} ({count})
            </Button>
          )
        })}
      </div>

      {/* Liste documents */}
      {filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(doc => {
            const cat = getCat(doc.categorie)
            const Icon = cat.icon
            return (
              <Card key={doc.id} className="border-gray-200 group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cat.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-red-500"
                      onClick={() => handleDelete(doc.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <p className="font-medium text-gray-900 mt-3 truncate">{doc.nom}</p>
                  <p className="text-xs text-gray-500">{doc.type}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {new Date(doc.dateUpload).toLocaleDateString('fr-FR')}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <FolderOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Aucun document</p>
        </div>
      )}

      {/* Dialog ajout */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un document</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={form.categorie} onValueChange={v => setForm({...form, categorie: v, type: TYPES[v][0]})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES[form.categorie].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Nom du document" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} />
            <div>
              <label className="text-sm text-gray-500">Date d'expiration (optionnel)</label>
              <Input type="date" value={form.dateExpiration} onChange={e => setForm({...form, dateExpiration: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Annuler</Button>
            <Button onClick={handleAdd} className="gap-2"><Upload className="w-4 h-4" />Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
