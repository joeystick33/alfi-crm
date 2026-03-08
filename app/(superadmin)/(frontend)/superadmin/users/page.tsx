'use client'

/**
 * Page SuperAdmin - Gestion des Utilisateurs
 * 
 * Liste tous les utilisateurs de la plateforme avec:
 * - Recherche et filtres
 * - Actions (désactiver, réinitialiser mot de passe, etc.)
 * - Vue par cabinet
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import {
  Users,
  Search,
  RefreshCw,
  Building2,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Key,
  Ban,
  CheckCircle,
  Clock,
  Loader2,
} from 'lucide-react'
import { useToast } from '@/app/_common/hooks/use-toast'

interface UserData {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  lastLogin: string | null
  createdAt: string
  cabinetId: string
  cabinetName: string
  cabinetPlan: string
}

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  ADMIN: { label: 'Admin', color: 'bg-violet-50 text-violet-700 border-0' },
  ADVISOR: { label: 'Conseiller', color: 'bg-blue-50 text-blue-700 border-0' },
  ASSISTANT: { label: 'Assistant', color: 'bg-emerald-50 text-emerald-700 border-0' },
  SUPPORT: { label: 'Support', color: 'bg-amber-50 text-amber-700 border-0' },
}

export default function UsersPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [users, setUsers] = useState<UserData[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [cabinetFilter, setCabinetFilter] = useState('all')
  const [cabinets, setCabinets] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    loadUsers()
    loadCabinets()
  }, [roleFilter, statusFilter, cabinetFilter])

  const loadCabinets = async () => {
    try {
      const response = await fetch('/api/superadmin/cabinets', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setCabinets(data.cabinets?.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })) || [])
      }
    } catch (error) {
      console.error('Erreur chargement cabinets:', error)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(cabinetFilter !== 'all' && { cabinetId: cabinetFilter }),
        ...(searchQuery && { search: searchQuery }),
      })
      
      const response = await fetch(`/api/superadmin/users?${params}`, {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        setTotalCount(data.totalCount || 0)
      } else {
        console.error('Erreur API utilisateurs:', response.status)
        setUsers([])
        setTotalCount(0)
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error)
      setUsers([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatLastLogin = (dateString: string | null) => {
    if (!dateString) return 'Jamais connecté'
    const date = new Date(dateString)
    const diff = Date.now() - date.getTime()
    
    if (diff < 3600000) return 'Il y a moins d\'1h'
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`
    if (diff < 604800000) return `Il y a ${Math.floor(diff / 86400000)}j`
    
    return formatDate(dateString)
  }

  // Envoyer un email à l'utilisateur
  const handleSendEmail = async (user: UserData) => {
    setActionLoading(`email-${user.id}`)
    try {
      // Ouvrir le client email par défaut
      window.location.href = `mailto:${user.email}?subject=Message depuis Aura CRM`
      toast({ title: 'Email', description: `Ouverture du client email pour ${user.email}` })
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  // Réinitialiser le mot de passe
  const handleResetPassword = async (user: UserData) => {
    setActionLoading(`reset-${user.id}`)
    try {
      const response = await fetch('/api/auth/reset-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: user.email }),
      })
      
      if (response.ok) {
        toast({ 
          title: 'Email envoyé', 
          description: `Un email de réinitialisation a été envoyé à ${user.email}` 
        })
      } else {
        throw new Error('Erreur')
      }
    } catch {
      toast({ 
        title: 'Erreur', 
        description: 'Impossible d\'envoyer l\'email de réinitialisation', 
        variant: 'destructive' 
      })
    } finally {
      setActionLoading(null)
    }
  }

  // Activer/Désactiver l'utilisateur
  const handleToggleActive = async (user: UserData) => {
    setActionLoading(`toggle-${user.id}`)
    try {
      const response = await fetch(`/api/superadmin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !user.isActive }),
      })
      
      if (response.ok) {
        setUsers(prev => prev.map(u => 
          u.id === user.id ? { ...u, isActive: !u.isActive } : u
        ))
        toast({ 
          title: user.isActive ? 'Utilisateur désactivé' : 'Utilisateur activé', 
          description: `${user.firstName} ${user.lastName} a été ${user.isActive ? 'désactivé' : 'activé'}` 
        })
      } else {
        throw new Error('Erreur')
      }
    } catch {
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de modifier le statut de l\'utilisateur', 
        variant: 'destructive' 
      })
    } finally {
      setActionLoading(null)
    }
  }

  // Stats
  const activeUsers = users.filter(u => u.isActive).length
  const adminCount = users.filter(u => u.role === 'ADMIN').length
  const advisorCount = users.filter(u => u.role === 'ADVISOR').length
  const recentLogins = users.filter(u => u.lastLogin && Date.now() - new Date(u.lastLogin).getTime() < 86400000).length

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
          <p className="text-gray-500 mt-1">{totalCount} utilisateurs sur la plateforme</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/superadmin/users/superadmins" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl border border-gray-200 transition-all">
            <Shield className="h-4 w-4 text-violet-600" />
            SuperAdmins
          </Link>
          <button onClick={loadUsers} disabled={loading} className="p-2.5 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition-all">
            <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards - Premium Design */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total affichés</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <UserCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Actifs</p>
              <p className="text-2xl font-bold text-gray-900">{activeUsers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Admins cabinet</p>
              <p className="text-2xl font-bold text-gray-900">{adminCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Connectés aujourd'hui</p>
              <p className="text-2xl font-bold text-gray-900">{recentLogins}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && loadUsers()}
                />
              </div>
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="ADVISOR">Conseiller</SelectItem>
                <SelectItem value="ASSISTANT">Assistant</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>

            <Select value={cabinetFilter} onValueChange={setCabinetFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Cabinet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les cabinets</SelectItem>
                {cabinets.map(cab => (
                  <SelectItem key={cab.id} value={cab.id}>{cab.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium">Utilisateur</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Cabinet</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Rôle</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Statut</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Dernière connexion</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-medium text-gray-600">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{user.cabinetName}</p>
                        <Badge variant="outline" className="text-xs">{user.cabinetPlan}</Badge>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={ROLE_CONFIG[user.role]?.color || 'bg-gray-100 text-gray-700'}>
                      {ROLE_CONFIG[user.role]?.label || user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {user.isActive ? (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Actif
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700">
                        <UserX className="h-3 w-3 mr-1" />
                        Inactif
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      {formatLastLogin(user.lastLogin)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Envoyer email"
                        onClick={() => handleSendEmail(user)}
                        disabled={actionLoading === `email-${user.id}`}
                      >
                        {actionLoading === `email-${user.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Réinitialiser MDP"
                        onClick={() => handleResetPassword(user)}
                        disabled={actionLoading === `reset-${user.id}`}
                      >
                        {actionLoading === `reset-${user.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title={user.isActive ? 'Désactiver' : 'Activer'}
                        onClick={() => handleToggleActive(user)}
                        disabled={actionLoading === `toggle-${user.id}`}
                      >
                        {actionLoading === `toggle-${user.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className={`h-4 w-4 ${user.isActive ? 'text-gray-400' : 'text-red-500'}`} />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
