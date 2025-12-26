"use client"
 

import { useState, useMemo } from 'react'
import { useCabinetInfo, useUpdateCabinetUser, useDeleteCabinetUser, useCreateCabinetUser, CabinetUser } from '@/app/_common/hooks/api/use-cabinet-api'
import { useAuth } from '@/app/_common/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_common/components/ui/Select'
import { 
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  ModalDescription,
} from '@/app/_common/components/ui/Modal'
import { useToast } from '@/app/_common/hooks/use-toast'
import { 
  Key, 
  Users, 
  Shield, 
  UserCog,
  Trash2,
  Edit2,
  AlertTriangle,
  Loader2,
  Lock,
  Unlock,
  Crown,
  User,
  Eye,
  EyeOff,
  Mail,
  Search,
  Settings,
  UserPlus,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import { cn } from '@/app/_common/lib/utils'

// ============================================================================
// TYPES ET CONSTANTES
// ============================================================================

interface Permission {
  id: string
  label: string
  description: string
  category: 'users' | 'clients' | 'documents' | 'reports' | 'settings' | 'billing'
}

// Permissions disponibles avec catégories
const PERMISSIONS: Permission[] = [
  { id: 'canManageUsers', label: 'Gérer les utilisateurs', description: 'Créer, modifier et supprimer des utilisateurs', category: 'users' },
  { id: 'canViewUsers', label: 'Voir les utilisateurs', description: 'Consulter la liste des utilisateurs', category: 'users' },
  { id: 'canManageClients', label: 'Gérer les clients', description: 'Créer, modifier et archiver les fiches clients', category: 'clients' },
  { id: 'canViewClients', label: 'Voir les clients', description: 'Consulter les fiches clients (lecture seule)', category: 'clients' },
  { id: 'canManageDocuments', label: 'Gérer les documents', description: 'Upload, modification et suppression de documents', category: 'documents' },
  { id: 'canViewDocuments', label: 'Voir les documents', description: 'Consulter et télécharger les documents', category: 'documents' },
  { id: 'canViewReports', label: 'Voir les rapports', description: 'Accès aux statistiques et rapports', category: 'reports' },
  { id: 'canExportData', label: 'Exporter les données', description: 'Exporter les données clients et documents', category: 'reports' },
  { id: 'canManageSettings', label: 'Paramètres cabinet', description: 'Modifier les paramètres du cabinet', category: 'settings' },
  { id: 'canManageBilling', label: 'Facturation', description: 'Accès à la facturation et aux factures', category: 'billing' },
]

// Permissions par défaut par rôle
const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ['canManageUsers', 'canViewUsers', 'canManageClients', 'canViewClients', 'canManageDocuments', 'canViewDocuments', 'canViewReports', 'canExportData', 'canManageSettings', 'canManageBilling'],
  ADVISOR: ['canViewUsers', 'canManageClients', 'canViewClients', 'canManageDocuments', 'canViewDocuments', 'canViewReports', 'canExportData'],
  ASSISTANT: ['canViewClients', 'canManageDocuments', 'canViewDocuments'],
}

// Catégories de permissions pour l'affichage groupé
const PERMISSION_CATEGORIES = [
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'clients', label: 'Clients', icon: UserCog },
  { id: 'documents', label: 'Documents', icon: Shield },
  { id: 'reports', label: 'Rapports', icon: Eye },
  { id: 'settings', label: 'Paramètres', icon: Settings },
  { id: 'billing', label: 'Facturation', icon: Key },
]

type UserRole = 'ADMIN' | 'ADVISOR' | 'ASSISTANT'

interface UserFormData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  phone: string
  role: UserRole
  permissions: string[]
}

// ============================================================================
// COMPOSANT INITIAL FORM (valeurs par défaut)
// ============================================================================

const getInitialFormData = (): UserFormData => ({
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  phone: '',
  role: 'ADVISOR',
  permissions: DEFAULT_PERMISSIONS['ADVISOR'],
})

// ============================================================================
// HELPERS
// ============================================================================

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'ADMIN': return Crown
    case 'ADVISOR': return UserCog
    default: return User
  }
}

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'ADMIN': return 'Administrateur'
    case 'ADVISOR': return 'Conseiller'
    case 'ASSISTANT': return 'Assistant'
    default: return role
  }
}

const getRoleColor = (role: string): 'primary' | 'info' | 'default' => {
  switch (role) {
    case 'ADMIN': return 'primary'
    case 'ADVISOR': return 'info'
    case 'ASSISTANT': return 'default'
    default: return 'default'
  }
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'Jamais'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function AccesPage() {
  const { toast } = useToast()
  const { user: authUser } = useAuth()
  const { data: cabinet, isLoading, error, refetch } = useCabinetInfo()
  const updateUser = useUpdateCabinetUser()
  const deleteUser = useDeleteCabinetUser()
  const createUser = useCreateCabinetUser()

  // États des modales
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  
  // États des formulaires
  const [formData, setFormData] = useState<UserFormData>(getInitialFormData())
  const [editingUser, setEditingUser] = useState<CabinetUser | null>(null)
  const [userToDelete, setUserToDelete] = useState<CabinetUser | null>(null)
  const [permissionsUser, setPermissionsUser] = useState<CabinetUser | null>(null)
  const [editPermissions, setEditPermissions] = useState<string[]>([])
  
  // Filtres et recherche
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [showPassword, setShowPassword] = useState(false)

  const isAdmin = authUser?.role === 'ADMIN'

  // Filtrage des utilisateurs
  const filteredUsers = useMemo(() => {
    if (!cabinet?.users) return []
    
    return cabinet.users.filter((user) => {
      // Recherche textuelle
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = 
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      
      // Filtre par rôle
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
      
      // Filtre par statut
      const matchesStatus = 
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIF' && user.isActive) ||
        (statusFilter === 'INACTIF' && !user.isActive)
      
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [cabinet?.users, searchQuery, roleFilter, statusFilter])

  // Statistiques
  const stats = useMemo(() => {
    if (!cabinet?.users) return { total: 0, active: 0, admins: 0, advisors: 0, assistants: 0 }
    return {
      total: cabinet.users.length,
      active: cabinet.users.filter(u => u.isActive).length,
      admins: cabinet.users.filter(u => u.role === 'ADMIN').length,
      advisors: cabinet.users.filter(u => u.role === 'ADVISOR').length,
      assistants: cabinet.users.filter(u => u.role === 'ASSISTANT').length,
    }
  }, [cabinet?.users])

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  const handleCreateUser = async () => {
    // Validation
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires', variant: 'destructive' })
      return
    }
    if (formData.password !== formData.confirmPassword) {
      toast({ title: 'Erreur', description: 'Les mots de passe ne correspondent pas', variant: 'destructive' })
      return
    }
    if (formData.password.length < 8) {
      toast({ title: 'Erreur', description: 'Le mot de passe doit contenir au moins 8 caractères', variant: 'destructive' })
      return
    }

    try {
      await createUser.mutateAsync({
        email: formData.email.toLowerCase(),
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        cabinetId: cabinet!.id,
      })
      
      toast({ title: 'Utilisateur créé', description: `${formData.firstName} ${formData.lastName} a été ajouté à l'équipe` })
      setShowCreateModal(false)
      setFormData(getInitialFormData())
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message || 'Impossible de créer l\'utilisateur', variant: 'destructive' })
    }
  }

  const handleEditUser = async () => {
    if (!editingUser) return
    
    try {
      await updateUser.mutateAsync({
        userId: editingUser.id,
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
        }
      })
      
      toast({ title: 'Utilisateur modifié', description: 'Les informations ont été mises à jour' })
      setShowEditModal(false)
      setEditingUser(null)
      setFormData(getInitialFormData())
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message || 'Impossible de modifier l\'utilisateur', variant: 'destructive' })
    }
  }

  const handleToggleActive = async (user: CabinetUser) => {
    try {
      await updateUser.mutateAsync({
        userId: user.id,
        data: { isActive: !user.isActive }
      })
      toast({
        title: user.isActive ? 'Utilisateur désactivé' : 'Utilisateur activé',
        description: user.isActive 
          ? 'L\'utilisateur ne peut plus se connecter' 
          : 'L\'utilisateur peut maintenant se connecter',
      })
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message || 'Impossible de modifier le statut', variant: 'destructive' })
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    
    try {
      await deleteUser.mutateAsync(userToDelete.id)
      toast({ title: 'Utilisateur supprimé', description: `${userToDelete.firstName} ${userToDelete.lastName} a été supprimé` })
      setShowDeleteModal(false)
      setUserToDelete(null)
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message || 'Impossible de supprimer l\'utilisateur', variant: 'destructive' })
    }
  }

  const handleSavePermissions = async () => {
    if (!permissionsUser) return
    
    try {
      await updateUser.mutateAsync({
        userId: permissionsUser.id,
        data: { 
          permissions: editPermissions.reduce((acc, perm) => ({ ...acc, [perm]: true }), {})
        }
      })
      toast({ title: 'Permissions mises à jour', description: 'Les permissions ont été modifiées' })
      setShowPermissionsModal(false)
      setPermissionsUser(null)
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message || 'Impossible de modifier les permissions', variant: 'destructive' })
    }
  }

  const openEditModal = (user: CabinetUser) => {
    setEditingUser(user)
    setFormData({
      ...getInitialFormData(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    })
    setShowEditModal(true)
  }

  const openPermissionsModal = (user: CabinetUser) => {
    setPermissionsUser(user)
    setEditPermissions(DEFAULT_PERMISSIONS[user.role] || [])
    setShowPermissionsModal(true)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LOADING & ERROR STATES
  // ══════════════════════════════════════════════════════════════════════════

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !cabinet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900">Erreur de chargement</h2>
        <p className="text-sm text-gray-500 mt-1">Impossible de charger les informations</p>
        <Button onClick={() => refetch()} variant="outline" className="mt-4 gap-2">
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDU
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Key className="h-6 w-6 text-blue-600" />
            Gestion des Accès
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez les permissions et les accès des membres de votre équipe
          </p>
        </div>
        
        {isAdmin && (
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Ajouter un membre
          </Button>
        )}
      </header>

      {/* Alerte non-admin */}
      {!isAdmin && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Accès limité</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Seuls les administrateurs peuvent modifier les accès. Contactez votre administrateur pour toute modification.
            </p>
          </div>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-600 font-medium">Actifs</p>
                <p className="text-2xl font-bold text-emerald-700">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-600 font-medium">Admins</p>
                <p className="text-2xl font-bold text-indigo-700">{stats.admins}</p>
              </div>
              <Crown className="h-8 w-8 text-indigo-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-medium">Conseillers</p>
                <p className="text-2xl font-bold text-blue-700">{stats.advisors}</p>
              </div>
              <UserCog className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 font-medium">Assistants</p>
                <p className="text-2xl font-bold text-slate-700">{stats.assistants}</p>
              </div>
              <User className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les rôles</SelectItem>
                <SelectItem value="ADMIN">Administrateur</SelectItem>
                <SelectItem value="ADVISOR">Conseiller</SelectItem>
                <SelectItem value="ASSISTANT">Assistant</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="ACTIVE">Actifs</SelectItem>
                <SelectItem value="INACTIVE">Désactivés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des utilisateurs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            Membres de l'équipe ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">Aucun utilisateur trouvé</p>
              {searchQuery && (
                <Button variant="link" onClick={() => setSearchQuery('')} className="mt-2">
                  Effacer la recherche
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredUsers.map((member) => {
                const RoleIcon = getRoleIcon(member.role)
                const isCurrentUser = member.id === authUser?.id
                const permissions = DEFAULT_PERMISSIONS[member.role] || []
                
                return (
                  <div 
                    key={member.id} 
                    className={cn(
                      'px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors',
                      !member.isActive && 'bg-gray-50/50'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'h-11 w-11 rounded-full flex items-center justify-center relative',
                        member.isActive 
                          ? 'bg-gradient-to-br from-blue-400 to-blue-600' 
                          : 'bg-gray-300'
                      )}>
                        <span className="text-sm font-semibold text-white">
                          {member.firstName?.[0]}{member.lastName?.[0]}
                        </span>
                        {!member.isActive && (
                          <div className="absolute -bottom-1 -right-1 bg-gray-500 rounded-full p-0.5">
                            <XCircle className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {member.firstName} {member.lastName}
                          </p>
                          {isCurrentUser && (
                            <Badge variant="primary" size="xs">Vous</Badge>
                          )}
                          {!member.isActive && (
                            <Badge variant="default" size="xs" className="bg-gray-100 text-gray-600">Désactivé</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          Dernière connexion: {formatDate(member.lastLogin)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block">
                        <Badge variant={getRoleColor(member.role)} size="sm" className="gap-1">
                          <RoleIcon className="h-3 w-3" />
                          {getRoleLabel(member.role)}
                        </Badge>
                        <p className="text-xs text-gray-400 mt-1">
                          {permissions.length} permission{permissions.length > 1 ? 's' : ''}
                        </p>
                      </div>
                      
                      {isAdmin && !isCurrentUser && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(member)}
                            className="text-gray-500 hover:text-gray-700"
                            title="Modifier"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPermissionsModal(member)}
                            className="text-gray-500 hover:text-gray-700"
                            title="Permissions"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(member)}
                            disabled={updateUser.isPending}
                            className={cn(
                              member.isActive ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'
                            )}
                            title={member.isActive ? 'Désactiver' : 'Activer'}
                          >
                            {member.isActive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </Button>
                          {member.role !== 'ADMIN' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUserToDelete(member)
                                setShowDeleteModal(true)
                              }}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matrice des permissions par rôle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="h-4 w-4 text-gray-400" />
            Matrice des permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Permission</th>
                  <th className="px-4 py-3 text-center font-medium text-indigo-700">
                    <div className="flex items-center justify-center gap-1">
                      <Crown className="h-4 w-4" />
                      Admin
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-blue-700">
                    <div className="flex items-center justify-center gap-1">
                      <UserCog className="h-4 w-4" />
                      Conseiller
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">
                    <div className="flex items-center justify-center gap-1">
                      <User className="h-4 w-4" />
                      Assistant
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {PERMISSIONS.map((perm) => (
                  <tr key={perm.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{perm.label}</p>
                        <p className="text-xs text-gray-500">{perm.description}</p>
                      </div>
                    </td>
                    {(['ADMIN', 'ADVISOR', 'ASSISTANT'] as const).map((role) => (
                      <td key={role} className="px-4 py-3 text-center">
                        {DEFAULT_PERMISSIONS[role].includes(perm.id) ? (
                          <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODALES */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* Modal Création */}
      <Modal open={showCreateModal} onOpenChange={setShowCreateModal}>
        <ModalContent className="max-w-lg">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Ajouter un membre
            </ModalTitle>
            <ModalDescription>
              Créez un compte pour un nouveau membre de l'équipe
            </ModalDescription>
          </ModalHeader>
          
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Jean"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Dupont"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jean.dupont@cabinet.fr"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Rôle *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(v: UserRole) => setFormData({ ...formData, role: v, permissions: DEFAULT_PERMISSIONS[v] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-indigo-600" />
                      Administrateur
                    </div>
                  </SelectItem>
                  <SelectItem value="ADVISOR">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-blue-600" />
                      Conseiller
                    </div>
                  </SelectItem>
                  <SelectItem value="ASSISTANT">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-600" />
                      Assistant
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {formData.role === 'ADMIN' && 'Accès complet à toutes les fonctionnalités'}
                {formData.role === 'ADVISOR' && 'Gestion des clients et documents'}
                {formData.role === 'ASSISTANT' && 'Accès limité aux documents'}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 8 caractères"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Répétez le mot de passe"
              />
            </div>
          </div>
          
          <ModalFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false)
                setFormData(getInitialFormData())
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={createUser.isPending}
              className="gap-2"
            >
              {createUser.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Créer le compte
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Édition */}
      <Modal open={showEditModal} onOpenChange={setShowEditModal}>
        <ModalContent className="max-w-lg">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-blue-600" />
              Modifier l'utilisateur
            </ModalTitle>
            <ModalDescription>
              {editingUser?.email}
            </ModalDescription>
          </ModalHeader>
          
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">Prénom</Label>
                <Input
                  id="editFirstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Nom</Label>
                <Input
                  id="editLastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editRole">Rôle</Label>
              <Select 
                value={formData.role} 
                onValueChange={(v: UserRole) => setFormData({ ...formData, role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrateur</SelectItem>
                  <SelectItem value="ADVISOR">Conseiller</SelectItem>
                  <SelectItem value="ASSISTANT">Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <ModalFooter className="gap-3">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditUser} disabled={updateUser.isPending} className="gap-2">
              {updateUser.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Permissions */}
      <Modal open={showPermissionsModal} onOpenChange={setShowPermissionsModal}>
        <ModalContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Permissions de {permissionsUser?.firstName} {permissionsUser?.lastName}
            </ModalTitle>
            <ModalDescription>
              Personnalisez les accès pour cet utilisateur
            </ModalDescription>
          </ModalHeader>
          
          <div className="px-6 py-4 space-y-6">
            {PERMISSION_CATEGORIES.map((cat) => {
              const CatIcon = cat.icon
              const catPermissions = PERMISSIONS.filter(p => p.category === cat.id)
              
              return (
                <div key={cat.id} className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <CatIcon className="h-4 w-4 text-gray-500" />
                    {cat.label}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {catPermissions.map((perm) => (
                      <label
                        key={perm.id}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                          editPermissions.includes(perm.id)
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={editPermissions.includes(perm.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditPermissions([...editPermissions, perm.id])
                            } else {
                              setEditPermissions(editPermissions.filter(p => p !== perm.id))
                            }
                          }}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{perm.label}</p>
                          <p className="text-xs text-gray-500">{perm.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          
          <ModalFooter className="gap-3">
            <Button variant="outline" onClick={() => setShowPermissionsModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleSavePermissions} disabled={updateUser.isPending} className="gap-2">
              {updateUser.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Suppression */}
      <Modal open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Confirmer la suppression
            </ModalTitle>
          </ModalHeader>
          
          <div className="px-6 py-4">
            <p className="text-sm text-gray-600">
              Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
              <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong> ?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Cette action est irréversible. L'utilisateur perdra immédiatement l'accès à la plateforme.
            </p>
          </div>
          
          <ModalFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setUserToDelete(null)
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleteUser.isPending}
              className="gap-2"
            >
              {deleteUser.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
