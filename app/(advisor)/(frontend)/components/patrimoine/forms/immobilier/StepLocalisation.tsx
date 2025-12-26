 
'use client'

/**
 * Step Localisation - Formulaire Bien Immobilier
 * Adresse complète du bien
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { MapPin, Globe, Building2, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import type { BienImmobilier } from '@/app/_common/types/patrimoine.types'

interface StepLocalisationProps {
  data: Partial<BienImmobilier>
  updateNestedField: (parent: keyof BienImmobilier, field: string, value: any) => void
  errors: Record<string, string>
}

// Liste des pays les plus courants
const PAYS_COURANTS = [
  { code: 'FR', label: 'France' },
  { code: 'MC', label: 'Monaco' },
  { code: 'BE', label: 'Belgique' },
  { code: 'CH', label: 'Suisse' },
  { code: 'LU', label: 'Luxembourg' },
  { code: 'ES', label: 'Espagne' },
  { code: 'PT', label: 'Portugal' },
  { code: 'IT', label: 'Italie' },
  { code: 'DE', label: 'Allemagne' },
  { code: 'GB', label: 'Royaume-Uni' },
  { code: 'US', label: 'États-Unis' },
  { code: 'MA', label: 'Maroc' },
  { code: 'TN', label: 'Tunisie' },
  { code: 'MU', label: 'Île Maurice' },
  { code: 'AUTRE', label: 'Autre pays...' },
]

// Validation du code postal français
const isValidFrenchPostalCode = (code: string): boolean => {
  return /^[0-9]{5}$/.test(code)
}

// Extraction du département depuis le code postal
const getDepartementFromPostalCode = (code: string): string | null => {
  if (!isValidFrenchPostalCode(code)) return null
  const dep = code.substring(0, 2)
  if (dep === '20') {
    // Corse
    return code.startsWith('201') ? '2A' : '2B'
  }
  if (parseInt(dep) > 95) {
    // DOM-TOM
    return code.substring(0, 3)
  }
  return dep
}

// Zones tendues pour Pinel/Denormandie
const ZONES_TENDUES = ['75', '92', '93', '94', '69', '13', '31', '33', '34', '06', '59', '67', '44', '35', '38']

export function StepLocalisation({ data, updateNestedField, errors }: StepLocalisationProps) {
  const adresse = data.adresse || {
    numero: '',
    rue: '',
    complement: '',
    codePostal: '',
    ville: '',
    pays: 'France',
  }
  const departement = adresse.codePostal ? getDepartementFromPostalCode(adresse.codePostal) : null
  const isZoneTendue = departement ? ZONES_TENDUES.includes(departement) : false
  const isFrance = !adresse.pays || adresse.pays === 'France'

  return (
    <div className="space-y-6">
      {/* Adresse principale */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Adresse du bien
          </CardTitle>
          <CardDescription>
            Localisation exacte du bien immobilier
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Numéro et rue */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="numero">Numéro</Label>
              <Input
                id="numero"
                value={adresse.numero || ''}
                onChange={(e) => updateNestedField('adresse', 'numero', e.target.value)}
                placeholder="123"
                className="text-center"
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="rue">
                Rue / Voie <span className="text-red-500">*</span>
              </Label>
              <Input
                id="rue"
                value={adresse.rue || ''}
                onChange={(e) => updateNestedField('adresse', 'rue', e.target.value)}
                placeholder="Rue de la Paix"
                className={errors['adresse.rue'] ? 'border-red-500' : ''}
              />
              {errors['adresse.rue'] && (
                <p className="text-xs text-red-500">{errors['adresse.rue']}</p>
              )}
            </div>
          </div>

          {/* Complément */}
          <div className="space-y-2">
            <Label htmlFor="complement">Complément d'adresse</Label>
            <Input
              id="complement"
              value={adresse.complement || ''}
              onChange={(e) => updateNestedField('adresse', 'complement', e.target.value)}
              placeholder="Bâtiment A, Escalier 2, 3ème étage, Porte droite..."
            />
            <p className="text-xs text-gray-500">
              Bâtiment, escalier, étage, appartement, résidence, lieu-dit...
            </p>
          </div>

          {/* Code postal, ville, pays */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="codePostal">
                Code postal <span className="text-red-500">*</span>
              </Label>
              <Input
                id="codePostal"
                value={adresse.codePostal || ''}
                onChange={(e) => updateNestedField('adresse', 'codePostal', e.target.value)}
                placeholder={isFrance ? '75001' : 'Code postal'}
                maxLength={isFrance ? 5 : 10}
                className={errors['adresse.codePostal'] ? 'border-red-500' : ''}
              />
              {errors['adresse.codePostal'] && (
                <p className="text-xs text-red-500">{errors['adresse.codePostal']}</p>
              )}
              {departement && isFrance && (
                <p className="text-xs text-gray-500">
                  Département : {departement}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ville">
                Ville <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ville"
                value={adresse.ville || ''}
                onChange={(e) => updateNestedField('adresse', 'ville', e.target.value)}
                placeholder="Paris"
                className={errors['adresse.ville'] ? 'border-red-500' : ''}
              />
              {errors['adresse.ville'] && (
                <p className="text-xs text-red-500">{errors['adresse.ville']}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pays">Pays</Label>
              <Select
                value={adresse.pays || 'France'}
                onValueChange={(value) => updateNestedField('adresse', 'pays', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYS_COURANTS.map((pays) => (
                    <SelectItem key={pays.code} value={pays.label}>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                        {pays.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations fiscales liées à la localisation */}
      {isFrance && adresse.codePostal && isValidFrenchPostalCode(adresse.codePostal) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              Informations liées à la localisation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Zone tendue */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg border bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Zone tendue</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    isZoneTendue 
                      ? 'bg-orange-100 text-orange-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {isZoneTendue ? 'Oui' : 'Non'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {isZoneTendue 
                    ? 'Encadrement des loyers possible, préavis réduit, majoration taxe habitation RS' 
                    : 'Pas d\'encadrement des loyers'}
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Département</span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                    {departement}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Taxe foncière et d'habitation variables selon commune
                </p>
              </div>
            </div>

            {/* Alertes spécifiques */}
            {departement && ['75', '92', '93', '94'].includes(departement) && (
              <Alert className="bg-amber-50 border-amber-200">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-sm text-amber-800">
                  <strong>Île-de-France :</strong> Encadrement des loyers en vigueur à Paris et dans certaines communes. 
                  Vérifiez les plafonds sur l'observatoire des loyers.
                </AlertDescription>
              </Alert>
            )}

            {departement && ['971', '972', '973', '974', '976'].includes(departement) && (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-800">
                  <strong>DOM-TOM :</strong> Fiscalité spécifique (Girardin, abattement revenus). 
                  Réduction d'impôt majorée pour certains dispositifs.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bien à l'étranger */}
      {!isFrance && (
        <Alert className="bg-amber-50 border-amber-200">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm text-amber-800">
            <strong>Bien à l'étranger :</strong> Ce bien doit être déclaré dans la déclaration de patrimoine. 
            Les revenus locatifs sont imposables en France selon les conventions fiscales.
            Le bien est inclus dans l'assiette IFI.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default StepLocalisation
