"use client"

import { useRef, useState } from 'react'
import { useSuperAdminProfile, useUploadSuperAdminAvatar, useDeleteSuperAdminAvatar } from '@/app/_common/hooks/api/use-superadmin-profile'
import { Avatar } from '@/app/_common/components/ui/Avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Label } from '@/app/_common/components/ui/Label'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Loader2, Upload, Trash2, User, Mail, Shield } from 'lucide-react'

export default function SuperAdminProfilePage() {
  const { data: profile, isLoading } = useSuperAdminProfile()
  const uploadAvatar = useUploadSuperAdminAvatar()
  const deleteAvatar = useDeleteSuperAdminAvatar()

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : 'SuperAdmin'

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      uploadAvatar.mutate(file)
      e.target.value = ''
    }
  }

  const handleDelete = () => {
    deleteAvatar.mutate()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mon profil SuperAdmin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            <div className="flex flex-col items-center gap-3">
              <Avatar
                size="2xl"
                variant="gradient"
                src={profile?.avatar || undefined}
                name={fullName}
                ring
                ringColor="primary"
                className="shadow"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1.5"
                  disabled={uploadAvatar.isPending}
                >
                  {uploadAvatar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {profile?.avatar ? 'Changer la photo' : 'Ajouter une photo'}
                </Button>
                {profile?.avatar && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteAvatar.isPending}
                    className="gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    {deleteAvatar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Supprimer
                  </Button>
                )}
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                ref={fileInputRef}
                onChange={onFileChange}
              />
              <p className="text-xs text-gray-500 text-center">JPEG, PNG, WebP ou GIF · 5 MB max</p>
            </div>

            <div className="flex-1 w-full space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Nom complet</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900 font-semibold">{fullName}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{profile?.email || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Rôle</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <Badge variant="primary" size="sm">{profile?.role || 'SUPER_ADMIN'}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Statut</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={profile?.isActive ? 'success' : 'destructive'} size="sm">
                      {profile?.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
