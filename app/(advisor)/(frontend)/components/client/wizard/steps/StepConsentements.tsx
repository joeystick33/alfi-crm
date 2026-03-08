 
'use client'

/**
 * Step Consentements RGPD
 * Recueil des consentements réglementaires
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Label } from '@/app/_common/components/ui/Label'
import Checkbox from '@/app/_common/components/ui/Checkbox'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { Shield, FileText, Mail, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { cn } from '@/app/_common/lib/utils'
import type { WizardClientDataSimplified } from '@/app/_common/types/client-professionnel.types'

interface StepConsentementsProps {
  data: Partial<WizardClientDataSimplified>
  updateField: <K extends keyof WizardClientDataSimplified>(field: K, value: WizardClientDataSimplified[K]) => void
  updateNestedField: (parent: string, field: string, value: unknown) => void
  errors: Record<string, string>
}

export function StepConsentements({ data, updateField: _updateField, updateNestedField, errors: errors }: StepConsentementsProps) {
  const consentements = (data as any).consentements || {}

  const allMandatoryAccepted = consentements.rgpdTraitement && 
    consentements.conditionsGenerales && 
    consentements.politiqueConfidentialite

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-800">
          Conformément au RGPD, nous devons recueillir votre consentement explicite pour le traitement 
          de vos données personnelles. Les consentements marqués d'un * sont obligatoires.
        </AlertDescription>
      </Alert>

      {/* Consentements obligatoires */}
      <Card className="border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-red-800">
            <Shield className="h-5 w-5" />
            Consentements obligatoires
          </CardTitle>
          <CardDescription>
            Ces consentements sont nécessaires pour établir la relation client
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Traitement des données */}
          <div className={cn(
            'p-4 rounded-lg border',
            consentements.rgpdTraitement ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
          )}>
            <div className="flex items-start gap-3">
              <Checkbox
                checked={consentements.rgpdTraitement || false}
                onChange={(checked) => updateNestedField('consentements', 'rgpdTraitement', checked)}
              />
              <div className="flex-1">
                <Label className="font-medium">
                  Traitement des données personnelles                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  J'accepte que mes données personnelles soient collectées et traitées dans le cadre 
                  de la relation de conseil en gestion de patrimoine, conformément à la politique 
                  de confidentialité.
                </p>
              </div>
            </div>
          </div>

          {/* Conditions générales */}
          <div className={cn(
            'p-4 rounded-lg border',
            consentements.conditionsGenerales ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
          )}>
            <div className="flex items-start gap-3">
              <Checkbox
                checked={consentements.conditionsGenerales || false}
                onChange={(checked) => updateNestedField('consentements', 'conditionsGenerales', checked)}
              />
              <div className="flex-1">
                <Label className="font-medium">
                  Conditions générales de service                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  J'ai lu et j'accepte les conditions générales de service et la lettre de mission.
                </p>
                <button 
                  type="button"
                  onClick={() => window.open('/legal/conditions-generales', '_blank')}
                  className="text-sm text-blue-600 hover:underline cursor-pointer"
                >
                  Consulter les conditions générales
                </button>
              </div>
            </div>
          </div>

          {/* Politique de confidentialité */}
          <div className={cn(
            'p-4 rounded-lg border',
            consentements.politiqueConfidentialite ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
          )}>
            <div className="flex items-start gap-3">
              <Checkbox
                checked={consentements.politiqueConfidentialite || false}
                onChange={(checked) => updateNestedField('consentements', 'politiqueConfidentialite', checked)}
              />
              <div className="flex-1">
                <Label className="font-medium">
                  Politique de confidentialité                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  J'ai pris connaissance de la politique de confidentialité et des modalités 
                  d'exercice de mes droits (accès, rectification, suppression, portabilité).
                </p>
                <button 
                  type="button"
                  onClick={() => window.open('/legal/politique-confidentialite', '_blank')}
                  className="text-sm text-blue-600 hover:underline cursor-pointer"
                >
                  Consulter la politique de confidentialité
                </button>
              </div>
            </div>
          </div>

          {!allMandatoryAccepted && (
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-sm text-red-800">
                Vous devez accepter tous les consentements obligatoires pour continuer.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Consentements optionnels */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Préférences de communication (optionnel)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prospection commerciale */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={consentements.prospectionCommerciale || false}
                onChange={(checked) => updateNestedField('consentements', 'prospectionCommerciale', checked)}
              />
              <div className="flex-1">
                <Label className="font-medium">Prospection commerciale</Label>
                <p className="text-sm text-gray-600 mt-1">
                  J'accepte de recevoir des informations sur les produits et services 
                  susceptibles de m'intéresser (newsletters, offres personnalisées).
                </p>
              </div>
            </div>
          </div>

          {/* Partage avec partenaires */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={consentements.partagePartenaires || false}
                onChange={(checked) => updateNestedField('consentements', 'partagePartenaires', checked)}
              />
              <div className="flex-1">
                <Label className="font-medium">Partage avec les partenaires</Label>
                <p className="text-sm text-gray-600 mt-1">
                  J'accepte que mes données soient partagées avec les partenaires sélectionnés 
                  (assureurs, banques) dans le cadre de l'étude de mes projets.
                </p>
              </div>
            </div>
          </div>

          {/* Communication électronique */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={consentements.communicationElectronique || false}
                onChange={(checked) => updateNestedField('consentements', 'communicationElectronique', checked)}
              />
              <div className="flex-1">
                <Label className="font-medium">Communication électronique</Label>
                <p className="text-sm text-gray-600 mt-1">
                  J'accepte de recevoir mes documents par voie électronique 
                  (relevés, avenants, rapports de mission).
                </p>
              </div>
            </div>
          </div>

          {/* Enquêtes satisfaction */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={consentements.enquetesSatisfaction || false}
                onChange={(checked) => updateNestedField('consentements', 'enquetesSatisfaction', checked)}
              />
              <div className="flex-1">
                <Label className="font-medium">Enquêtes de satisfaction</Label>
                <p className="text-sm text-gray-600 mt-1">
                  J'accepte d'être contacté pour des enquêtes de satisfaction 
                  visant à améliorer la qualité de service.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signature électronique */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            Signature électronique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={cn(
            'p-4 rounded-lg border',
            consentements.signatureElectronique ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'
          )}>
            <div className="flex items-start gap-3">
              <Checkbox
                checked={consentements.signatureElectronique || false}
                onChange={(checked) => updateNestedField('consentements', 'signatureElectronique', checked)}
              />
              <div className="flex-1">
                <Label className="font-medium">Acceptation de la signature électronique</Label>
                <p className="text-sm text-gray-600 mt-1">
                  J'accepte que ma signature électronique ait la même valeur juridique 
                  qu'une signature manuscrite pour tous les documents liés à notre relation.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Récapitulatif */}
      {allMandatoryAccepted && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-sm text-green-800">
            <strong>Tous les consentements obligatoires ont été acceptés.</strong> Vous pouvez 
            continuer vers l'étape suivante.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default StepConsentements
