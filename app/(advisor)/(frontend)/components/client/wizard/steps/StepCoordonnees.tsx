 
'use client'

/**
 * Step 2: Coordonnées
 * Adresse, téléphones, emails
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import Checkbox from '@/app/_common/components/ui/Checkbox'
import { Phone, Mail, Home } from 'lucide-react'
import type { WizardClientDataSimplified } from '@/app/_common/types/client-professionnel.types'

interface StepCoordonneesProps {
  data: Partial<WizardClientDataSimplified>
  updateField: <K extends keyof WizardClientDataSimplified>(field: K, value: WizardClientDataSimplified[K]) => void
  updateNestedField: (parent: string, field: string, value: any) => void
  errors: Record<string, string>
}

// Pays
const PAYS = [
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgique' },
  { value: 'CH', label: 'Suisse' },
  { value: 'LU', label: 'Luxembourg' },
  { value: 'MC', label: 'Monaco' },
]

export function StepCoordonnees({ data, updateField: _updateField, updateNestedField, errors }: StepCoordonneesProps) {
  const coordonnees = (data as any).coordonnees || {}
  const adresse = coordonnees.adresse || {}

  return (
    <div className="space-y-6">
      {/* Adresse principale */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Home className="h-5 w-5 text-blue-600" />
            Adresse de résidence principale
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adresse1">
              Adresse            </Label>
            <Input
              id="adresse1"
              value={adresse.ligne1 || ''}
              onChange={(e) => updateNestedField('coordonnees.adresse', 'ligne1', e.target.value)}
              placeholder="12 Rue de la République"
              className={errors['coordonnees.adresse.ligne1'] ? 'border-red-500' : ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adresse2">Complément d'adresse</Label>
            <Input
              id="adresse2"
              value={adresse.ligne2 || ''}
              onChange={(e) => updateNestedField('coordonnees.adresse', 'ligne2', e.target.value)}
              placeholder="Bâtiment A, Appartement 42"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="codePostal">
                Code postal              </Label>
              <Input
                id="codePostal"
                value={adresse.codePostal || ''}
                onChange={(e) => updateNestedField('coordonnees.adresse', 'codePostal', e.target.value)}
                placeholder="75001"
                className={errors['coordonnees.adresse.codePostal'] ? 'border-red-500' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ville">
                Ville              </Label>
              <Input
                id="ville"
                value={adresse.ville || ''}
                onChange={(e) => updateNestedField('coordonnees.adresse', 'ville', e.target.value)}
                placeholder="Paris"
                className={errors['coordonnees.adresse.ville'] ? 'border-red-500' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label>Pays</Label>
              <Select
                value={adresse.pays || 'FR'}
                onValueChange={(value) => updateNestedField('coordonnees.adresse', 'pays', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <Checkbox
              checked={coordonnees.estProprietaire || false}
              onChange={(checked) => updateNestedField('coordonnees', 'estProprietaire', checked)}
            />
            <div>
              <Label className="font-medium">Propriétaire de la résidence principale</Label>
              <p className="text-xs text-gray-500">Le client est propriétaire de ce logement</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Téléphones */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-600" />
            Téléphones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="telMobile">
                Téléphone mobile              </Label>
              <Input
                id="telMobile"
                type="tel"
                value={coordonnees.telephoneMobile || ''}
                onChange={(e) => updateNestedField('coordonnees', 'telephoneMobile', e.target.value)}
                placeholder="06 12 34 56 78"
                className={errors['coordonnees.telephoneMobile'] ? 'border-red-500' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telFixe">Téléphone fixe</Label>
              <Input
                id="telFixe"
                type="tel"
                value={coordonnees.telephoneFixe || ''}
                onChange={(e) => updateNestedField('coordonnees', 'telephoneFixe', e.target.value)}
                placeholder="01 23 45 67 89"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="telPro">Téléphone professionnel</Label>
            <Input
              id="telPro"
              type="tel"
              value={coordonnees.telephoneProfessionnel || ''}
              onChange={(e) => updateNestedField('coordonnees', 'telephoneProfessionnel', e.target.value)}
              placeholder="01 23 45 67 89"
            />
          </div>
        </CardContent>
      </Card>

      {/* Emails */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-5 w-5 text-indigo-600" />
            Emails
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emailPerso">
                Email personnel              </Label>
              <Input
                id="emailPerso"
                type="email"
                value={coordonnees.emailPersonnel || ''}
                onChange={(e) => updateNestedField('coordonnees', 'emailPersonnel', e.target.value)}
                placeholder="jean.dupont@gmail.com"
                className={errors['coordonnees.emailPersonnel'] ? 'border-red-500' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailPro">Email professionnel</Label>
              <Input
                id="emailPro"
                type="email"
                value={coordonnees.emailProfessionnel || ''}
                onChange={(e) => updateNestedField('coordonnees', 'emailProfessionnel', e.target.value)}
                placeholder="j.dupont@entreprise.com"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Préférences de contact</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={coordonnees.accepteSMS || false}
                  onChange={(checked) => updateNestedField('coordonnees', 'accepteSMS', checked)}
                />
                <span className="text-sm">SMS</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={coordonnees.accepteEmail || false}
                  onChange={(checked) => updateNestedField('coordonnees', 'accepteEmail', checked)}
                />
                <span className="text-sm">Email</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={coordonnees.accepteCourrier || false}
                  onChange={(checked) => updateNestedField('coordonnees', 'accepteCourrier', checked)}
                />
                <span className="text-sm">Courrier</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={coordonnees.accepteAppel || false}
                  onChange={(checked) => updateNestedField('coordonnees', 'accepteAppel', checked)}
                />
                <span className="text-sm">Appel téléphonique</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StepCoordonnees
