'use client'

/**
 * Page SuperAdmin - Gestion des Clients (Maintenance)
 * 
 * Permet au SuperAdmin d'intervenir sur les clients de tous les cabinets:
 * - Rechercher des clients par nom, email, cabinet
 * - Voir les détails d'un client
 * - Modifier les données en cas de problème
 * - Supprimer/archiver des clients
 */

import { useState, useEffect } from 'react'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { useToast } from '@/app/_common/hooks/use-toast'
import {
  Users,
  Search,
  RefreshCw,
  Building2,
  Mail,
  Phone,
  Eye,
  Trash2,
  Archive,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  User,
  Calendar,
  MapPin,
} from 'lucide-react'

interface ClientData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  type: string
  status: string
  createdAt: string
  cabinetId: string
  cabinetName: string
  cabinetPlan: string
  city: string | null
}

interface CabinetOption {
  id: string
  name: string
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  PARTICULIER: { label: 'Particulier', color: 'bg-blue-50 text-blue-700 border-0' },
  PROFESSIONNEL: { label: 'Professionnel', color: 'bg-amber-50 text-amber-700 border-0' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PROSPECT: { label: 'Prospect', color: 'bg-gray-100 text-gray-700 border-0' },
  ACTIF: { label: 'Actif', color: 'bg-emerald-50 text-emerald-700 border-0' },
  INACTIF: { label: 'Inactif', color: 'bg-red-50 text-red-700 border-0' },
  ARCHIVE: { label: 'Archivé', color: 'bg-slate-100 text-slate-600 border-0' },
}

export default function ClientsMaintenancePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<ClientData[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(20)
  
  // Filtres
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [cabinetFilter, setCabinetFilter] = useState('all')
  const [cabinets, setCabinets] = useState<CabinetOption[]>([])

  // Modal détail
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    loadCabinets()
  }, [])

  useEffect(() => {
    loadClients()
  }, [page, typeFilter, statusFilter, cabinetFilter])

  const loadCabinets = async () => {
    try {
      const response = await fetch('/api/superadmin/cabinets', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setCabinets(data.cabinets?.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })) || [])
      }
    } catch (error) {
      console.error('Erreur chargement cabinets:', error)
    }
  }

  const loadClients = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: perPage.toString(),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(cabinetFilter !== 'all' && { cabinetId: cabinetFilter }),
        ...(searchQuery && { search: searchQuery }),
      })
      
      const response = await fetch(`/api/superadmin/clients?${params}`, { credentials: 'include' })
      
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
        setTotalCount(data.totalCount || 0)
      } else {
        console.error('Erreur API clients:', response.status)
        setClients([])
        setTotalCount(0)
      }
    } catch (error) {
      console.error('Erreur chargement clients:', error)
      setClients([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadClients()
  }

  const handleArchive = async (clientId: string) => {
    try {
      const response = await fetch(`/api/superadmin/clients/${clientId}/archive`, {
        method: 'POST',
        credentials: 'include',
      })
      
      if (response.ok) {
        toast({ title: 'Client archivé', description: 'Le client a été archivé avec succès' })
        loadClients()
      } else {
        const data = await response.json()
        toast({ title: 'Erreur', description: data.error || 'Impossible d\'archiver le client', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur réseau', variant: 'destructive' })
    }
  }

  const handleDelete = async (clientId: string) => {
    try {
      const response = await fetch(`/api/superadmin/clients/${clientId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      
      if (response.ok) {
        toast({ title: 'Client supprimé', description: 'Le client a été supprimé définitivement' })
        setShowDeleteConfirm(null)
        loadClients()
      } else {
        const data = await response.json()
        toast({ title: 'Erreur', description: data.error || 'Impossible de supprimer le client', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur réseau', variant: 'destructive' })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const totalPages = Math.ceil(totalCount / perPage)

  // Stats
  const particulierCount = clients.filter(c => c.type === 'PARTICULIER').length
  const professionnelCount = clients.filter(c => c.type === 'PROFESSIONNEL').length
  const activeCount = clients.filter(c => c.status === 'ACTIF').length

  if (loading && clients.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Clients (Maintenance)</h1>
          <p className="text-gray-500 mt-1">Accès SuperAdmin à tous les clients de la plateforme</p>
        </div>
        <button onClick={loadClients} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl border border-gray-200 transition-all">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Alerte maintenance */}
      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800">Mode Maintenance</p>
          <p className="text-xs text-amber-600">Les modifications ici affectent directement les données des cabinets. Utilisez avec précaution.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total affichés</p>
              <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Actifs</p>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Particuliers</p>
              <p className="text-2xl font-bold text-gray-900">{particulierCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Professionnels</p>
              <p className="text-2xl font-bold text-gray-900">{professionnelCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, email..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="PARTICULIER">Particulier</SelectItem>
                <SelectItem value="PROFESSIONNEL">Professionnel</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="PROSPECT">Prospect</SelectItem>
                <SelectItem value="ACTIF">Actif</SelectItem>
                <SelectItem value="INACTIF">Inactif</SelectItem>
                <SelectItem value="ARCHIVE">Archivé</SelectItem>
              </SelectContent>
            </Select>

            <Select value={cabinetFilter} onValueChange={(v) => { setCabinetFilter(v); setPage(1) }}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Cabinet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les cabinets</SelectItem>
                {cabinets.map(cab => (
                  <SelectItem key={cab.id} value={cab.id}>{cab.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleSearch}>Rechercher</Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium">Client</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Cabinet</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Statut</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Créé le</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-medium text-gray-600">
                        {client.firstName[0]}{client.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{client.firstName} {client.lastName}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {client.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {client.email}
                            </span>
                          )}
                        </div>
                        {client.phone && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{client.cabinetName}</p>
                        <Badge variant="outline" className="text-xs">{client.cabinetPlan}</Badge>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={TYPE_CONFIG[client.type]?.color || 'bg-gray-100 text-gray-700'}>
                      {TYPE_CONFIG[client.type]?.label || client.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={STATUS_CONFIG[client.status]?.color || 'bg-gray-100 text-gray-700'}>
                      {STATUS_CONFIG[client.status]?.label || client.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {formatDate(client.createdAt)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" title="Voir détails" onClick={() => setSelectedClient(client)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Archiver" onClick={() => handleArchive(client.id)}>
                        <Archive className="h-4 w-4 text-amber-500" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Supprimer" onClick={() => setShowDeleteConfirm(client.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <Users className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                    <p>Aucun client trouvé</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} sur {totalPages || 1} ({totalCount} résultats)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages || 1, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal détail client */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedClient(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails du client</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#7373FF]/10 flex items-center justify-center font-semibold text-[#7373FF]">
                  {selectedClient.firstName[0]}{selectedClient.lastName[0]}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedClient.firstName} {selectedClient.lastName}</p>
                  <p className="text-sm text-gray-500">{selectedClient.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                <div>
                  <p className="text-xs text-gray-500">Cabinet</p>
                  <p className="font-medium">{selectedClient.cabinetName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <Badge className={TYPE_CONFIG[selectedClient.type]?.color}>{TYPE_CONFIG[selectedClient.type]?.label}</Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Statut</p>
                  <Badge className={STATUS_CONFIG[selectedClient.status]?.color}>{STATUS_CONFIG[selectedClient.status]?.label}</Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Téléphone</p>
                  <p className="font-medium">{selectedClient.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ville</p>
                  <p className="font-medium">{selectedClient.city || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Créé le</p>
                  <p className="font-medium">{formatDate(selectedClient.createdAt)}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setSelectedClient(null)}>Fermer</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer définitivement ce client ? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>Annuler</Button>
              <Button variant="destructive" onClick={() => handleDelete(showDeleteConfirm)}>Supprimer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
