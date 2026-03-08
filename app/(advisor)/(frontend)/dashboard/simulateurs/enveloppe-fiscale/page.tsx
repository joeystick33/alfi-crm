 
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { useToast } from '@/app/_common/hooks/use-toast'
import { generatePDFContent, downloadReport } from '@/app/_common/lib/services/simulation-export-service'
import { ArrowLeft, Percent, Calculator, FileDown, RefreshCw, Euro, CheckCircle } from 'lucide-react'
import { RULES } from '@/app/_common/lib/rules/fiscal-rules'

export default function EnveloppeFiscalePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  
  const [form, setForm] = useState({
    beneficeAnnuel: 100000,
    chargesSociales: 25000,
    trancheMarginal: 41,
    cotisationsMadelin: 5000,
    cotisationsPER: 8000,
    versementsAV: 4600,
  })

  const simulate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/advisor/simulators-proxy/enveloppe-fiscale/enveloppe-fiscale/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setResult(data.data)
      } else {
        // Calcul local
        const plafondPER = Math.min(form.beneficeAnnuel * RULES.per.plafond_taux, RULES.per.plafond_max_salarie)
        const plafondMadelin = Math.min(form.beneficeAnnuel * RULES.per.tns.taux_base + RULES.per.tns.plafond_additionnel, RULES.per.tns.plafond_max)
        const plafondAV = RULES.assurance_vie.rachat.abattement_celibataire_8ans + (form.beneficeAnnuel > 100000 ? RULES.assurance_vie.rachat.abattement_celibataire_8ans : 0)
        
        const utilisePER = Math.min(form.cotisationsPER, plafondPER)
        const utiliseMadelin = Math.min(form.cotisationsMadelin, plafondMadelin)
        const utiliseAV = Math.min(form.versementsAV, plafondAV)
        
        const economieIR = (utilisePER + utiliseMadelin) * (form.trancheMarginal / 100)
        const enveloppeTotale = plafondPER + plafondMadelin + plafondAV
        const utilise = utilisePER + utiliseMadelin + utiliseAV
        
        setResult({
          enveloppes: [
            { nom: 'PER', plafond: plafondPER, utilise: utilisePER, reste: plafondPER - utilisePER },
            { nom: 'Madelin', plafond: plafondMadelin, utilise: utiliseMadelin, reste: plafondMadelin - utiliseMadelin },
            { nom: 'Assurance-Vie (abattement)', plafond: plafondAV, utilise: utiliseAV, reste: plafondAV - utiliseAV },
          ],
          enveloppeTotale,
          utilise,
          reste: enveloppeTotale - utilise,
          economieIR: Math.round(economieIR),
          tauxOptimisation: Math.round((utilise / enveloppeTotale) * 100),
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
      simulation: { type: 'OPTIMISATION_FISCALE', name: 'Enveloppe Fiscale TNS', parameters: form, results: result }
    })
    downloadReport(html, `enveloppe-fiscale-${Date.now()}`, 'html')
  }

  const formatCurrency = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/dashboard/simulateurs">Simulateurs</Link><span>/</span><span>Enveloppe Fiscale</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Percent className="h-7 w-7 text-primary" />
            Enveloppe Fiscale TNS
          </h1>
          <p className="text-muted-foreground mt-1">Backend Node.js - Port 3003</p>
        </div>
        <Link href="/dashboard/simulateurs"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button></Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Situation fiscale</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Bénéfice annuel</Label>
              <div className="relative mt-1">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="number" value={form.beneficeAnnuel} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, beneficeAnnuel: +e.target.value})} className="pl-9" />
              </div>
            </div>
            <div>
              <Label>Tranche marginale (%)</Label>
              <Input type="number" value={form.trancheMarginal} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, trancheMarginal: +e.target.value})} />
            </div>
            <div>
              <Label>Cotisations Madelin actuelles</Label>
              <Input type="number" value={form.cotisationsMadelin} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, cotisationsMadelin: +e.target.value})} />
            </div>
            <div>
              <Label>Cotisations PER actuelles</Label>
              <Input type="number" value={form.cotisationsPER} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, cotisationsPER: +e.target.value})} />
            </div>
            <div>
              <Label>Versements AV actuels</Label>
              <Input type="number" value={form.versementsAV} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, versementsAV: +e.target.value})} />
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
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">Taux d'optimisation fiscale</p>
                  <p className="text-4xl font-bold text-primary">{result.tauxOptimisation}%</p>
                  <p className="text-sm mt-2">Économie d'IR: <span className="font-bold text-green-600">{formatCurrency(result.economieIR)}/an</span></p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Détail par enveloppe</CardTitle></CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left">Enveloppe</th>
                        <th className="p-3 text-right">Plafond</th>
                        <th className="p-3 text-right">Utilisé</th>
                        <th className="p-3 text-right">Disponible</th>
                        <th className="p-3 text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.enveloppes?.map((env: any) => (
                        <tr key={env.nom} className="border-b">
                          <td className="p-3 font-medium">{env.nom}</td>
                          <td className="p-3 text-right">{formatCurrency(env.plafond)}</td>
                          <td className="p-3 text-right">{formatCurrency(env.utilise)}</td>
                          <td className="p-3 text-right text-green-600">{formatCurrency(env.reste)}</td>
                          <td className="p-3 text-center">
                            {env.reste <= 0 ? (
                              <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <span className="text-orange-600 text-xs">À optimiser</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted font-bold">
                      <tr>
                        <td className="p-3">TOTAL</td>
                        <td className="p-3 text-right">{formatCurrency(result.enveloppeTotale)}</td>
                        <td className="p-3 text-right">{formatCurrency(result.utilise)}</td>
                        <td className="p-3 text-right text-green-600">{formatCurrency(result.reste)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </CardContent>
              </Card>

              <Button onClick={exportPDF} variant="outline"><FileDown className="h-4 w-4 mr-2" />Exporter PDF</Button>
            </>
          ) : (
            <Card className="p-12">
              <div className="text-center">
                <Percent className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Optimisez votre fiscalité TNS</h3>
                <p className="text-muted-foreground">Calculez vos plafonds de déduction disponibles</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
