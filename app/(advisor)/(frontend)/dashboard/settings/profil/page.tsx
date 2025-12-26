 
"use client"

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { 
  useProfile, 
  useUpdateProfile, 
  useUploadAvatar,
  useDeleteAvatar,
} from '@/app/_common/hooks/api/use-profile-api'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Badge } from '@/app/_common/components/ui/Badge'
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
  User, 
  Mail, 
  Building2, 
  Save,
  Camera,
  Loader2,
  AlertTriangle,
  Calendar,
  Trash2,
  Upload,
  X,
  Crown,
  UserCog,
  ArrowLeft,
  RefreshCw,
  Image,
} from 'lucide-react'
import { getPlanLabel } from '@/app/_common/lib/utils/plan-definitions'

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'ADMIN': return 'Administrateur'
    case 'ADVISOR': return 'Conseiller'
    case 'ASSISTANT': return 'Assistant'
    default: return role
  }
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'ADMIN': return Crown
    case 'ADVISOR': return UserCog
    default: return User
  }
}

const formatDateShort = (dateStr: string | null) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function ProfilPage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // API hooks
  const { data: profile, isLoading, error, refetch } = useProfile()
  const updateProfile = useUpdateProfile()
  const uploadAvatar = useUploadAvatar()
  const deleteAvatar = useDeleteAvatar()
  
  // UI States
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [showDeleteAvatarModal, setShowDeleteAvatarModal] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  
  // Form states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')

  // Initialisation des formulaires
  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '')
      setLastName(profile.lastName || '')
      setPhone(profile.phone || '')
    }
  }, [profile])

  // Détecter les changements
  useEffect(() => {
    if (profile) {
      const changed = 
        firstName !== (profile.firstName || '') ||
        lastName !== (profile.lastName || '') ||
        phone !== (profile.phone || '')
      setHasChanges(changed)
    }
  }, [firstName, lastName, phone, profile])

  // Computed values
  const userFullName = profile ? `${profile.firstName} ${profile.lastName}` : ''
  const userInitials = profile ? `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase() : 'U'
  const userRole = getRoleLabel(profile?.role || '')
  const cabinetName = profile?.cabinet?.name || ''

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({ title: 'Erreur', description: 'Le prénom et le nom sont obligatoires', variant: 'destructive' })
      return
    }

    try {
      await updateProfile.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      })
      toast({ title: 'Profil mis à jour', description: 'Vos informations ont été enregistrées avec succès' })
      setHasChanges(false)
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message || 'Impossible de mettre à jour le profil', variant: 'destructive' })
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast({ title: 'Erreur', description: 'Format non accepté. Utilisez JPEG, PNG, WebP ou GIF.', variant: 'destructive' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Erreur', description: 'Fichier trop volumineux. Maximum 5 MB.', variant: 'destructive' })
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    setShowAvatarModal(true)
  }

  const handleUploadAvatar = async () => {
    if (!selectedFile) return

    try {
      await uploadAvatar.mutateAsync(selectedFile)
      toast({ title: 'Photo mise à jour', description: 'Votre photo de profil a été enregistrée' })
      setShowAvatarModal(false)
      setSelectedFile(null)
      setAvatarPreview(null)
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message || 'Impossible d\'uploader la photo', variant: 'destructive' })
    }
  }

  const handleDeleteAvatar = async () => {
    try {
      await deleteAvatar.mutateAsync()
      toast({ title: 'Photo supprimée', description: 'Votre photo de profil a été supprimée' })
      setShowDeleteAvatarModal(false)
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message || 'Impossible de supprimer la photo', variant: 'destructive' })
    }
  }

  const handleResetForm = () => {
    if (profile) {
      setFirstName(profile.firstName || '')
      setLastName(profile.lastName || '')
      setPhone(profile.phone || '')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900">Erreur de chargement</h2>
        <p className="text-sm text-gray-500 mt-1">Impossible de charger votre profil</p>
        <Button onClick={() => refetch()} variant="outline" className="mt-4 gap-2">
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
      />

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
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mon profil</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gérez vos informations personnelles</p>
          </div>
        </div>
        <Button
          onClick={handleSaveProfile}
          disabled={updateProfile.isPending || !hasChanges}
          className="gap-2"
        >
          {updateProfile.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Enregistrer
        </Button>
      </div>

      {/* Profile Card with Avatar */}
      <Card className="overflow-hidden">
        <div className="relative h-28 bg-gradient-to-r from-indigo-500 to-indigo-600">
          <div className="absolute -bottom-10 left-6">
            <div className="relative group">
              <div className="h-20 w-20 rounded-2xl bg-white p-1 shadow-xl">
                {profile.avatar ? (
                  <img 
                    src={profile.avatar} 
                    alt={userFullName}
                    className="h-full w-full rounded-xl object-cover"
                  />
                ) : (
                  <div className="h-full w-full rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{userInitials}</span>
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
                title="Modifier la photo"
              >
                <Camera className="h-3.5 w-3.5 text-gray-600" />
              </button>
              {profile.avatar && (
                <button 
                  onClick={() => setShowDeleteAvatarModal(true)}
                  className="absolute -top-1 -right-1 p-1 bg-rose-500 rounded-full shadow-lg hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                  title="Supprimer la photo"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
        <CardContent className="pt-14 pb-5 px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{userFullName}</h2>
              <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {profile.email}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="primary" size="xs" className="gap-1">
                  {React.createElement(getRoleIcon(profile.role), { className: 'h-3 w-3' })}
                  {userRole}
                </Badge>
                <Badge variant="default" size="xs" className="gap-1">
                  <Building2 className="h-3 w-3" />
                  {cabinetName}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5 text-xs text-gray-500">
              <p className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Membre depuis {formatDateShort(profile.createdAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info Form */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-indigo-50">
              <User className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Informations personnelles</h2>
              <p className="text-xs text-gray-500">Modifiez vos informations de profil</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-medium text-gray-700">Prénom *</Label>
                <Input 
                  id="firstName"
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jean"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-medium text-gray-700">Nom *</Label>
                <Input 
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Dupont"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-gray-700">Email</Label>
              <div className="relative">
                <Input 
                  id="email"
                  value={profile.email} 
                  type="email" 
                  disabled 
                  className="bg-gray-50 pr-24" 
                />
                <Badge variant="default" size="xs" className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px]">
                  Non modifiable
                </Badge>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-medium text-gray-700">Téléphone</Label>
              <Input 
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+33 6 00 00 00 00"
                type="tel"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photo Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-violet-50">
              <Camera className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Photo de profil</h2>
              <p className="text-xs text-gray-500">Personnalisez votre avatar</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-white shadow-lg overflow-hidden border border-gray-100">
              {profile.avatar ? (
                <img 
                  src={profile.avatar} 
                  alt={userFullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{userInitials}</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {profile.avatar ? 'Modifier' : 'Ajouter'}
                </Button>
                {profile.avatar && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowDeleteAvatarModal(true)}
                    className="gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                JPG, PNG, WebP ou GIF • Maximum 5 MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cabinet Info (Read Only) */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-emerald-50">
              <Building2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Cabinet</h2>
              <p className="text-xs text-gray-500">Informations de votre cabinet (lecture seule)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Nom du cabinet</p>
              <p className="text-sm font-medium text-gray-900">{cabinetName}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Votre rôle</p>
              <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                {React.createElement(getRoleIcon(profile.role), { className: 'h-4 w-4 text-gray-500' })}
                {userRole}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Plan</p>
              <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                {getPlanLabel(profile.cabinet?.plan)}
                <Badge variant="success" size="xs">{profile.cabinet?.status || 'Actif'}</Badge>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Footer */}
      {hasChanges && (
        <div className="sticky bottom-4 p-4 bg-white rounded-xl border border-gray-200 shadow-lg flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Vous avez des modifications non enregistrées
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleResetForm}>
              Annuler
            </Button>
            <Button size="sm" onClick={handleSaveProfile} disabled={updateProfile.isPending} className="gap-1.5">
              {updateProfile.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </div>
      )}

      {/* Modal Upload Avatar */}
      <Modal open={showAvatarModal} onOpenChange={(open) => {
        setShowAvatarModal(open)
        if (!open) {
          setSelectedFile(null)
          setAvatarPreview(null)
        }
      }}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-indigo-600" />
              Nouvelle photo de profil
            </ModalTitle>
            <ModalDescription>
              Prévisualisez et confirmez votre nouvelle photo
            </ModalDescription>
          </ModalHeader>
          
          <div className="px-6 py-4">
            <div className="flex flex-col items-center">
              {avatarPreview && (
                <div className="relative">
                  <img 
                    src={avatarPreview} 
                    alt="Prévisualisation"
                    className="w-40 h-40 rounded-2xl object-cover shadow-lg"
                  />
                  <div className="absolute inset-0 rounded-2xl ring-4 ring-indigo-500/20" />
                </div>
              )}
              <p className="text-sm text-gray-500 mt-4">
                {selectedFile?.name} ({selectedFile ? (selectedFile.size / 1024).toFixed(1) : 0} KB)
              </p>
            </div>
          </div>
          
          <ModalFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowAvatarModal(false)
                setSelectedFile(null)
                setAvatarPreview(null)
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUploadAvatar}
              disabled={uploadAvatar.isPending || !selectedFile}
              className="gap-2"
            >
              {uploadAvatar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer la photo
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Supprimer Avatar */}
      <Modal open={showDeleteAvatarModal} onOpenChange={setShowDeleteAvatarModal}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Supprimer la photo
            </ModalTitle>
          </ModalHeader>
          
          <div className="px-6 py-4">
            <p className="text-sm text-gray-600">
              Êtes-vous sûr de vouloir supprimer votre photo de profil ?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Vous pourrez en ajouter une nouvelle à tout moment.
            </p>
          </div>
          
          <ModalFooter className="gap-3">
            <Button variant="outline" onClick={() => setShowDeleteAvatarModal(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAvatar}
              disabled={deleteAvatar.isPending}
              className="gap-2"
            >
              {deleteAvatar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
