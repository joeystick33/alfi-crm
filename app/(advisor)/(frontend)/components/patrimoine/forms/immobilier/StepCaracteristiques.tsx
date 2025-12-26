'use client'
 

/**
 * Step Caractéristiques - Formulaire Bien Immobilier
 * Surfaces, composition, DPE, équipements
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import Checkbox from '@/app/_common/components/ui/Checkbox'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { cn } from '@/app/_common/lib/utils'
import { 
  Ruler, Home, BedDouble, Bath, Layers, Thermometer, 
  Leaf, Car, Warehouse, Key, Fence, Droplets, Building2, Wifi,
  Shield, AlertCircle, Info
} from 'lucide-react'
import type { BienImmobilier } from '@/app/_common/types/patrimoine.types'

interface StepCaracteristiquesProps {
  data: Partial<BienImmobilier>
  updateField: <K extends keyof BienImmobilier>(field: K, value: BienImmobilier[K]) => void
  updateNestedField: (parent: keyof BienImmobilier, field: string, value: any) => void
  errors: Record<string, string>
}

// Configuration DPE
const DPE_CONFIG = {
  A: { color: 'bg-green-600', label: 'A', kwh: '< 70', description: 'Excellent - Bâtiment très performant' },
  B: { color: 'bg-green-500', label: 'B', kwh: '70-110', description: 'Très bonne performance' },
  C: { color: 'bg-lime-500', label: 'C', kwh: '110-180', description: 'Bonne performance' },
  D: { color: 'bg-yellow-500', label: 'D', kwh: '180-250', description: 'Performance moyenne' },
  E: { color: 'bg-orange-500', label: 'E', kwh: '250-330', description: 'Performance faible' },
  F: { color: 'bg-red-500', label: 'F', kwh: '330-420', description: 'Passoire thermique - Location interdite 2028' },
  G: { color: 'bg-red-700', label: 'G', kwh: '> 420', description: 'Passoire thermique - Location interdite 2025' },
}

// Équipements avec détails
const EQUIPEMENTS = [
  { key: 'parking', label: 'Parking', icon: Car, description: 'Place(s) de stationnement' },
  { key: 'garage', label: 'Garage', icon: Warehouse, description: 'Garage fermé' },
  { key: 'cave', label: 'Cave', icon: Key, description: 'Cave / Cellier' },
  { key: 'balcon', label: 'Balcon', icon: Layers, description: 'Balcon' },
  { key: 'terrasse', label: 'Terrasse', icon: Fence, description: 'Terrasse' },
  { key: 'jardin', label: 'Jardin', icon: Leaf, description: 'Jardin privatif' },
  { key: 'piscine', label: 'Piscine', icon: Droplets, description: 'Piscine' },
  { key: 'ascenseur', label: 'Ascenseur', icon: Building2, description: 'Ascenseur dans l\'immeuble' },
  { key: 'gardien', label: 'Gardien', icon: Shield, description: 'Gardien / Concierge' },
  { key: 'interphone', label: 'Interphone', icon: Wifi, description: 'Interphone / Visiophone' },
  { key: 'digicode', label: 'Digicode', icon: Key, description: 'Digicode / Vigik' },
]

export function StepCaracteristiques({ data, updateField, updateNestedField, errors }: StepCaracteristiquesProps) {
  const equipements = data.equipements || {
    parking: false,
    nombrePlacesParking: 0,
    garage: false,
    cave: false,
    balcon: false,
    terrasse: false,
    jardin: false,
    piscine: false,
    ascenseur: false,
    gardien: false,
    interphone: false,
    digicode: false,
  }

  const dpeInfo = data.dpe ? DPE_CONFIG[data.dpe] : null
  const gesInfo = data.ges ? DPE_CONFIG[data.ges] : null
  const isPassoireThermique = data.dpe === 'F' || data.dpe === 'G'

  return (
    <div className="space-y-6">
      {/* Surfaces */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Ruler className="h-5 w-5 text-blue-600" />
            Surfaces
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="surfaceHabitable">
                Surface habitable (m²) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="surfaceHabitable"
                type="number"
                min="0"
                step="0.01"
                value={data.surfaceHabitable || ''}
                onChange={(e) => updateField('surfaceHabitable', parseFloat(e.target.value) || 0)}
                placeholder="85.50"
                className={errors.surfaceHabitable ? 'border-red-500' : ''}
              />
              {errors.surfaceHabitable && (
                <p className="text-xs text-red-500">{errors.surfaceHabitable}</p>
              )}
              <p className="text-xs text-gray-500">
                Surface loi Carrez pour les lots de copropriété
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="surfaceTerrain">Surface terrain (m²)</Label>
              <Input
                id="surfaceTerrain"
                type="number"
                min="0"
                value={data.surfaceTerrain || ''}
                onChange={(e) => updateField('surfaceTerrain', parseFloat(e.target.value) || undefined)}
                placeholder="500"
              />
              <p className="text-xs text-gray-500">
                Pour maisons et terrains
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="anneeConstruction">Année de construction</Label>
              <Input
                id="anneeConstruction"
                type="number"
                min="1800"
                max={new Date().getFullYear()}
                value={data.anneeConstruction || ''}
                onChange={(e) => updateField('anneeConstruction', parseInt(e.target.value) || undefined)}
                placeholder="1985"
              />
              <p className="text-xs text-gray-500">
                {data.anneeConstruction && data.anneeConstruction < 1949 && 'Bien ancien - Travaux possibles'}
                {data.anneeConstruction && data.anneeConstruction >= 1949 && data.anneeConstruction < 1974 && 'Attention isolation thermique'}
                {data.anneeConstruction && data.anneeConstruction >= 2013 && 'Normes RT 2012 ou RE 2020'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Composition */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Home className="h-5 w-5 text-indigo-600" />
            Composition du bien
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="nombrePieces">Nombre de pièces</Label>
              <Input
                id="nombrePieces"
                type="number"
                min="1"
                max="20"
                value={data.nombrePieces || ''}
                onChange={(e) => updateField('nombrePieces', parseInt(e.target.value) || 0)}
                placeholder="4"
              />
              <p className="text-xs text-gray-500">Pièces principales</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombreChambres" className="flex items-center gap-1">
                <BedDouble className="h-4 w-4" />
                Chambres
              </Label>
              <Input
                id="nombreChambres"
                type="number"
                min="0"
                max="15"
                value={data.nombreChambres || ''}
                onChange={(e) => updateField('nombreChambres', parseInt(e.target.value) || 0)}
                placeholder="3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombreSDB" className="flex items-center gap-1">
                <Bath className="h-4 w-4" />
                Salles de bain / eau
              </Label>
              <Input
                id="nombreSDB"
                type="number"
                min="0"
                max="10"
                value={data.nombreSDB || ''}
                onChange={(e) => updateField('nombreSDB', parseInt(e.target.value) || 0)}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="etage" className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                Étage
              </Label>
              <Input
                id="etage"
                type="number"
                min="0"
                max="50"
                value={data.etage ?? ''}
                onChange={(e) => updateField('etage', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="0 = RDC"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombreEtages">Nombre d'étages (maison)</Label>
              <Input
                id="nombreEtages"
                type="number"
                min="1"
                max="10"
                value={data.nombreEtages || ''}
                onChange={(e) => updateField('nombreEtages', parseInt(e.target.value) || undefined)}
                placeholder="2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DPE / GES */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-green-600" />
            Diagnostics énergétiques
          </CardTitle>
          <CardDescription>
            DPE (Diagnostic de Performance Énergétique) et GES (Gaz à Effet de Serre)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* DPE */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">DPE - Consommation énergétique</Label>
              <Select
                value={data.dpe || ''}
                onValueChange={(value) => updateField('dpe', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez la classe DPE" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DPE_CONFIG).map(([letter, config]) => (
                    <SelectItem key={letter} value={letter}>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold',
                          config.color
                        )}>
                          {letter}
                        </span>
                        <div>
                          <span className="font-medium">{config.kwh} kWh/m²/an</span>
                          <p className="text-xs text-gray-500">{config.description}</p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {dpeInfo && (
                <div className={cn(
                  'p-3 rounded-lg border',
                  isPassoireThermique ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                )}>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'w-10 h-10 rounded flex items-center justify-center text-white text-lg font-bold',
                      dpeInfo.color
                    )}>
                      {data.dpe}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{dpeInfo.kwh} kWh/m²/an</p>
                      <p className="text-xs text-gray-500">{dpeInfo.description}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* GES */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">GES - Émissions de CO₂</Label>
              <Select
                value={data.ges || ''}
                onValueChange={(value) => updateField('ges', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez la classe GES" />
                </SelectTrigger>
                <SelectContent>
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((letter) => (
                    <SelectItem key={letter} value={letter}>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold',
                          DPE_CONFIG[letter as keyof typeof DPE_CONFIG].color
                        )}>
                          {letter}
                        </span>
                        Classe {letter}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {gesInfo && (
                <div className="p-3 rounded-lg border bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'w-10 h-10 rounded flex items-center justify-center text-white text-lg font-bold',
                      gesInfo.color
                    )}>
                      {data.ges}
                    </span>
                    <div>
                      <p className="text-sm font-medium">Classe {data.ges}</p>
                      <p className="text-xs text-gray-500">Émissions de gaz à effet de serre</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Alerte passoire thermique */}
          {isPassoireThermique && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-sm text-red-800">
                <strong>Passoire thermique :</strong> Ce bien est classé {data.dpe} et sera soumis à des restrictions de location :
                <ul className="mt-2 list-disc list-inside">
                  {data.dpe === 'G' && <li><strong>Depuis le 1er janvier 2025</strong> : interdiction de mise en location</li>}
                  {data.dpe === 'F' && <li><strong>À partir du 1er janvier 2028</strong> : interdiction de mise en location</li>}
                  <li>Travaux de rénovation énergétique recommandés</li>
                  <li>Audit énergétique obligatoire avant vente</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Info DPE vierge */}
          {!data.dpe && (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800">
                Le DPE est obligatoire pour toute vente ou location. Un DPE vierge n'est plus accepté depuis 2021.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Équipements */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-5 w-5 text-amber-600" />
            Équipements et annexes
          </CardTitle>
          <CardDescription>
            Cochez les équipements présents dans le bien
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {EQUIPEMENTS.map((item) => {
              const Icon = item.icon
              const isChecked = (equipements as any)[item.key] || false
              return (
                <label 
                  key={item.key} 
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    isChecked 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <Checkbox
                    checked={isChecked}
                    onChange={(checked) => updateNestedField('equipements', item.key, checked)}
                  />
                  <Icon className={cn('h-5 w-5', isChecked ? 'text-blue-600' : 'text-gray-400')} />
                  <div>
                    <span className="text-sm font-medium">{item.label}</span>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                </label>
              )
            })}
          </div>

          {/* Nombre de places parking */}
          {equipements.parking && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <Label htmlFor="nombrePlacesParking">Nombre de places de parking</Label>
              <Input
                id="nombrePlacesParking"
                type="number"
                min="1"
                max="10"
                className="w-32 mt-2"
                value={equipements.nombrePlacesParking || 1}
                onChange={(e) => updateNestedField('equipements', 'nombrePlacesParking', parseInt(e.target.value) || 1)}
              />
            </div>
          )}

          {/* Résumé des équipements */}
          {Object.values(equipements).some(v => v === true) && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Équipements sélectionnés :</strong>{' '}
                {EQUIPEMENTS
                  .filter(e => (equipements as any)[e.key])
                  .map(e => e.label)
                  .join(', ')}
                {equipements.parking && equipements.nombrePlacesParking > 1 && 
                  ` (${equipements.nombrePlacesParking} places parking)`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StepCaracteristiques
