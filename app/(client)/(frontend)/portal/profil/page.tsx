 
'use client'

/**
 * Client Portal - Mon Profil
 * 
 * Page de gestion du profil client:
 * - Informations personnelles (lecture)
 * - Coordonnées (modifiables)
 * - Informations du conseiller
 * - Informations du cabinet
 * 
 * UX Pédagogique:
 * - Indications claires sur ce qui est modifiable
 * - Explication de l'importance des informations à jour
 * - Contact facile avec le conseiller
 */

import { useState, useMemo } from 'react'
import { useAuth } from '@/app/_common/hooks/use-auth'
import { useClientProfile, useUpdateClientProfile } from '@/app/_common/hooks/use-api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Edit2,
  Save,
  X,
  Info,
  Shield,
  Users,
  Heart,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'

// Demo data
const DEMO_PROFILE = {
  profile: {
    id: '1',
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@email.fr',
    phone: '01 23 45 67 89',
    mobile: '06 12 34 56 78',
    address: {
      street: '15 rue de la Paix',
      postalCode: '75001',
      city: 'Paris',
      country: 'France',
    },
    birthDate: '1975-06-15',
    maritalStatus: 'MARIE',
    numberOfChildren: 2,
    profession: 'Directeur commercial',
    clientType: 'PARTICULIER',
    status: 'ACTIF',
    portalAccess: true,
    lastPortalLogin: '2024-11-25T10:30:00',
    createdAt: '2020-03-15',
  },
  advisor: {
    id: '1',
    firstName: 'Marie',
    lastName: 'Martin',
    email: 'marie.martin@cabinet.fr',
    phone: '01 98 76 54 32',
  },
  cabinet: {
    id: '1',
    name: 'Cabinet Martin Patrimoine',
    email: 'contact@martin-patrimoine.fr',
    phone: '01 40 00 00 00',
    address: {
      street: '50 avenue des Champs-Élysées',
      postalCode: '75008',
      city: 'Paris',
    },
  },
  familyMembers: [
    { id: '1', firstName: 'Sophie', lastName: 'Dupont', relationship: 'CONJOINT', birthDate: '1978-09-20' },
    { id: '2', firstName: 'Lucas', lastName: 'Dupont', relationship: 'ENFANT', birthDate: '2008-04-10' },
    { id: '3', firstName: 'Emma', lastName: 'Dupont', relationship: 'ENFANT', birthDate: '2012-11-25' },
  ],
}

const MARITAL_STATUS_LABELS: Record<string, string> = {
  CELIBATAIRE: 'Célibataire',
  MARIE: 'Marié(e)',
  PACSE: 'Pacsé(e)',
  DIVORCE: 'Divorcé(e)',
  VEUF: 'Veuf/Veuve',
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  SPOUSE: 'Conjoint(e)',
  CHILD: 'Enfant',
  PARENT: 'Parent',
  SIBLING: 'Frère/Sœur',
}

export default function ProfilPage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState({
    phone: '',
    mobile: '',
    address: { street: '', postalCode: '', city: '', country: '' },
  })

  const { data: apiData, isLoading } = useClientProfile(user?.id || '')
  const updateProfileMutation = useUpdateClientProfile()

  const profile = useMemo(() => {
    if (apiData?.profile) return apiData.profile
    return DEMO_PROFILE.profile
  }, [apiData])

  const advisor = useMemo(() => {
    if (apiData?.advisor) return apiData.advisor
    return DEMO_PROFILE.advisor
  }, [apiData])

  const cabinet = useMemo(() => {
    if (apiData?.cabinet) return apiData.cabinet
    return DEMO_PROFILE.cabinet
  }, [apiData])

  const familyMembers = useMemo(() => {
    if (apiData?.familyMembers) return apiData.familyMembers
    return DEMO_PROFILE.familyMembers
  }, [apiData])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  const startEditing = () => {
    setEditedData({
      phone: profile.phone || '',
      mobile: profile.mobile || '',
      address: profile.address || { street: '', postalCode: '', city: '', country: 'France' },
    })
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditedData({
      phone: '',
      mobile: '',
      address: { street: '', postalCode: '', city: '', country: '' },
    })
  }

  const saveChanges = async () => {
    await updateProfileMutation.mutateAsync({
      clientId: user?.id || '',
      phone: editedData.phone,
      mobile: editedData.mobile,
      address: editedData.address,
    })
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
          <p className="text-gray-500 mt-1">
            Consultez et mettez à jour vos informations personnelles
          </p>
        </div>
      </div>

      {/* Info Box - Pédagogique */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">Pourquoi ces informations sont importantes ?</p>
            <p className="text-blue-700 mt-1">
              Vos coordonnées permettent à votre conseiller de vous contacter facilement.
              Votre situation familiale et professionnelle l'aide à mieux adapter ses conseils patrimoniaux.
              <strong> Prévenez-nous de tout changement important.</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Informations personnelles
                </CardTitle>
                <CardDescription>Ces informations ne sont pas modifiables en ligne</CardDescription>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Protégées
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Identity */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <p className="text-xl font-semibold text-gray-900">
                    {profile.firstName} {profile.lastName}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(profile.birthDate)} ({calculateAge(profile.birthDate)} ans)
                    </span>
                    <Badge variant="secondary">
                      {profile.clientType === 'PARTICULIER' ? 'Particulier' : 'Professionnel'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Situation familiale</p>
                  <p className="font-medium text-gray-900 mt-1">
                    {MARITAL_STATUS_LABELS[profile.maritalStatus] || profile.maritalStatus}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Enfants</p>
                  <p className="font-medium text-gray-900 mt-1">
                    {profile.numberOfChildren || 0} enfant(s)
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Profession</p>
                  <p className="font-medium text-gray-900 mt-1">
                    {profile.profession || 'Non renseigné'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Client depuis</p>
                  <p className="font-medium text-gray-900 mt-1">
                    {formatDate(profile.createdAt)}
                  </p>
                </div>
              </div>

              {/* Change request notice */}
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>
                  Pour modifier ces informations, contactez votre conseiller ou envoyez un message depuis la messagerie.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info Card - Editable */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-green-600" />
                  Coordonnées
                </CardTitle>
                <CardDescription>Vous pouvez modifier ces informations</CardDescription>
              </div>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={startEditing}>
                  <Edit2 className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={cancelEditing}>
                    <X className="h-4 w-4 mr-1" />
                    Annuler
                  </Button>
                  <Button size="sm" onClick={saveChanges} disabled={updateProfileMutation.isPending}>
                    <Save className="h-4 w-4 mr-1" />
                    Enregistrer
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email - Not editable */}
              <div>
                <Label className="text-gray-500">Email</Label>
                <div className="flex items-center gap-2 mt-1 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{profile.email}</span>
                  <Badge variant="outline" className="ml-auto text-xs">Non modifiable</Badge>
                </div>
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone">Téléphone fixe</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={editedData.phone}
                    onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                    placeholder="01 23 45 67 89"
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-900">
                    {profile.phone || 'Non renseigné'}
                  </p>
                )}
              </div>

              {/* Mobile */}
              <div>
                <Label htmlFor="mobile">Téléphone mobile</Label>
                {isEditing ? (
                  <Input
                    id="mobile"
                    value={editedData.mobile}
                    onChange={(e) => setEditedData({ ...editedData, mobile: e.target.value })}
                    placeholder="06 12 34 56 78"
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-900">
                    {profile.mobile || 'Non renseigné'}
                  </p>
                )}
              </div>

              {/* Address */}
              <div>
                <Label>Adresse postale</Label>
                {isEditing ? (
                  <div className="mt-1 space-y-2">
                    <Input
                      placeholder="Rue"
                      value={editedData.address.street}
                      onChange={(e) => setEditedData({
                        ...editedData,
                        address: { ...editedData.address, street: e.target.value }
                      })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Code postal"
                        value={editedData.address.postalCode}
                        onChange={(e) => setEditedData({
                          ...editedData,
                          address: { ...editedData.address, postalCode: e.target.value }
                        })}
                      />
                      <Input
                        placeholder="Ville"
                        value={editedData.address.city}
                        onChange={(e) => setEditedData({
                          ...editedData,
                          address: { ...editedData.address, city: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-900">
                    {profile.address ? (
                      <>
                        <p>{profile.address.street}</p>
                        <p>{profile.address.postalCode} {profile.address.city}</p>
                      </>
                    ) : (
                      <p className="text-gray-500">Non renseigné</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Family Members */}
          {familyMembers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-pink-600" />
                  Composition familiale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {familyMembers.map((member: any) => (
                    <div key={member.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="h-10 w-10 bg-pink-100 rounded-full flex items-center justify-center">
                        {member.relationship === 'CONJOINT' ? (
                          <Heart className="h-5 w-5 text-pink-600" />
                        ) : (
                          <User className="h-5 w-5 text-pink-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {RELATIONSHIP_LABELS[member.relationship]}
                          {member.birthDate && ` • ${calculateAge(member.birthDate)} ans`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Advisor Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Votre conseiller</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <p className="font-semibold text-gray-900">
                  {advisor.firstName} {advisor.lastName}
                </p>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700 truncate">{advisor.email}</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{advisor.phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cabinet Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-600" />
                Le cabinet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="font-semibold text-gray-900">{cabinet.name}</p>
              <div className="flex items-start gap-2 text-gray-600">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p>{cabinet.address?.street}</p>
                  <p>{cabinet.address?.postalCode} {cabinet.address?.city}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{cabinet.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="h-4 w-4" />
                <span className="truncate">{cabinet.email}</span>
              </div>
            </CardContent>
          </Card>

          {/* Last Connection */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Dernière connexion</span>
              </div>
              <p className="font-medium text-gray-900 mt-1">
                {profile.lastPortalLogin ? formatDate(profile.lastPortalLogin) : 'Première visite'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
