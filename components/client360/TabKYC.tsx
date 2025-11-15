'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog'
import { Label } from '@/components/ui/Label'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import Alert from '@/components/ui/Alert'
import { formatDate, formatPercentage } from '@/lib/utils'
import { api } from '@/lib/api-client'
import {
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  TrendingUp,
  AlertTriangle,
  Save,
  Upload,
  Download,
  Eye,
} from 'lucide-react'
import type { ClientDetail } from '@/lib/api-types'
import type { KYCDocumentType, KYCDocStatus } from '@prisma/client'

interface TabKYCProps {
  clientId: string
  client: ClientDetail
  onRefresh?: () => void
}

interface KYCDocument {
  id: string
  type: KYCDocumentType
  status: KYCDocStatus
  documentId?: string
  validatedAt?: string
  validatedBy?: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

interface KYCCheckResult {
  isComplete: boolean
  missingDocuments: KYCDocumentType[]
  expiredDocuments: KYCDocumentType[]
  pendingDocuments: KYCDocumentType[]
  completionPercentage: number
}

const kycStatusConfig = {
  PENDING: {
    label: 'En attente',
    variant: 'outline' as const,
    icon: Clock,
    color: 'text-muted-foreground',
  },
  IN_PROGRESS: {
    label: 'En cours',
    variant: 'default' as const,
    icon: Clock,
    color: 'text-blue-600',
  },
  COMPLETED: {
    label: 'Complété',
    variant: 'default' as const,
    icon: CheckCircle,
    color: 'text-green-600',
  },
  EXPIRED: {
    label: 'Expiré',
    variant: 'destructive' as const,
    icon: AlertCircle,
    color: 'text-destructive',
  },
  REJECTED: {
    label: 'Rejeté',
    variant: 'destructive' as const,
    icon: AlertTriangle,
    color: 'text-destructive',
  },
}

const riskProfileConfig = {
  CONSERVATEUR: { label: 'Conservateur', color: 'bg-blue-500' },
  PRUDENT: { label: 'Prudent', color: 'bg-cyan-500' },
  EQUILIBRE: { label: 'Équilibré', color: 'bg-green-500' },
  DYNAMIQUE: { label: 'Dynamique', color: 'bg-orange-500' },
  OFFENSIF: { label: 'Offensif', color: 'bg-red-500' },
}

const kycDocumentTypeLabels: Record<KYCDocumentType, string> = {
  IDENTITY: 'Pièce d\'identité',
  PROOF_OF_ADDRESS: 'Justificatif de domicile',
  TAX_NOTICE: 'Avis d\'imposition',
  BANK_RIB: 'RIB bancaire',
  WEALTH_JUSTIFICATION: 'Justificatif de patrimoine',
  ORIGIN_OF_FUNDS: 'Origine des fonds',
  OTHER: 'Autre',
}

const kycDocStatusLabels: Record<KYCDocStatus, string> = {
  PENDING: 'En attente',
  VALIDATED: 'Validé',
  REJECTED: 'Rejeté',
  EXPIRED: 'Expiré',
}

export function TabKYC({ clientId, client, onRefresh }: TabKYCProps) {
  const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([])
  const [kycCheck, setKycCheck] = useState<KYCCheckResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [showKYCForm, setShowKYCForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    riskProfile: client.riskProfile || '',
    investmentHorizon: client.investmentHorizon || '',
    investmentGoals: '',
    investmentKnowledge: client.investmentKnowledge || '',
    investmentExperience: client.investmentExperience || '',
  })

  const kycConfig = kycStatusConfig[client.kycStatus]
  const StatusIcon = kycConfig.icon

  useEffect(() => {
    loadKYCData()
  }, [clientId])

  const loadKYCData = async () => {
    try {
      setLoading(true)
      
      // Load KYC documents
      const docsResponse = await api.get(`/api/clients/${clientId}/kyc/documents`)
      setKycDocuments(docsResponse.data || [])
      
      // Load KYC check status
      const checkResponse = await api.get(`/api/clients/${clientId}/kyc`)
      setKycCheck(checkResponse.data)
    } catch (error) {
      console.error('Error loading KYC data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateKYC = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      await api.patch(`/api/clients/${clientId}`, {
        riskProfile: formData.riskProfile,
        investmentHorizon: formData.investmentHorizon,
        investmentGoals: formData.investmentGoals ? [formData.investmentGoals] : null,
        investmentKnowledge: formData.investmentKnowledge,
        investmentExperience: formData.investmentExperience,
      })
      
      setShowKYCForm(false)
      if (onRefresh) onRefresh()
      await loadKYCData()
    } catch (error) {
      console.error('Error updating KYC:', error)
      alert('Erreur lors de la mise à jour du KYC')
    } finally {
      setSaving(false)
    }
  }

  const handleValidateDocument = async (docId: string, status: KYCDocStatus) => {
    try {
      await api.patch(`/api/clients/${clientId}/kyc/documents/${docId}`, {
        status,
      })
      
      await loadKYCData()
      if (onRefresh) onRefresh()
    } catch (error) {
      console.error('Error validating document:', error)
      alert('Erreur lors de la validation du document')
    }
  }

  const getDocumentStatusIcon = (status: KYCDocStatus) => {
    switch (status) {
      case 'VALIDATED':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'REJECTED':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'EXPIRED':
        return <AlertCircle className="h-5 w-5 text-orange-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des données KYC...</p>
        </div>
      </div>
    )
  }

  const kycScore = kycCheck?.completionPercentage || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            KYC & Conformité MIF II
          </h2>
          <p className="text-muted-foreground mt-1">Know Your Customer / Connaissance Client</p>
        </div>
        
        <Button onClick={() => setShowKYCForm(true)}>
          {client.kycStatus === 'COMPLETED' ? 'Mettre à jour' : 'Compléter le KYC'}
        </Button>
      </div>

      {/* KYC Status Overview */}
      <Card className={client.kycStatus === 'COMPLETED' ? 'bg-green-50 dark:bg-green-950' : 'bg-yellow-50 dark:bg-yellow-950'}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Statut KYC</div>
              <Badge variant={kycConfig.variant} className="text-base">
                <StatusIcon className="h-4 w-4 mr-1" />
                {kycConfig.label}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Complétion</div>
              <div className="text-3xl font-bold">
                {Math.round(kycScore)}%
              </div>
            </div>
          </div>
          
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full transition-all ${
                kycScore >= 80
                  ? 'bg-green-600'
                  : kycScore >= 50
                  ? 'bg-yellow-600'
                  : 'bg-red-600'
              }`}
              style={{ width: `${kycScore}%` }}
            />
          </div>

          {/* Missing/Expired Documents Alert */}
          {kycCheck && (kycCheck.missingDocuments.length > 0 || kycCheck.expiredDocuments.length > 0) && (
            <Alert variant="warning" title="Documents requis" onClose={undefined} className="mt-4">
              {kycCheck.missingDocuments.length > 0 && (
                <div>Documents manquants: {kycCheck.missingDocuments.map(d => kycDocumentTypeLabels[d]).join(', ')}</div>
              )}
              {kycCheck.expiredDocuments.length > 0 && (
                <div>Documents expirés: {kycCheck.expiredDocuments.map(d => kycDocumentTypeLabels[d]).join(', ')}</div>
              )}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {client.updatedAt && (
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Dernière mise à jour</div>
              <div className="font-semibold">
                {formatDate(client.updatedAt)}
              </div>
            </CardContent>
          </Card>
        )}

        {client.kycCompletedAt && (
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Date de complétion</div>
              <div className="font-semibold">
                {formatDate(client.kycCompletedAt)}
              </div>
            </CardContent>
          </Card>
        )}

        {client.kycNextReviewDate && (
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Prochaine mise à jour</div>
              <div className="font-semibold">
                {formatDate(client.kycNextReviewDate)}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* MIF II - Profil Investisseur */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Profil investisseur (MIF II)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risk Profile */}
            <div>
              <div className="text-sm text-muted-foreground mb-1">Profil de risque</div>
              {client.riskProfile ? (
                <div className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      riskProfileConfig[client.riskProfile]?.color || 'bg-gray-500'
                    }`}
                  />
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {riskProfileConfig[client.riskProfile]?.label || client.riskProfile}
                  </Badge>
                </div>
              ) : (
                <div className="text-lg font-semibold text-muted-foreground">Non défini</div>
              )}
            </div>

            {/* Investment Horizon */}
            <div>
              <div className="text-sm text-muted-foreground mb-1">Horizon d'investissement</div>
              {client.investmentHorizon ? (
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {client.investmentHorizon}
                </Badge>
              ) : (
                <div className="text-lg font-semibold text-muted-foreground">Non défini</div>
              )}
            </div>

            {/* Investment Knowledge */}
            <div>
              <div className="text-sm text-muted-foreground mb-1">Connaissances financières</div>
              <div className="text-lg font-semibold">
                {client.investmentKnowledge || 'Non évalué'}
              </div>
            </div>

            {/* Investment Experience */}
            <div>
              <div className="text-sm text-muted-foreground mb-1">Expérience d'investissement</div>
              <div className="text-lg font-semibold">
                {client.investmentExperience || 'Non renseigné'}
              </div>
            </div>
          </div>

          {/* Investment Goals */}
          {client.investmentGoals && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Objectifs d'investissement
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(client.investmentGoals) ? (
                  client.investmentGoals.map((goal, index: number) => (
                    <Badge key={index} variant="secondary">
                      {String(goal)}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="secondary">Non renseigné</Badge>
                )}
              </div>
            </div>
          )}

          {/* MIF II Score */}
          {client.riskProfile && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <span className="font-medium">Score MIF II Global</span>
                <span className="text-2xl font-bold text-blue-600">
                  {Math.round(kycScore)} / 100
                </span>
              </div>
            </div>
          )}

          {client.riskProfile && (
            <Alert variant="info" title="Recommandation" onClose={undefined} className="mt-4">
              Profil adapté pour des investissements {riskProfileConfig[client.riskProfile]?.label.toLowerCase()}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* LCB-FT - Lutte contre le blanchiment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            LCB-FT (Lutte contre le blanchiment)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* PEP Status */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="font-medium">Personne Exposée Politiquement (PEP)</span>
              <Badge variant="secondary">
                NON
              </Badge>
            </div>

            {/* Origin of Funds */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Origine des fonds</div>
              <div className="font-semibold">
                {client.profession ? `Revenus professionnels (${client.profession})` : 'Non renseigné'}
              </div>
              {client.annualIncome && (
                <div className="text-sm text-muted-foreground mt-2">
                  Revenus annuels: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(client.annualIncome))}
                </div>
              )}
            </div>

            {/* Beneficial Owner for Professional Clients */}
            {client.clientType === 'PROFESSIONNEL' && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Bénéficiaire effectif</div>
                <div className="font-semibold">
                  {client.firstName} {client.lastName}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Détient plus de 25% du capital
                </div>
                {client.companyName && (
                  <div className="text-sm mt-2">
                    Société: {client.companyName}
                  </div>
                )}
              </div>
            )}

            {/* Engagement Letter */}
            {client.kycStatus === 'COMPLETED' && (
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">
                    Lettre de mission signée
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KYC Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents justificatifs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {kycDocuments.length > 0 ? (
            <div className="space-y-3">
              {kycDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getDocumentStatusIcon(doc.status)}
                    <div>
                      <div className="font-semibold">{kycDocumentTypeLabels[doc.type]}</div>
                      <div className="text-sm text-muted-foreground">
                        Uploadé le {formatDate(doc.createdAt)}
                      </div>
                      {doc.expiresAt && (
                        <div className={`text-xs mt-1 ${
                          new Date(doc.expiresAt) < new Date() 
                            ? 'text-red-600' 
                            : 'text-orange-600'
                        }`}>
                          Expire le {formatDate(doc.expiresAt)}
                        </div>
                      )}
                      {doc.validatedAt && (
                        <div className="text-xs text-green-600 mt-1">
                          Validé le {formatDate(doc.validatedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        doc.status === 'VALIDATED'
                          ? 'default'
                          : doc.status === 'REJECTED'
                          ? 'destructive'
                          : doc.status === 'EXPIRED'
                          ? 'destructive'
                          : 'outline'
                      }
                      className={
                        doc.status === 'VALIDATED'
                          ? 'bg-green-600 text-white'
                          : ''
                      }
                    >
                      {kycDocStatusLabels[doc.status]}
                    </Badge>
                    
                    {doc.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleValidateDocument(doc.id, 'VALIDATED')}
                          title="Valider"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleValidateDocument(doc.id, 'REJECTED')}
                          title="Rejeter"
                        >
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    )}
                    
                    {doc.documentId && (
                      <Button size="sm" variant="ghost" title="Voir le document">
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun document justificatif uploadé</p>
              <Button className="mt-4" variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Ajouter un document
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Alerts */}
      {client.kycStatus === 'EXPIRED' && (
        <Card className="border-destructive bg-red-50 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Alerte de conformité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Le KYC de ce client a expiré. Une mise à jour est requise pour rester conforme
              aux obligations réglementaires.
            </p>
            <Button variant="destructive" onClick={() => setShowKYCForm(true)}>
              <AlertCircle className="h-4 w-4 mr-2" />
              Mettre à jour maintenant
            </Button>
          </CardContent>
        </Card>
      )}

      {client.kycStatus !== 'COMPLETED' && client.kycStatus !== 'EXPIRED' && (
        <Alert variant="info" title="Information" onClose={undefined} className="">
          Le KYC n'est pas encore complété. Cliquez sur "Compléter le KYC" pour renseigner toutes les informations nécessaires.
        </Alert>
      )}

      {/* Modal Formulaire KYC */}
      <Dialog open={showKYCForm} onOpenChange={setShowKYCForm}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compléter le KYC Client</DialogTitle>
            <DialogDescription>
              Renseignez les informations nécessaires pour la conformité réglementaire
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateKYC} className="space-y-6">
            {/* Section MIFID II */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">📋 Profil MIFID II</h3>
              
              <div className="space-y-2">
                <Label htmlFor="riskProfile">Profil de risque *</Label>
                <Select 
                  value={formData.riskProfile}
                  onValueChange={(val) => setFormData({...formData, riskProfile: val})}
                  required
                >
                  <SelectTrigger id="riskProfile">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONSERVATEUR">Conservateur</SelectItem>
                    <SelectItem value="PRUDENT">Prudent</SelectItem>
                    <SelectItem value="EQUILIBRE">Équilibré</SelectItem>
                    <SelectItem value="DYNAMIQUE">Dynamique</SelectItem>
                    <SelectItem value="OFFENSIF">Offensif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="investmentHorizon">Horizon d'investissement *</Label>
                <Select 
                  value={formData.investmentHorizon}
                  onValueChange={(val) => setFormData({...formData, investmentHorizon: val})}
                  required
                >
                  <SelectTrigger id="investmentHorizon">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SHORT">Court terme (&lt; 2 ans)</SelectItem>
                    <SelectItem value="MEDIUM">Moyen terme (2-5 ans)</SelectItem>
                    <SelectItem value="LONG">Long terme (&gt; 5 ans)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="investmentKnowledge">Connaissances financières *</Label>
                <Select 
                  value={formData.investmentKnowledge}
                  onValueChange={(val) => setFormData({...formData, investmentKnowledge: val})}
                  required
                >
                  <SelectTrigger id="investmentKnowledge">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEBUTANT">Débutant</SelectItem>
                    <SelectItem value="INTERMEDIAIRE">Intermédiaire</SelectItem>
                    <SelectItem value="AVANCE">Avancé</SelectItem>
                    <SelectItem value="EXPERT">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="investmentExperience">Expérience d'investissement</Label>
                <Input
                  id="investmentExperience"
                  value={formData.investmentExperience}
                  onChange={(e) => setFormData({...formData, investmentExperience: e.target.value})}
                  placeholder="Ex: 5 ans en bourse, 10 ans en immobilier"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="investmentGoals">Objectif principal d'investissement *</Label>
                <Select 
                  value={formData.investmentGoals}
                  onValueChange={(val) => setFormData({...formData, investmentGoals: val})}
                  required
                >
                  <SelectTrigger id="investmentGoals">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESERVATION">Préservation du capital</SelectItem>
                    <SelectItem value="REVENUS">Génération de revenus</SelectItem>
                    <SelectItem value="CROISSANCE">Croissance du capital</SelectItem>
                    <SelectItem value="SPECULATION">Spéculation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowKYCForm(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Enregistrement...' : 'Enregistrer le KYC'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
