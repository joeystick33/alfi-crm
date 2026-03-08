'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import Checkbox from '@/app/_common/components/ui/Checkbox'
import { 
  User, Home, Wallet, TrendingUp, CreditCard, Shield, Building2,
  ChevronRight, Loader2, RefreshCw, CheckCircle2, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Minus, PieChart, BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/app/_common/hooks/use-toast'

interface ClientDataSnapshotProps {
  dossier: {
    id: string
    categorie: string
    type: string
    clientDataSnapshot: Record<string, unknown> | null
    client: {
      id: string
      firstName: string
      lastName: string
    } | null
  }
  onSnapshotCreated: () => void
  onNext: () => void
}

/* eslint-disable @typescript-eslint/no-explicit-any */
interface PatrimoineData {
  identite: {
    nom: string
    prenom: string
    dateNaissance: string
    situationFamiliale: string
    regimeMatrimonial: string
    enfants: number
    profession?: string
  }
  revenus: {
    details?: Array<{ categorie: string; montantAnnuel: number; montantMensuel: number }>
    total: number
    totalMensuel?: number
  }
  charges: {
    details?: Array<{ categorie: string; montantMensuel: number; montantAnnuel: number }>
    passifs: any[]
    total: number
    totalMensuel?: number
    totalMensualitesCredits: number
  }
  patrimoineImmobilier: Array<{
    id: string
    type: string
    adresse?: string
    nom?: string
    valeur: number
    encours?: number
    loyer?: number
  }>
  patrimoineFinancier: Array<{
    id: string
    type: string
    etablissement?: string
    nom?: string
    valeur: number
  }>
  patrimoineProfessionnel: Array<{
    id: string
    nom: string
    forme?: string
    participation?: number
    valeur: number
  }>
  contrats: Array<{
    id: string
    type: string
    assureur?: string
    produit?: string
    garanties?: string
    prime: number
    statut?: string
  }>
}

const SECTIONS = [
  { id: 'identite', label: 'Identité & Famille', icon: User, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { id: 'revenus', label: 'Revenus', icon: Wallet, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  { id: 'charges', label: 'Charges & Crédits', icon: CreditCard, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  { id: 'patrimoineImmobilier', label: 'Patrimoine Immobilier', icon: Home, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { id: 'patrimoineFinancier', label: 'Patrimoine Financier', icon: TrendingUp, color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200' },
  { id: 'patrimoineProfessionnel', label: 'Patrimoine Professionnel', icon: Building2, color: 'text-slate-600', bgColor: 'bg-slate-50', borderColor: 'border-slate-200' },
  { id: 'contrats', label: 'Contrats & Prévoyance', icon: Shield, color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200' },
]

export function ClientDataSnapshot({ dossier, onSnapshotCreated, onNext }: ClientDataSnapshotProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [clientData, setClientData] = useState<PatrimoineData | null>(null)
  const [selectedSections, setSelectedSections] = useState<string[]>(SECTIONS.map(s => s.id))
  const hasSnapshot = !!dossier.clientDataSnapshot

  useEffect(() => {
    fetchClientData()
  }, [dossier.client?.id])

  const fetchClientData = async () => {
    setIsFetching(true)
    try {
      const response = await fetch(`/api/advisor/clients/${dossier.client?.id}/patrimoine-snapshot`)
      if (response.ok) {
        const json = await response.json()
        setClientData(json.data || json)
      }
    } catch (error) {
      console.error('Erreur chargement données client:', error)
    } finally {
      setIsFetching(false)
    }
  }

  const handleCreateSnapshot = async () => {
    if (!clientData) return
    
    setIsLoading(true)
    try {
      const snapshotData: Record<string, unknown> = {}
      selectedSections.forEach(sectionId => {
        snapshotData[sectionId] = clientData[sectionId as keyof PatrimoineData]
      })

      const response = await fetch(`/api/advisor/dossiers/${dossier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientDataSnapshot: snapshotData,
          etapeActuelle: 'ANALYSE'
        })
      })

      if (response.ok) {
        toast({ title: 'Données importées', description: 'Le snapshot client a été créé', variant: 'success' })
        onSnapshotCreated()
        onNext()
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de créer le snapshot', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(s => s !== sectionId)
        : [...prev, sectionId]
    )
  }

  const fmt = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
  }

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Chargement des données patrimoniales...</p>
      </div>
    )
  }

  // ═══ View when snapshot already exists ═══
  if (hasSnapshot) {
    const snapshot = dossier.clientDataSnapshot as unknown as PatrimoineData

    const totalImmo = snapshot?.patrimoineImmobilier?.reduce((acc: number, b: any) => acc + (Number(b.valeur) || 0), 0) || 0
    const totalFin = snapshot?.patrimoineFinancier?.reduce((acc: number, c: any) => acc + (Number(c.valeur) || 0), 0) || 0
    const totalPro = snapshot?.patrimoineProfessionnel?.reduce((acc: number, p: any) => acc + (Number(p.valeur) || 0), 0) || 0
    const totalActifs = totalImmo + totalFin + totalPro
    const totalPassifs = snapshot?.charges?.passifs?.reduce((acc: number, p: any) => acc + (Number(p.capitalRestant) || 0), 0) || 0
    const patrimoineNet = totalActifs - totalPassifs
    const revenuTotal = snapshot?.revenus?.total || 0
    const mensualitesCredits = snapshot?.charges?.totalMensualitesCredits || 0
    const tauxEndettement = revenuTotal > 0 ? ((mensualitesCredits * 12) / revenuTotal * 100) : 0
    const tauxImmo = totalActifs > 0 ? (totalImmo / totalActifs * 100) : 0

    return (
      <div className="space-y-6">
        {/* Header de synthèse */}
        <div className="relative overflow-hidden rounded-xl border bg-card">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Données patrimoniales importées</h3>
                  <p className="text-sm text-muted-foreground">
                    Snapshot de {dossier.client?.firstName} {dossier.client?.lastName}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={fetchClientData} className="gap-2">
                <RefreshCw className="w-3.5 h-3.5" />
                Actualiser
              </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-indigo-50 to-indigo-100/30 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-indigo-600 uppercase tracking-wider">Patrimoine net</span>
                  <PieChart className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-bold text-indigo-900">{fmt(patrimoineNet)}</div>
                <div className="text-xs text-indigo-600/70 mt-1">
                  Actifs {fmt(totalActifs)} − Passifs {fmt(totalPassifs)}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-emerald-50 to-emerald-100/30 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Revenus annuels</span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-900">{fmt(revenuTotal)}</div>
                <div className="text-xs text-emerald-600/70 mt-1">
                  {fmt(revenuTotal / 12)}/mois
                  {snapshot?.revenus?.details && snapshot.revenus.details.length > 0 && (
                    <> — {snapshot.revenus.details.map((d: any) => d.categorie).join(', ')}</>
                  )}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-amber-50 to-amber-100/30 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">Immobilier</span>
                  <Home className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-amber-900">{fmt(totalImmo)}</div>
                <div className="text-xs text-amber-600/70 mt-1">
                  {snapshot?.patrimoineImmobilier?.length || 0} bien(s) — {tauxImmo.toFixed(0)}% du patrimoine
                </div>
              </div>

              <div className={cn(
                'relative overflow-hidden rounded-xl border p-4',
                tauxEndettement > 33
                  ? 'bg-gradient-to-br from-red-50 to-red-100/30'
                  : 'bg-gradient-to-br from-sky-50 to-sky-100/30'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    'text-xs font-medium uppercase tracking-wider',
                    tauxEndettement > 33 ? 'text-red-600' : 'text-sky-600'
                  )}>
                    Endettement
                  </span>
                  {tauxEndettement > 33 ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : (
                    <BarChart3 className="w-4 h-4 text-sky-400" />
                  )}
                </div>
                <div className={cn(
                  'text-2xl font-bold',
                  tauxEndettement > 33 ? 'text-red-900' : 'text-sky-900'
                )}>
                  {tauxEndettement.toFixed(1)}%
                </div>
                <div className={cn(
                  'text-xs mt-1',
                  tauxEndettement > 33 ? 'text-red-600/70' : 'text-sky-600/70'
                )}>
                  {fmt(mensualitesCredits)}/mois de crédits
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Détail patrimoine */}
        <div className="grid grid-cols-2 gap-4">
          {/* Patrimoine immobilier */}
          {(snapshot?.patrimoineImmobilier?.length || 0) > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Home className="w-4 h-4 text-amber-600" />
                  Immobilier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {snapshot.patrimoineImmobilier.map((b: any, i: number) => (
                  <div key={b.id || i} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                    <div>
                      <div className="font-medium">{b.nom || b.type || 'Bien immobilier'}</div>
                      {b.adresse && <div className="text-xs text-muted-foreground">{b.adresse}</div>}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{fmt(b.valeur)}</div>
                      {b.loyer > 0 && <div className="text-xs text-emerald-600">+{fmt(b.loyer)}/mois</div>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Patrimoine financier */}
          {(snapshot?.patrimoineFinancier?.length || 0) > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-600" />
                  Financier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {snapshot.patrimoineFinancier.map((c: any, i: number) => (
                  <div key={c.id || i} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                    <div>
                      <div className="font-medium">{c.nom || c.type || 'Placement'}</div>
                      {c.etablissement && <div className="text-xs text-muted-foreground">{c.etablissement}</div>}
                    </div>
                    <div className="font-semibold">{fmt(c.valeur)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Passifs */}
        {(snapshot?.charges?.passifs?.length || 0) > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-red-600" />
                Crédits en cours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {snapshot.charges.passifs.map((p: any, i: number) => (
                  <div key={p.id || i} className="flex items-center justify-between text-sm p-3 rounded-lg bg-red-50/50 border border-red-100">
                    <div>
                      <div className="font-medium">{p.nom || p.type || 'Crédit'}</div>
                      {p.tauxInteret > 0 && <div className="text-xs text-muted-foreground">Taux : {p.tauxInteret}%</div>}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-700">{fmt(p.capitalRestant)}</div>
                      {p.mensualite > 0 && <div className="text-xs text-red-600">{fmt(p.mensualite)}/mois</div>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button onClick={onNext} size="lg" className="gap-2 px-6">
            Continuer vers l&apos;analyse
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  // ═══ Import view (no snapshot yet) ═══
  const getSectionSummary = (sectionId: string): string => {
    if (!clientData) return 'Aucune donnée'
    const data = clientData[sectionId as keyof PatrimoineData]
    if (!data) return 'Aucune donnée'

    if (sectionId === 'identite') {
      const id = data as PatrimoineData['identite']
      return [id.prenom, id.nom, id.situationFamiliale, id.enfants > 0 ? `${id.enfants} enfant(s)` : null].filter(Boolean).join(' · ')
    }
    if (sectionId === 'revenus') {
      const r = data as PatrimoineData['revenus']
      return r.total > 0 ? `${fmt(r.total)}/an` : 'Non renseigné'
    }
    if (sectionId === 'charges') {
      const c = data as PatrimoineData['charges']
      return c.totalMensualitesCredits > 0 ? `${fmt(c.totalMensualitesCredits)}/mois de crédits` : 'Aucun crédit'
    }
    if (Array.isArray(data)) {
      if (data.length === 0) return 'Aucun élément'
      const total = data.reduce((s: number, item: any) => s + (Number(item.valeur) || Number(item.prime) || 0), 0)
      return `${data.length} élément(s) — ${fmt(total)}`
    }
    return 'Données disponibles'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl border bg-card">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Import des données patrimoniales</h3>
              <p className="text-sm text-muted-foreground">
                Sélectionnez les sections à inclure dans le dossier de <strong>{dossier.client?.firstName} {dossier.client?.lastName}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sections grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SECTIONS.map(section => {
          const Icon = section.icon
          const isSelected = selectedSections.includes(section.id)
          const sectionData = clientData?.[section.id as keyof PatrimoineData]
          const hasData = sectionData && (Array.isArray(sectionData) ? sectionData.length > 0 : Object.keys(sectionData).length > 0)
          const summary = getSectionSummary(section.id)

          return (
            <button
              key={section.id}
              onClick={() => hasData && toggleSection(section.id)}
              disabled={!hasData}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left w-full',
                isSelected && hasData && 'border-primary bg-primary/5 shadow-sm',
                !isSelected && hasData && 'border-transparent bg-muted/30 hover:bg-muted/60 hover:border-muted-foreground/20',
                !hasData && 'border-dashed border-muted opacity-40 cursor-not-allowed'
              )}
            >
              <div className="relative">
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', section.bgColor)}>
                  <Icon className={cn('w-5 h-5', section.color)} />
                </div>
                {isSelected && hasData && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{section.label}</div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {hasData ? summary : 'Aucune donnée disponible'}
                </div>
              </div>
              {hasData && (
                <div className={cn(
                  'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
                  isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                )}>
                  {isSelected && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={fetchClientData} className="gap-2 text-muted-foreground">
          <RefreshCw className="w-4 h-4" />
          Actualiser les données
        </Button>
        <Button 
          onClick={handleCreateSnapshot} 
          disabled={isLoading || selectedSections.length === 0}
          size="lg"
          className="gap-2 px-6"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Importer et continuer
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
