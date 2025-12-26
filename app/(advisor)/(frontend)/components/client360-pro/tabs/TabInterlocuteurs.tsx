'use client'

/**
 * TabInterlocuteurs - Contacts clés entreprise (connecté API)
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/_common/components/ui/Dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Users, Plus, Mail, Phone, Star, Edit, Trash2, Copy, Check, Loader2 } from 'lucide-react'
import { useToast } from '@/app/_common/hooks/use-toast'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'

const ROLES = [
  { value: 'DIRIGEANT', label: 'Dirigeant', color: 'bg-amber-100 text-amber-700' },
  { value: 'DAF', label: 'DAF', color: 'bg-blue-100 text-blue-700' },
  { value: 'DRH', label: 'DRH', color: 'bg-purple-100 text-purple-700' },
  { value: 'COMPTABLE', label: 'Comptable', color: 'bg-green-100 text-green-700' },
  { value: 'ASSISTANT', label: 'Assistant(e)', color: 'bg-gray-100 text-gray-700' },
  { value: 'EXPERT_COMPTABLE', label: 'Expert-comptable', color: 'bg-teal-100 text-teal-700' },
  { value: 'AVOCAT', label: 'Avocat', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'BANQUIER', label: 'Banquier', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'AUTRE', label: 'Autre', color: 'bg-gray-100 text-gray-700' },
]

interface Interlocuteur {
  id: string
  nom: string
  prenom: string
  role: string
  fonction?: string | null
  email?: string | null
  telephone?: string | null
  mobile?: string | null
  isPrincipal: boolean
  notes?: string | null
}

interface Props {
  clientId: string
  client: ClientDetail
  wealthSummary?: WealthSummary
}

export default function TabInterlocuteurs({ clientId, client }: Props) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<Interlocuteur | null>(null)
  const [form, setForm] = useState({ nom: '', prenom: '', role: 'AUTRE', fonction: '', email: '', telephone: '' })

  // Fetch interlocuteurs
  const { data, isLoading, error } = useQuery({
    queryKey: ['interlocuteurs', clientId],
    queryFn: async () => {
      const res = await fetch(`/api/advisor/clients/${clientId}/interlocuteurs`)
      if (!res.ok) throw new Error('Erreur chargement')
      const json = await res.json()
      return json.data?.interlocuteurs || []
    },
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (newData: any) => {
      const res = await fetch(`/api/advisor/clients/${clientId}/interlocuteurs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      })
      if (!res.ok) throw new Error('Erreur création')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interlocuteurs', clientId] })
      toast({ title: 'Contact ajouté' })
      resetForm()
    },
    onError: () => toast({ title: 'Erreur lors de l\'ajout', variant: 'destructive' }),
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/advisor/clients/${clientId}/interlocuteurs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Erreur modification')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interlocuteurs', clientId] })
      toast({ title: 'Contact modifié' })
      resetForm()
    },
    onError: () => toast({ title: 'Erreur lors de la modification', variant: 'destructive' }),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/advisor/clients/${clientId}/interlocuteurs/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Erreur suppression')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interlocuteurs', clientId] })
      toast({ title: 'Contact supprimé' })
    },
    onError: () => toast({ title: 'Erreur lors de la suppression', variant: 'destructive' }),
  })

  const interlocuteurs: Interlocuteur[] = data || []

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    toast({ title: `${label} copié` })
    setTimeout(() => setCopied(null), 2000)
  }

  const handleSave = () => {
    if (!form.nom || !form.prenom) {
      toast({ title: 'Nom et prénom obligatoires', variant: 'destructive' })
      return
    }
    const payload = {
      nom: form.nom,
      prenom: form.prenom,
      role: form.role,
      fonction: form.fonction || null,
      email: form.email || null,
      telephone: form.telephone || null,
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const resetForm = () => {
    setForm({ nom: '', prenom: '', role: 'AUTRE', fonction: '', email: '', telephone: '' })
    setEditing(null)
    setShowDialog(false)
  }

  const openEdit = (c: Interlocuteur) => {
    setForm({
      nom: c.nom,
      prenom: c.prenom,
      role: c.role,
      fonction: c.fonction || '',
      email: c.email || '',
      telephone: c.telephone || '',
    })
    setEditing(c)
    setShowDialog(true)
  }

  const handleDelete = (id: string, isPrincipal: boolean) => {
    if (isPrincipal) {
      toast({ title: 'Contact principal non supprimable', variant: 'destructive' })
      return
    }
    deleteMutation.mutate(id)
  }

  const getRole = (r: string) => ROLES.find(x => x.value === r) || ROLES[8]
  const principal = interlocuteurs.find(c => c.isPrincipal)
  const autres = interlocuteurs.filter(c => !c.isPrincipal)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={() => setShowDialog(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />Ajouter
        </Button>
      </div>

      {/* Contact principal */}
      {principal && (
        <Card className="border-indigo-200 bg-indigo-50/30">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Star className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{principal.prenom} {principal.nom}</p>
                    <Badge className={getRole(principal.role).color}>{getRole(principal.role).label}</Badge>
                  </div>
                  <p className="text-sm text-gray-500">{principal.fonction || 'Contact principal'}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => openEdit(principal)}>
                <Edit className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              {principal.email && (
                <button onClick={() => copy(principal.email!, 'Email')} className="flex items-center gap-2 text-gray-600 hover:text-indigo-600">
                  <Mail className="w-4 h-4" />
                  {principal.email}
                  {copied === 'Email' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 opacity-50" />}
                </button>
              )}
              {principal.telephone && (
                <button onClick={() => copy(principal.telephone!, 'Téléphone')} className="flex items-center gap-2 text-gray-600 hover:text-indigo-600">
                  <Phone className="w-4 h-4" />
                  {principal.telephone}
                  {copied === 'Téléphone' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 opacity-50" />}
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Autres contacts */}
      {autres.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {autres.map(c => (
            <Card key={c.id} className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Badge className={getRole(c.role).color}>{getRole(c.role).label}</Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(c)}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => handleDelete(c.id, c.isPrincipal)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="font-medium text-gray-900">{c.prenom} {c.nom}</p>
                {c.fonction && <p className="text-xs text-gray-500">{c.fonction}</p>}
                <div className="mt-2 space-y-1 text-xs text-gray-600">
                  {c.email && <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{c.email}</p>}
                  {c.telephone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{c.telephone}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {autres.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Aucun autre contact</p>
          <p className="text-xs text-gray-400 mt-1">Ajoutez DAF, DRH, comptable...</p>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) resetForm() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier le contact' : 'Nouveau contact'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Prénom" value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} />
              <Input placeholder="Nom" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} />
            </div>
            <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Fonction" value={form.fonction} onChange={e => setForm({...form, fonction: e.target.value})} />
            <Input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            <Input placeholder="Téléphone" value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Annuler</Button>
            <Button onClick={handleSave}>{editing ? 'Modifier' : 'Ajouter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
