'use client'

/**
 * Page SuperAdmin - Demandes d'Inscription
 * 
 * Gestion des demandes d'inscription de nouveaux cabinets:
 * - Liste des demandes en attente
 * - Validation/Rejet des demandes
 * - Historique des demandes traitées
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { Textarea } from '@/app/_common/components/ui/Textarea'
import { useToast } from '@/app/_common/hooks/use-toast'
import {
  Bell,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Mail,
  User,
  Calendar,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react'

interface RegistrationRequest {
  id: string
  status: 'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE'
  createdAt: string
  processedAt?: string
  processedBy?: string
  rejectionReason?: string
  
  // Informations cabinet
  cabinetName: string
  cabinetEmail: string
  cabinetPhone?: string
  cabinetAddress?: {
    street?: string
    city?: string
    postalCode?: string
    country?: string
  }
  website?: string
  siret?: string
  
  // Informations admin
  adminFirstName: string
  adminLastName: string
  adminEmail: string
  adminPhone?: string
  
  // Informations complémentaires
  planRequested: string
  expectedUsers: number
  expectedClients: number
  message?: string
  source?: string
}

const STATUS_CONFIG = {
  PENDING: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'En attente' },
  APPROVED: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Approuvée' },
  REJECTED: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Rejetée' },
}

const PLAN_COLORS: Record<string, string> = {
  TRIAL: 'bg-gray-100 text-gray-700',
  STARTER: 'bg-blue-100 text-blue-700',
  BUSINESS: 'bg-green-100 text-green-700',
  PREMIUM: 'bg-purple-100 text-purple-700',
  ENTERPRISE: 'bg-orange-100 text-orange-700',
}

export default function RegistrationRequestsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<RegistrationRequest[]>([])
  const [activeTab, setActiveTab] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/superadmin/registration-requests', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
      } else {
        setRequests(generateDemoRequests())
      }
    } catch {
      setRequests(generateDemoRequests())
    } finally {
      setLoading(false)
    }
  }

  const generateDemoRequests = (): RegistrationRequest[] => [
    {
      id: '1',
      status: 'EN_ATTENTE',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      cabinetName: 'Cabinet Conseil Finance',
      cabinetEmail: 'contact@conseil-finance.fr',
      cabinetPhone: '+33 1 23 45 67 89',
      cabinetAddress: { street: '15 Rue de la Bourse', city: 'Paris', postalCode: '75002', country: 'France' },
      siret: '12345678901234',
      adminFirstName: 'Jean',
      adminLastName: 'Martin',
      adminEmail: 'jmartin@conseil-finance.fr',
      adminPhone: '+33 6 12 34 56 78',
      planRequested: 'BUSINESS',
      expectedUsers: 8,
      expectedClients: 500,
      message: 'Nous sommes un cabinet de conseil en gestion de patrimoine avec 10 ans d\'expérience. Nous cherchons à digitaliser notre activité.',
      source: 'Google',
    },
    {
      id: '2',
      status: 'EN_ATTENTE',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      cabinetName: 'Patrimoine & Avenir',
      cabinetEmail: 'info@patrimoine-avenir.com',
      cabinetPhone: '+33 4 56 78 90 12',
      cabinetAddress: { city: 'Lyon', postalCode: '69001' },
      adminFirstName: 'Marie',
      adminLastName: 'Dupont',
      adminEmail: 'mdupont@patrimoine-avenir.com',
      planRequested: 'PREMIUM',
      expectedUsers: 25,
      expectedClients: 2000,
      source: 'Recommandation',
    },
    {
      id: '3',
      status: 'APPROUVEE',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      processedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      processedBy: 'Admin Principal',
      cabinetName: 'Finance Solutions SARL',
      cabinetEmail: 'contact@finance-solutions.fr',
      adminFirstName: 'Pierre',
      adminLastName: 'Bernard',
      adminEmail: 'pbernard@finance-solutions.fr',
      planRequested: 'STARTER',
      expectedUsers: 3,
      expectedClients: 100,
    },
    {
      id: '4',
      status: 'REJETEE',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      processedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      processedBy: 'Admin Principal',
      rejectionReason: 'Informations incomplètes. Veuillez fournir un numéro SIRET valide.',
      cabinetName: 'Test Cabinet',
      cabinetEmail: 'test@test.com',
      adminFirstName: 'Test',
      adminLastName: 'User',
      adminEmail: 'test@test.com',
      planRequested: 'TRIAL',
      expectedUsers: 1,
      expectedClients: 10,
    },
  ]

  const approveRequest = async (requestId: string) => {
    setProcessing(true)
    try {
      const response = await fetch(`/api/superadmin/registration-requests/${requestId}/approve`, {
        method: 'POST',
        credentials: 'include',
      })
      
      if (response.ok) {
        toast({ title: 'Demande approuvée', description: 'Le cabinet a été créé et un email a été envoyé.' })
        setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'APPROUVEE' as const, processedAt: new Date().toISOString() } : r))
        setSelectedRequest(null)
      } else {
        throw new Error('Erreur approbation')
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible d\'approuver la demande', variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  const rejectRequest = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      toast({ title: 'Erreur', description: 'Veuillez indiquer un motif de rejet', variant: 'destructive' })
      return
    }
    
    setProcessing(true)
    try {
      const response = await fetch(`/api/superadmin/registration-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: rejectionReason }),
      })
      
      if (response.ok) {
        toast({ title: 'Demande rejetée', description: 'Un email de notification a été envoyé.' })
        setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'REJETEE' as const, processedAt: new Date().toISOString(), rejectionReason } : r))
        setSelectedRequest(null)
        setShowRejectModal(false)
        setRejectionReason('')
      } else {
        throw new Error('Erreur rejet')
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de rejeter la demande', variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const filteredRequests = requests.filter(r => {
    if (activeTab === 'pending' && r.status !== 'EN_ATTENTE') return false
    if (activeTab === 'processed' && r.status === 'EN_ATTENTE') return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return r.cabinetName.toLowerCase().includes(q) || 
             r.adminEmail.toLowerCase().includes(q) ||
             r.cabinetEmail.toLowerCase().includes(q)
    }
    return true
  })

  const pendingCount = requests.filter(r => r.status === 'EN_ATTENTE').length

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Demandes d'Inscription</h1>
            {pendingCount > 0 && (
              <Badge className="bg-amber-100 text-amber-700 text-lg px-3">{pendingCount} en attente</Badge>
            )}
          </div>
          <p className="text-gray-500 mt-1">Validez les nouvelles inscriptions de cabinets</p>
        </div>
        <Button variant="outline" onClick={loadRequests}><RefreshCw className="h-4 w-4 mr-2" />Actualiser</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg"><Clock className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold">{requests.filter(r => r.status === 'EN_ATTENTE').length}</p><p className="text-xs text-gray-500">En attente</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{requests.filter(r => r.status === 'APPROUVEE').length}</p><p className="text-xs text-gray-500">Approuvées</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg"><XCircle className="h-5 w-5 text-red-600" /></div>
            <div><p className="text-2xl font-bold">{requests.filter(r => r.status === 'REJETEE').length}</p><p className="text-xs text-gray-500">Rejetées</p></div>
          </div>
        </Card>
      </div>

      {/* Tabs & Search */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">En attente ({requests.filter(r => r.status === 'EN_ATTENTE').length})</TabsTrigger>
            <TabsTrigger value="processed">Traitées</TabsTrigger>
            <TabsTrigger value="all">Toutes</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Rechercher..." value={searchQuery} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
      </div>

      {/* Liste des demandes */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune demande {activeTab === 'pending' ? 'en attente' : ''}</p>
          </Card>
        ) : (
          filteredRequests.map(request => {
            const statusConfig = STATUS_CONFIG[request.status]
            const StatusIcon = statusConfig.icon
            
            return (
              <Card key={request.id} className={`cursor-pointer hover:shadow-md transition-shadow ${selectedRequest?.id === request.id ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setSelectedRequest(request)}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{request.cabinetName}</h3>
                          <Badge className={PLAN_COLORS[request.planRequested]}>{request.planRequested}</Badge>
                          <Badge className={statusConfig.color}><StatusIcon className="h-3 w-3 mr-1" />{statusConfig.label}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1"><User className="h-3 w-3" />{request.adminFirstName} {request.adminLastName}</span>
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{request.cabinetEmail}</span>
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(request.createdAt)}</span>
                        </div>
                        {request.message && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-1"><MessageSquare className="h-3 w-3 inline mr-1" />{request.message}</p>
                        )}
                      </div>
                    </div>
                    
                    {request.status === 'EN_ATTENTE' && (
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        <Button size="sm" onClick={() => approveRequest(request.id)} disabled={processing}>
                          <CheckCircle className="h-4 w-4 mr-1" />Approuver
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedRequest(request); setShowRejectModal(true) }}>
                          <XCircle className="h-4 w-4 mr-1" />Rejeter
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Modal Détail */}
      {selectedRequest && !showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />{selectedRequest.cabinetName}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(null)}>✕</Button>
              </div>
              <CardDescription>Demande reçue le {formatDate(selectedRequest.createdAt)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Infos Cabinet */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2"><Building2 className="h-4 w-4" />Informations Cabinet</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><Label className="text-gray-500">Email</Label><p>{selectedRequest.cabinetEmail}</p></div>
                  {selectedRequest.cabinetPhone && <div><Label className="text-gray-500">Téléphone</Label><p>{selectedRequest.cabinetPhone}</p></div>}
                  {selectedRequest.siret && <div><Label className="text-gray-500">SIRET</Label><p>{selectedRequest.siret}</p></div>}
                  {selectedRequest.website && <div><Label className="text-gray-500">Site web</Label><p>{selectedRequest.website}</p></div>}
                  {selectedRequest.cabinetAddress && (
                    <div className="col-span-2"><Label className="text-gray-500">Adresse</Label>
                      <p>{selectedRequest.cabinetAddress.street}, {selectedRequest.cabinetAddress.postalCode} {selectedRequest.cabinetAddress.city}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Infos Admin */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2"><User className="h-4 w-4" />Administrateur</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><Label className="text-gray-500">Nom</Label><p>{selectedRequest.adminFirstName} {selectedRequest.adminLastName}</p></div>
                  <div><Label className="text-gray-500">Email</Label><p>{selectedRequest.adminEmail}</p></div>
                  {selectedRequest.adminPhone && <div><Label className="text-gray-500">Téléphone</Label><p>{selectedRequest.adminPhone}</p></div>}
                </div>
              </div>
              
              {/* Plan demandé */}
              <div>
                <h4 className="font-medium mb-3">Plan demandé</h4>
                <div className="flex items-center gap-4">
                  <Badge className={`${PLAN_COLORS[selectedRequest.planRequested]} text-lg px-4 py-1`}>{selectedRequest.planRequested}</Badge>
                  <span className="text-sm text-gray-500">{selectedRequest.expectedUsers} utilisateurs prévus • {selectedRequest.expectedClients} clients prévus</span>
                </div>
              </div>
              
              {/* Message */}
              {selectedRequest.message && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2"><MessageSquare className="h-4 w-4" />Message</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">{selectedRequest.message}</p>
                </div>
              )}
              
              {/* Statut traitement */}
              {selectedRequest.status !== 'EN_ATTENTE' && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={STATUS_CONFIG[selectedRequest.status].color}>{STATUS_CONFIG[selectedRequest.status].label}</Badge>
                    <span className="text-sm text-gray-500">par {selectedRequest.processedBy} le {formatDate(selectedRequest.processedAt!)}</span>
                  </div>
                  {selectedRequest.rejectionReason && (
                    <p className="text-sm text-red-600"><AlertTriangle className="h-4 w-4 inline mr-1" />{selectedRequest.rejectionReason}</p>
                  )}
                </div>
              )}
              
              {/* Actions */}
              {selectedRequest.status === 'EN_ATTENTE' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button className="flex-1" onClick={() => approveRequest(selectedRequest.id)} disabled={processing}>
                    <CheckCircle className="h-4 w-4 mr-2" />Approuver et créer le cabinet
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setShowRejectModal(true)}>
                    <XCircle className="h-4 w-4 mr-2" />Rejeter
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Rejet */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2"><XCircle className="h-5 w-5" />Rejeter la demande</CardTitle>
              <CardDescription>Demande de {selectedRequest.cabinetName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Motif du rejet *</Label>
                <Textarea
                  placeholder="Expliquez pourquoi cette demande est rejetée..."
                  value={rejectionReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
                  className="mt-2"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">Ce message sera envoyé au demandeur par email.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => { setShowRejectModal(false); setRejectionReason('') }}>Annuler</Button>
                <Button variant="destructive" className="flex-1" onClick={() => rejectRequest(selectedRequest.id)} disabled={processing || !rejectionReason.trim()}>
                  <XCircle className="h-4 w-4 mr-2" />Confirmer le rejet
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
