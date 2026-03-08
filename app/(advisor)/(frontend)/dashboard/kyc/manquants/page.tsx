
'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/_common/components/ui/Select'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/app/_common/components/ui/DropdownMenu'
import {
  AlertTriangle, Search, FileCheck, Clock, Mail,
  MoreVertical, Eye, CheckCircle2, XCircle
} from 'lucide-react'
import Link from 'next/link'
import { useKYCDocuments, useValidateKYCDocument, useDeleteKYCDocument, useRemindKYC } from '@/app/_common/hooks/use-api'
import type { KYCDocumentFilters, KYCDocStatus, KYCDocumentType, KYCDocumentDetail } from '@/app/_common/lib/api-types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useToast } from '@/app/_common/hooks/use-toast'

const STATUS_LABELS: Record<KYCDocStatus, string> = {
  EN_ATTENTE: 'En attente',
  VALIDE: 'Validé',
  REJETE: 'Rejeté',
  EXPIRE: 'Expiré'
}

const STATUS_COLORS: Record<KYCDocStatus, 'default' | 'secondary' | 'success' | 'destructive' | 'warning'> = {
  EN_ATTENTE: 'warning',
  VALIDE: 'success',
  REJETE: 'destructive',
  EXPIRE: 'destructive'
}

const TYPE_LABELS: Record<KYCDocumentType, string> = {
  IDENTITE: 'Pièce identité',
  JUSTIFICATIF_DOMICILE: 'Justificatif domicile',
  AVIS_IMPOSITION: 'Avis imposition',
  RIB_BANCAIRE: 'RIB',
  JUSTIFICATIF_PATRIMOINE: 'Justif. patrimoine',
  ORIGINE_FONDS: 'Origine fonds',
  AUTRE: 'Autre'
}

export default function KYCManquantsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<KYCDocumentType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<KYCDocStatus>('EN_ATTENTE')

  const filters = useMemo<KYCDocumentFilters>(() => {
    const f: KYCDocumentFilters = {
      status: statusFilter
    }
    if (typeFilter !== 'all') f.type = typeFilter
    return f
  }, [statusFilter, typeFilter])

  const { data: documentsData, isLoading } = useKYCDocuments(filters)
  const validateDocument = useValidateKYCDocument()
  const deleteDocument = useDeleteKYCDocument()
  const remindKYC = useRemindKYC()
  const { toast } = useToast()

  const documents = (documentsData?.data || []) as unknown as KYCDocumentDetail[]

  // Group documents by client
  const documentsByClient = useMemo(() => {
    const grouped = new Map<string, KYCDocumentDetail[]>()
    documents.forEach(doc => {
      const key = doc.clientId
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(doc)
    })
    return Array.from(grouped.entries()).map(([clientId, docs]) => ({
      clientId,
      documents: docs,
      client: docs[0].client
    }))
  }, [documents])

  // Filtrage local par recherche
  const filteredGroups = useMemo(() => {
    if (!search) return documentsByClient
    const searchLower = search.toLowerCase()
    return documentsByClient.filter(group => {
      const clientName = `${group.client.firstName} ${group.client.lastName}`.toLowerCase()
      return clientName.includes(searchLower) || group.client.email.toLowerCase().includes(searchLower)
    })
  }, [documentsByClient, search])

  const pendingCount = documents.filter(d => d.status === 'EN_ATTENTE').length
  const expiredCount = documents.filter(d => d.status === 'EXPIRE').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents KYC Manquants</h1>
          <p className="text-muted-foreground">Suivi et relance des pièces en attente</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <p className="text-sm text-muted-foreground">Documents en attente</p>
          </div>
          <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-red-600" />
            <p className="text-sm text-muted-foreground">Documents expirés</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-muted-foreground">Clients concernés</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{documentsByClient.length}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Documents List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </Card>
          ))
        ) : filteredGroups.length === 0 ? (
          <Card className="p-6">
            <EmptyState
              icon={FileCheck}
              title="Aucun document"
              description="Tous les documents sont à jour ou aucun ne correspond à vos critères"
            />
          </Card>
        ) : (
          filteredGroups.map((group) => (
            <Card key={group.clientId} className="p-6 border-l-4 border-l-blue-500 overflow-hidden">
              <div className="space-y-4">
                {/* Client Header */}
                <div className="flex items-start justify-between pb-4 border-b">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                      {group.client.firstName[0]}{group.client.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-1">
                        {group.client.firstName} {group.client.lastName}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{group.client.email}</span>
                        {group.client.phone && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                            <span>{group.client.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        remindKYC.mutate(group.clientId, {
                          onSuccess: () => {
                            toast({
                              title: "Relance envoyée",
                              description: `Un email a été envoyé à ${group.client.firstName} ${group.client.lastName}.`,
                              variant: "success",
                            })
                          },
                          onError: (error: any) => {
                            toast({
                              title: "Erreur",
                              description: error.message,
                              variant: "destructive",
                            })
                          }
                        })
                      }}
                      loading={remindKYC.isPending}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Relancer
                    </Button>
                    <Link href={`/dashboard/clients/${group.clientId}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir profil
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Documents Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-3 font-medium text-sm">Type document</th>
                        <th className="text-left p-3 font-medium text-sm">Statut</th>
                        <th className="text-left p-3 font-medium text-sm">Date dépôt</th>
                        <th className="text-left p-3 font-medium text-sm">Expiration</th>
                        <th className="text-left p-3 font-medium text-sm">Notes</th>
                        <th className="text-right p-3 font-medium text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.documents.map((doc) => {
                        const isExpiringSoon = doc.expiresAt &&
                          new Date(doc.expiresAt).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000 &&
                          new Date(doc.expiresAt).getTime() > Date.now()

                        return (
                          <tr key={doc.id} className="border-b last:border-0">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <FileCheck className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{TYPE_LABELS[doc.type]}</span>
                              </div>
                              {doc.fileName && (
                                <p className="text-xs text-muted-foreground mt-1">{doc.fileName}</p>
                              )}
                            </td>
                            <td className="p-3">
                              <Badge variant={STATUS_COLORS[doc.status]}>
                                {STATUS_LABELS[doc.status]}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <p className="text-sm">
                                {format(new Date(doc.createdAt), 'dd MMM yyyy', { locale: fr })}
                              </p>
                            </td>
                            <td className="p-3">
                              {doc.expiresAt ? (
                                <div>
                                  <p className="text-sm">
                                    {format(new Date(doc.expiresAt), 'dd MMM yyyy', { locale: fr })}
                                  </p>
                                  {isExpiringSoon && (
                                    <Badge variant="warning" className="mt-1">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Bientôt expiré
                                    </Badge>
                                  )}
                                  {doc.status === 'EXPIRE' && (
                                    <Badge variant="destructive" className="mt-1">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Expiré
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </td>
                            <td className="p-3">
                              {doc.notes ? (
                                <p className="text-sm text-muted-foreground truncate max-w-xs">
                                  {doc.notes}
                                </p>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Voir document
                                  </DropdownMenuItem>
                                  {doc.status === 'EN_ATTENTE' && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          if (confirm('Valider ce document ?')) {
                                            validateDocument.mutate({
                                              id: doc.id,
                                              data: { status: 'VALIDE' }
                                            })
                                          }
                                        }}
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Valider
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          const reason = prompt('Raison du rejet :')
                                          if (reason) {
                                            validateDocument.mutate({
                                              id: doc.id,
                                              data: {
                                                status: 'REJETEE',
                                                rejectionReason: reason
                                              }
                                            })
                                          }
                                        }}
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Rejeter
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  <DropdownMenuItem>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Relancer client
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      if (confirm('Supprimer ce document ?')) {
                                        deleteDocument.mutate(doc.id)
                                      }
                                    }}
                                    className="text-red-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
