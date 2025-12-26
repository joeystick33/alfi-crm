 
'use client'

/**
 * Step 4: Situation Professionnelle
 * Emploi, statut, entreprise
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { Briefcase, Building, Info, Calendar } from 'lucide-react'
import type { WizardClientDataSimplified } from '@/app/_common/types/client-professionnel.types'

interface StepSituationProfessionnelleProps {
  data: Partial<WizardClientDataSimplified>
  updateField: <K extends keyof WizardClientDataSimplified>(field: K, value: WizardClientDataSimplified[K]) => void
  updateNestedField: (parent: string, field: string, value: unknown) => void
  errors: Record<string, string>
}

// Statuts professionnels
const STATUTS_PROFESSIONNELS = [
  { value: 'SALARIE_PRIVE', label: 'Salarié secteur privé' },
  { value: 'SALARIE_PUBLIC', label: 'Fonctionnaire / Secteur public' },
  { value: 'CADRE', label: 'Cadre' },
  { value: 'CADRE_DIRIGEANT', label: 'Cadre dirigeant' },
  { value: 'TNS', label: 'Travailleur Non Salarié (TNS)' },
  { value: 'PROFESSION_LIBERALE', label: 'Profession libérale' },
  { value: 'GERANT_MAJORITAIRE', label: 'Gérant majoritaire SARL' },
  { value: 'GERANT_MINORITAIRE', label: 'Gérant minoritaire/égalitaire' },
  { value: 'PRESIDENT_SAS', label: 'Président SAS/SASU' },
  { value: 'AUTO_ENTREPRENEUR', label: 'Auto-entrepreneur / Micro' },
  { value: 'CHEF_ENTREPRISE', label: 'Chef d\'entreprise' },
  { value: 'RETRAITE', label: 'Retraité' },
  { value: 'SANS_EMPLOI', label: 'Sans emploi' },
  { value: 'ETUDIANT', label: 'Étudiant' },
  { value: 'AUTRE', label: 'Autre' },
]

// Types de contrat
const TYPES_CONTRAT = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'INTERIM', label: 'Intérim' },
  { value: 'STAGE', label: 'Stage' },
  { value: 'APPRENTISSAGE', label: 'Apprentissage' },
  { value: 'FONCTIONNAIRE', label: 'Fonction publique' },
  { value: 'MANDATAIRE', label: 'Mandataire social' },
]

// Secteurs d'activité
const SECTEURS_ACTIVITE = [
  { value: 'AGRICULTURE', label: 'Agriculture' },
  { value: 'INDUSTRIE', label: 'Industrie' },
  { value: 'CONSTRUCTION', label: 'Construction / BTP' },
  { value: 'COMMERCE', label: 'Commerce' },
  { value: 'TRANSPORT', label: 'Transport / Logistique' },
  { value: 'HOTELLERIE_RESTAURATION', label: 'Hôtellerie / Restauration' },
  { value: 'INFORMATION_COMMUNICATION', label: 'Information / Communication' },
  { value: 'FINANCE_ASSURANCE', label: 'Finance / Assurance' },
  { value: 'IMMOBILIER', label: 'Immobilier' },
  { value: 'SERVICES_ENTREPRISES', label: 'Services aux entreprises' },
  { value: 'ADMINISTRATION_PUBLIQUE', label: 'Administration publique' },
  { value: 'ENSEIGNEMENT', label: 'Enseignement' },
  { value: 'SANTE', label: 'Santé / Action sociale' },
  { value: 'ARTS_SPECTACLES', label: 'Arts / Spectacles' },
  { value: 'AUTRE_SERVICE', label: 'Autres services' },
]

// Catégories socio-professionnelles INSEE
const CSP = [
  { value: 'AGRICULTEUR', label: 'Agriculteur exploitant' },
  { value: 'ARTISAN', label: 'Artisan' },
  { value: 'COMMERCANT', label: 'Commerçant' },
  { value: 'CHEF_ENTREPRISE', label: 'Chef d\'entreprise 10+ salariés' },
  { value: 'PROFESSION_LIBERALE', label: 'Profession libérale' },
  { value: 'CADRE_FONCTION_PUBLIQUE', label: 'Cadre fonction publique' },
  { value: 'PROFESSEUR', label: 'Professeur / Prof. scientifique' },
  { value: 'PROF_INFO_ARTS', label: 'Prof. information/arts/spectacles' },
  { value: 'CADRE_ENTREPRISE', label: 'Cadre administratif et commercial' },
  { value: 'INGENIEUR', label: 'Ingénieur / Cadre technique' },
  { value: 'PROF_INTERMEDIAIRE', label: 'Profession intermédiaire' },
  { value: 'TECHNICIEN', label: 'Technicien' },
  { value: 'EMPLOYE', label: 'Employé' },
  { value: 'OUVRIER_QUALIFIE', label: 'Ouvrier qualifié' },
  { value: 'OUVRIER', label: 'Ouvrier non qualifié' },
  { value: 'RETRAITE', label: 'Retraité' },
  { value: 'SANS_ACTIVITE', label: 'Sans activité professionnelle' },
]

export function StepSituationProfessionnelle({ data, updateField: _updateField, updateNestedField, errors }: StepSituationProfessionnelleProps) {
  const pro = (data as any).situationProfessionnelle || {}
  
  const isActif = !['RETRAITE', 'SANS_EMPLOI', 'ETUDIANT'].includes(pro.statut)
  const isTNS = ['TNS', 'PROFESSION_LIBERALE', 'GERANT_MAJORITAIRE', 'AUTO_ENTREPRENEUR', 'CHEF_ENTREPRISE'].includes(pro.statut)
  const isDirigeant = ['GERANT_MAJORITAIRE', 'GERANT_MINORITAIRE', 'PRESIDENT_SAS', 'CHEF_ENTREPRISE'].includes(pro.statut)

  return (
    <div className="space-y-6">
      {/* Statut actuel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600" />
            Situation actuelle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Statut professionnel              </Label>
              <Select
                value={pro.statut || ''}
                onValueChange={(value) => updateNestedField('situationProfessionnelle', 'statut', value)}
              >
                <SelectTrigger className={errors['situationProfessionnelle.statut'] ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Sélectionnez votre statut" />
                </SelectTrigger>
                <SelectContent>
                  {STATUTS_PROFESSIONNELS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Catégorie socio-professionnelle</Label>
              <Select
                value={pro.csp || ''}
                onValueChange={(value) => updateNestedField('situationProfessionnelle', 'csp', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="CSP INSEE" />
                </SelectTrigger>
                <SelectContent>
                  {CSP.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isActif && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profession">
                  Profession / Fonction                </Label>
                <Input
                  id="profession"
                  value={pro.profession || ''}
                  onChange={(e) => updateNestedField('situationProfessionnelle', 'profession', e.target.value)}
                  placeholder="Directeur financier, Médecin..."
                  className={errors['situationProfessionnelle.profession'] ? 'border-red-500' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label>Secteur d'activité</Label>
                <Select
                  value={pro.secteurActivite || ''}
                  onValueChange={(value) => updateNestedField('situationProfessionnelle', 'secteurActivite', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Secteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTEURS_ACTIVITE.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Alerte régime social */}
          {isTNS && (
            <Alert className="bg-amber-50 border-amber-200">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800">
                <strong>Régime TNS :</strong> Protection sociale spécifique (SSI). Pensez à vérifier les couvertures 
                prévoyance et retraite complémentaires Madelin.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Employeur / Entreprise */}
      {isActif && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-5 w-5 text-indigo-600" />
              {isDirigeant ? 'Entreprise dirigée' : 'Employeur'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employeur">
                  {isDirigeant ? 'Raison sociale' : 'Nom de l\'employeur'}
                </Label>
                <Input
                  id="employeur"
                  value={pro.employeur || ''}
                  onChange={(e) => updateNestedField('situationProfessionnelle', 'employeur', e.target.value)}
                  placeholder="Société XYZ SAS"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siret">SIRET</Label>
                <Input
                  id="siret"
                  value={pro.siret || ''}
                  onChange={(e) => updateNestedField('situationProfessionnelle', 'siret', e.target.value)}
                  placeholder="123 456 789 00012"
                  maxLength={17}
                />
              </div>
            </div>

            {!isTNS && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type de contrat</Label>
                  <Select
                    value={pro.typeContrat || ''}
                    onValueChange={(value) => updateNestedField('situationProfessionnelle', 'typeContrat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type de contrat" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES_CONTRAT.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateEntree">Date d'entrée dans l'entreprise</Label>
                  <Input
                    id="dateEntree"
                    type="date"
                    value={pro.dateEntree || ''}
                    onChange={(e) => updateNestedField('situationProfessionnelle', 'dateEntree', e.target.value)}
                  />
                </div>
              </div>
            )}

            {isDirigeant && (
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 space-y-3">
                <h4 className="font-medium text-indigo-800">Détails de l'entreprise</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Forme juridique</Label>
                    <Select
                      value={pro.formeJuridique || ''}
                      onValueChange={(value) => updateNestedField('situationProfessionnelle', 'formeJuridique', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Forme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SARL">SARL</SelectItem>
                        <SelectItem value="EURL">EURL</SelectItem>
                        <SelectItem value="SAS">SAS</SelectItem>
                        <SelectItem value="SASU">SASU</SelectItem>
                        <SelectItem value="SA">SA</SelectItem>
                        <SelectItem value="SCI">SCI</SelectItem>
                        <SelectItem value="EI">Entreprise Individuelle</SelectItem>
                        <SelectItem value="MICRO">Micro-entreprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capitalSocial">Capital social (€)</Label>
                    <Input
                      id="capitalSocial"
                      type="number"
                      value={pro.capitalSocial || ''}
                      onChange={(e) => updateNestedField('situationProfessionnelle', 'capitalSocial', parseFloat(e.target.value))}
                      placeholder="10000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pourcentageDetention">% de détention</Label>
                    <Input
                      id="pourcentageDetention"
                      type="number"
                      min="0"
                      max="100"
                      value={pro.pourcentageDetention || ''}
                      onChange={(e) => updateNestedField('situationProfessionnelle', 'pourcentageDetention', parseFloat(e.target.value))}
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Carrière */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Historique de carrière
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="debutActivite">Début d'activité professionnelle</Label>
              <Input
                id="debutActivite"
                type="date"
                value={pro.dateDebutActivite || ''}
                onChange={(e) => updateNestedField('situationProfessionnelle', 'dateDebutActivite', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anneesActivite">Années d'activité</Label>
              <Input
                id="anneesActivite"
                type="number"
                min="0"
                value={pro.anneesActivite || ''}
                onChange={(e) => updateNestedField('situationProfessionnelle', 'anneesActivite', parseInt(e.target.value))}
                placeholder="25"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="datePrevueRetraite">Date prévisionnelle de départ en retraite</Label>
            <Input
              id="datePrevueRetraite"
              type="date"
              value={pro.dateRetraitePrevue || ''}
              onChange={(e) => updateNestedField('situationProfessionnelle', 'dateRetraitePrevue', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StepSituationProfessionnelle
