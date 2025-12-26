 
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/app/_common/components/ui/Select'
import { formatDate } from '@/app/_common/lib/utils'
import { formatLabel } from '@/app/_common/lib/labels'
import { 
  User, 
  Users, 
  Scale, 
  Calculator,
  Edit, 
  Save, 
  X, 
  UserPlus,
  Trash2,
  Building2,
  AlertCircle
} from 'lucide-react'
import type { ClientDetail } from '@/app/_common/lib/api-types'
import type { 
  ProfileData, 
  FamilyMember, 
  FamilyRole,
  LegalStructure,
  LegalStructureType
} from '@/app/_common/types/client360'

interface TabProfileProps {
  clientId: string
  client: ClientDetail
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateAge(birthDate: string | Date | null): number | null {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

const FAMILY_ROLE_LABELS: Record<FamilyRole, string> = {
  CONJOINT: 'Conjoint(e)',
  CHILD_MAJOR: 'Enfant majeur',
  CHILD_MINOR: 'Enfant mineur',
  DEPENDENT: 'Personne à charge'
}

const MATRIMONIAL_REGIMES = [
  { value: 'COMMUNAUTE_REDUITE', label: 'Communauté réduite aux acquêts' },
  { value: 'COMMUNAUTE_UNIVERSELLE', label: 'Communauté universelle' },
  { value: 'SEPARATION', label: 'Séparation de biens' },
  { value: 'PARTICIPATION', label: 'Participation aux acquêts' },
  { value: 'PACS', label: 'PACS' },
  { value: 'NONE', label: 'Non applicable' }
]

const PROFESSIONAL_STATUSES = [
  { value: 'SALARIE', label: 'Salarié' },
  { value: 'TNS', label: 'Travailleur Non Salarié (TNS)' },
  { value: 'LIBERAL', label: 'Profession libérale' },
  { value: 'DIRIGEANT', label: 'Dirigeant de société' },
  { value: 'RETRAITE', label: 'Retraité' },
  { value: 'SANS_ACTIVITE', label: 'Sans activité professionnelle' }
]

const STRUCTURE_TYPES: { value: LegalStructureType; label: string }[] = [
  { value: 'SCI', label: 'SCI' },
  { value: 'HOLDING', label: 'Holding' },
  { value: 'SARL', label: 'SARL' },
  { value: 'SAS', label: 'SAS' }
]

// ============================================================================
// Main Component
// ============================================================================

export function TabProfile({ clientId, client }: TabProfileProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditingIdentity, setIsEditingIdentity] = useState(false)
  const [isEditingLegal, setIsEditingLegal] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [savingIdentity, setSavingIdentity] = useState(false)
  const [savingLegal, setSavingLegal] = useState(false)

  // Fetch profile data
  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/advisor/clients/${clientId}/profile`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile data')
      }
      
      const result = await response.json()
      setProfileData(result.data)
    } catch (err) {
      console.error('Error fetching profile data:', err)
      setError('Impossible de charger les données du profil')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchProfileData()
  }, [fetchProfileData])

  // Loading state
  if (loading) {
    return <TabProfileSkeleton />
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="text-destructive font-medium">{error}</p>
        <button 
          onClick={fetchProfileData}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Réessayer
        </button>
      </div>
    )
  }

  const age = calculateAge(profileData?.identity.birthDate || client.birthDate)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Profil & Famille</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Informations personnelles, familiales et situation juridique
        </p>
      </div>

      {/* Identity Section - Requirement 2.1 */}
      <IdentitySection 
        identity={profileData?.identity}
        client={client}
        age={age}
        isEditing={isEditingIdentity}
        saving={savingIdentity}
        onEdit={() => setIsEditingIdentity(true)}
        onCancel={() => setIsEditingIdentity(false)}
        onSave={async (data) => {
          setSavingIdentity(true)
          try {
            const response = await fetch(`/api/advisor/clients/${clientId}/profile`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ identity: data })
            })
            if (response.ok) {
              const result = await response.json()
              setProfileData(result.data)
              setIsEditingIdentity(false)
            }
          } finally {
            setSavingIdentity(false)
          }
        }}
      />

      {/* Family Structure Section - Requirements 2.2, 2.3, 2.7 */}
      <FamilySection 
        family={profileData?.family || []}
        clientId={clientId}
        showAddMember={showAddMember}
        onShowAddMember={() => setShowAddMember(true)}
        onHideAddMember={() => setShowAddMember(false)}
        onRefresh={fetchProfileData}
      />

      {/* Legal Rights Section - Requirement 2.4 */}
      <LegalRightsSection 
        legalRights={profileData?.legalRights}
        isEditing={isEditingLegal}
        saving={savingLegal}
        onEdit={() => setIsEditingLegal(true)}
        onCancel={() => setIsEditingLegal(false)}
        onSave={async (data) => {
          setSavingLegal(true)
          try {
            const response = await fetch(`/api/advisor/clients/${clientId}/profile`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ legalRights: data })
            })
            if (response.ok) {
              const result = await response.json()
              setProfileData(result.data)
              setIsEditingLegal(false)
            }
          } finally {
            setSavingLegal(false)
          }
        }}
      />

      {/* Fiscal Shares Section - Requirement 2.5 */}
      <FiscalSharesSection fiscalInfo={profileData?.fiscalInfo} />
    </div>
  )
}


// ============================================================================
// Identity Section Component - Requirement 2.1
// ============================================================================

interface IdentitySectionProps {
  identity?: ProfileData['identity']
  client: ClientDetail
  age: number | null
  isEditing: boolean
  saving: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (data: Partial<ProfileData['identity']>) => Promise<void>
}

function IdentitySection({ 
  identity, 
  client, 
  age, 
  isEditing, 
  saving,
  onEdit, 
  onCancel, 
  onSave 
}: IdentitySectionProps) {
  const [formData, setFormData] = useState({
    firstName: identity?.firstName || client.firstName || '',
    lastName: identity?.lastName || client.lastName || '',
    birthDate: identity?.birthDate || (client.birthDate ? new Date(client.birthDate).toISOString().split('T')[0] : ''),
    nationality: identity?.nationality || client.nationality || '',
    email: identity?.email || client.email || '',
    phone: identity?.phone || client.phone || ''
  })

  useEffect(() => {
    if (identity) {
      setFormData({
        firstName: identity.firstName,
        lastName: identity.lastName,
        birthDate: identity.birthDate,
        nationality: identity.nationality,
        email: identity.email,
        phone: identity.phone
      })
    }
  }, [identity])

  const handleSave = async () => {
    await onSave(formData)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations personnelles
          </CardTitle>
          <div className="flex items-center gap-2">
            {age && (
              <Badge variant="outline" className="text-base">
                {age} ans
              </Badge>
            )}
            {!isEditing ? (
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={onCancel} disabled={saving}>
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Date de naissance</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationalité</Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <InfoField label="Prénom" value={identity?.firstName || client.firstName} />
            <InfoField label="Nom" value={identity?.lastName || client.lastName} />
            <InfoField 
              label="Date de naissance" 
              value={identity?.birthDate ? formatDate(identity.birthDate) : (client.birthDate ? formatDate(client.birthDate) : null)} 
            />
            <InfoField label="Nationalité" value={identity?.nationality || client.nationality} />
            <InfoField label="Email" value={identity?.email || client.email} />
            <InfoField label="Téléphone" value={identity?.phone || client.phone} />
            {identity?.address && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                <p className="text-sm">
                  {[identity.address.street, identity.address.postalCode, identity.address.city, identity.address.country]
                    .filter(Boolean)
                    .join(', ') || '-'}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Family Section Component - Requirements 2.2, 2.3, 2.7
// ============================================================================

interface FamilySectionProps {
  family: FamilyMember[]
  clientId: string
  showAddMember: boolean
  onShowAddMember: () => void
  onHideAddMember: () => void
  onRefresh: () => void
}

function FamilySection({ 
  family, 
  clientId, 
  showAddMember, 
  onShowAddMember, 
  onHideAddMember,
  onRefresh 
}: FamilySectionProps) {
  const [newMember, setNewMember] = useState<Partial<FamilyMember>>({
    role: 'CHILD_MINOR',
    firstName: '',
    lastName: '',
    birthDate: '',
    isFiscalDependent: false
  })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleAddMember = async () => {
    if (!newMember.firstName || !newMember.lastName) return
    
    setSaving(true)
    try {
      // Map role to relationship for API
      const relationshipMap: Record<FamilyRole, string> = {
        CONJOINT: 'CONJOINT',
        CHILD_MAJOR: 'ENFANT',
        CHILD_MINOR: 'ENFANT',
        DEPENDENT: 'AUTRE'
      }
      
      const response = await fetch(`/api/advisor/clients/${clientId}/family`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relationship: relationshipMap[newMember.role as FamilyRole],
          firstName: newMember.firstName,
          lastName: newMember.lastName,
          birthDate: newMember.birthDate || undefined,
          isDependent: newMember.isFiscalDependent
        })
      })
      
      if (response.ok) {
        setNewMember({
          role: 'CHILD_MINOR',
          firstName: '',
          lastName: '',
          birthDate: '',
          isFiscalDependent: false
        })
        onHideAddMember()
        onRefresh()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    setDeletingId(memberId)
    try {
      const response = await fetch(`/api/advisor/family/${memberId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        onRefresh()
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Structure familiale
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{family.length} membre{family.length !== 1 ? 's' : ''}</Badge>
            <Button size="sm" variant="outline" onClick={onShowAddMember}>
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter un membre
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Add Member Form */}
        {showAddMember && (
          <div className="mb-6 p-4 rounded-lg border bg-muted/30">
            <h4 className="font-medium mb-4">Nouveau membre de la famille</h4>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select
                  value={newMember.role}
                  onValueChange={(value) => setNewMember({ ...newMember, role: value as FamilyRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FAMILY_ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input
                  value={newMember.firstName}
                  onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                  placeholder="Prénom"
                />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  value={newMember.lastName}
                  onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                  placeholder="Nom"
                />
              </div>
              <div className="space-y-2">
                <Label>Date de naissance</Label>
                <Input
                  type="date"
                  value={newMember.birthDate}
                  onChange={(e) => setNewMember({ ...newMember, birthDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newMember.isFiscalDependent}
                  onChange={(e) => setNewMember({ ...newMember, isFiscalDependent: e.target.checked })}
                  className="rounded border-gray-300"
                />
                À charge fiscalement
              </label>
              <div className="flex-1" />
              <Button size="sm" variant="outline" onClick={onHideAddMember} disabled={saving}>
                Annuler
              </Button>
              <Button size="sm" onClick={handleAddMember} disabled={saving || !newMember.firstName || !newMember.lastName}>
                {saving ? 'Ajout...' : 'Ajouter'}
              </Button>
            </div>
          </div>
        )}

        {/* Family Members List */}
        {family.length > 0 ? (
          <div className="space-y-3">
            {family.map((member) => {
              const memberAge = calculateAge(member.birthDate)
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.firstName} {member.lastName}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {FAMILY_ROLE_LABELS[member.role]}
                        </Badge>
                        {memberAge !== null && <span>• {memberAge} ans</span>}
                        {member.birthDate && (
                          <span>• Né(e) le {formatDate(member.birthDate)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.isFiscalDependent && (
                      <Badge variant="secondary" className="text-xs">
                        À charge
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteMember(member.id)}
                      disabled={deletingId === member.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-3">
              Aucun membre de la famille enregistré
            </p>
            <Button size="sm" variant="outline" onClick={onShowAddMember}>
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter le premier membre
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


// ============================================================================
// Legal Rights Section Component - Requirement 2.4
// ============================================================================

interface LegalRightsSectionProps {
  legalRights?: ProfileData['legalRights']
  isEditing: boolean
  saving: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (data: Partial<ProfileData['legalRights']>) => Promise<void>
}

function LegalRightsSection({ 
  legalRights, 
  isEditing, 
  saving,
  onEdit, 
  onCancel, 
  onSave 
}: LegalRightsSectionProps) {
  const [formData, setFormData] = useState({
    matrimonialRegime: legalRights?.matrimonialRegime || '',
    professionalStatus: legalRights?.professionalStatus || '',
    structures: legalRights?.structures || []
  })

  useEffect(() => {
    if (legalRights) {
      setFormData({
        matrimonialRegime: legalRights.matrimonialRegime,
        professionalStatus: legalRights.professionalStatus,
        structures: legalRights.structures || []
      })
    }
  }, [legalRights])

  const handleAddStructure = () => {
    setFormData({
      ...formData,
      structures: [...formData.structures, { type: 'SCI' as LegalStructureType, name: '', ownership: 100 }]
    })
  }

  const handleRemoveStructure = (index: number) => {
    setFormData({
      ...formData,
      structures: formData.structures.filter((_, i) => i !== index)
    })
  }

  const handleUpdateStructure = (index: number, field: keyof LegalStructure, value: any) => {
    const newStructures = [...formData.structures]
    newStructures[index] = { ...newStructures[index], [field]: value }
    setFormData({ ...formData, structures: newStructures })
  }

  const handleSave = async () => {
    await onSave(formData)
  }

  const getRegimeLabel = (value: string) => {
    return MATRIMONIAL_REGIMES.find(r => r.value === value)?.label || value || '-'
  }

  const getStatusLabel = (value: string) => {
    return PROFESSIONAL_STATUSES.find(s => s.value === value)?.label || value || '-'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Droits et situation juridique
          </CardTitle>
          {!isEditing ? (
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onCancel} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Régime matrimonial</Label>
                <Select
                  value={formData.matrimonialRegime}
                  onValueChange={(value) => setFormData({ ...formData, matrimonialRegime: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MATRIMONIAL_REGIMES.map((regime) => (
                      <SelectItem key={regime.value} value={regime.value}>
                        {regime.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Statut professionnel</Label>
                <Select
                  value={formData.professionalStatus}
                  onValueChange={(value) => setFormData({ ...formData, professionalStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFESSIONAL_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Legal Structures */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Structures juridiques (SCI, Holding, etc.)</Label>
                <Button size="sm" variant="outline" onClick={handleAddStructure}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
              {formData.structures.length > 0 ? (
                <div className="space-y-3">
                  {formData.structures.map((structure, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Select
                        value={structure.type}
                        onValueChange={(value) => handleUpdateStructure(index, 'type', value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STRUCTURE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Nom de la structure"
                        value={structure.name}
                        onChange={(e) => handleUpdateStructure(index, 'name', e.target.value)}
                        className="flex-1"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={structure.ownership}
                          onChange={(e) => handleUpdateStructure(index, 'ownership', Number(e.target.value))}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleRemoveStructure(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
                  Aucune structure juridique
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-medium text-muted-foreground mb-1">Régime matrimonial</p>
                <p className="text-sm font-semibold">{getRegimeLabel(legalRights?.matrimonialRegime || '')}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-medium text-muted-foreground mb-1">Statut professionnel</p>
                <p className="text-sm font-semibold">{getStatusLabel(legalRights?.professionalStatus || '')}</p>
              </div>
            </div>

            {/* Legal Structures Display */}
            {legalRights?.structures && legalRights.structures.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-3">Structures juridiques</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {legalRights.structures.map((structure) => (
                    <div key={`structure-${structure.type}-${structure.name}`} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{structure.name || 'Sans nom'}</p>
                        <p className="text-xs text-muted-foreground">{formatLabel(structure.type)}</p>
                      </div>
                      <Badge variant="outline">{structure.ownership}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Fiscal Shares Section Component - Requirement 2.5
// ============================================================================

interface FiscalSharesSectionProps {
  fiscalInfo?: ProfileData['fiscalInfo']
}

function FiscalSharesSection({ fiscalInfo }: FiscalSharesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Quotient familial
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Fiscal Shares Display */}
          <div className="p-6 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Parts fiscales</p>
                <p className="text-xs text-blue-700 mt-1">
                  Calculé automatiquement selon la situation familiale
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-900">
                  {fiscalInfo?.fiscalShares?.toFixed(1) || '1.0'}
                </p>
                <p className="text-xs text-blue-700">parts</p>
              </div>
            </div>
          </div>

          {/* Fiscal Household Summary */}
          <div className="p-6 rounded-lg bg-muted/50 border">
            <p className="text-sm font-medium text-muted-foreground mb-2">Foyer fiscal</p>
            <p className="text-lg font-semibold">
              {fiscalInfo?.fiscalHousehold || 'Célibataire'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Les parts fiscales sont utilisées pour le calcul de l'impôt sur le revenu (quotient familial)
            </p>
          </div>
        </div>

        {/* Explanation */}
        <div className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-sm text-amber-800">
            <strong>Règles de calcul :</strong> 1 part par adulte, 0,5 part par enfant à charge (2 premiers), 
            1 part par enfant supplémentaire. Bonus de 0,5 part pour parent isolé.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Helper Components
// ============================================================================

interface InfoFieldProps {
  label: string
  value: string | null | undefined
}

function InfoField({ label, value }: InfoFieldProps) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value || '-'}</p>
    </div>
  )
}

// ============================================================================
// Skeleton Component
// ============================================================================

function TabProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      
      {/* Identity Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Family Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legal Rights Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-52" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>

      {/* Fiscal Shares Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
