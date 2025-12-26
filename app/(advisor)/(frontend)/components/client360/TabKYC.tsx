'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { Progress } from '@/app/_common/components/ui/Progress'
import { cn, formatDate } from '@/app/_common/lib/utils'
import { Shield, FileText, CheckCircle2, AlertCircle, AlertTriangle, Clock, Upload, Scale, Target, FileWarning } from 'lucide-react'
import { api } from '@/app/_common/lib/api-client'

interface TabKYCProps { clientId: string }

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  TERMINE: { label: 'Vérifié', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  PENDING: { label: 'En attente', color: 'bg-orange-100 text-orange-800', icon: Clock },
  EN_COURS: { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: Clock },
  EXPIRED: { label: 'Expiré', color: 'bg-red-100 text-red-800', icon: AlertCircle },
}

const DOC_STATUS: Record<string, { label: string; color: string }> = {
  VALIDATED: { label: 'Validé', color: 'bg-green-100 text-green-800' },
  PENDING: { label: 'En attente', color: 'bg-orange-100 text-orange-800' },
  EXPIRED: { label: 'Expiré', color: 'bg-red-100 text-red-800' },
  REJECTED: { label: 'Rejeté', color: 'bg-red-100 text-red-800' },
}

const RISK_PROFILE: Record<string, { label: string; color: string }> = {
  PRUDENT: { label: 'Prudent', color: 'bg-green-100 text-green-800' },
  EQUILIBRE: { label: 'Équilibré', color: 'bg-blue-100 text-blue-800' },
  DYNAMIQUE: { label: 'Dynamique', color: 'bg-orange-100 text-orange-800' },
  OFFENSIF: { label: 'Offensif', color: 'bg-red-100 text-red-800' },
}

const LCBFT_RISK: Record<string, { label: string; color: string }> = {
  BASSE: { label: 'Faible', color: 'bg-green-100 text-green-800' },
  MOYENNE: { label: 'Moyen', color: 'bg-orange-100 text-orange-800' },
  HAUTE: { label: 'Élevé', color: 'bg-red-100 text-red-800' },
}

export function TabKYC({ clientId }: TabKYCProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Record<string, unknown> | null>(null)

  useEffect(() => { loadKYC() }, [clientId])

  async function loadKYC() {
    try {
      setLoading(true)
      const response = await api.get(`/advisor/clients/${clientId}/kyc`)
      setData(response as any)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Impossible de charger les données KYC.</p>
        <Button onClick={loadKYC} className="mt-4">Réessayer</Button>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[(data as any).status] || STATUS_CONFIG.PENDING
  const StatusIcon = statusCfg.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-600" />
            KYC & Conformité
          </h2>
          <p className="text-gray-600 mt-1">Vérification d'identité et conformité réglementaire</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Upload className="w-4 h-4 mr-2" />
          Ajouter un document
        </Button>
      </div>

      {/* Alertes */}
      {((data as any).alerts as Array<{ severity: string; message: string }> | undefined)?.map((alert, i: number) => (
        <Alert key={i} className={cn('border-l-4', alert.severity === 'CRITIQUE' ? 'bg-red-50 border-red-500' : 'bg-orange-50 border-orange-500')}>
          <AlertTriangle className="w-5 h-5" />
          <AlertDescription className="ml-2">{alert.message}</AlertDescription>
        </Alert>
      ))}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><StatusIcon className="w-5 h-5 text-blue-600" /><span className="text-sm text-gray-600">Statut</span></div>
            <Badge className={cn('text-sm', statusCfg.color)}>{statusCfg.label}</Badge>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><Target className="w-5 h-5 text-green-600" /><span className="text-sm text-gray-600">Complétion</span></div>
            <div className="text-2xl font-bold text-gray-900">{(data as any).completionRate || 0}%</div>
            <Progress value={(data as any).completionRate || 0} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><Scale className="w-5 h-5 text-purple-600" /><span className="text-sm text-gray-600">Score MIF II</span></div>
            <div className="text-2xl font-bold text-gray-900">{(data as any).mifid?.overallScore || 0}/100</div>
            {(data as any).mifid?.riskProfile && <Badge className={cn('text-xs mt-1', RISK_PROFILE[(data as any).mifid.riskProfile]?.color)}>{RISK_PROFILE[(data as any).mifid.riskProfile]?.label}</Badge>}
          </CardContent>
        </Card>
        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><FileWarning className="w-5 h-5 text-orange-600" /><span className="text-sm text-gray-600">Risque LCB-FT</span></div>
            {(data as any).lcbft?.riskLevel && <Badge className={cn('text-sm', LCBFT_RISK[(data as any).lcbft.riskLevel]?.color)}>{LCBFT_RISK[(data as any).lcbft.riskLevel]?.label}</Badge>}
            {(data as any).lcbft?.isPEP && <Badge className="ml-2 bg-red-100 text-red-800 text-xs">PEP</Badge>}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="bg-gray-100 border border-gray-200">
          <TabsTrigger value="documents" className="data-[state=active]:bg-white">Documents</TabsTrigger>
          <TabsTrigger value="mifid" className="data-[state=active]:bg-white">MIF II</TabsTrigger>
          <TabsTrigger value="lcbft" className="data-[state=active]:bg-white">LCB-FT</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6 space-y-4">
          {(data as any).missingDocs?.length > 0 && (
            <Card className="border border-red-200 bg-red-50">
              <CardHeader><CardTitle className="text-red-800 flex items-center gap-2"><AlertCircle className="w-5 h-5" />Documents manquants</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {((data as any).missingDocs as Array<{ label: string; description: string }>).map((doc, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                    <div><p className="font-medium">{doc.label}</p><p className="text-sm text-gray-600">{doc.description}</p></div>
                    <Button size="sm" variant="outline"><Upload className="w-4 h-4 mr-1" />Ajouter</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          <Card className="border border-gray-200 bg-white">
            <CardHeader><CardTitle>Documents KYC</CardTitle></CardHeader>
            <CardContent>
              {((data as any).documents as Array<{ id: string; label: string; status: string; expiresAt?: string }> | undefined)?.length ? ((data as any).documents as Array<{ id: string; label: string; status: string; expiresAt?: string }>).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 mb-2">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <div><p className="font-medium">{doc.label}</p><p className="text-xs text-gray-500">{doc.expiresAt && `Expire le ${formatDate(doc.expiresAt)}`}</p></div>
                  </div>
                  <Badge className={DOC_STATUS[doc.status]?.color}>{DOC_STATUS[doc.status]?.label}</Badge>
                </div>
              )) : <p className="text-center py-8 text-gray-500">Aucun document</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mifid" className="mt-6">
          <Card className="border border-gray-200 bg-white">
            <CardHeader><CardTitle className="flex items-center gap-2"><Scale className="w-5 h-5 text-purple-600" />Profil MIF II</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(data as any).mifid ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-sm text-gray-600">Profil de risque</p><Badge className={cn('mt-1', RISK_PROFILE[(data as any).mifid.riskProfile]?.color)}>{RISK_PROFILE[(data as any).mifid.riskProfile]?.label}</Badge></div>
                    <div><p className="text-sm text-gray-600">Horizon</p><p className="font-medium mt-1">{(data as any).mifid.investmentHorizon}</p></div>
                  </div>
                  <div className="space-y-2">
                    <div><div className="flex justify-between text-sm"><span>Connaissance marchés</span><span>{(data as any).mifid.investmentKnowledge}%</span></div><Progress value={(data as any).mifid.investmentKnowledge} className="h-2" /></div>
                    <div><div className="flex justify-between text-sm"><span>Capacité financière</span><span>{(data as any).mifid.financialCapacity}%</span></div><Progress value={(data as any).mifid.financialCapacity} className="h-2" /></div>
                    <div><div className="flex justify-between text-sm font-medium"><span>Score global</span><span className="text-purple-600">{(data as any).mifid.overallScore}/100</span></div><Progress value={(data as any).mifid.overallScore} className="h-3" /></div>
                  </div>
                  {(data as any).mifid.recommendation && <div className="p-4 bg-purple-50 rounded-lg"><p className="text-sm text-purple-800">{(data as any).mifid.recommendation}</p></div>}
                </>
              ) : <p className="text-center py-8 text-gray-500">Questionnaire non complété</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lcbft" className="mt-6">
          <Card className="border border-gray-200 bg-white">
            <CardHeader><CardTitle className="flex items-center gap-2"><FileWarning className="w-5 h-5 text-orange-600" />LCB-FT</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(data as any).lcbft ? (
                <>
                  {(data as any).lcbft.isPEP && <Alert className="border-red-200 bg-red-50"><AlertCircle className="w-5 h-5 text-red-600" /><AlertDescription className="ml-2 font-medium text-red-900">Personne Politiquement Exposée (PEP)</AlertDescription></Alert>}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"><span>Niveau de risque</span><Badge className={LCBFT_RISK[(data as any).lcbft.riskLevel]?.color}>{LCBFT_RISK[(data as any).lcbft.riskLevel]?.label}</Badge></div>
                  {(data as any).lcbft.enhancedDueDiligence && <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-600" /><span className="text-orange-800 font-medium">Vigilance renforcée requise</span></div>}
                  <div className="space-y-3">
                    <div><p className="text-sm text-gray-600">Origine des fonds</p><p>{(data as any).lcbft.originOfFunds || '-'}</p></div>
                    <div><p className="text-sm text-gray-600">Source patrimoine</p><p>{(data as any).lcbft.sourceOfWealth || '-'}</p></div>
                  </div>
                </>
              ) : <p className="text-center py-8 text-gray-500">Évaluation non effectuée</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
