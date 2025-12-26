 
'use client'

/**
 * Formulaire Bien Mobilier Professionnel
 * Véhicules, œuvres d'art, bijoux, collections, équipements...
 */

import { useState, useMemo } from 'react'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Button } from '@/app/_common/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import Checkbox from '@/app/_common/components/ui/Checkbox'
import Textarea from '@/app/_common/components/ui/Textarea'
import { CollapsibleSection, CollapsibleGroup } from '@/app/_common/components/ui/CollapsibleSection'
import { formatCurrency, cn } from '@/app/_common/lib/utils'
import { useToast } from '@/app/_common/hooks/use-toast'
import { 
  Car, Gem, Palette, Watch, Briefcase, Package,
  Euro, Calculator, Shield, MapPin,
  Save, Loader2, ChevronDown,
  Plane, Anchor
} from 'lucide-react'

// =============================================================================
// Types et Constantes
// =============================================================================

interface BienMobilierFormProps {
  clientId: string
  initialData?: Partial<BienMobilier>
  onSave: (data: Partial<BienMobilier>) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
}

interface BienMobilier {
  id?: string
  clientId: string
  type: TypeBienMobilier
  categorie: CategorieBienMobilier
  libelle: string
  description?: string
  marque?: string
  modele?: string
  annee?: number
  numeroSerie?: string
  immatriculation?: string
  valeurAcquisition: number
  dateAcquisition?: string
  valeurActuelle: number
  dateEstimation?: string
  sourceEstimation?: 'EXPERTISE' | 'ARGUS' | 'MARCHE' | 'DECLARATION'
  modeDetention: 'PLEINE_PROPRIETE' | 'INDIVISION' | 'DEMEMBREMENT' | 'SOCIETE'
  quotiteDetention: number
  estAssure: boolean
  assureur?: string
  montantAssurance?: number
  estGage: boolean
  organismePreteur?: string
  capitalRestantDu?: number
  estAmortissable: boolean
  dureeAmortissement?: number
  localisation?: string
  documents?: string[]
  photos?: string[]
  notes?: string
}

type TypeBienMobilier = 
  | 'VEHICULE_TERRESTRE'
  | 'VEHICULE_NAUTIQUE'
  | 'VEHICULE_AERIEN'
  | 'OEUVRE_ART'
  | 'BIJOUX_MONTRES'
  | 'MOBILIER_LUXE'
  | 'COLLECTION'
  | 'EQUIPEMENT_PRO'
  | 'AUTRE'

type CategorieBienMobilier = string

// Catégories de biens mobiliers détaillées
const CATEGORIES_MOBILIER: {
  type: TypeBienMobilier
  label: string
  icon: typeof Car
  color: string
  categories: { value: string; label: string; description: string }[]
}[] = [
  {
    type: 'VEHICULE_TERRESTRE',
    label: 'Véhicules terrestres',
    icon: Car,
    color: 'blue',
    categories: [
      { value: 'VOITURE_PARTICULIER', label: 'Voiture particulier', description: 'Berline, SUV, citadine...' },
      { value: 'VOITURE_LUXE', label: 'Voiture de luxe', description: 'Ferrari, Porsche, Mercedes AMG...' },
      { value: 'VOITURE_COLLECTION', label: 'Voiture de collection', description: 'Véhicule ancien > 30 ans' },
      { value: 'MOTO', label: 'Moto', description: 'Deux-roues motorisé' },
      { value: 'CAMPING_CAR', label: 'Camping-car', description: 'Véhicule de loisirs' },
      { value: 'CARAVANE', label: 'Caravane', description: 'Remorque habitable' },
      { value: 'QUAD_SCOOTER', label: 'Quad / Scooter', description: 'Véhicule léger' },
      { value: 'UTILITAIRE', label: 'Utilitaire', description: 'Véhicule professionnel' },
    ]
  },
  {
    type: 'VEHICULE_NAUTIQUE',
    label: 'Véhicules nautiques',
    icon: Anchor,
    color: 'cyan',
    categories: [
      { value: 'BATEAU_MOTEUR', label: 'Bateau à moteur', description: 'Vedette, yacht...' },
      { value: 'VOILIER', label: 'Voilier', description: 'Bateau à voile' },
      { value: 'JET_SKI', label: 'Jet-ski', description: 'Scooter des mers' },
      { value: 'PENICHE', label: 'Péniche', description: 'Bateau fluvial habitable' },
    ]
  },
  {
    type: 'VEHICULE_AERIEN',
    label: 'Véhicules aériens',
    icon: Plane,
    color: 'indigo',
    categories: [
      { value: 'AVION_PRIVE', label: 'Avion privé', description: 'Aéronef personnel' },
      { value: 'HELICOPTERE', label: 'Hélicoptère', description: 'Voilure tournante' },
      { value: 'ULM', label: 'ULM', description: 'Ultra-léger motorisé' },
      { value: 'PLANEUR', label: 'Planeur', description: 'Aéronef sans moteur' },
    ]
  },
  {
    type: 'OEUVRE_ART',
    label: 'Œuvres d\'art',
    icon: Palette,
    color: 'purple',
    categories: [
      { value: 'PEINTURE', label: 'Peinture', description: 'Tableaux, toiles...' },
      { value: 'SCULPTURE', label: 'Sculpture', description: 'Statues, bronzes...' },
      { value: 'PHOTOGRAPHIE', label: 'Photographie d\'art', description: 'Tirages originaux' },
      { value: 'DESSIN_GRAVURE', label: 'Dessin / Gravure', description: 'Œuvres sur papier' },
      { value: 'ART_CONTEMPORAIN', label: 'Art contemporain', description: 'Installations, vidéo...' },
      { value: 'ANTIQUITE', label: 'Antiquité', description: 'Objet > 100 ans' },
    ]
  },
  {
    type: 'BIJOUX_MONTRES',
    label: 'Bijoux & Montres',
    icon: Watch,
    color: 'amber',
    categories: [
      { value: 'MONTRE_LUXE', label: 'Montre de luxe', description: 'Rolex, Patek Philippe, AP...' },
      { value: 'BIJOU_OR', label: 'Bijou en or', description: 'Chaînes, bracelets, bagues...' },
      { value: 'BIJOU_DIAMANT', label: 'Bijou avec diamants', description: 'Pièces serties' },
      { value: 'BIJOU_PIERRES', label: 'Bijou pierres précieuses', description: 'Rubis, saphir, émeraude...' },
      { value: 'PERLES', label: 'Perles', description: 'Colliers, boucles...' },
      { value: 'BIJOU_FANTAISIE_LUXE', label: 'Haute joaillerie fantaisie', description: 'Créateurs haut de gamme' },
    ]
  },
  {
    type: 'MOBILIER_LUXE',
    label: 'Mobilier de luxe',
    icon: Package,
    color: 'orange',
    categories: [
      { value: 'MOBILIER_EPOQUE', label: 'Mobilier d\'époque', description: 'Louis XV, Art Déco...' },
      { value: 'MOBILIER_DESIGNER', label: 'Mobilier design', description: 'Le Corbusier, Starck...' },
      { value: 'TAPIS_TAPISSERIE', label: 'Tapis / Tapisserie', description: 'Persans, Aubusson...' },
      { value: 'LUMINAIRE', label: 'Luminaires', description: 'Lustres, lampes design...' },
      { value: 'ARGENTERIE', label: 'Argenterie', description: 'Couverts, services...' },
      { value: 'PORCELAINE_CRISTAL', label: 'Porcelaine / Cristal', description: 'Sèvres, Baccarat...' },
    ]
  },
  {
    type: 'COLLECTION',
    label: 'Collections',
    icon: Gem,
    color: 'rose',
    categories: [
      { value: 'VIN', label: 'Cave à vin', description: 'Collection de grands crus' },
      { value: 'WHISKY_SPIRITUEUX', label: 'Whisky / Spiritueux', description: 'Collection de spiritueux' },
      { value: 'TIMBRES', label: 'Timbres', description: 'Philatélie' },
      { value: 'PIECES_MONNAIES', label: 'Pièces / Monnaies', description: 'Numismatique' },
      { value: 'LIVRES_RARES', label: 'Livres rares', description: 'Éditions originales, manuscrits' },
      { value: 'ARMES_ANCIENNES', label: 'Armes anciennes', description: 'Collection déclarée' },
      { value: 'INSTRUMENTS_MUSIQUE', label: 'Instruments de musique', description: 'Stradivarius, pianos...' },
      { value: 'MEMORABILIA', label: 'Memorabilia', description: 'Objets de célébrités, sport...' },
    ]
  },
  {
    type: 'EQUIPEMENT_PRO',
    label: 'Équipements professionnels',
    icon: Briefcase,
    color: 'slate',
    categories: [
      { value: 'MATERIEL_INFORMATIQUE', label: 'Matériel informatique', description: 'Ordinateurs, serveurs...' },
      { value: 'MATERIEL_MEDICAL', label: 'Matériel médical', description: 'Équipement cabinet' },
      { value: 'OUTILLAGE', label: 'Outillage', description: 'Machines, outils...' },
      { value: 'VEHICULE_PRO', label: 'Véhicule professionnel', description: 'Inscrit au bilan' },
      { value: 'STOCK_MARCHANDISES', label: 'Stock de marchandises', description: 'Inventaire' },
    ]
  },
  {
    type: 'AUTRE',
    label: 'Autres biens',
    icon: Package,
    color: 'gray',
    categories: [
      { value: 'ELECTROMENAGER_LUXE', label: 'Électroménager haut de gamme', description: 'Cuisine équipée...' },
      { value: 'EQUIPEMENT_SPORT', label: 'Équipement sportif', description: 'Golf, ski, équitation...' },
      { value: 'ANIMAL_VALEUR', label: 'Animal de valeur', description: 'Chevaux de course, élevage...' },
      { value: 'AUTRE_MOBILIER', label: 'Autre bien mobilier', description: 'Non classé ailleurs' },
    ]
  },
]

// Sources d'estimation
const SOURCES_ESTIMATION = [
  { value: 'EXPERTISE', label: 'Expertise professionnelle', description: 'Commissaire-priseur, expert agréé' },
  { value: 'ARGUS', label: 'Argus / Cote officielle', description: 'Pour véhicules' },
  { value: 'MARCHE', label: 'Prix du marché', description: 'Comparaison ventes récentes' },
  { value: 'DECLARATION', label: 'Déclaration propriétaire', description: 'Estimation personnelle' },
]

// =============================================================================
// Composant Principal
// =============================================================================

export function BienMobilierForm({ clientId, initialData, onSave, onCancel, isEdit = false }: BienMobilierFormProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [expandedType, setExpandedType] = useState<TypeBienMobilier | null>(null)

  const [formData, setFormData] = useState<Partial<BienMobilier>>({
    clientId,
    type: 'VEHICULE_TERRESTRE',
    categorie: '',
    libelle: '',
    valeurAcquisition: 0,
    valeurActuelle: 0,
    modeDetention: 'PLEINE_PROPRIETE',
    quotiteDetention: 100,
    estAssure: false,
    estGage: false,
    estAmortissable: false,
    ...initialData,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Trouver les infos de la catégorie sélectionnée
  const selectedTypeInfo = useMemo(() => {
    return CATEGORIES_MOBILIER.find(t => t.type === formData.type)
  }, [formData.type])

  const selectedCategoryInfo = useMemo(() => {
    if (!selectedTypeInfo) return null
    return selectedTypeInfo.categories.find(c => c.value === formData.categorie)
  }, [selectedTypeInfo, formData.categorie])

  // Plus-value latente
  const plusValueLatente = useMemo(() => {
    const acquisition = formData.valeurAcquisition || 0
    const actuelle = formData.valeurActuelle || 0
    return actuelle - acquisition
  }, [formData.valeurAcquisition, formData.valeurActuelle])

  // Mise à jour
  const updateField = <K extends keyof BienMobilier>(field: K, value: BienMobilier[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field as string]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field as string]
        return next
      })
    }
  }

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.type) newErrors.type = 'Le type est requis'
    if (!formData.categorie) newErrors.categorie = 'La catégorie est requise'
    if (!formData.libelle) newErrors.libelle = 'Le libellé est requis'
    if (!formData.valeurActuelle && formData.valeurActuelle !== 0) {
      newErrors.valeurActuelle = 'La valeur actuelle est requise'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Soumission
  const handleSubmit = async () => {
    if (!validate()) {
      toast({ title: 'Champs requis manquants', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      await onSave(formData)
      toast({
        title: isEdit ? 'Bien modifié' : 'Bien ajouté',
        description: `Le bien "${formData.libelle}" a été ${isEdit ? 'modifié' : 'ajouté'} avec succès`,
      })
    } catch (error) {
      toast({ title: 'Erreur', description: 'Une erreur est survenue', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Afficher des champs spécifiques selon le type
  const showVehicleFields = formData.type === 'VEHICULE_TERRESTRE' || 
                            formData.type === 'VEHICULE_NAUTIQUE' || 
                            formData.type === 'VEHICULE_AERIEN'

  return (
    <div className="flex flex-col">
      {/* Contenu - scroll géré par le modal parent */}
      <div className="p-6">
        <CollapsibleGroup accordion={true} defaultOpenId="type" spacing="sm">
          {/* Sélection du type */}
          <CollapsibleSection
            id="type"
            title="Type de bien mobilier"
            icon={Package}
            iconColor="text-blue-600"
            hasRequired={true}
            hasError={!!errors.categorie}
            defaultOpen={true}
          >
            <div className="space-y-4">
            {/* Types avec accordion */}
            <div className="space-y-2">
              {CATEGORIES_MOBILIER.map((typeInfo) => {
                const Icon = typeInfo.icon
                const isExpanded = expandedType === typeInfo.type
                const hasSelectedItem = formData.type === typeInfo.type && formData.categorie

                return (
                  <div key={typeInfo.type} className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedType(isExpanded ? null : typeInfo.type)
                        if (!isExpanded) {
                          updateField('type', typeInfo.type)
                        }
                      }}
                      className={cn(
                        'w-full flex items-center justify-between p-3 text-left transition-colors',
                        formData.type === typeInfo.type ? `bg-${typeInfo.color}-50` : 'bg-gray-50 hover:bg-gray-100'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={cn('h-5 w-5', `text-${typeInfo.color}-600`)} />
                        <span className="font-medium">{typeInfo.label}</span>
                        {hasSelectedItem && (
                          <span className={cn('text-xs px-2 py-0.5 rounded', `bg-${typeInfo.color}-100 text-${typeInfo.color}-700`)}>
                            {selectedCategoryInfo?.label}
                          </span>
                        )}
                      </div>
                      <ChevronDown className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} />
                    </button>

                    {isExpanded && (
                      <div className="p-3 border-t bg-white grid gap-2 md:grid-cols-2">
                        {typeInfo.categories.map((cat) => (
                          <label
                            key={cat.value}
                            className={cn(
                              'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                              formData.categorie === cat.value
                                ? `bg-${typeInfo.color}-50 border-${typeInfo.color}-300`
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            )}
                          >
                            <input
                              type="radio"
                              name="categorie"
                              value={cat.value}
                              checked={formData.categorie === cat.value}
                              onChange={() => updateField('categorie', cat.value)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{cat.label}</p>
                              <p className="text-xs text-gray-500">{cat.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {errors.categorie && <p className="text-xs text-red-500">{errors.categorie}</p>}
            </div>
          </CollapsibleSection>

          {/* Identification */}
          <CollapsibleSection
            id="identification"
            title="Identification"
            hasRequired={true}
            hasError={!!errors.libelle}
          >
            <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="libelle">
                  Libellé / Désignation <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="libelle"
                  value={formData.libelle || ''}
                  onChange={(e) => updateField('libelle', e.target.value)}
                  placeholder="Ex: Porsche 911 Carrera, Rolex Daytona..."
                  className={errors.libelle ? 'border-red-500' : ''}
                />
                {errors.libelle && <p className="text-xs text-red-500">{errors.libelle}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Description détaillée..."
                />
              </div>
            </div>

            {/* Champs spécifiques véhicules */}
            {showVehicleFields && (
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="marque">Marque</Label>
                  <Input
                    id="marque"
                    value={formData.marque || ''}
                    onChange={(e) => updateField('marque', e.target.value)}
                    placeholder="Ex: Porsche"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modele">Modèle</Label>
                  <Input
                    id="modele"
                    value={formData.modele || ''}
                    onChange={(e) => updateField('modele', e.target.value)}
                    placeholder="Ex: 911 Carrera"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annee">Année</Label>
                  <Input
                    id="annee"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={formData.annee || ''}
                    onChange={(e) => updateField('annee', parseInt(e.target.value) || undefined)}
                    placeholder="2023"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="immatriculation">Immatriculation</Label>
                  <Input
                    id="immatriculation"
                    value={formData.immatriculation || ''}
                    onChange={(e) => updateField('immatriculation', e.target.value)}
                    placeholder="AA-123-BB"
                  />
                </div>
              </div>
            )}

            {/* Champs pour objets de valeur */}
            {!showVehicleFields && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="marque">Artiste / Créateur / Marque</Label>
                  <Input
                    id="marque"
                    value={formData.marque || ''}
                    onChange={(e) => updateField('marque', e.target.value)}
                    placeholder="Ex: Picasso, Rolex, Baccarat..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeroSerie">N° de série / Référence</Label>
                  <Input
                    id="numeroSerie"
                    value={formData.numeroSerie || ''}
                    onChange={(e) => updateField('numeroSerie', e.target.value)}
                    placeholder="Numéro unique d'identification"
                  />
                </div>
              </div>
            )}
            </div>
          </CollapsibleSection>

          {/* Valorisation */}
          <CollapsibleSection
            id="valorisation"
            title="Valorisation"
            icon={Euro}
            iconColor="text-green-600"
            hasRequired={true}
            hasError={!!errors.valeurActuelle}
            badge={formData.valeurActuelle ? formatCurrency(formData.valeurActuelle) : undefined}
            badgeColor="green"
          >
            <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="valeurAcquisition">Valeur d'acquisition (€)</Label>
                <Input
                  id="valeurAcquisition"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.valeurAcquisition || ''}
                  onChange={(e) => updateField('valeurAcquisition', parseFloat(e.target.value) || 0)}
                  placeholder="Prix d'achat"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateAcquisition">Date d'acquisition</Label>
                <Input
                  id="dateAcquisition"
                  type="date"
                  value={formData.dateAcquisition || ''}
                  onChange={(e) => updateField('dateAcquisition', e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="valeurActuelle">
                  Valeur actuelle estimée (€) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="valeurActuelle"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.valeurActuelle || ''}
                  onChange={(e) => updateField('valeurActuelle', parseFloat(e.target.value) || 0)}
                  placeholder="Valeur actuelle"
                  className={errors.valeurActuelle ? 'border-red-500' : ''}
                />
                {errors.valeurActuelle && <p className="text-xs text-red-500">{errors.valeurActuelle}</p>}
              </div>
              <div className="space-y-2">
                <Label>Source de l'estimation</Label>
                <Select
                  value={formData.sourceEstimation || 'DECLARATION'}
                  onValueChange={(value) => updateField('sourceEstimation', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCES_ESTIMATION.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Plus-value latente */}
            <div className={cn(
              'p-4 rounded-lg border',
              plusValueLatente >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className={cn('h-5 w-5', plusValueLatente >= 0 ? 'text-green-600' : 'text-red-600')} />
                  <span className={cn('font-medium', plusValueLatente >= 0 ? 'text-green-800' : 'text-red-800')}>
                    {plusValueLatente >= 0 ? 'Plus-value latente' : 'Moins-value latente'}
                  </span>
                </div>
                <span className={cn('text-xl font-bold', plusValueLatente >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {plusValueLatente >= 0 ? '+' : ''}{formatCurrency(plusValueLatente)}
                </span>
              </div>
            </div>
            </div>
          </CollapsibleSection>

          {/* Détention */}
          <CollapsibleSection
            id="detention"
            title="Mode de détention"
          >
            <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Mode de détention</Label>
                <Select
                  value={formData.modeDetention || 'PLEINE_PROPRIETE'}
                  onValueChange={(value) => updateField('modeDetention', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLEINE_PROPRIETE">Pleine propriété</SelectItem>
                    <SelectItem value="INDIVISION">Indivision</SelectItem>
                    <SelectItem value="DEMEMBREMENT">Démembrement</SelectItem>
                    <SelectItem value="SOCIETE">Via une société</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quotiteDetention">Quote-part détenue (%)</Label>
                <Input
                  id="quotiteDetention"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.quotiteDetention || 100}
                  onChange={(e) => updateField('quotiteDetention', parseFloat(e.target.value) || 100)}
                />
              </div>
            </div>
            </div>
          </CollapsibleSection>

          {/* Assurance & Financement */}
          <CollapsibleSection
            id="assurance"
            title="Assurance & Financement"
            icon={Shield}
            iconColor="text-purple-600"
          >
            <div className="space-y-4">
            {/* Assurance */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <Checkbox
                checked={formData.estAssure || false}
                onChange={(checked) => updateField('estAssure', checked)}
              />
              <div>
                <Label className="font-medium">Bien assuré</Label>
                <p className="text-xs text-gray-500">Ce bien est couvert par une assurance</p>
              </div>
            </div>

            {formData.estAssure && (
              <div className="grid gap-4 md:grid-cols-2 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="assureur">Assureur</Label>
                  <Input
                    id="assureur"
                    value={formData.assureur || ''}
                    onChange={(e) => updateField('assureur', e.target.value)}
                    placeholder="Nom de l'assureur"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="montantAssurance">Valeur assurée (€)</Label>
                  <Input
                    id="montantAssurance"
                    type="number"
                    min="0"
                    value={formData.montantAssurance || ''}
                    onChange={(e) => updateField('montantAssurance', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            )}

            {/* Financement */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <Checkbox
                checked={formData.estGage || false}
                onChange={(checked) => updateField('estGage', checked)}
              />
              <div>
                <Label className="font-medium">Bien financé / gagé</Label>
                <p className="text-xs text-gray-500">Ce bien est financé par un crédit</p>
              </div>
            </div>

            {formData.estGage && (
              <div className="grid gap-4 md:grid-cols-2 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="organismePreteur">Organisme prêteur</Label>
                  <Input
                    id="organismePreteur"
                    value={formData.organismePreteur || ''}
                    onChange={(e) => updateField('organismePreteur', e.target.value)}
                    placeholder="Banque ou organisme de crédit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capitalRestantDu">Capital restant dû (€)</Label>
                  <Input
                    id="capitalRestantDu"
                    type="number"
                    min="0"
                    value={formData.capitalRestantDu || ''}
                    onChange={(e) => updateField('capitalRestantDu', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            )}

            {/* Amortissement (pour équipements pro) */}
            {formData.type === 'EQUIPEMENT_PRO' && (
              <>
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <Checkbox
                    checked={formData.estAmortissable || false}
                    onChange={(checked) => updateField('estAmortissable', checked)}
                  />
                  <div>
                    <Label className="font-medium">Bien amortissable</Label>
                    <p className="text-xs text-gray-500">Ce bien est amorti comptablement</p>
                  </div>
                </div>

                {formData.estAmortissable && (
                  <div className="pl-6">
                    <div className="space-y-2 max-w-xs">
                      <Label htmlFor="dureeAmortissement">Durée d'amortissement (années)</Label>
                      <Input
                        id="dureeAmortissement"
                        type="number"
                        min="1"
                        max="30"
                        value={formData.dureeAmortissement || ''}
                        onChange={(e) => updateField('dureeAmortissement', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
            </div>
          </CollapsibleSection>

          {/* Localisation & Notes */}
          <CollapsibleSection
            id="infos"
            title="Informations complémentaires"
            icon={MapPin}
            iconColor="text-gray-600"
          >
            <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="localisation">Localisation / Lieu de stockage</Label>
              <Input
                id="localisation"
                value={formData.localisation || ''}
                onChange={(e) => updateField('localisation', e.target.value)}
                placeholder="Ex: Garage résidence principale, Coffre-fort banque, Port de..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Notes complémentaires, historique, certificats..."
                rows={3}
              />
            </div>
            </div>
          </CollapsibleSection>
        </CollapsibleGroup>

        {/* Footer avec boutons d'action */}
        <div className="pt-4 border-t flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEdit ? 'Enregistrer' : 'Créer le bien'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default BienMobilierForm
