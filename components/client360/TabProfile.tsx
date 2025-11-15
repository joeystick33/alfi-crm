import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import { User, Users, Briefcase, DollarSign, Edit, Save, X, UserPlus } from 'lucide-react'
import type { ClientDetail } from '@/lib/api-types'

interface TabProfileProps {
  clientId: string
  client: ClientDetail
}

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

export function TabProfile({ clientId, client }: TabProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const age = calculateAge(client.birthDate)

  return (
    <div className="space-y-6">
      {/* Header with Edit Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Profil Client</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Informations personnelles, familiales et professionnelles
          </p>
        </div>
        <Button
          variant={isEditing ? 'outline' : 'primary'}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </>
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </>
          )}
        </Button>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
            {age && (
              <Badge variant="outline" className="text-base">
                {age} ans
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Civilité</p>
              <p className="text-sm">-</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Type de client</p>
              <Badge variant="outline">
                {client.clientType === 'PARTICULIER' ? 'Particulier' : 'Professionnel'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Prénom</p>
              <p className="text-sm font-semibold">{client.firstName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nom</p>
              <p className="text-sm font-semibold">{client.lastName}</p>
            </div>
            {client.birthDate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date de naissance</p>
                <p className="text-sm">{formatDate(client.birthDate)}</p>
              </div>
            )}
            {client.birthPlace && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lieu de naissance</p>
                <p className="text-sm">{client.birthPlace}</p>
              </div>
            )}
            {client.nationality && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nationalité</p>
                <p className="text-sm">{client.nationality}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{client.email || '-'}</p>
            </div>
            {client.phone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                <p className="text-sm">{client.phone}</p>
              </div>
            )}
            {client.mobile && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mobile</p>
                <p className="text-sm">{client.mobile}</p>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                💡 La modification des informations client sera disponible prochainement
              </p>
              <Button size="sm" disabled>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer les modifications
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Family Situation */}
      {client.clientType === 'PARTICULIER' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Situation familiale
              </CardTitle>
              <Button size="sm" variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Ajouter un membre
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {client.maritalStatus && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Statut marital</p>
                  <p className="text-sm font-semibold">{client.maritalStatus}</p>
                </div>
              )}
              {client.marriageRegime && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Régime matrimonial</p>
                  <p className="text-sm font-semibold">{client.marriageRegime}</p>
                </div>
              )}
              {client.numberOfChildren !== null && client.numberOfChildren !== undefined && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Nombre d'enfants</p>
                  <p className="text-sm font-semibold">{client.numberOfChildren}</p>
                </div>
              )}
            </div>

            {client.familyMembers && client.familyMembers.length > 0 ? (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">Membres de la famille</p>
                  <Badge variant="secondary">{client.familyMembers.length}</Badge>
                </div>
                <div className="space-y-2">
                  {client.familyMembers.map((member: any) => {
                    const memberAge = calculateAge(member.birthDate)
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {member.firstName} {member.lastName}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{member.relationship}</span>
                              {memberAge && <span>• {memberAge} ans</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.isBeneficiary && (
                            <Badge variant="outline" className="text-xs">
                              Bénéficiaire
                            </Badge>
                          )}
                          {member.isDependent && (
                            <Badge variant="secondary" className="text-xs">
                              À charge
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="mt-6 text-center py-8 border-2 border-dashed rounded-lg">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">
                  Aucun membre de la famille enregistré
                </p>
                <Button size="sm" variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Ajouter le premier membre
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Professional Situation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Situation professionnelle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground mb-1">Profession</p>
              <p className="text-sm font-semibold">{client.profession || '-'}</p>
            </div>
            {client.employerName && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-medium text-muted-foreground mb-1">Employeur</p>
                <p className="text-sm font-semibold">{client.employerName}</p>
              </div>
            )}
            {client.professionalStatus && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-medium text-muted-foreground mb-1">Statut professionnel</p>
                <p className="text-sm font-semibold">{client.professionalStatus}</p>
              </div>
            )}

          </div>
        </CardContent>
      </Card>

      {/* Fiscal Situation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Situation fiscale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {client.annualIncome && (
              <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                <p className="text-xs font-medium text-green-700 mb-1">Revenu annuel</p>
                <p className="text-lg font-bold text-green-800">
                  {Number(client.annualIncome).toLocaleString('fr-FR')} €
                </p>
              </div>
            )}
            {client.taxBracket && (
              <div className="p-3 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
                <p className="text-xs font-medium text-orange-700 mb-1">Tranche marginale d'imposition (TMI)</p>
                <p className="text-lg font-bold text-orange-800">{client.taxBracket}</p>
              </div>
            )}
            {client.fiscalResidence && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-medium text-muted-foreground mb-1">Résidence fiscale</p>
                <p className="text-sm font-semibold">{client.fiscalResidence}</p>
              </div>
            )}

          </div>

          {/* Tax Shares Calculation */}
          {client.clientType === 'PARTICULIER' && (
            <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Parts fiscales (quotient familial)</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Calculé selon la situation familiale
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-900">
                    2.0
                  </p>
                  <p className="text-xs text-blue-700">parts</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investor Profile */}
      {client.riskProfile && (
        <Card>
          <CardHeader>
            <CardTitle>Profil investisseur (MIF II)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Profil de risque</p>
                <Badge variant="outline">{client.riskProfile}</Badge>
              </div>
              {client.investmentHorizon && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Horizon d'investissement</p>
                  <Badge variant="outline">{client.investmentHorizon}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
