'use client'

/**
 * Step 1: Identité du client
 * Informations civiles complètes
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { User, FileText, Info, MapPin } from 'lucide-react'
import type { WizardClientDataSimplified } from '@/app/_common/types/client-professionnel.types'

interface StepIdentiteProps {
  data: Partial<WizardClientDataSimplified>
  updateField: <K extends keyof WizardClientDataSimplified>(field: K, value: WizardClientDataSimplified[K]) => void
  updateNestedField: (parent: string, field: string, value: unknown) => void
  errors: Record<string, string>
}

// Civilités
const CIVILITES = [
  { value: 'M', label: 'Monsieur' },
  { value: 'MME', label: 'Madame' },
  { value: 'MLLE', label: 'Mademoiselle' },
]

// Nationalités principales
const NATIONALITES = [
  { value: 'FR', label: 'Française' },
  { value: 'BE', label: 'Belge' },
  { value: 'CH', label: 'Suisse' },
  { value: 'LU', label: 'Luxembourgeoise' },
  { value: 'DE', label: 'Allemande' },
  { value: 'IT', label: 'Italienne' },
  { value: 'ES', label: 'Espagnole' },
  { value: 'GB', label: 'Britannique' },
  { value: 'US', label: 'Américaine' },
  { value: 'AUTRE', label: 'Autre' },
]

// Types de pièce d'identité
const TYPES_PIECE_IDENTITE = [
  { value: 'CNI', label: 'Carte Nationale d\'Identité' },
  { value: 'PASSEPORT', label: 'Passeport' },
  { value: 'TITRE_SEJOUR', label: 'Titre de séjour' },
  { value: 'PERMIS_CONDUIRE', label: 'Permis de conduire' },
]

export function StepIdentite({ data, updateField: _updateField, updateNestedField, errors }: StepIdentiteProps) {
  const identite = data.identite || {}

  return (
    <div className="space-y-6">
      {/* État civil */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            État civil
          </CardTitle>
          <CardDescription>
            Informations d'identité du client
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Civilité et Nom */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>
                Civilité              </Label>
              <Select
                value={identite.civilite || ''}
                onValueChange={(value) => updateNestedField('identite', 'civilite', value)}
              >
                <SelectTrigger className={errors['identite.civilite'] ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Civilité" />
                </SelectTrigger>
                <SelectContent>
                  {CIVILITES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">
                Nom de naissance              </Label>
              <Input
                id="nom"
                value={identite.nom || ''}
                onChange={(e) => updateNestedField('identite', 'nom', e.target.value.toUpperCase())}
                placeholder="DUPONT"
                className={errors['identite.nom'] ? 'border-red-500' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomUsage">Nom d'usage</Label>
              <Input
                id="nomUsage"
                value={identite.nomUsage || ''}
                onChange={(e) => updateNestedField('identite', 'nomUsage', e.target.value.toUpperCase())}
                placeholder="MARTIN-DUPONT"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prenom">
                Prénom(s)              </Label>
              <Input
                id="prenom"
                value={identite.prenom || ''}
                onChange={(e) => updateNestedField('identite', 'prenom', e.target.value)}
                placeholder="Jean Pierre"
                className={errors['identite.prenom'] ? 'border-red-500' : ''}
              />
            </div>
          </div>

          {/* Naissance */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="dateNaissance">
                Date de naissance              </Label>
              <Input
                id="dateNaissance"
                type="date"
                value={identite.dateNaissance || ''}
                onChange={(e) => updateNestedField('identite', 'dateNaissance', e.target.value)}
                className={errors['identite.dateNaissance'] ? 'border-red-500' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lieuNaissance">
                Lieu de naissance              </Label>
              <Input
                id="lieuNaissance"
                value={identite.lieuNaissance || ''}
                onChange={(e) => updateNestedField('identite', 'lieuNaissance', e.target.value)}
                placeholder="Paris"
                className={errors['identite.lieuNaissance'] ? 'border-red-500' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departementNaissance">Département/Pays de naissance</Label>
              <Input
                id="departementNaissance"
                value={identite.departementNaissance || ''}
                onChange={(e) => updateNestedField('identite', 'departementNaissance', e.target.value)}
                placeholder="75 - Paris"
              />
            </div>
          </div>

          {/* Nationalité */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Nationalité              </Label>
              <Select
                value={identite.nationalite || 'FR'}
                onValueChange={(value) => updateNestedField('identite', 'nationalite', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NATIONALITES.map((n) => (
                    <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doubleNationalite">Seconde nationalité</Label>
              <Select
                value={identite.doubleNationalite || ''}
                onValueChange={(value) => updateNestedField('identite', 'doubleNationalite', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucune" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune</SelectItem>
                  {NATIONALITES.map((n) => (
                    <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pièce d'identité */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            Pièce d'identité
          </CardTitle>
          <CardDescription>
            Document d'identité officiel (obligatoire LCB-FT)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>
                Type de document              </Label>
              <Select
                value={identite.typePieceIdentite || ''}
                onValueChange={(value) => updateNestedField('identite', 'typePieceIdentite', value)}
              >
                <SelectTrigger className={errors['identite.typePieceIdentite'] ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_PIECE_IDENTITE.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="numeroPieceIdentite">
                Numéro              </Label>
              <Input
                id="numeroPieceIdentite"
                value={identite.numeroPieceIdentite || ''}
                onChange={(e) => updateNestedField('identite', 'numeroPieceIdentite', e.target.value.toUpperCase())}
                placeholder="123456789012"
                className={errors['identite.numeroPieceIdentite'] ? 'border-red-500' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateValiditePieceIdentite">
                Date de validité              </Label>
              <Input
                id="dateValiditePieceIdentite"
                type="date"
                value={identite.dateValiditePieceIdentite || ''}
                onChange={(e) => updateNestedField('identite', 'dateValiditePieceIdentite', e.target.value)}
                className={errors['identite.dateValiditePieceIdentite'] ? 'border-red-500' : ''}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="autorite">Autorité de délivrance</Label>
              <Input
                id="autorite"
                value={identite.autoriteDelivrance || ''}
                onChange={(e) => updateNestedField('identite', 'autoriteDelivrance', e.target.value)}
                placeholder="Préfecture de Paris"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateDelivrance">Date de délivrance</Label>
              <Input
                id="dateDelivrance"
                type="date"
                value={identite.dateDelivrancePieceIdentite || ''}
                onChange={(e) => updateNestedField('identite', 'dateDelivrancePieceIdentite', e.target.value)}
              />
            </div>
          </div>

          <Alert className="bg-amber-50 border-amber-200">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800">
              <strong>Obligation LCB-FT :</strong> La copie recto-verso du document d'identité en cours de validité 
              doit être conservée dans le dossier client.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Résidence fiscale */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            Résidence fiscale
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Pays de résidence fiscale</Label>
              <Select
                value={identite.paysResidenceFiscale || 'FR'}
                onValueChange={(value) => updateNestedField('identite', 'paysResidenceFiscale', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NATIONALITES.map((n) => (
                    <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nif">Numéro d'Identification Fiscale (NIF)</Label>
              <Input
                id="nif"
                value={identite.nif || ''}
                onChange={(e) => updateNestedField('identite', 'nif', e.target.value)}
                placeholder="Numéro fiscal"
              />
            </div>
          </div>

          {identite.paysResidenceFiscale && identite.paysResidenceFiscale !== 'FR' && (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800">
                <strong>US Person / FATCA :</strong> Si le client est résident fiscal américain ou a des liens avec les USA, 
                des obligations déclaratives spécifiques s'appliquent.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StepIdentite
