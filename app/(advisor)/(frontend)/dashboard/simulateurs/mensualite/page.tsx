
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { useToast } from '@/app/_common/hooks/use-toast'
import { generatePDFContent, downloadReport } from '@/app/_common/lib/services/simulation-export-service'
import { ArrowLeft, Calculator, FileDown, RefreshCw, Euro, Percent, Calendar } from 'lucide-react'

interface MensualiteResult {
  mensualite: number
  coutTotal: number
  coutInterets: number
  tauxEndettement: number
  tableau: Array<{ mois: number; capital: number; interets: number; restant: number }>
}

export default function MensualitePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MensualiteResult | null>(null)

  const [form, setForm] = useState({
    montantEmprunt: 200000,
    tauxAnnuel: 3.5,
    dureeAnnees: 20,
    revenusMensuels: 5000,
  })

  const simulate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/advisor/simulators-proxy/mensualite/mensualite/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setResult(data.data)
      } else {
        // Calcul local
        const tauxMensuel = form.tauxAnnuel / 100 / 12
        const nbMensualites = form.dureeAnnees * 12
        const mensualite = form.montantEmprunt * (tauxMensuel * Math.pow(1 + tauxMensuel, nbMensualites)) / (Math.pow(1 + tauxMensuel, nbMensualites) - 1)
        const coutTotal = mensualite * nbMensualites
        const coutInterets = coutTotal - form.montantEmprunt

        // Tableau d'amortissement (premiers 12 mois)
        const tableau = []
        let restant = form.montantEmprunt
        for (let i = 1; i <= Math.min(12, nbMensualites); i++) {
          const interets = restant * tauxMensuel
          const capital = mensualite - interets
          restant -= capital
          tableau.push({ mois: i, capital: Math.round(capital), interets: Math.round(interets), restant: Math.round(restant) })
        }

        setResult({
          mensualite: Math.round(mensualite),
          coutTotal: Math.round(coutTotal),
          coutInterets: Math.round(coutInterets),
          tauxEndettement: Math.round((mensualite / form.revenusMensuels) * 100),
          tableau,
        })
      }
      toast({ title: 'Calcul terminé' })
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const exportPDF = () => {
    if (!result) return
    const html = generatePDFContent({
      simulation: { type: 'MENSUALITE', name: 'Mensualité Crédit', parameters: form, results: result as any }
    })
    downloadReport(html, `mensualite-${Date.now()}`, 'html')
  }

  const formatCurrency = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/dashboard/simulateurs">Simulateurs</Link><span>/</span><span>Mensualité</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calculator className="h-7 w-7 text-primary" />
            Calculateur de Mensualité
          </h1>
          <p className="text-muted-foreground mt-1">Backend Node.js - Port 3002</p>
        </div>
        <Link href="/dashboard/simulateurs"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button></Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Paramètres du prêt</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Montant emprunté</Label>
              <div className="relative mt-1">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="number" value={form.montantEmprunt} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, montantEmprunt: +e.target.value })} className="pl-9" />
              </div>
            </div>
            <div>
              <Label>Taux annuel (%)</Label>
              <div className="relative mt-1">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="number" value={form.tauxAnnuel} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, tauxAnnuel: +e.target.value })} className="pl-9" step={0.1} />
              </div>
            </div>
            <div>
              <Label>Durée (années)</Label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="number" value={form.dureeAnnees} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, dureeAnnees: +e.target.value })} className="pl-9" min={1} max={30} />
              </div>
            </div>
            <div>
              <Label>Revenus mensuels (pour taux endettement)</Label>
              <Input type="number" value={form.revenusMensuels} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, revenusMensuels: +e.target.value })} />
            </div>
            <Button onClick={simulate} disabled={loading} className="w-full">
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Calculator className="h-4 w-4 mr-2" />}
              Calculer
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {result ? (
            <>
              <Card className="bg-primary/5 border-primary">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground">Mensualité</p>
                    <p className="text-4xl font-bold text-primary">{formatCurrency(result.mensualite)}/mois</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-white rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Coût total</p>
                      <p className="text-lg font-bold">{formatCurrency(result.coutTotal)}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Coût intérêts</p>
                      <p className="text-lg font-bold text-orange-600">{formatCurrency(result.coutInterets)}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Taux endettement</p>
                      <p className={`text-lg font-bold ${result.tauxEndettement > 35 ? 'text-red-600' : 'text-green-600'}`}>{result.tauxEndettement}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Tableau d'amortissement (12 premiers mois)</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-auto max-h-64">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-muted">
                        <tr>
                          <th className="p-2 text-left">Mois</th>
                          <th className="p-2 text-right">Capital</th>
                          <th className="p-2 text-right">Intérêts</th>
                          <th className="p-2 text-right">Restant dû</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.tableau?.map((row) => (
                          <tr key={row.mois} className="border-b">
                            <td className="p-2">{row.mois}</td>
                            <td className="p-2 text-right">{formatCurrency(row.capital)}</td>
                            <td className="p-2 text-right text-orange-600">{formatCurrency(row.interets)}</td>
                            <td className="p-2 text-right font-medium">{formatCurrency(row.restant)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={exportPDF} variant="outline"><FileDown className="h-4 w-4 mr-2" />Exporter PDF</Button>
            </>
          ) : (
            <Card className="p-12">
              <div className="text-center">
                <Calculator className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Calculez vos mensualités</h3>
                <p className="text-muted-foreground">Avec tableau d'amortissement détaillé</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
