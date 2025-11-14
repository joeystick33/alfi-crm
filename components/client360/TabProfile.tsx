import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { User, Users, Briefcase, DollarSign } from 'lucide-react'
import type { ClientDetail } from '@/lib/api-types'

interface TabProfileProps {
  clientId: string
  client: ClientDetail
}

export function TabProfile({ clientId, client }: TabProfileProps) {
  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Prénom</p>
              <p className="text-sm">{client.firstName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nom</p>
              <p className="text-sm">{client.lastName}</p>
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
            {client.email && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-sm">{client.email}</p>
              </div>
            )}
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
        </CardContent>
      </Card>

      {/* Family Situation */}
      {client.clientType === 'PARTICULIER' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Situation familiale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {client.maritalStatus && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Statut marital</p>
                  <p className="text-sm">{client.maritalStatus}</p>
                </div>
              )}
              {client.marriageRegime && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Régime matrimonial</p>
                  <p className="text-sm">{client.marriageRegime}</p>
                </div>
              )}
              {client.numberOfChildren !== null && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre d'enfants</p>
                  <p className="text-sm">{client.numberOfChildren}</p>
                </div>
              )}
            </div>

            {client.familyMembers && client.familyMembers.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium mb-3">Membres de la famille</p>
                <div className="space-y-2">
                  {client.familyMembers.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{member.relationship}</p>
                      </div>
                      {member.isBeneficiary && (
                        <Badge variant="outline">Bénéficiaire</Badge>
                      )}
                    </div>
                  ))}
                </div>
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
          <div className="grid gap-4 md:grid-cols-2">
            {client.profession && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Profession</p>
                <p className="text-sm">{client.profession}</p>
              </div>
            )}
            {client.employerName && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Employeur</p>
                <p className="text-sm">{client.employerName}</p>
              </div>
            )}
            {client.professionalStatus && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Statut</p>
                <p className="text-sm">{client.professionalStatus}</p>
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
          <div className="grid gap-4 md:grid-cols-2">
            {client.annualIncome && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenu annuel</p>
                <p className="text-sm">{client.annualIncome.toLocaleString('fr-FR')} €</p>
              </div>
            )}
            {client.taxBracket && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tranche fiscale</p>
                <p className="text-sm">{client.taxBracket}</p>
              </div>
            )}
            {client.fiscalResidence && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Résidence fiscale</p>
                <p className="text-sm">{client.fiscalResidence}</p>
              </div>
            )}
          </div>
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
