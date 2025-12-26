 
'use client'

/**
 * Step Profil Investisseur (MIFID II)
 * Questionnaire réglementaire sur les connaissances et la tolérance au risque
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Label } from '@/app/_common/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { RadioGroup, RadioGroupItem } from '@/app/_common/components/ui/RadioGroup'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { TrendingUp, Brain, Clock, AlertTriangle, Info, BarChart3 } from 'lucide-react'
import { cn } from '@/app/_common/lib/utils'
import type { WizardClientDataSimplified } from '@/app/_common/types/client-professionnel.types'

interface StepProfilInvestisseurProps {
  data: Partial<WizardClientDataSimplified>
  updateField: <K extends keyof WizardClientDataSimplified>(field: K, value: WizardClientDataSimplified[K]) => void
  updateNestedField: (parent: string, field: string, value: any) => void
  errors: Record<string, string>
}

// Niveaux de connaissance
const NIVEAUX_CONNAISSANCE = [
  { value: 'AUCUNE', label: 'Aucune', score: 0 },
  { value: 'BASIQUE', label: 'Basique', score: 1 },
  { value: 'MOYENNE', label: 'Moyenne', score: 2 },
  { value: 'BONNE', label: 'Bonne', score: 3 },
  { value: 'EXPERT', label: 'Expert', score: 4 },
]

// Produits financiers
const PRODUITS_FINANCIERS = [
  { id: 'livrets', label: 'Livrets d\'épargne (Livret A, LDDS...)' },
  { id: 'assurance_vie_euros', label: 'Assurance-vie fonds euros' },
  { id: 'assurance_vie_uc', label: 'Assurance-vie unités de compte' },
  { id: 'actions', label: 'Actions cotées' },
  { id: 'obligations', label: 'Obligations' },
  { id: 'opcvm', label: 'OPCVM / FCP / SICAV' },
  { id: 'etf', label: 'ETF / Trackers' },
  { id: 'immobilier_papier', label: 'SCPI / OPCI' },
  { id: 'private_equity', label: 'Private Equity (FIP, FCPI...)' },
  { id: 'produits_structures', label: 'Produits structurés' },
  { id: 'derives', label: 'Produits dérivés (options, warrants...)' },
  { id: 'crypto', label: 'Crypto-actifs' },
]

// Profils de risque
const PROFILS_RISQUE = [
  { 
    value: 'SECURITAIRE', 
    label: 'Sécuritaire', 
    description: 'Priorité à la sécurité du capital. Accepte uniquement des placements garantis.',
    color: 'green',
    allocation: 'Fonds euros 100%'
  },
  { 
    value: 'PRUDENT', 
    label: 'Prudent', 
    description: 'Recherche de stabilité avec une légère prise de risque pour améliorer le rendement.',
    color: 'teal',
    allocation: 'Fonds euros 70-80%, UC 20-30%'
  },
  { 
    value: 'EQUILIBRE', 
    label: 'Équilibré', 
    description: 'Équilibre entre sécurité et performance. Accepte une volatilité modérée.',
    color: 'blue',
    allocation: 'Fonds euros 50%, UC 50%'
  },
  { 
    value: 'DYNAMIQUE', 
    label: 'Dynamique', 
    description: 'Recherche de performance. Accepte une volatilité significative.',
    color: 'amber',
    allocation: 'Fonds euros 30%, UC 70%'
  },
  { 
    value: 'OFFENSIF', 
    label: 'Offensif', 
    description: 'Maximisation du rendement. Accepte une forte volatilité et des pertes potentielles importantes.',
    color: 'red',
    allocation: 'UC 100%'
  },
]

export function StepProfilInvestisseur({ data, updateField: _updateField, updateNestedField, errors: errors }: StepProfilInvestisseurProps) {
  const profil = (data as any).profilRisque || {}
  const connaissances = profil.connaissances || {}

  // Calcul du score de connaissance
  const scoreConnaissance = Object.values(connaissances).reduce((sum: number, level: any) => {
    const found = NIVEAUX_CONNAISSANCE.find(n => n.value === level)
    return sum + (found?.score || 0)
  }, 0) as number

  const maxScore = PRODUITS_FINANCIERS.length * 4
  const pourcentageConnaissance = Math.round((scoreConnaissance / maxScore) * 100)

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-800">
          <strong>Directive MiFID II :</strong> Ce questionnaire permet d'évaluer vos connaissances financières 
          et votre tolérance au risque afin de vous proposer des solutions d'investissement adaptées.
        </AlertDescription>
      </Alert>

      {/* Connaissances financières */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Connaissances financières
          </CardTitle>
          <CardDescription>
            Évaluez votre niveau de connaissance pour chaque type de produit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {PRODUITS_FINANCIERS.map((produit) => (
              <div key={produit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">{produit.label}</span>
                <Select
                  value={connaissances[produit.id] || 'AUCUNE'}
                  onValueChange={(value) => updateNestedField('profilRisque.connaissances', produit.id, value)}
                >
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NIVEAUX_CONNAISSANCE.map((n) => (
                      <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {/* Score global */}
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-purple-800">Score de connaissance</span>
              <span className="text-lg font-bold text-purple-600">{pourcentageConnaissance}%</span>
            </div>
            <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 transition-all"
                style={{ width: `${pourcentageConnaissance}%` }}
              />
            </div>
            <p className="text-xs text-purple-600 mt-2">
              {pourcentageConnaissance < 25 && 'Niveau débutant - Accompagnement conseillé'}
              {pourcentageConnaissance >= 25 && pourcentageConnaissance < 50 && 'Niveau intermédiaire'}
              {pourcentageConnaissance >= 50 && pourcentageConnaissance < 75 && 'Niveau confirmé'}
              {pourcentageConnaissance >= 75 && 'Niveau expert'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tolérance au risque */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-600" />
            Tolérance au risque
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question 1 */}
          <div className="space-y-3">
            <Label className="font-medium">
              Si vos placements perdaient 20% de leur valeur en quelques mois, que feriez-vous ?
            </Label>
            <RadioGroup
              value={profil.reactionPerte || ''}
              onValueChange={(value) => updateNestedField('profilRisque', 'reactionPerte', value)}
              className="space-y-2"
            >
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <RadioGroupItem value="VENDRE_TOUT" />
                <span className="text-sm">Je vendrais tout immédiatement pour limiter les pertes</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <RadioGroupItem value="VENDRE_PARTIEL" />
                <span className="text-sm">Je vendrais une partie pour sécuriser</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <RadioGroupItem value="ATTENDRE" />
                <span className="text-sm">J'attendrais que les marchés remontent</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <RadioGroupItem value="RENFORCER" />
                <span className="text-sm">Je profiterais de la baisse pour investir davantage</span>
              </label>
            </RadioGroup>
          </div>

          {/* Question 2 */}
          <div className="space-y-3">
            <Label className="font-medium">
              Quel niveau de perte maximale seriez-vous prêt à accepter sur 1 an ?
            </Label>
            <RadioGroup
              value={profil.perteMaxAcceptee || ''}
              onValueChange={(value) => updateNestedField('profilRisque', 'perteMaxAcceptee', value)}
              className="space-y-2"
            >
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <RadioGroupItem value="0" />
                <span className="text-sm">Aucune perte (capital garanti uniquement)</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <RadioGroupItem value="5" />
                <span className="text-sm">Jusqu'à 5% de perte</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <RadioGroupItem value="10" />
                <span className="text-sm">Jusqu'à 10% de perte</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <RadioGroupItem value="20" />
                <span className="text-sm">Jusqu'à 20% de perte</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <RadioGroupItem value="30" />
                <span className="text-sm">Plus de 20% si le potentiel de gain est important</span>
              </label>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Horizon d'investissement */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Horizon d'investissement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>
              Sur quelle durée envisagez-vous d'investir ?            </Label>
            <Select
              value={profil.horizonInvestissement || ''}
              onValueChange={(value) => updateNestedField('profilRisque', 'horizonInvestissement', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COURT">Court terme (moins de 2 ans)</SelectItem>
                <SelectItem value="MOYEN_COURT">Moyen-court terme (2-5 ans)</SelectItem>
                <SelectItem value="MOYEN">Moyen terme (5-8 ans)</SelectItem>
                <SelectItem value="LONG">Long terme (8-15 ans)</SelectItem>
                <SelectItem value="TRES_LONG">Très long terme (plus de 15 ans)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {profil.horizonInvestissement === 'COURT' && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800">
                Un horizon court limite les possibilités d'investissement. Privilégiez les supports à capital garanti.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Profil synthétique */}
      <Card className="border-indigo-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-indigo-800">
            <BarChart3 className="h-5 w-5" />
            Profil d'investisseur
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>
              Profil de risque            </Label>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {PROFILS_RISQUE.map((p) => (
                <label
                  key={p.value}
                  className={cn(
                    'flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-colors',
                    profil.profilRisque === p.value
                      ? `bg-${p.color}-50 border-${p.color}-400`
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <input
                    type="radio"
                    name="profilRisque"
                    value={p.value}
                    checked={profil.profilRisque === p.value}
                    onChange={() => updateNestedField('profilRisque', 'profilRisque', p.value)}
                    className="sr-only"
                  />
                  <span className={cn('font-semibold', `text-${p.color}-700`)}>{p.label}</span>
                  <span className="text-xs text-gray-500 mt-1">{p.description}</span>
                  <span className="text-xs font-medium text-gray-400 mt-2">{p.allocation}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StepProfilInvestisseur
