"use client"

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useCabinetInfo, useUpdateCabinetUser, useDeleteCabinetUser, useCreateCabinetUser, CabinetUser } from '@/app/_common/hooks/api/use-cabinet-api'
import { useAuth } from '@/app/_common/hooks/use-auth'
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
  Users, 
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
  Search,
  UserPlus,
  RefreshCw,
  CheckCircle,
  Clock,
  ArrowLeft,
  ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/app/_common/lib/utils'

// ============================================================================
// TYPES & HELPERS
// ============================================================================

type UserRole = 'ADMIN' | 'ADVISOR' | 'ASSISTANT'

interface UserFormData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  role: UserRole
}

const getInitialFormData = (): UserFormData => ({
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  role: 'ADVISOR',
})

function RoleIcon({ role, className }: { role: string; className?: string }) {
  switch (role) {
    case 'ADMIN':
      return <Crown className={className} />
    case 'ADVISOR':
      return <UserCog className={className} />
    default:
      return <User className={className} />
  }
}

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'ADMIN': return 'Admin'
    case 'ADVISOR': return 'Conseiller'
    case 'ASSISTANT': return 'Assistant'
    default: return role
  }
}

const getRoleColorClasses = (role: string) => {
  switch (role) {
    case 'ADMIN': return { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-600' }
    case 'ADVISOR': return { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' }
    case 'ASSISTANT': return { bg: 'bg-slate-50', text: 'text-slate-700', icon: 'text-slate-600' }
    default: return { bg: 'bg-gray-50', text: 'text-gray-700', icon: 'text-gray-600' }
  }
}

const getRoleDescription = (role: string) => {
  switch (role) {
    case 'ADMIN': return 'Accès complet à toutes les fonctionnalités'
    case 'ADVISOR': return 'Gestion des clients et documents'
    case 'ASSISTANT': return 'Accès limité en lecture'
    default: return ''
  }
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'Jamais'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return "Hier"
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  })
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error) return error
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as Record<string, unknown>).message
    if (typeof message === 'string' && message) return message
  }
  return fallbackMessage
}

// ============================================================================
// USER CARD COMPONENT
// ============================================================================

interface UserCardProps {
  user: CabinetUser
  isCurrentUser: boolean
  canManageUser: boolean // Can edit/deactivate this user
  canDeleteUser: boolean // Can delete this user
  onEdit: () => void
  onToggleActive: () => void
  onDelete: () => void
  isUpdating: boolean
}

function UserCard({ user, isCurrentUser, canManageUser, canDeleteUser, onEdit, onToggleActive, onDelete, isUpdating }: UserCardProps) {
  const roleColors = getRoleColorClasses(user.role)
  
  return (
    <div className={cn(
      "p-4 rounded-xl border transition-all duration-200",
      user.isActive 
        ? "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm" 
        : "bg-gray-50/50 border-gray-100"
    )}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          <div className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center text-white font-semibold",
            user.isActive 
              ? "bg-gradient-to-br from-indigo-500 to-indigo-600" 
              : "bg-gray-400"
          )}>
            {user.firstName?.[0]}{user.lastName?.[0]}
          </div>
          {user.isActive && (
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-white" />
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {user.firstName} {user.lastName}
            </h3>
            {isCurrentUser && (
              <Badge variant="primary" size="xs">Vous</Badge>
            )}
            {user.isPrimaryAdmin && (
              <Badge variant="success" size="xs" className="gap-0.5">
                <Crown className="h-2.5 w-2.5" />
                Principal
              </Badge>
            )}
            {!user.isActive && (
              <Badge variant="default" size="xs" className="bg-gray-100 text-gray-500">Inactif</Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
              roleColors.bg, roleColors.text
            )}>
              <RoleIcon role={user.role} className={cn("h-3 w-3", roleColors.icon)} />
              {getRoleLabel(user.role)}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(user.lastLogin)}
            </span>
          </div>
        </div>
        
        {/* Actions - only show if can manage or delete */}
        {!isCurrentUser && (canManageUser || canDeleteUser) && (
          <div className="flex items-center gap-1">
            {canManageUser && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                  title="Modifier"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleActive}
                  disabled={isUpdating}
                  className={cn(
                    "h-8 w-8 p-0",
                    user.isActive 
                      ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50" 
                      : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                  )}
                  title={user.isActive ? 'Désactiver' : 'Activer'}
                >
                  {user.isActive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                </Button>
              </>
            )}
            {canDeleteUser && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                title={user.role === 'ADMIN' ? 'Supprimer cet administrateur' : 'Supprimer'}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function UsersPage() {
  const { toast } = useToast()
  const { user: authUser } = useAuth()
  const { data: cabinet, isLoading, error, refetch } = useCabinetInfo()
  const updateUser = useUpdateCabinetUser()
  const deleteUser = useDeleteCabinetUser()
  const createUser = useCreateCabinetUser()

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState<UserFormData>(getInitialFormData())
  const [editingUser, setEditingUser] = useState<CabinetUser | null>(null)
  const [userToDelete, setUserToDelete] = useState<CabinetUser | null>(null)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [showPassword, setShowPassword] = useState(false)

  const isAdmin = authUser?.role === 'ADMIN'

  // Quotas
  const quotas = cabinet?.quotas || { maxUsers: 0, maxAdmins: 2 }
  const usage = cabinet?.usage || { users: 0 }
  const quotaReached = usage.users >= quotas.maxUsers
  const remaining = quotas.maxUsers - usage.users
  
  // Admin quota
  const maxAdmins = quotas.maxAdmins ?? 2
  const currentAdmins = cabinet?.users?.filter(u => u.role === 'ADMIN').length ?? 0
  const adminQuotaReached = currentAdmins >= maxAdmins

  // Check if current user is the primary admin
  const currentUserIsPrimaryAdmin = authUser?.id && cabinet?.users?.find(u => u.isPrimaryAdmin)?.id === authUser.id

  // Permission helpers
  const canManageUser = (targetUser: CabinetUser): boolean => {
    if (!isAdmin) return false // Only admins can manage users
    if (targetUser.id === authUser?.id) return false // Can't manage yourself via this interface
    
    // If target is the primary admin, only primary admin themselves or superadmin can manage
    if (targetUser.isPrimaryAdmin && !currentUserIsPrimaryAdmin) {
      return false // Secondary admin cannot manage primary admin
    }
    
    return true
  }

  const canDeleteUser = (targetUser: CabinetUser): boolean => {
    if (!isAdmin) return false
    if (targetUser.id === authUser?.id) return false // Can't delete yourself
    
    // Primary admin cannot be deleted by anyone except SuperAdmin (handled server-side)
    if (targetUser.isPrimaryAdmin) return false
    
    return true
  }

  // Filter users
  const filteredUsers = useMemo(() => {
    const users = cabinet?.users ?? []
    if (users.length === 0) return []

    const searchLower = searchQuery.toLowerCase()
    return users.filter((user) => {
      const matchesSearch = 
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
      return matchesSearch && matchesRole
    }).sort((a, b) => {
      // Current user first, then by name
      if (a.id === authUser?.id) return -1
      if (b.id === authUser?.id) return 1
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    })
  }, [cabinet?.users, searchQuery, roleFilter, authUser?.id])

  // Stats
  const stats = useMemo(() => {
    const users = cabinet?.users ?? []
    return {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      admins: users.filter(u => u.role === 'ADMIN').length,
      advisors: users.filter(u => u.role === 'ADVISOR').length,
      assistants: users.filter(u => u.role === 'ASSISTANT').length,
    }
  }, [cabinet?.users])

  // Handlers
  const handleCreateUser = async () => {
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
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        role: formData.role,
        cabinetId: cabinet!.id,
      })
      
      toast({ title: 'Membre ajouté', description: `${formData.firstName} peut maintenant se connecter` })
      setShowCreateModal(false)
      setFormData(getInitialFormData())
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: getErrorMessage(error, "Impossible de créer l'utilisateur"),
        variant: 'destructive'
      })
    }
  }

  const handleEditUser = async () => {
    if (!editingUser) return
    
    try {
      await updateUser.mutateAsync({
        userId: editingUser.id,
        data: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          role: formData.role,
        }
      })
      
      toast({ title: 'Modifications enregistrées' })
      setShowEditModal(false)
      setEditingUser(null)
      setFormData(getInitialFormData())
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: getErrorMessage(error, 'Impossible de modifier cet utilisateur'),
        variant: 'destructive'
      })
    }
  }

  const handleToggleActive = async (user: CabinetUser) => {
    try {
      await updateUser.mutateAsync({
        userId: user.id,
        data: { isActive: !user.isActive }
      })
      toast({
        title: user.isActive ? 'Compte désactivé' : 'Compte réactivé',
        description: user.isActive ? `${user.firstName} ne peut plus se connecter` : `${user.firstName} peut se connecter`,
      })
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: getErrorMessage(error, 'Impossible de modifier le statut du compte'),
        variant: 'destructive'
      })
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    
    try {
      await deleteUser.mutateAsync(userToDelete.id)
      toast({ title: 'Utilisateur supprimé' })
      setShowDeleteModal(false)
      setUserToDelete(null)
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: getErrorMessage(error, 'Impossible de supprimer cet utilisateur'),
        variant: 'destructive'
      })
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  // Error state
  if (error || !cabinet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900">Erreur de chargement</h2>
        <p className="text-sm text-gray-500 mt-1">Impossible de charger les utilisateurs</p>
        <Button onClick={() => refetch()} variant="outline" className="mt-4 gap-2">
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
      </div>
    )
  }

  // Access denied
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Lock className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900">Accès restreint</h2>
        <p className="text-sm text-gray-500 mt-1">Seuls les administrateurs peuvent gérer l'équipe</p>
        <Link href="/dashboard/settings">
          <Button variant="outline" className="mt-4">Retour aux paramètres</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/settings"
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Équipe</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {cabinet.name} • {stats.total} membre{stats.total > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)} 
          disabled={quotaReached}
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {/* Quota Banner */}
      {quotaReached ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-100">
                <Users className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-rose-900">Quota atteint</p>
                <p className="text-xs text-rose-700">Passez à un plan supérieur pour ajouter plus de membres</p>
              </div>
            </div>
            <Link href="/dashboard/settings/abonnement">
              <Button size="sm" className="gap-1.5 bg-rose-600 hover:bg-rose-700">
                <ArrowUpRight className="h-4 w-4" />
                Upgrader
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <Users className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{usage.users}/{quotas.maxUsers}</p>
                  <p className="text-xs text-gray-500">utilisateurs</p>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span className="text-gray-600">{stats.admins} admin{stats.admins > 1 ? 's' : ''}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-gray-600">{stats.advisors} conseiller{stats.advisors > 1 ? 's' : ''}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-slate-400" />
                  <span className="text-gray-600">{stats.assistants} assistant{stats.assistants > 1 ? 's' : ''}</span>
                </span>
              </div>
            </div>
            {remaining > 0 && (
              <p className="text-xs text-gray-500">
                {remaining} place{remaining > 1 ? 's' : ''} disponible{remaining > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un membre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tous les rôles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les rôles</SelectItem>
            <SelectItem value="ADMIN">Administrateurs</SelectItem>
            <SelectItem value="ADVISOR">Conseillers</SelectItem>
            <SelectItem value="ASSISTANT">Assistants</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">Aucun membre trouvé</p>
            <p className="text-xs text-gray-400 mt-1">Modifiez vos critères de recherche</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              isCurrentUser={user.id === authUser?.id}
              canManageUser={canManageUser(user)}
              canDeleteUser={canDeleteUser(user)}
              onEdit={() => openEditModal(user)}
              onToggleActive={() => handleToggleActive(user)}
              onDelete={() => {
                setUserToDelete(user)
                setShowDeleteModal(true)
              }}
              isUpdating={updateUser.isPending}
            />
          ))
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODALS */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* Create Modal */}
      <Modal open={showCreateModal} onOpenChange={setShowCreateModal}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50">
                <UserPlus className="h-5 w-5 text-blue-600" />
              </div>
              <span>Nouveau membre</span>
            </ModalTitle>
            <ModalDescription>
              Créez un compte pour un nouveau membre de l'équipe
            </ModalDescription>
          </ModalHeader>
          
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Prénom *</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Jean"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nom *</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Dupont"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs">Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jean.dupont@cabinet.fr"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs">Rôle *</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['ADMIN', 'ADVISOR', 'ASSISTANT'] as const).map((role) => {
                  const colors = getRoleColorClasses(role)
                  const isSelected = formData.role === role
                  const isDisabled = role === 'ADMIN' && adminQuotaReached
                  
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => !isDisabled && setFormData({ ...formData, role })}
                      disabled={isDisabled}
                      className={cn(
                        "p-3 rounded-xl border-2 transition-all text-center relative",
                        isDisabled 
                          ? "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
                          : isSelected 
                            ? "border-indigo-500 bg-indigo-50" 
                            : "border-gray-100 hover:border-gray-200"
                      )}
                    >
                      <RoleIcon role={role} className={cn(
                        "h-5 w-5 mx-auto mb-1",
                        isDisabled ? "text-gray-400" : isSelected ? "text-indigo-600" : colors.icon
                      )} />
                      <p className={cn(
                        "text-xs font-medium",
                        isDisabled ? "text-gray-400" : isSelected ? "text-indigo-900" : "text-gray-700"
                      )}>
                        {getRoleLabel(role)}
                      </p>
                      {isDisabled && (
                        <span className="absolute -top-1 -right-1 text-[9px] px-1 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">
                          Max
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              {formData.role === 'ADMIN' && adminQuotaReached ? (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Quota admin atteint ({currentAdmins}/{maxAdmins})
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-2">{getRoleDescription(formData.role)}</p>
              )}
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs">Mot de passe *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 8 caractères"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs">Confirmer le mot de passe *</Label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Répétez le mot de passe"
              />
              {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Les mots de passe ne correspondent pas
                </p>
              )}
              {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 8 && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Les mots de passe correspondent
                </p>
              )}
            </div>
          </div>
          
          <ModalFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={
                createUser.isPending || 
                !formData.email || 
                !formData.password || 
                formData.password !== formData.confirmPassword || 
                formData.password.length < 8 ||
                (formData.role === 'ADMIN' && adminQuotaReached)
              }
              className="gap-2"
            >
              {createUser.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Créer le compte
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEditModal} onOpenChange={setShowEditModal}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50">
                <Edit2 className="h-5 w-5 text-blue-600" />
              </div>
              <span>Modifier le membre</span>
            </ModalTitle>
            <ModalDescription>{editingUser?.email}</ModalDescription>
          </ModalHeader>
          
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Prénom</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nom</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs">Rôle</Label>
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
              <p className="text-xs text-gray-500">{getRoleDescription(formData.role)}</p>
            </div>
          </div>
          
          <ModalFooter className="gap-2">
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

      {/* Delete Modal */}
      <Modal open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <ModalContent className="max-w-sm">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              {userToDelete?.role === 'ADMIN' ? 'Supprimer un administrateur' : 'Supprimer le membre'}
            </ModalTitle>
          </ModalHeader>
          
          <div className="px-6 py-4">
            <p className="text-sm text-gray-600">
              Supprimer <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong> ?
            </p>
            {userToDelete?.role === 'ADMIN' && (
              <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800 flex items-start gap-1.5">
                  <Crown className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  Cet utilisateur est administrateur. Il perdra tous ses droits de gestion.
                </p>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Cette action est irréversible. L'utilisateur perdra immédiatement l'accès.
            </p>
          </div>
          
          <ModalFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
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
