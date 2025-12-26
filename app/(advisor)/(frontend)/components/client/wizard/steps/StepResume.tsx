'use client'

/**
 * Step Résumé final
 * Récapitulatif de toutes les informations saisies
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { 
  User, MapPin, Heart, Briefcase, Shield,
  Target, FileText, CheckCircle, AlertTriangle, Calendar
} from 'lucide-react'
import { cn } from '@/app/_common/lib/utils'
import type { WizardClientDataSimplified } from '@/app/_common/types/client-professionnel.types'

interface StepResumeProps {
  data: Partial<WizardClientDataSimplified>
  updateField: <K extends keyof WizardClientDataSimplified>(field: K, value: WizardClientDataSimplified[K]) => void
  updateNestedField: (parent: string, field: string, value: unknown) => void
  errors: Record<string, string>
}

// Composant pour une section du résumé
function ResumeSection({ 
  icon: Icon, 
  title, 
  children, 
  complete = true 
}: { 
  icon: React.ElementType
  title: string
  children: React.ReactNode
  complete?: boolean
}) {
  return (
    <Card className={cn(!complete && 'border-amber-200')}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className={cn('h-4 w-4', complete ? 'text-green-600' : 'text-amber-600')} />
          {title}
          {complete ? (
            <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-500 ml-auto" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-1">
        {children}
      </CardContent>
    </Card>
  )
}

// Ligne d'information
function InfoLine({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

export function StepResume({ data }: StepResumeProps) {
   
  const dataAny = data as any
  const identite = dataAny.identite || {}
  const coordonnees = dataAny.coordonnees || {}
  const famille = dataAny.situationFamiliale || {}
  const pro = dataAny.situationProfessionnelle || {}
  const kyc = dataAny.kycLcbft || {}
  const profil = dataAny.profilRisque || {}
  const objectifs = dataAny.objectifs || {}
  const consentements = dataAny.consentements || {}

  // Vérifications de complétude
  const identiteComplete = !!(identite.nom && identite.prenom && identite.dateNaissance)
  const coordonneesComplete = !!(coordonnees.emailPersonnel && coordonnees.telephoneMobile)
  const familleComplete = !!famille.situationMatrimoniale
  const proComplete = !!pro.statut
  const kycComplete = !!(kyc.origineFonds && kyc.niveauRisque)
  const profilComplete = !!profil.profilRisque
  const objectifsComplete = objectifs.priorites?.length > 0
  const consentementsComplete = !!(consentements.rgpdTraitement && consentements.conditionsGenerales)

  const allComplete = identiteComplete && coordonneesComplete && familleComplete && 
    proComplete && kycComplete && profilComplete && consentementsComplete

  // Formatage date
  const formatDate = (date: string) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('fr-FR')
  }

  return (
    <div className="space-y-6">
      {allComplete ? (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-sm text-green-800">
            <strong>Dossier complet !</strong> Vous pouvez valider la création du client.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm text-amber-800">
            <strong>Dossier incomplet.</strong> Certaines sections doivent encore être complétées.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Identité */}
        <ResumeSection icon={User} title="Identité" complete={identiteComplete}>
          <InfoLine label="Nom" value={identite.nom} />
          <InfoLine label="Prénom" value={identite.prenom} />
          <InfoLine label="Date de naissance" value={formatDate(identite.dateNaissance)} />
          <InfoLine label="Lieu de naissance" value={identite.lieuNaissance} />
          <InfoLine label="Nationalité" value={identite.nationalite} />
          {identite.typePieceIdentite && (
            <InfoLine label="Pièce d'identité" value={`${identite.typePieceIdentite} - ${identite.numeroPieceIdentite}`} />
          )}
        </ResumeSection>

        {/* Coordonnées */}
        <ResumeSection icon={MapPin} title="Coordonnées" complete={coordonneesComplete}>
          {coordonnees.adresse && (
            <InfoLine 
              label="Adresse" 
              value={`${coordonnees.adresse.ligne1 || ''}, ${coordonnees.adresse.codePostal || ''} ${coordonnees.adresse.ville || ''}`} 
            />
          )}
          <InfoLine label="Email" value={coordonnees.emailPersonnel} />
          <InfoLine label="Téléphone" value={coordonnees.telephoneMobile} />
        </ResumeSection>

        {/* Situation familiale */}
        <ResumeSection icon={Heart} title="Situation familiale" complete={familleComplete}>
          <InfoLine label="Situation" value={famille.situationMatrimoniale?.replace(/_/g, ' ')} />
          {famille.regimeMatrimonial && (
            <InfoLine label="Régime" value={famille.regimeMatrimonial.replace(/_/g, ' ')} />
          )}
          {famille.conjoint?.prenom && (
            <InfoLine label="Conjoint" value={`${famille.conjoint.prenom} ${famille.conjoint.nom || ''}`} />
          )}
          <InfoLine label="Enfants" value={famille.enfants?.length || 0} />
        </ResumeSection>

        {/* Situation professionnelle */}
        <ResumeSection icon={Briefcase} title="Situation professionnelle" complete={proComplete}>
          <InfoLine label="Statut" value={pro.statut?.replace(/_/g, ' ')} />
          <InfoLine label="Profession" value={pro.profession} />
          <InfoLine label="Employeur" value={pro.employeur} />
          {pro.secteurActivite && (
            <InfoLine label="Secteur" value={pro.secteurActivite.replace(/_/g, ' ')} />
          )}
        </ResumeSection>

        {/* KYC / LCB-FT */}
        <ResumeSection icon={Shield} title="KYC / LCB-FT" complete={kycComplete}>
          <InfoLine label="Origine des fonds" value={kyc.origineFonds?.replace(/_/g, ' ')} />
          <InfoLine 
            label="PPE" 
            value={kyc.estPPE ? 'Oui' : 'Non'} 
          />
          <InfoLine label="Niveau de risque" value={kyc.niveauRisque} />
          <InfoLine 
            label="US Person" 
            value={kyc.usPersonFatca ? 'Oui' : 'Non'} 
          />
        </ResumeSection>

        {/* Profil investisseur */}
        <ResumeSection icon={Target} title="Profil investisseur" complete={profilComplete}>
          <InfoLine label="Profil de risque" value={profil.profilRisque?.replace(/_/g, ' ')} />
          <InfoLine label="Horizon" value={profil.horizonInvestissement?.replace(/_/g, ' ')} />
          <InfoLine label="Perte max acceptée" value={profil.perteMaxAcceptee ? `${profil.perteMaxAcceptee}%` : null} />
        </ResumeSection>

        {/* Objectifs */}
        <ResumeSection icon={Target} title="Objectifs" complete={objectifsComplete}>
          {objectifs.priorites?.length > 0 ? (
            <div className="space-y-1">
              {objectifs.priorites.slice(0, 3).map((p: string, i: number) => (
                <div key={p} className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{i + 1}</Badge>
                  <span className="text-xs truncate">{p.replace(/_/g, ' ')}</span>
                </div>
              ))}
              {objectifs.priorites.length > 3 && (
                <span className="text-xs text-gray-500">+{objectifs.priorites.length - 3} autres</span>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-xs">Aucun objectif défini</p>
          )}
        </ResumeSection>

        {/* Consentements */}
        <ResumeSection icon={FileText} title="Consentements" complete={consentementsComplete}>
          <div className="flex items-center gap-2">
            {consentements.rgpdTraitement ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <AlertTriangle className="h-3 w-3 text-red-500" />
            )}
            <span className="text-xs">RGPD</span>
          </div>
          <div className="flex items-center gap-2">
            {consentements.conditionsGenerales ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <AlertTriangle className="h-3 w-3 text-red-500" />
            )}
            <span className="text-xs">CGS</span>
          </div>
          <div className="flex items-center gap-2">
            {consentements.signatureElectronique ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <span className="h-3 w-3 rounded-full bg-gray-200" />
            )}
            <span className="text-xs">Signature électronique</span>
          </div>
        </ResumeSection>
      </div>

      {/* Date de création */}
      <Card className="bg-gray-50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              Date de création du dossier
            </div>
            <span className="font-medium">{new Date().toLocaleDateString('fr-FR')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StepResume
