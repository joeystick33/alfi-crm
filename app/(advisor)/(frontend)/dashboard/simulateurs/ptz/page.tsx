
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { useToast } from '@/app/_common/hooks/use-toast'
import { generatePDFContent, downloadReport } from '@/app/_common/lib/services/simulation-export-service'
import { ArrowLeft, Home, Calculator, FileDown, RefreshCw, Euro, Users, CheckCircle, XCircle } from 'lucide-react'
import { SimulatorGate } from '@/app/_common/components/FeatureGate'

interface PTZResult {
  eligible: boolean
  montantPTZ: number
  dureeRemboursement: number
  differePaiement: number
  zonePTZ: string
  plafondRessources: number
  mensualite: number
}

export default function PTZPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PTZResult | null>(null)

  const [form, setForm] = useState({
    revenus: 45000,
    nbPersonnes: 2,
    zone: 'B1',
    prixBien: 250000,
    neuf: true,
    primoAccedant: true,
  })

  const simulate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/advisor/simulators-proxy/ptz/ptz/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setResult(data.data)
        toast({ title: 'Simulation terminée' })
      } else {
        // Simulation locale si backend hors ligne
        const quotientFamilial = form.revenus / form.nbPersonnes
        const plafonds: Record<string, number> = { 'A': 37000, 'B1': 30000, 'B2': 27000, 'C': 24000 }
        const eligible = quotientFamilial <= (plafonds[form.zone] || 30000) && form.primoAccedant
        const tauxPTZ: Record<string, number> = { 'A': 0.40, 'B1': 0.40, 'B2': 0.20, 'C': 0.20 }
        const montant = eligible ? Math.min(form.prixBien * (tauxPTZ[form.zone] || 0.20), 150000) : 0
        setResult({
          eligible,
          montantPTZ: montant,
          dureeRemboursement: eligible ? 25 : 0,
          differePaiement: eligible ? 5 : 0,
          zonePTZ: form.zone,
          plafondRessources: plafonds[form.zone] || 30000,
          mensualite: eligible ? montant / (20 * 12) : 0,
        })
        toast({ title: 'Simulation locale' })
      }
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const exportPDF = () => {
    if (!result) return
    const html = generatePDFContent({
      simulation: { type: 'PTZ', name: 'Simulation PTZ 2025', parameters: form, results: result as any }
    })
    downloadReport(html, `simulation-ptz-${Date.now()}`, 'html')
  }

  const formatCurrency = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

  return (
    <SimulatorGate simulator="PTZ" showTeaser>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link href="/dashboard/simulateurs">Simulateurs</Link><span>/</span><span>PTZ 2025</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Home className="h-7 w-7 text-primary" />
              Simulateur PTZ 2025
            </h1>
            <p className="text-muted-foreground mt-1">Prêt à Taux Zéro - Éligibilité et simulation</p>
          </div>
          <Link href="/dashboard/simulateurs"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button></Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle>Paramètres</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Revenus annuels du foyer</Label>
                <div className="relative mt-1">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="number" value={form.revenus} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, revenus: +e.target.value })} className="pl-9" />
                </div>
              </div>
              <div>
                <Label>Nombre de personnes</Label>
                <div className="relative mt-1">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="number" value={form.nbPersonnes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, nbPersonnes: +e.target.value })} className="pl-9" min={1} max={8} />
                </div>
              </div>
              <div>
                <Label>Zone PTZ</Label>
                <Select value={form.zone} onValueChange={(v: string) => setForm({ ...form, zone: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Zone A (Paris, Côte d'Azur)</SelectItem>
                    <SelectItem value="B1">Zone B1 (Grandes agglomérations)</SelectItem>
                    <SelectItem value="B2">Zone B2 (Villes moyennes)</SelectItem>
                    <SelectItem value="C">Zone C (Reste du territoire)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prix du bien</Label>
                <Input type="number" value={form.prixBien} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, prixBien: +e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.primoAccedant} onChange={(e) => setForm({ ...form, primoAccedant: e.target.checked })} id="primo" />
                <Label htmlFor="primo">Primo-accédant</Label>
              </div>
              <Button onClick={simulate} disabled={loading} className="w-full">
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Calculator className="h-4 w-4 mr-2" />}
                Vérifier l'éligibilité
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            {result ? (
              <>
                <Card className={result.eligible ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                  <CardContent className="p-6 text-center">
                    {result.eligible ? (
                      <>
                        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-green-700">Éligible au PTZ !</h2>
                        <p className="text-green-600">Montant maximum : {formatCurrency(result.montantPTZ)}</p>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-red-700">Non éligible</h2>
                        <p className="text-red-600">Les conditions ne sont pas remplies pour le PTZ</p>
                      </>
                    )}
                  </CardContent>
                </Card>

                {result.eligible && (
                  <Card>
                    <CardHeader><CardTitle>Détails du PTZ</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-muted rounded-lg text-center">
                          <p className="text-sm text-muted-foreground">Montant PTZ</p>
                          <p className="text-xl font-bold text-primary">{formatCurrency(result.montantPTZ)}</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg text-center">
                          <p className="text-sm text-muted-foreground">Durée</p>
                          <p className="text-xl font-bold">{result.dureeRemboursement} ans</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg text-center">
                          <p className="text-sm text-muted-foreground">Différé</p>
                          <p className="text-xl font-bold">{result.differePaiement} ans</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg text-center">
                          <p className="text-sm text-muted-foreground">Mensualité</p>
                          <p className="text-xl font-bold">{formatCurrency(result.mensualite)}/mois</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2">
                  <Button onClick={exportPDF} variant="outline"><FileDown className="h-4 w-4 mr-2" />Exporter PDF</Button>
                </div>
              </>
            ) : (
              <Card className="p-12">
                <div className="text-center">
                  <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Vérifiez votre éligibilité au PTZ 2025</h3>
                  <p className="text-muted-foreground">Renseignez les informations et vérifiez votre éligibilité</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </SimulatorGate>
  )
}
