'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Textarea } from '@/app/_common/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { useToast } from '@/app/_common/hooks/use-toast'
import { useClients } from '@/app/_common/hooks/use-api'
import { useCreateDossier } from '@/app/_common/hooks/api/use-dossiers-api'
import { ArrowLeft, Save, Loader2, User, Search, Check, X, Landmark, ScrollText, Clock, TrendingUp, Home, CreditCard, Shield, Car, Briefcase, Building2, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ContextualDetailFields } from './_components/ContextualDetailFields'
import { CATEGORIES } from './_data/categories'

const STATUT_OPTIONS = [
  { value: 'BROUILLON', label: 'Brouillon', color: 'bg-slate-100 text-slate-700' },
  { value: 'EN_ATTENTE', label: 'En attente', color: 'bg-amber-100 text-amber-700' },
  { value: 'EN_COURS', label: 'En cours', color: 'bg-blue-100 text-blue-700' },
  { value: 'A_VALIDER', label: 'À valider', color: 'bg-purple-100 text-purple-700' },
]

interface FormData {
  nom: string
  categorie: string
  type: string
  statut: string
  clientId: string
  description: string
  notes: string
  details: Record<string, string>
}

export default function NewDossierPage() {
  const router = useRouter()
  const { toast } = useToast()
  const createMutation = useCreateDossier()

  const [formData, setFormData] = useState<FormData>({
    nom: '', categorie: '', type: '', statut: 'BROUILLON', clientId: '', description: '', notes: '', details: {},
  })
  const [clientSearch, setClientSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [step, setStep] = useState<'categorie' | 'type' | 'details'>('categorie')

  const { data: clientsData, isLoading: clientsLoading } = useClients()
  
  const clients = useMemo(() => {
    if (!clientsData) return []
    const apiData = clientsData as unknown as Record<string, unknown>
    const rawData = apiData.data || apiData.clients || clientsData
    return Array.isArray(rawData) ? rawData : []
  }, [clientsData])

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients.slice(0, 10)
    const search = clientSearch.toLowerCase()
    return clients.filter((c: any) => c.firstName?.toLowerCase().includes(search) || c.lastName?.toLowerCase().includes(search)).slice(0, 10)
  }, [clients, clientSearch])

  const selectedClient = useMemo(() => formData.clientId ? clients.find((c: any) => c.id === formData.clientId) : null, [clients, formData.clientId])
  const selectedCategorie = CATEGORIES.find(c => c.id === formData.categorie)
  const selectedType = selectedCategorie?.types.find(t => t.value === formData.type)

  const handleSelectCategorie = (id: string) => { setFormData(prev => ({ ...prev, categorie: id, type: '', nom: '', details: {} })); setStep('type') }
  const handleSelectType = (val: string) => {
    const type = selectedCategorie?.types.find(t => t.value === val)
    const clientName = selectedClient ? `${(selectedClient as any).firstName} ${(selectedClient as any).lastName}` : ''
    setFormData(prev => ({ ...prev, type: val, nom: clientName ? `${type?.label} - ${clientName}` : type?.label || '', details: {} }))
    setStep('details')
  }
  const handleSelectClient = (client: any) => {
    const autoNom = selectedType ? `${selectedType.label} - ${client.firstName} ${client.lastName}` : ''
    setFormData(prev => ({ ...prev, clientId: client.id, nom: autoNom || prev.nom }))
    setClientSearch(''); setShowClientDropdown(false)
  }
  const handleDetailChange = (field: string, value: string) => setFormData(prev => ({ ...prev, details: { ...prev.details, [field]: value } }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.clientId) { toast({ title: 'Erreur', description: 'Sélectionnez un client', variant: 'destructive' }); return }
    if (!formData.categorie || !formData.type) { toast({ title: 'Erreur', description: 'Sélectionnez catégorie et type', variant: 'destructive' }); return }

    const detailsText = Object.entries(formData.details).filter(([_, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n')
    const fullDescription = [formData.description, detailsText].filter(Boolean).join('\n\n---\n\n')

    try {
      const result = await createMutation.mutateAsync({
        nom: formData.nom || `${selectedType?.label} - ${(selectedClient as any)?.firstName} ${(selectedClient as any)?.lastName}`,
        categorie: formData.categorie, type: formData.type, status: formData.statut, clientId: formData.clientId,
        description: fullDescription || undefined, notes: formData.notes || undefined, tags: [formData.categorie, formData.type],
      })
      router.push(`/dashboard/dossiers/${(result as any).id}`)
    } catch (error) {}
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/dossiers"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button></Link>
        <div><h1 className="text-2xl font-bold text-slate-900">Nouveau dossier</h1><p className="text-slate-600 text-sm">Créez un nouveau dossier client</p></div>
      </div>

      <div className="flex items-center gap-2 mb-6 text-sm">
        <button onClick={() => setStep('categorie')} className={cn('px-3 py-1 rounded-full', step === 'categorie' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-500')}>1. Catégorie</button>
        <ChevronRight className="h-4 w-4 text-slate-400" />
        <button onClick={() => formData.categorie && setStep('type')} disabled={!formData.categorie} className={cn('px-3 py-1 rounded-full', step === 'type' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-500', !formData.categorie && 'opacity-50')}>2. Type</button>
        <ChevronRight className="h-4 w-4 text-slate-400" />
        <button onClick={() => formData.type && setStep('details')} disabled={!formData.type} className={cn('px-3 py-1 rounded-full', step === 'details' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-500', !formData.type && 'opacity-50')}>3. Détails</button>
      </div>

      <form onSubmit={handleSubmit}>
        {step === 'categorie' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              return (
                <button key={cat.id} type="button" onClick={() => handleSelectCategorie(cat.id)}
                  className={cn('p-4 rounded-xl border-2 text-left transition-all hover:shadow-lg', formData.categorie === cat.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white')}>
                  <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center mb-3', formData.categorie === cat.id ? 'bg-indigo-600 text-white' : cat.color)}><Icon className="h-6 w-6" /></div>
                  <p className="font-semibold text-sm mb-1">{cat.label}</p>
                  <p className="text-xs text-slate-500">{cat.description}</p>
                </button>
              )
            })}
          </div>
        )}

        {step === 'type' && selectedCategorie && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', selectedCategorie.color)}><selectedCategorie.icon className="h-5 w-5" /></div>
              <div><h2 className="text-lg font-semibold">{selectedCategorie.label}</h2><p className="text-sm text-slate-500">{selectedCategorie.description}</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedCategorie.types.map((type) => (
                <button key={type.value} type="button" onClick={() => handleSelectType(type.value)}
                  className={cn('p-4 rounded-lg border-2 text-left', formData.type === type.value ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300')}>
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{type.description}</p>
                </button>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={() => setStep('categorie')}><ArrowLeft className="h-4 w-4 mr-2" />Changer de catégorie</Button>
          </div>
        )}

        {step === 'details' && selectedCategorie && selectedType && (
          <div className="space-y-6">
            <Card className="bg-slate-50"><CardContent className="p-4 flex items-center gap-4">
              <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', selectedCategorie.color)}><selectedCategorie.icon className="h-6 w-6" /></div>
              <div className="flex-1"><p className="text-sm text-slate-500">{selectedCategorie.label}</p><p className="font-semibold">{selectedType.label}</p></div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep('type')}>Modifier</Button>
            </CardContent></Card>

            <Card><CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-indigo-600" />Client *</CardTitle></CardHeader>
              <CardContent>
                {selectedClient ? (
                  <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-lg">{(selectedClient as any).firstName?.[0]}{(selectedClient as any).lastName?.[0]}</div>
                      <div><p className="font-medium text-lg">{(selectedClient as any).firstName} {(selectedClient as any).lastName}</p><p className="text-sm text-slate-600">{(selectedClient as any).email}</p></div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setFormData(prev => ({ ...prev, clientId: '' }))}><X className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input placeholder="Rechercher un client..." value={clientSearch} onChange={(e) => { setClientSearch(e.target.value); setShowClientDropdown(true) }} onFocus={() => setShowClientDropdown(true)} className="pl-12 h-12 text-lg" />
                    {showClientDropdown && (
                      <div className="absolute z-10 w-full mt-2 bg-white border rounded-lg shadow-lg max-h-72 overflow-y-auto">
                        {clientsLoading ? <div className="p-4 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                          : filteredClients.length === 0 ? <div className="p-4 text-center text-slate-500">Aucun client trouvé</div>
                          : filteredClients.map((c: any) => (
                            <button key={c.id} type="button" onClick={() => handleSelectClient(c)} className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 text-left border-b last:border-0">
                              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-medium">{c.firstName?.[0]}{c.lastName?.[0]}</div>
                              <div className="flex-1"><p className="font-medium">{c.firstName} {c.lastName}</p><p className="text-sm text-slate-500">{c.email}</p></div>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card><CardHeader><CardTitle>Détails - {selectedType.label}</CardTitle><CardDescription>Informations spécifiques à ce type d'opération</CardDescription></CardHeader>
              <CardContent>
                <ContextualDetailFields categorie={formData.categorie} type={formData.type} details={formData.details} onChange={handleDetailChange} />
              </CardContent>
            </Card>

            <Card><CardHeader><CardTitle>Informations complémentaires</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Nom du dossier</Label><Input value={formData.nom} onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))} placeholder="Auto-généré si vide" className="mt-1" /></div>
                <div><Label>Statut</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {STATUT_OPTIONS.map((o) => (<button key={o.value} type="button" onClick={() => setFormData(prev => ({ ...prev, statut: o.value }))} className={cn('px-3 py-1.5 rounded-full text-sm font-medium', formData.statut === o.value ? o.color : 'bg-slate-100 text-slate-600')}>{o.label}</button>))}
                  </div>
                </div>
                <div><Label>Notes internes</Label><Textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} placeholder="Notes pour le suivi..." rows={2} className="mt-1" /></div>
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-end">
              <Link href="/dashboard/dossiers"><Button variant="outline" type="button">Annuler</Button></Link>
              <Button type="submit" disabled={!formData.clientId || !formData.type || createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Créer le dossier
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
