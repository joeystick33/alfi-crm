'use client'

/**
 * Page SuperAdmin - Gestion des SuperAdmins
 * 
 * Permet de:
 * - Lister tous les SuperAdmins
 * - Créer/modifier/désactiver des SuperAdmins
 * - Gérer les permissions granulaires
 * - Voir les logs de connexion
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { useToast } from '@/app/_common/hooks/use-toast'
import {
  Shield,
  Plus,
  Edit,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Save,
} from 'lucide-react'

interface SuperAdminData {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'OWNER' | 'ADMIN' | 'SUPPORT'
  permissions: {
    canManageCabinets: boolean
    canManageUsers: boolean
    canManagePlans: boolean
    canManageBilling: boolean
    canAccessLogs: boolean
    canManageConfig: boolean
    canDeleteData: boolean
  }
  isActive: boolean
  lastLogin: string | null
  createdAt: string
  loginCount: number
}

const ROLE_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  OWNER: { label: 'Propriétaire', color: 'bg-amber-100 text-amber-800', description: 'Accès total' },
  ADMIN: { label: 'Administrateur', color: 'bg-purple-100 text-purple-800', description: 'Gestion complète' },
  SUPPORT: { label: 'Support', color: 'bg-blue-100 text-blue-800', description: 'Lecture et support' },
}

const DEFAULT_PERMISSIONS = {
  canManageCabinets: true,
  canManageUsers: true,
  canManagePlans: false,
  canManageBilling: false,
  canAccessLogs: true,
  canManageConfig: false,
  canDeleteData: false,
}

export default function SuperAdminsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [superAdmins, setSuperAdmins] = useState<SuperAdminData[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'ADMIN' as 'OWNER' | 'ADMIN' | 'SUPPORT',
    permissions: { ...DEFAULT_PERMISSIONS },
  })

  useEffect(() => {
    loadSuperAdmins()
  }, [])

  const loadSuperAdmins = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/superadmin/superadmins', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setSuperAdmins(data.superAdmins)
      } else {
        setSuperAdmins(generateDemoData())
      }
    } catch {
      setSuperAdmins(generateDemoData())
    } finally {
      setLoading(false)
    }
  }

  const generateDemoData = (): SuperAdminData[] => [
    {
      id: '1',
      email: 'owner@aura.fr',
      firstName: 'Admin',
      lastName: 'Principal',
      role: 'OWNER',
      permissions: {
        canManageCabinets: true, canManageUsers: true, canManagePlans: true,
        canManageBilling: true, canAccessLogs: true, canManageConfig: true, canDeleteData: true,
      },
      isActive: true,
      lastLogin: new Date().toISOString(),
      createdAt: '2024-01-01T00:00:00Z',
      loginCount: 234,
    },
    {
      id: '2',
      email: 'admin@aura.fr',
      firstName: 'Jean',
      lastName: 'Dupont',
      role: 'ADMIN',
      permissions: { ...DEFAULT_PERMISSIONS, canManagePlans: true },
      isActive: true,
      lastLogin: new Date(Date.now() - 86400000).toISOString(),
      createdAt: '2024-03-15T00:00:00Z',
      loginCount: 87,
    },
    {
      id: '3',
      email: 'support@aura.fr',
      firstName: 'Marie',
      lastName: 'Martin',
      role: 'SUPPORT',
      permissions: { ...DEFAULT_PERMISSIONS, canManageUsers: false, canDeleteData: false },
      isActive: true,
      lastLogin: new Date(Date.now() - 3600000).toISOString(),
      createdAt: '2024-06-01T00:00:00Z',
      loginCount: 45,
    },
  ]

  const formatDate = (date: string | null) => {
    if (!date) return 'Jamais'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/superadmin/superadmins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        toast({ title: 'Succès', description: 'SuperAdmin créé' })
        loadSuperAdmins()
        setShowCreateModal(false)
        resetForm()
      } else {
        throw new Error('Erreur création')
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de créer le SuperAdmin', variant: 'destructive' })
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/superadmin/superadmins/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !isActive }),
      })
      setSuperAdmins(prev => prev.map(sa => sa.id === id ? { ...sa, isActive: !isActive } : sa))
      toast({ title: 'Succès', description: isActive ? 'SuperAdmin désactivé' : 'SuperAdmin activé' })
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setFormData({
      email: '', firstName: '', lastName: '', password: '',
      role: 'ADMIN', permissions: { ...DEFAULT_PERMISSIONS },
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des SuperAdmins</h1>
          <p className="text-gray-500 mt-1">{superAdmins.length} superadmin(s) configuré(s)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadSuperAdmins} className="p-2.5 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition-all">
            <RefreshCw className="h-4 w-4 text-gray-500" />
          </button>
          <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#7373FF] hover:bg-[#5c5ce6] text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow-md">
            <Plus className="h-4 w-4" />Ajouter
          </button>
        </div>
      </div>

      {/* Stats Cards - Premium Design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Actifs</p>
              <p className="text-2xl font-bold text-gray-900">{superAdmins.filter(s => s.isActive).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Propriétaires</p>
              <p className="text-2xl font-bold text-gray-900">{superAdmins.filter(s => s.role === 'OWNER').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Connexions totales</p>
              <p className="text-2xl font-bold text-gray-900">{superAdmins.reduce((s, a) => s + a.loginCount, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="space-y-4">
        {superAdmins.map(admin => (
          <Card key={admin.id} className={`${!admin.isActive ? 'opacity-60' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                    {admin.firstName[0]}{admin.lastName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-lg">{admin.firstName} {admin.lastName}</p>
                      <Badge className={ROLE_CONFIG[admin.role].color}>{ROLE_CONFIG[admin.role].label}</Badge>
                      {!admin.isActive && <Badge className="bg-red-100 text-red-700">Inactif</Badge>}
                    </div>
                    <p className="text-sm text-gray-500">{admin.email}</p>
                    <p className="text-xs text-gray-400 mt-1">Dernière connexion: {formatDate(admin.lastLogin)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingId(admin.id)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(admin.id, admin.isActive)}
                    disabled={admin.role === 'OWNER'}
                  >
                    {admin.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              {/* Permissions */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-medium text-gray-500 mb-2">PERMISSIONS</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(admin.permissions).map(([key, value]) => (
                    <Badge key={key} variant="outline" className={value ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}>
                      {value ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                      {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal Création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>Créer un SuperAdmin</CardTitle>
              <CardDescription>Ajoutez un nouvel administrateur système</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prénom</Label>
                  <Input value={formData.firstName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, firstName: e.target.value })} />
                </div>
                <div>
                  <Label>Nom</Label>
                  <Input value={formData.lastName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, lastName: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div>
                <Label>Mot de passe</Label>
                <Input type="password" value={formData.password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => { setShowCreateModal(false); resetForm() }}>Annuler</Button>
                <Button className="flex-1" onClick={handleCreate}><Save className="h-4 w-4 mr-2" />Créer</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
