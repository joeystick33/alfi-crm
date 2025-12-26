"use client"
 

import { useState } from 'react'
import { Button } from '@/app/_common/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Input } from '@/app/_common/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { ErrorState, getErrorVariant } from '@/app/_common/components/ui/ErrorState'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/_common/components/ui/Dialog'
import {
  useSignatureStats,
  usePendingSignatures,
  useInitiateSignature,
  useUpdateSignatureStep,
  useDocuments,
} from '@/app/_common/hooks/use-api'
import type {
  PendingSignatureItem,
  InitiateSignatureRequest,
  SignatureStepInput,
  UpdateSignatureStepRequest,
  SignatureWorkflowStep,
} from '@/app/_common/lib/api-types'
import { toast } from '@/app/_common/hooks/use-toast'
import { FileSignature, Plus, CheckCircle, XCircle, RefreshCw, Mail } from 'lucide-react'

const SIGNATURE_STATUS_LABELS: Record<string, { label: string; variant: any }> = {
  PENDING: { label: 'En attente', variant: 'outline' },
  SIGNED: { label: 'Signé', variant: 'default' },
  REJECTED: { label: 'Rejeté', variant: 'destructive' },
  EXPIRED: { label: 'Expiré', variant: 'outline' },
}

export default function DocumentsSignaturePage() {
  const [initiateDialogOpen, setInitiateDialogOpen] = useState(false)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('')
  const [signatureSteps, setSignatureSteps] = useState<SignatureStepInput[]>([
    { signerEmail: '', signerName: '', signatureType: 'ELECTRONIC' },
  ])

  const { data: stats, isLoading: statsLoading } = useSignatureStats()
  const {
    data: pendingResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = usePendingSignatures()
  const { data: documentsResponse } = useDocuments({})

  const pendingDocuments: PendingSignatureItem[] = pendingResponse?.data || []
  const allDocuments = documentsResponse?.data || []

  const initiateMutation = useInitiateSignature()
  const updateStepMutation = useUpdateSignatureStep()

  const handleOpenInitiate = () => {
    setInitiateDialogOpen(true)
  }

  const handleCloseInitiate = () => {
    setInitiateDialogOpen(false)
    setSelectedDocumentId('')
    setSignatureSteps([{ signerEmail: '', signerName: '', signatureType: 'ELECTRONIC' }])
  }

  const handleAddStep = () => {
    setSignatureSteps(prev => [
      ...prev,
      { signerEmail: '', signerName: '', signatureType: 'ELECTRONIC' },
    ])
  }

  const handleRemoveStep = (index: number) => {
    setSignatureSteps(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpdateStep = (index: number, field: keyof SignatureStepInput, value: any) => {
    setSignatureSteps(prev =>
      prev.map((step, i) => (i === index ? { ...step, [field]: value } : step))
    )
  }

  const handleInitiateSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!selectedDocumentId) {
      toast({
        title: 'Document requis',
        description: 'Sélectionnez un document pour initier la signature.',
        variant: 'destructive',
      })
      return
    }

    const validSteps = signatureSteps.filter(s => s.signerEmail && s.signerName)
    if (validSteps.length === 0) {
      toast({
        title: 'Étapes manquantes',
        description: 'Ajoutez au moins un signataire avec email et nom.',
        variant: 'destructive',
      })
      return
    }

    const payload: InitiateSignatureRequest = {
      documentId: selectedDocumentId,
      provider: 'DOCUSIGN' as any,
      steps: validSteps,
    }

    try {
      await initiateMutation.mutateAsync(payload)
      handleCloseInitiate()
    } catch {
      // Toast géré par le hook
    }
  }

  const handleMarkAsSigned = async (step: SignatureWorkflowStep) => {
    if (!window.confirm(`Marquer l'étape comme signée pour ${step.signerName || step.signerEmail} ?`)) return

    const updatePayload: UpdateSignatureStepRequest = {
      status: 'SIGNE' as any,
      signedAt: new Date().toISOString(),
    }

    try {
      await updateStepMutation.mutateAsync({ stepId: step.id, data: updatePayload })
    } catch {
      // Toast géré par le hook
    }
  }

  const handleReject = async (step: SignatureWorkflowStep) => {
    if (!window.confirm(`Rejeter la signature pour ${step.signerName || step.signerEmail} ?`)) return

    const updatePayload: UpdateSignatureStepRequest = {
      status: 'REJETEE' as any,
    }

    try {
      await updateStepMutation.mutateAsync({ stepId: step.id, data: updatePayload })
    } catch {
      // Toast géré par le hook
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileSignature className="h-7 w-7 text-slate-600" />
            Workflows de signature
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestion des signatures électroniques et des documents en attente.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
          <Button onClick={handleOpenInitiate} className="gap-2">
            <Plus className="h-4 w-4" />
            Initier une signature
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Workflows totaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-semibold">{stats?.totalWorkflows ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Complétés
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-semibold">{stats?.completed ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-semibold">{stats?.pending ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejetés
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-semibold">{stats?.rejected ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux de complétion
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-semibold">{stats?.completionRate?.toFixed(0) ?? 0}%</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Liste de documents en attente */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <RefreshCw className="h-5 w-5 mb-2 animate-spin" />
          <span>Chargement des signatures…</span>
        </div>
      ) : isError ? (
        <ErrorState
          error={error as Error}
          variant={getErrorVariant(error as Error)}
          onRetry={() => refetch()}
        />
      ) : pendingDocuments.length === 0 ? (
        <Card>
          <CardContent className="pt-10 pb-10">
            <EmptyState
              icon={FileSignature}
              title="Aucun document en attente"
              description="Les documents nécessitant une signature apparaîtront ici."
              action={{
                label: 'Initier une signature',
                onClick: handleOpenInitiate,
                icon: Plus,
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingDocuments.map(doc => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">{doc.name}</CardTitle>
                    {doc.description && (
                      <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                    )}
                  </div>
                  <Badge variant="outline">{String(doc.type)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {doc.signatureSteps && doc.signatureSteps.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Étapes de signature :
                    </p>
                    {doc.signatureSteps.map((step, index) => (
                      <div
                        key={step.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border text-xs font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {step.signerName || step.signerEmail}
                            </p>
                            <p className="text-xs text-muted-foreground">{step.signerEmail}</p>
                            {step.signerRole && (
                              <p className="text-xs text-muted-foreground italic">
                                {step.signerRole}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              SIGNATURE_STATUS_LABELS[step.status]?.variant || 'outline'
                            }
                          >
                            {SIGNATURE_STATUS_LABELS[step.status]?.label || step.status}
                          </Badge>
                          {step.status === 'EN_ATTENTE' && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAsSigned(step)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Signé
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReject(step)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rejeter
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune étape de signature.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal d'initiation de signature */}
      <Dialog
        open={initiateDialogOpen}
        onOpenChange={open => {
          if (!open) {
            handleCloseInitiate()
          } else {
            setInitiateDialogOpen(true)
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Initier un workflow de signature</DialogTitle>
            <DialogDescription>
              Sélectionnez un document et définissez les signataires.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInitiateSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Document *</label>
              <Select
                value={selectedDocumentId}
                onValueChange={value => setSelectedDocumentId(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un document" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {allDocuments.map(doc => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Signataires</label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddStep}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter un signataire
                </Button>
              </div>

              {signatureSteps.map((step, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Étape {index + 1}</span>
                    {signatureSteps.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStep(index)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Email *</label>
                      <Input
                        type="email"
                        value={step.signerEmail}
                        onChange={e => handleUpdateStep(index, 'signerEmail', e.target.value)}
                        placeholder="email@exemple.com"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Nom *</label>
                      <Input
                        value={step.signerName}
                        onChange={e => handleUpdateStep(index, 'signerName', e.target.value)}
                        placeholder="Nom complet"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Rôle</label>
                      <Input
                        value={step.signerRole || ''}
                        onChange={e => handleUpdateStep(index, 'signerRole', e.target.value)}
                        placeholder="Rôle (optionnel)"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Type de signature</label>
                      <Select
                        value={step.signatureType || 'ELECTRONIC'}
                        onValueChange={value => handleUpdateStep(index, 'signatureType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ELECTRONIC">Électronique</SelectItem>
                          <SelectItem value="ADVANCED">Avancée</SelectItem>
                          <SelectItem value="QUALIFIED">Qualifiée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseInitiate}>
                Annuler
              </Button>
              <Button type="submit" className="gap-2">
                <Mail className="h-4 w-4" />
                Initier la signature
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
