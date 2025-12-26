'use client'

/**
 * Step 3: Situation Familiale
 * Régime matrimonial, enfants, personnes à charge
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Button } from '@/app/_common/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import Checkbox from '@/app/_common/components/ui/Checkbox'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { Heart, Users, Baby, Plus, Trash2, Info } from 'lucide-react'
import type { WizardClientDataSimplified } from '@/app/_common/types/client-professionnel.types'

interface StepSituationFamilialeProps {
  data: Partial<WizardClientDataSimplified>
  updateField: <K extends keyof WizardClientDataSimplified>(field: K, value: WizardClientDataSimplified[K]) => void
   
  updateNestedField: (parent: string, field: string, value: any) => void
  errors: Record<string, string>
}

// Situations matrimoniales
const SITUATIONS_MATRIMONIALES = [
  { value: 'CELIBATAIRE', label: 'Célibataire' },
  { value: 'MARIE', label: 'Marié(e)' },
  { value: 'PACSE', label: 'Pacsé(e)' },
  { value: 'CONCUBINAGE', label: 'Concubinage / Union libre' },
  { value: 'DIVORCE', label: 'Divorcé(e)' },
  { value: 'SEPARE', label: 'Séparé(e)' },
  { value: 'VEUF', label: 'Veuf(ve)' },
]

// Régimes matrimoniaux
const REGIMES_MATRIMONIAUX = [
  { value: 'COMMUNAUTE_REDUITE_ACQUETS', label: 'Communauté réduite aux acquêts', description: 'Régime légal depuis 1966' },
  { value: 'COMMUNAUTE_UNIVERSELLE', label: 'Communauté universelle', description: 'Tous les biens sont communs' },
  { value: 'SEPARATION_BIENS', label: 'Séparation de biens', description: 'Chacun conserve ses biens propres' },
  { value: 'PARTICIPATION_ACQUETS', label: 'Participation aux acquêts', description: 'Mixte entre séparation et communauté' },
  { value: 'COMMUNAUTE_MEUBLES_ACQUETS', label: 'Communauté de meubles et acquêts', description: 'Ancien régime légal' },
]

// Types de rattachement fiscal enfants
const RATTACHEMENTS_ENFANT = [
  { value: 'FOYER_FISCAL', label: 'Rattaché au foyer fiscal' },
  { value: 'FOYER_FISCAL_MAJEUR', label: 'Majeur rattaché' },
  { value: 'PROPRE_FOYER', label: 'A son propre foyer' },
  { value: 'GARDE_ALTERNEE', label: 'Garde alternée' },
]

export function StepSituationFamiliale({ data, updateField: _updateField, updateNestedField, errors }: StepSituationFamilialeProps) {
   
  const famille = (data as any).situationFamiliale || {}
  const [enfants, setEnfants] = useState(famille.enfants || [])

  const needsRegimeMatrimonial = famille.situationMatrimoniale === 'MARIE'
  const needsConjoint = ['MARIE', 'PACSE', 'CONCUBINAGE'].includes(famille.situationMatrimoniale)

  // Ajouter un enfant
  const addEnfant = () => {
    const newEnfants = [...enfants, {
      prenom: '',
      dateNaissance: '',
      aCharge: true,
      rattachementFiscal: 'FOYER_FISCAL',
      gardeAlternee: false,
    }]
    setEnfants(newEnfants)
    updateNestedField('situationFamiliale', 'enfants', newEnfants)
  }

  // Supprimer un enfant
  const removeEnfant = (index: number) => {
     
    const newEnfants = enfants.filter((_: any, i: number) => i !== index)
    setEnfants(newEnfants)
    updateNestedField('situationFamiliale', 'enfants', newEnfants)
  }

  // Mettre à jour un enfant
   
  const updateEnfant = (index: number, field: string, value: any) => {
    const newEnfants = [...enfants]
    newEnfants[index] = { ...newEnfants[index], [field]: value }
    setEnfants(newEnfants)
    updateNestedField('situationFamiliale', 'enfants', newEnfants)
  }

  return (
    <div className="space-y-6">
      {/* Situation matrimoniale */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-600" />
            Situation matrimoniale
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Situation              </Label>
              <Select
                value={famille.situationMatrimoniale || ''}
                onValueChange={(value) => updateNestedField('situationFamiliale', 'situationMatrimoniale', value)}
              >
                <SelectTrigger className={errors['situationFamiliale.situationMatrimoniale'] ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  {SITUATIONS_MATRIMONIALES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {famille.situationMatrimoniale && (
              <div className="space-y-2">
                <Label htmlFor="dateSituation">Date de la situation</Label>
                <Input
                  id="dateSituation"
                  type="date"
                  value={famille.dateSituationMatrimoniale || ''}
                  onChange={(e) => updateNestedField('situationFamiliale', 'dateSituationMatrimoniale', e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Régime matrimonial */}
          {needsRegimeMatrimonial && (
            <div className="space-y-4 p-4 bg-rose-50 rounded-lg border border-rose-200">
              <h4 className="font-medium text-rose-800">Régime matrimonial</h4>
              <div className="space-y-2">
                <Label>
                  Régime                </Label>
                <Select
                  value={famille.regimeMatrimonial || ''}
                  onValueChange={(value) => updateNestedField('situationFamiliale', 'regimeMatrimonial', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le régime" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIMES_MATRIMONIAUX.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        <div>
                          <span className="font-medium">{r.label}</span>
                          <p className="text-xs text-gray-500">{r.description}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={famille.contratMariage || false}
                    onChange={(checked) => updateNestedField('situationFamiliale', 'contratMariage', checked)}
                  />
                  <Label>Contrat de mariage</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={famille.clauseAttribution || false}
                    onChange={(checked) => updateNestedField('situationFamiliale', 'clauseAttribution', checked)}
                  />
                  <Label>Clause d'attribution intégrale</Label>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conjoint */}
      {needsConjoint && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Conjoint / Partenaire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Civilité</Label>
                <Select
                  value={famille.conjoint?.civilite || ''}
                  onValueChange={(value) => updateNestedField('situationFamiliale.conjoint', 'civilite', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Civilité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Monsieur</SelectItem>
                    <SelectItem value="MME">Madame</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nomConjoint">
                  Nom                </Label>
                <Input
                  id="nomConjoint"
                  value={famille.conjoint?.nom || ''}
                  onChange={(e) => updateNestedField('situationFamiliale.conjoint', 'nom', e.target.value.toUpperCase())}
                  placeholder="NOM"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prenomConjoint">
                  Prénom                </Label>
                <Input
                  id="prenomConjoint"
                  value={famille.conjoint?.prenom || ''}
                  onChange={(e) => updateNestedField('situationFamiliale.conjoint', 'prenom', e.target.value)}
                  placeholder="Prénom"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dateNaissanceConjoint">Date de naissance</Label>
                <Input
                  id="dateNaissanceConjoint"
                  type="date"
                  value={famille.conjoint?.dateNaissance || ''}
                  onChange={(e) => updateNestedField('situationFamiliale.conjoint', 'dateNaissance', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="professionConjoint">Profession</Label>
                <Input
                  id="professionConjoint"
                  value={famille.conjoint?.profession || ''}
                  onChange={(e) => updateNestedField('situationFamiliale.conjoint', 'profession', e.target.value)}
                  placeholder="Profession"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enfants */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Baby className="h-5 w-5 text-amber-600" />
            Enfants et personnes à charge
          </CardTitle>
          <CardDescription>
            Nombre de parts fiscales : {1 + (needsConjoint ? 1 : 0) + enfants.filter((e: any) => e.aCharge).length * 0.5}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Label htmlFor="nbEnfants">Nombre d'enfants</Label>
              <Input
                id="nbEnfants"
                type="number"
                min="0"
                className="w-24"
                value={enfants.length}
                readOnly
              />
            </div>
            <Button variant="outline" size="sm" onClick={addEnfant}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter un enfant
            </Button>
          </div>

          {/* Liste des enfants */}
          {enfants.length > 0 && (
            <div className="space-y-3">
              {enfants.map((enfant: any, index: number) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm">Enfant {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEnfant(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Prénom</Label>
                      <Input
                        value={enfant.prenom || ''}
                        onChange={(e) => updateEnfant(index, 'prenom', e.target.value)}
                        placeholder="Prénom"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Date de naissance</Label>
                      <Input
                        type="date"
                        value={enfant.dateNaissance || ''}
                        onChange={(e) => updateEnfant(index, 'dateNaissance', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Rattachement fiscal</Label>
                      <Select
                        value={enfant.rattachementFiscal || 'FOYER_FISCAL'}
                        onValueChange={(value) => updateEnfant(index, 'rattachementFiscal', value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RATTACHEMENTS_ENFANT.map((r) => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-2 pb-1">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={enfant.aCharge || false}
                          onChange={(checked) => updateEnfant(index, 'aCharge', checked)}
                        />
                        <Label className="text-xs">À charge</Label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              Les enfants à charge augmentent le quotient familial et réduisent l'impôt sur le revenu.
              Un enfant compte pour 0,5 part (1 part à partir du 3ème).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

export default StepSituationFamiliale
