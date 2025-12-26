 
'use client'

/**
 * Step KYC / LCB-FT
 * Conformité réglementaire obligatoire CGP/Courtier
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import Checkbox from '@/app/_common/components/ui/Checkbox'
import Textarea from '@/app/_common/components/ui/Textarea'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { AlertTriangle, Shield, Globe, Building, FileSearch, Info } from 'lucide-react'
import type { WizardClientDataSimplified } from '@/app/_common/types/client-professionnel.types'

interface StepKycLcbftProps {
  data: Partial<WizardClientDataSimplified>
  updateField: <K extends keyof WizardClientDataSimplified>(field: K, value: WizardClientDataSimplified[K]) => void
  updateNestedField: (parent: string, field: string, value: any) => void
  errors: Record<string, string>
}

// Niveaux de risque LCB-FT
const NIVEAUX_RISQUE = [
  { value: 'FAIBLE', label: 'Risque faible', description: 'Client standard, situation claire' },
  { value: 'MOYEN', label: 'Risque moyen', description: 'Vigilance normale' },
  { value: 'ELEVE', label: 'Risque élevé', description: 'Vigilance renforcée requise' },
]

// Origines des fonds
const ORIGINES_FONDS = [
  { value: 'SALAIRES', label: 'Salaires / Revenus d\'activité' },
  { value: 'EPARGNE', label: 'Épargne constituée' },
  { value: 'HERITAGE', label: 'Héritage / Succession' },
  { value: 'DONATION', label: 'Donation' },
  { value: 'VENTE_IMMOBILIER', label: 'Vente immobilière' },
  { value: 'VENTE_ENTREPRISE', label: 'Cession d\'entreprise' },
  { value: 'PLUS_VALUE', label: 'Plus-value financière' },
  { value: 'INDEMNITE', label: 'Indemnité (licenciement, assurance...)' },
  { value: 'AUTRE', label: 'Autre origine' },
]

// PPE
const FONCTIONS_PPE = [
  { value: 'CHEF_ETAT', label: 'Chef d\'État ou de gouvernement' },
  { value: 'MINISTRE', label: 'Ministre ou secrétaire d\'État' },
  { value: 'PARLEMENTAIRE', label: 'Parlementaire national' },
  { value: 'MAGISTRAT', label: 'Membre d\'une cour suprême' },
  { value: 'AMBASSADEUR', label: 'Ambassadeur' },
  { value: 'OFFICIER', label: 'Officier général des armées' },
  { value: 'DIRIGEANT_ENTREPRISE_PUBLIQUE', label: 'Dirigeant d\'entreprise publique' },
  { value: 'DIRIGEANT_INSTITUTION_INTERNATIONALE', label: 'Dirigeant d\'institution internationale' },
  { value: 'MEMBRE_FAMILLE', label: 'Membre de famille proche d\'une PPE' },
  { value: 'ASSOCIE', label: 'Personne connue pour être un proche associé' },
]

export function StepKycLcbft({ data, updateField: _updateField, updateNestedField, errors }: StepKycLcbftProps) {
  const kyc = (data as any).kycLcbft || {}

  return (
    <div className="space-y-6">
      <Alert className="bg-amber-50 border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-sm text-amber-800">
          <strong>Obligation réglementaire :</strong> Ces informations sont requises par la réglementation 
          LCB-FT (Lutte Contre le Blanchiment et le Financement du Terrorisme) pour tous les professionnels 
          du conseil en gestion de patrimoine.
        </AlertDescription>
      </Alert>

      {/* Origine des fonds */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-600" />
            Origine des fonds
          </CardTitle>
          <CardDescription>
            Justification de l'origine du patrimoine
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>
              Origine principale des fonds            </Label>
            <Select
              value={kyc.origineFonds || ''}
              onValueChange={(value) => updateNestedField('kycLcbft', 'origineFonds', value)}
            >
              <SelectTrigger className={errors['kycLcbft.origineFonds'] ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionnez l'origine des fonds" />
              </SelectTrigger>
              <SelectContent>
                {ORIGINES_FONDS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="detailOrigineFonds">Détail / Commentaire</Label>
            <Textarea
              id="detailOrigineFonds"
              value={kyc.detailOrigineFonds || ''}
              onChange={(e) => updateNestedField('kycLcbft', 'detailOrigineFonds', e.target.value)}
              placeholder="Précisez l'origine des fonds si nécessaire..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="montantPatrimoineEstime">Montant estimé du patrimoine (€)</Label>
            <Input
              id="montantPatrimoineEstime"
              type="number"
              value={kyc.montantPatrimoineEstime || ''}
              onChange={(e) => updateNestedField('kycLcbft', 'montantPatrimoineEstime', parseFloat(e.target.value))}
              placeholder="500000"
            />
          </div>
        </CardContent>
      </Card>

      {/* PPE - Personne Politiquement Exposée */}
      <Card className="border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-purple-800">
            <Shield className="h-5 w-5" />
            Personne Politiquement Exposée (PPE)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-3 bg-purple-50 rounded-lg">
            <Checkbox
              checked={kyc.estPPE || false}
              onChange={(checked) => updateNestedField('kycLcbft', 'estPPE', checked)}
            />
            <div>
              <Label className="font-medium">Le client est une PPE ou proche d'une PPE</Label>
              <p className="text-xs text-gray-500">Personne exerçant ou ayant exercé des fonctions politiques importantes</p>
            </div>
          </div>

          {kyc.estPPE && (
            <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="space-y-2">
                <Label>Type de fonction PPE</Label>
                <Select
                  value={kyc.fonctionPPE || ''}
                  onValueChange={(value) => updateNestedField('kycLcbft', 'fonctionPPE', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    {FONCTIONS_PPE.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="detailPPE">Précisions sur le lien PPE</Label>
                <Textarea
                  id="detailPPE"
                  value={kyc.detailPPE || ''}
                  onChange={(e) => updateNestedField('kycLcbft', 'detailPPE', e.target.value)}
                  placeholder="Fonction exercée, période, pays..."
                  rows={2}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résidence fiscale et FATCA */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-600" />
            Résidence fiscale & FATCA/CRS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <Checkbox
              checked={kyc.residenceFiscaleFrance || true}
              onChange={(checked) => updateNestedField('kycLcbft', 'residenceFiscaleFrance', checked)}
            />
            <div>
              <Label className="font-medium">Résident fiscal français uniquement</Label>
              <p className="text-xs text-gray-500">Le client est exclusivement résident fiscal en France</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <Checkbox
              checked={kyc.usPersonFatca || false}
              onChange={(checked) => updateNestedField('kycLcbft', 'usPersonFatca', checked)}
            />
            <div>
              <Label className="font-medium">US Person (FATCA)</Label>
              <p className="text-xs text-gray-500">Citoyen américain, résident fiscal US, ou Green Card holder</p>
            </div>
          </div>

          {kyc.usPersonFatca && (
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-sm text-red-800">
                <strong>Attention FATCA :</strong> Les US Persons sont soumises à des obligations déclaratives 
                spécifiques. Certains produits financiers peuvent être restreints.
              </AlertDescription>
            </Alert>
          )}

          {!kyc.residenceFiscaleFrance && (
            <div className="space-y-2">
              <Label htmlFor="autresResidencesFiscales">Autres pays de résidence fiscale</Label>
              <Input
                id="autresResidencesFiscales"
                value={kyc.autresResidencesFiscales || ''}
                onChange={(e) => updateNestedField('kycLcbft', 'autresResidencesFiscales', e.target.value)}
                placeholder="Belgique, Luxembourg..."
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Niveau de risque */}
      <Card className="border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-amber-800">
            <FileSearch className="h-5 w-5" />
            Évaluation du risque client
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>
              Niveau de risque LCB-FT            </Label>
            <Select
              value={kyc.niveauRisque || 'FAIBLE'}
              onValueChange={(value) => updateNestedField('kycLcbft', 'niveauRisque', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NIVEAUX_RISQUE.map((n) => (
                  <SelectItem key={n.value} value={n.value}>
                    <div>
                      <span className="font-medium">{n.label}</span>
                      <p className="text-xs text-gray-500">{n.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="justificationRisque">Justification du niveau de risque</Label>
            <Textarea
              id="justificationRisque"
              value={kyc.justificationRisque || ''}
              onChange={(e) => updateNestedField('kycLcbft', 'justificationRisque', e.target.value)}
              placeholder="Éléments justifiant le niveau de risque attribué..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateKyc">Date de la vérification KYC</Label>
              <Input
                id="dateKyc"
                type="date"
                value={kyc.dateVerificationKyc || new Date().toISOString().split('T')[0]}
                onChange={(e) => updateNestedField('kycLcbft', 'dateVerificationKyc', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prochainRevue">Prochaine revue</Label>
              <Input
                id="prochainRevue"
                type="date"
                value={kyc.dateProchaineRevue || ''}
                onChange={(e) => updateNestedField('kycLcbft', 'dateProchaineRevue', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-800">
          Les informations KYC doivent être mises à jour au minimum tous les ans pour les clients à risque élevé, 
          tous les 3 ans pour les autres. Conservez les justificatifs dans le dossier client.
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default StepKycLcbft
