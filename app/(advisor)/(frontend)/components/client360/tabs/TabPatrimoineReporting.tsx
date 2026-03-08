'use client'
 

/**
 * TabPatrimoineReporting - Patrimoine & Reporting complet
 * Fusion des actifs, passifs et reporting avec graphiques
 */

import { useState, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/app/_common/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/_common/components/ui/Dialog'
import { formatCurrency, formatPercentage, formatDate } from '@/app/_common/lib/utils'
import { formatLabel, formatAssetType } from '@/app/_common/lib/labels'
import { useToast } from '@/app/_common/hooks/use-toast'
import { Wallet, Home, Briefcase, TrendingUp, TrendingDown, Plus, RefreshCw, Edit, Trash2, PiggyBank, CreditCard, BarChart3, ChevronDown, Loader2, ClipboardList } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { PatrimoineFormModal, type PatrimoineFormType, BilanPatrimonialWizard } from '../modals'
import { ActifFormWizard } from '../../patrimoine/ActifFormWizard'
import { PassifFormWizard } from '../../patrimoine/PassifFormWizard'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'

interface TabPatrimoineReportingProps {
  clientId: string
  client: ClientDetail
  wealth?: WealthSummary
}

interface Actif {
  id: string
  type: string // Prisma ActifType: REAL_ESTATE_MAIN, LIFE_INSURANCE, etc.
  category: string // Prisma ActifCategory: IMMOBILIER, FINANCIER, PROFESSIONNEL, AUTRE
  name: string
  value: number
  acquisitionValue: number
  acquisitionDate: string | null
  managedByFirm: boolean
  details: Record<string, any>
}

interface Passif {
  id: string
  type: string
  name: string
  initialAmount: number
  remainingAmount: number
  interestRate: number
  monthlyPayment: number
  endDate: string | null
}

const CHART_COLORS = ['#7373FF', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899']

const ASSET_TYPES = [
  { value: 'IMMOBILIER', label: 'Immobilier', icon: Home, color: 'bg-blue-500' },
  { value: 'FINANCIER', label: 'Financier', icon: PiggyBank, color: 'bg-emerald-500' },
  { value: 'EPARGNE_SALARIALE', label: 'Épargne salariale', icon: Briefcase, color: 'bg-indigo-500' },
  { value: 'EPARGNE_RETRAITE', label: 'Épargne retraite', icon: TrendingUp, color: 'bg-orange-500' },
  { value: 'PROFESSIONNEL', label: 'Professionnel', icon: Briefcase, color: 'bg-purple-500' },
  { value: 'MOBILIER', label: 'Mobilier', icon: Wallet, color: 'bg-amber-500' },
  { value: 'AUTRE', label: 'Autres', icon: Wallet, color: 'bg-gray-500' },
]

// Utilise les valeurs Prisma (anglais) avec labels français
const PASSIF_TYPES = [
  { value: 'MORTGAGE', label: 'Crédit immobilier' },
  { value: 'CONSUMER_LOAN', label: 'Crédit consommation' },
  { value: 'PROFESSIONAL_LOAN', label: 'Prêt professionnel' },
  { value: 'REVOLVING_CREDIT', label: 'Crédit revolving' },
  { value: 'BRIDGE_LOAN', label: 'Prêt relais' },
  { value: 'AUTRE', label: 'Autre dette' },
]

// Traductions françaises pour tous les types d'actifs (Prisma ActifType → FR)
// Doit correspondre exactement aux valeurs de l'enum ActifType dans schema.prisma
const CATEGORY_LABELS: Record<string, string> = {
  // === IMMOBILIER ===
  'RESIDENCE_PRINCIPALE': 'Résidence principale',
  'IMMOBILIER_LOCATIF': 'Immobilier locatif',
  'RESIDENCE_SECONDAIRE': 'Résidence secondaire',
  'IMMOBILIER_COMMERCIAL': 'Immobilier commercial',
  'SCPI': 'SCPI',
  'SCI': 'SCI',
  'OPCI': 'OPCI',
  'CROWDFUNDING_IMMO': 'Crowdfunding immobilier',
  'VIAGER': 'Viager',
  'NUE_PROPRIETE': 'Nue-propriété',
  'USUFRUIT': 'Usufruit',
  // Legacy aliases
  'REAL_ESTATE_MAIN': 'Résidence principale',
  'REAL_ESTATE_SECONDARY': 'Résidence secondaire',
  'REAL_ESTATE_RENTAL': 'Immobilier locatif',
  'PROFESSIONAL_REAL_ESTATE': 'Immobilier professionnel',
  'TERRAIN': 'Terrain',
  
  // === ÉPARGNE SALARIALE ===
  'PEE': 'PEE',
  'PEG': 'PEG',
  'PERCO': 'PERCO',
  'PERECO': 'PER Collectif',
  'CET': 'Compte Épargne Temps',
  'PARTICIPATION': 'Participation',
  'INTERESSEMENT': 'Intéressement',
  'STOCK_OPTIONS': 'Stock-options',
  'ACTIONS_GRATUITES': 'Actions gratuites',
  'BSPCE': 'BSPCE',
  
  // === ÉPARGNE RETRAITE ===
  'PER': 'PER',
  'PERP': 'PERP',
  'MADELIN': 'Contrat Madelin',
  'ARTICLE_83': 'Article 83',
  'PREFON': 'PREFON',
  'COREM': 'COREM',
  
  // === PLACEMENTS FINANCIERS ===
  'ASSURANCE_VIE': 'Assurance vie',
  'CONTRAT_CAPITALISATION': 'Contrat de capitalisation',
  'COMPTE_TITRES': 'Compte-titres',
  'PEA': 'PEA',
  'PEA_PME': 'PEA-PME',
  // Legacy
  'SECURITIES_ACCOUNT': 'Compte-titres',
  
  // === ÉPARGNE BANCAIRE ===
  'COMPTE_BANCAIRE': 'Compte bancaire',
  'LIVRETS': 'Livrets',
  'PEL': 'PEL',
  'CEL': 'CEL',
  'COMPTE_A_TERME': 'Compte à terme',
  // Legacy
  'BANK_ACCOUNT': 'Compte bancaire',
  'SAVINGS_ACCOUNT': 'Livret d\'épargne',
  'LIVRET_A': 'Livret A',
  'LDDS': 'LDDS',
  'LEP': 'LEP',
  'COMPTE_COURANT': 'Compte courant',
  
  // === ACTIFS PROFESSIONNELS ===
  'PARTS_SOCIALES': 'Parts sociales',
  'IMMOBILIER_PRO': 'Immobilier professionnel',
  'MATERIEL_PRO': 'Matériel professionnel',
  'FONDS_COMMERCE': 'Fonds de commerce',
  'BREVETS_PI': 'Brevets et PI',
  // Legacy
  'COMPANY_SHARES': 'Parts sociales',
  
  // === MOBILIER & DIVERS ===
  'METAUX_PRECIEUX': 'Métaux précieux',
  'BIJOUX': 'Bijoux',
  'OEUVRES_ART': 'Œuvres d\'art',
  'VINS': 'Vins & spiritueux',
  'MONTRES': 'Montres de collection',
  'VEHICULES': 'Véhicules',
  'CRYPTO': 'Portefeuille cryptomonnaie',
  'NFT': 'NFT',
  // Legacy
  'PRECIOUS_METALS': 'Métaux précieux',
  'ART_COLLECTION': 'Œuvres d\'art',
  'VEHICULE': 'Véhicule',
  'BATEAU': 'Bateau',
  'OEUVRE_ART': 'Œuvre d\'art',
  'COLLECTION': 'Collection',
  
  // === PASSIFS (Prisma PassifType) ===
  'MORTGAGE': 'Crédit immobilier',
  'MORTGAGE_PTZ': 'PTZ',
  'MORTGAGE_ACTION_LOG': 'Action Logement',
  'CONSUMER_LOAN': 'Crédit consommation',
  'CAR_LOAN': 'Crédit auto',
  'STUDENT_LOAN': 'Prêt étudiant',
  'PROFESSIONAL_LOAN': 'Prêt professionnel',
  'REVOLVING_CREDIT': 'Crédit revolving',
  'BRIDGE_LOAN': 'Prêt relais',
  'IN_FINE_LOAN': 'Prêt in fine',
  'FAMILY_LOAN': 'Prêt familial',
  'OVERDRAFT': 'Découvert',
  'LEASING': 'Leasing',
  
  // === CATÉGORIES GÉNÉRIQUES ===
  'IMMOBILIER': 'Immobilier',
  'FINANCIER': 'Financier',
  'EPARGNE_SALARIALE': 'Épargne salariale',
  'EPARGNE_RETRAITE': 'Épargne retraite',
  'PROFESSIONNEL': 'Professionnel',
  'MOBILIER': 'Mobilier',
  'AUTRE': 'Autre',
}

const VALID_CATEGORIES = [
  'IMMOBILIER',
  'FINANCIER',
  'EPARGNE_SALARIALE',
  'EPARGNE_RETRAITE',
  'PROFESSIONNEL',
  'MOBILIER',
  'AUTRE',
] as const

type CategoryValue = (typeof VALID_CATEGORIES)[number]

// Mapping complet des ActifType Prisma vers les catégories d'affichage
// Doit correspondre exactement aux valeurs de l'enum ActifType dans schema.prisma
const CATEGORY_TYPE_MAP: Record<CategoryValue, string[]> = {
  IMMOBILIER: [
    // Prisma ActifType - IMMOBILIER
    'RESIDENCE_PRINCIPALE',
    'IMMOBILIER_LOCATIF',
    'RESIDENCE_SECONDAIRE',
    'IMMOBILIER_COMMERCIAL',
    'SCPI',
    'SCI',
    'OPCI',
    'CROWDFUNDING_IMMO',
    'VIAGER',
    'NUE_PROPRIETE',
    'USUFRUIT',
    // Legacy / aliases
    'REAL_ESTATE_MAIN',
    'REAL_ESTATE_SECONDARY',
    'REAL_ESTATE_RENTAL',
    'TERRAIN',
    'IMMOBILIER',
  ],
  FINANCIER: [
    // Prisma ActifType - PLACEMENTS FINANCIERS
    'ASSURANCE_VIE',
    'CONTRAT_CAPITALISATION',
    'COMPTE_TITRES',
    'PEA',
    'PEA_PME',
    // Prisma ActifType - ÉPARGNE BANCAIRE
    'COMPTE_BANCAIRE',
    'LIVRETS',
    'PEL',
    'CEL',
    'COMPTE_A_TERME',
    // Crypto (déplacé ici depuis MOBILIER)
    'CRYPTO',
    // Legacy / aliases
    'BANK_ACCOUNT',
    'SAVINGS_ACCOUNT',
    'LIVRET_A',
    'LDDS',
    'LEP',
    'SECURITIES_ACCOUNT',
    'COMPTE_COURANT',
    'BOND',
    'ETF',
    'FONDS_EUROS',
    'FINANCIER',
  ],
  EPARGNE_SALARIALE: [
    // Prisma ActifType - ÉPARGNE SALARIALE
    'PEE',
    'PEG',
    'PERCO',
    'PERECO',
    'CET',
    'PARTICIPATION',
    'INTERESSEMENT',
    'STOCK_OPTIONS',
    'ACTIONS_GRATUITES',
    'BSPCE',
    // Category marker
    'EPARGNE_SALARIALE',
  ],
  EPARGNE_RETRAITE: [
    // Prisma ActifType - ÉPARGNE RETRAITE
    'PER',
    'PERP',
    'MADELIN',
    'ARTICLE_83',
    'PREFON',
    'COREM',
    // Category marker
    'EPARGNE_RETRAITE',
  ],
  PROFESSIONNEL: [
    // Prisma ActifType - ACTIFS PROFESSIONNELS
    'PARTS_SOCIALES',
    'IMMOBILIER_PRO',
    'MATERIEL_PRO',
    'FONDS_COMMERCE',
    'BREVETS_PI',
    // Legacy / aliases
    'COMPANY_SHARES',
    'PROFESSIONAL_REAL_ESTATE',
    'PROFESSIONNEL',
  ],
  MOBILIER: [
    // Prisma ActifType - MOBILIER & DIVERS
    'METAUX_PRECIEUX',
    'BIJOUX',
    'OEUVRES_ART',
    'VINS',
    'MONTRES',
    'VEHICULES',
    'MOBILIER',
    'NFT',
    // Legacy / aliases
    'VEHICULE',
    'BATEAU',
    'OEUVRE_ART',
    'COLLECTION',
  ],
  AUTRE: [
    'AUTRE',
  ],
}

/**
 * Détermine la catégorie d'affichage d'un actif.
 * PRIORITÉ : le type est plus fiable que la catégorie DB car plus spécifique.
 * Ex: un PER doit toujours aller en EPARGNE_RETRAITE, même si la DB dit FINANCIER.
 */
const inferCategory = (category?: string, type?: string): CategoryValue => {
  const normalizedType = (type || '').toUpperCase()
  
  // 1. D'abord vérifier le type (plus spécifique et fiable)
  for (const cat of VALID_CATEGORIES) {
    if (CATEGORY_TYPE_MAP[cat].includes(normalizedType)) {
      return cat
    }
  }
  
  // 2. Ensuite vérifier la catégorie DB si le type n'est pas mappé
  const normalizedCategory = (category || '').toUpperCase()
  if (VALID_CATEGORIES.includes(normalizedCategory as CategoryValue)) {
    return normalizedCategory as CategoryValue
  }

  return 'AUTRE'
}

// Fonction helper pour traduire une catégorie (utilise le fichier labels.ts centralisé)
const translateCategory = (category: string): string => {
  return formatLabel(category)
}

const ChartPlaceholder = ({ label = 'Chargement du graphique...' }: { label?: string }) => (
  <div className="h-full min-h-[12rem] flex flex-col items-center justify-center rounded-md border border-dashed border-gray-200 bg-muted/40 text-sm text-muted-foreground">
    <Loader2 className="h-5 w-5 animate-spin mb-2 text-primary" />
    <span>{label}</span>
  </div>
)

// =============================================================================
// Segmentation CGP Professionnelle
// =============================================================================

interface SegmentationCGP {
  immobilierUsage: Actif[]
  immobilierRapport: Actif[]
  liquidites: Actif[]
  epargneMoyenTerme: Actif[]
  epargneLongTerme: Actif[]
  passifsCourtTerme: Passif[]
  passifsLongTerme: Passif[]
}

function segmenterPatrimoineCGP(actifs: Actif[], passifs: Passif[]): SegmentationCGP {
  const result: SegmentationCGP = {
    immobilierUsage: [],
    immobilierRapport: [],
    liquidites: [],
    epargneMoyenTerme: [],
    epargneLongTerme: [],
    passifsCourtTerme: [],
    passifsLongTerme: [],
  }

  actifs.forEach((actif) => {
    const type = (actif.type || actif.category || '').toUpperCase()
    
    // Immobilier d'usage (RP, secondaire) - Types Prisma français
    if (['RESIDENCE_PRINCIPALE', 'RESIDENCE_SECONDAIRE'].some(t => type.includes(t))) {
      result.immobilierUsage.push(actif)
    }
    // Immobilier de rapport (locatif, SCPI, SCI, OPCI) - Types Prisma français
    else if (['IMMOBILIER_LOCATIF', 'IMMOBILIER_COMMERCIAL', 'SCPI', 'SCI', 'OPCI', 'CROWDFUNDING_IMMO', 'VIAGER', 'NUE_PROPRIETE', 'USUFRUIT'].some(t => type.includes(t))) {
      result.immobilierRapport.push(actif)
    }
    // Liquidités (comptes courants, livrets) - Types Prisma français
    else if (['COMPTE_BANCAIRE', 'LIVRETS', 'COMPTE_A_TERME'].some(t => type.includes(t))) {
      result.liquidites.push(actif)
    }
    // Épargne moyen terme (PEL, CEL) - Types Prisma français
    else if (['PEL', 'CEL'].some(t => type.includes(t))) {
      result.epargneMoyenTerme.push(actif)
    }
    // Épargne long terme (AV, PER, PEA, épargne salariale) - Types Prisma français
    else if (['ASSURANCE_VIE', 'CONTRAT_CAPITALISATION', 'COMPTE_TITRES', 'PER', 'PERP', 'MADELIN', 'ARTICLE_83', 'PREFON', 'COREM', 'PEA', 'PEA_PME', 'PEE', 'PEG', 'PERCO', 'PERECO', 'PARTICIPATION', 'INTERESSEMENT'].some(t => type.includes(t))) {
      result.epargneLongTerme.push(actif)
    }
  })

  passifs.forEach((passif) => {
    const type = (passif.type || '').toUpperCase()
    
    // Passifs court terme (conso, auto, découvert, revolving) - Types Prisma
    if (['CONSUMER_LOAN', 'CAR_LOAN', 'REVOLVING_CREDIT', 'OVERDRAFT', 'LEASING', 'STUDENT_LOAN', 'FAMILY_LOAN'].some(t => type.includes(t))) {
      result.passifsCourtTerme.push(passif)
    }
    // Passifs long terme (immobilier) - Types Prisma
    else if (['MORTGAGE', 'MORTGAGE_PTZ', 'MORTGAGE_ACTION_LOG', 'BRIDGE_LOAN', 'IN_FINE_LOAN', 'PROFESSIONAL_LOAN'].some(t => type.includes(t))) {
      result.passifsLongTerme.push(passif)
    }
    else {
      // Par défaut, court terme
      result.passifsCourtTerme.push(passif)
    }
  })

  return result
}

// Graphiques CGP
function RepartitionImmobilierCGP({ segmentation }: { segmentation: SegmentationCGP }) {
  const usageTotal = segmentation.immobilierUsage.reduce((s, a) => s + a.value, 0)
  const rapportTotal = segmentation.immobilierRapport.reduce((s, a) => s + a.value, 0)
  const total = usageTotal + rapportTotal

  const chartData = [
    { name: 'Usage personnel', value: usageTotal, color: '#3B82F6', description: 'RP, résidence secondaire' },
    { name: 'Investissement', value: rapportTotal, color: '#10B981', description: 'Locatif, SCPI, SCI' },
  ].filter(d => d.value > 0)

  if (total === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Home className="h-4 w-4 text-blue-500" />
        <h4 className="text-sm font-semibold text-gray-900">Répartition Immobilier</h4>
      </div>
      <div className="flex items-center gap-4">
        <div style={{ width: 96, height: 96 }}>
          <ResponsiveContainer width={96} height={96}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={20} outerRadius={40} paddingAngle={2} dataKey="value">
                {chartData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900">{item.name}</p>
                <p className="text-[10px] text-gray-500">{item.description}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-900">{formatCurrency(item.value)}</p>
                <p className="text-[10px] text-gray-500">{((item.value / total) * 100).toFixed(0)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RepartitionFinancierCGP({ segmentation }: { segmentation: SegmentationCGP }) {
  const liquiditesTotal = segmentation.liquidites.reduce((s, a) => s + a.value, 0)
  const moyenTermeTotal = segmentation.epargneMoyenTerme.reduce((s, a) => s + a.value, 0)
  const longTermeTotal = segmentation.epargneLongTerme.reduce((s, a) => s + a.value, 0)
  const total = liquiditesTotal + moyenTermeTotal + longTermeTotal

  const chartData = [
    { name: 'Liquidités', value: liquiditesTotal, color: '#06B6D4', description: 'Comptes, livrets' },
    { name: 'Moyen terme', value: moyenTermeTotal, color: '#8B5CF6', description: 'PEL, CEL, CAT' },
    { name: 'Long terme', value: longTermeTotal, color: '#10B981', description: 'AV, PER, PEA' },
  ].filter(d => d.value > 0)

  if (total === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <PiggyBank className="h-4 w-4 text-emerald-500" />
        <h4 className="text-sm font-semibold text-gray-900">Répartition Épargne</h4>
      </div>
      <div className="flex items-center gap-4">
        <div style={{ width: 96, height: 96 }}>
          <ResponsiveContainer width={96} height={96}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={20} outerRadius={40} paddingAngle={2} dataKey="value">
                {chartData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900">{item.name}</p>
                <p className="text-[10px] text-gray-500">{item.description}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-900">{formatCurrency(item.value)}</p>
                <p className="text-[10px] text-gray-500">{((item.value / total) * 100).toFixed(0)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RepartitionPassifsCGP({ segmentation }: { segmentation: SegmentationCGP }) {
  const courtTermeTotal = segmentation.passifsCourtTerme.reduce((s, p) => s + p.remainingAmount, 0)
  const longTermeTotal = segmentation.passifsLongTerme.reduce((s, p) => s + p.remainingAmount, 0)
  const total = courtTermeTotal + longTermeTotal

  const mensualiteCT = segmentation.passifsCourtTerme.reduce((s, p) => s + p.monthlyPayment, 0)
  const mensualiteLT = segmentation.passifsLongTerme.reduce((s, p) => s + p.monthlyPayment, 0)

  const chartData = [
    { name: 'Court terme', value: courtTermeTotal, color: '#F59E0B', description: 'Conso, découvert' },
    { name: 'Long terme', value: longTermeTotal, color: '#EF4444', description: 'Crédits immobiliers' },
  ].filter(d => d.value > 0)

  if (total === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <CreditCard className="h-4 w-4 text-red-500" />
        <h4 className="text-sm font-semibold text-gray-900">Structure Endettement</h4>
      </div>
      <div className="flex items-center gap-4">
        <div style={{ width: 96, height: 96 }}>
          <ResponsiveContainer width={96} height={96}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={20} outerRadius={40} paddingAngle={2} dataKey="value">
                {chartData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900">{item.name}</p>
                <p className="text-[10px] text-gray-500">{item.description}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-red-600">{formatCurrency(item.value)}</p>
                <p className="text-[10px] text-gray-500">{((item.value / total) * 100).toFixed(0)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* KPIs mensualités */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
        <div className="text-center p-2 bg-amber-50 rounded-lg">
          <p className="text-[10px] text-gray-500">Mensualités CT</p>
          <p className="text-xs font-semibold text-amber-700">{formatCurrency(mensualiteCT)}/mois</p>
        </div>
        <div className="text-center p-2 bg-red-50 rounded-lg">
          <p className="text-[10px] text-gray-500">Mensualités LT</p>
          <p className="text-xs font-semibold text-red-700">{formatCurrency(mensualiteLT)}/mois</p>
        </div>
      </div>
    </div>
  )
}

// Composant carte de catégorie avec accordion
function CategoryCard({ 
  category, 
  actifs, 
  onAddActif, 
  onEditActif, 
  onDeleteActif 
}: { 
  category: { value: string; label: string; icon: React.ComponentType<{ className?: string }>; color: string }
  actifs: Actif[]
  onAddActif: () => void
  onEditActif: (actif: Actif) => void
  onDeleteActif: (actif: Actif) => void
}) {
  const [isExpanded, setIsExpanded] = useState(actifs.length > 0)
  const Icon = category.icon
  const categoryTotal = actifs.reduce((sum, a) => sum + a.value, 0)
  
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header cliquable */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl text-white ${category.color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">{category.label}</p>
            <p className="text-xs text-gray-500">{actifs.length} actif{actifs.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-gray-900">{formatCurrency(categoryTotal)}</span>
          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      
      {/* Contenu expandable */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {actifs.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-400 mb-3">Aucun actif dans cette catégorie</p>
              <Button variant="outline" size="sm" onClick={onAddActif}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {actifs.map((actif) => {
                const typeLabel = formatAssetType(actif.type)
                return (
                  <div key={actif.id} className="p-4 hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{actif.name}</p>
                        {actif.managedByFirm && (
                          <span className="text-[10px] px-2 py-0.5 bg-[#7373FF]/10 text-[#7373FF] rounded-full font-semibold">
                            Géré
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{formatCurrency(actif.value)}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0 rounded-lg"
                            onClick={() => onEditActif(actif)}
                          >
                            <Edit className="h-3.5 w-3.5 text-gray-500" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0 rounded-lg hover:bg-red-50"
                            onClick={() => onDeleteActif(actif)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{typeLabel}</span>
                      {actif.acquisitionDate && (
                        <span>Acquis le {formatDate(actif.acquisitionDate)}</span>
                      )}
                      {actif.acquisitionValue > 0 && actif.acquisitionValue !== actif.value && (
                        <span className={actif.value > actif.acquisitionValue ? 'text-emerald-600' : 'text-rose-600'}>
                          {actif.value > actif.acquisitionValue ? '+' : ''}
                          {formatPercentage(((actif.value - actif.acquisitionValue) / actif.acquisitionValue) * 100)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function TabPatrimoineReporting({ clientId, client, wealth }: TabPatrimoineReportingProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('actifs')
  const [loading, setLoading] = useState(false)
  const [chartsReady, setChartsReady] = useState(false)
  
  // Modal states - Actifs
  const [showAddActifModal, setShowAddActifModal] = useState(false)
  const [showEditActifModal, setShowEditActifModal] = useState(false)
  const [selectedActif, setSelectedActif] = useState<Actif | null>(null)
  
  // Modal states - Passifs
  const [showAddPassifModal, setShowAddPassifModal] = useState(false)
  const [showEditPassifModal, setShowEditPassifModal] = useState(false)
  const [selectedPassif, setSelectedPassif] = useState<Passif | null>(null)
  
  // Formulaires détaillés (PatrimoineFormModal)
  const [detailedFormType, setDetailedFormType] = useState<PatrimoineFormType | null>(null)
  const [detailedFormData, setDetailedFormData] = useState<any>(null)
  
  // Map client data to local types
  const actifs: Actif[] = useMemo(
    () =>
      (client.actifs || []).map((a: any) => ({
        id: a.id,
        type: a.type || 'AUTRE',
        category: inferCategory(a.category, a.type),
        name: a.name || '',
        value: Number(a.value) || 0,
        acquisitionValue: Number(a.acquisitionValue) || 0,
        acquisitionDate: a.acquisitionDate,
        managedByFirm: a.managedByFirm || false,
        details: a.details || {},
      })),
    [client.actifs],
  )

  const passifs: Passif[] = useMemo(() => (client.passifs || []).map((p: any) => ({
    id: p.id,
    type: p.type || 'AUTRE',
    name: p.name || '',
    initialAmount: Number(p.initialAmount) || 0,
    remainingAmount: Number(p.remainingAmount) || 0,
    interestRate: Number(p.interestRate) || 0,
    monthlyPayment: Number(p.monthlyPayment) || 0,
    endDate: p.endDate,
  })), [client.passifs])

  // Calculs patrimoniaux
  const totalActifs = actifs.reduce((sum, a) => sum + a.value, 0)
  const totalPassifs = passifs.reduce((sum, p) => sum + p.remainingAmount, 0)
  const patrimoineNet = totalActifs - totalPassifs
  const patrimoineGere = actifs.filter(a => a.managedByFirm).reduce((sum, a) => sum + a.value, 0)
  const tauxGestion = totalActifs > 0 ? (patrimoineGere / totalActifs) * 100 : 0

  // Répartition par catégorie (utilise category qui est IMMOBILIER, FINANCIER, etc.)
  const repartitionByType = useMemo(() => {
    const grouped: Record<string, number> = {}
    actifs.forEach(a => {
      const cat = a.category || 'AUTRE'
      grouped[cat] = (grouped[cat] || 0) + a.value
    })
    return Object.entries(grouped).map(([category, value], i) => ({
      type: category,
      value,
      percentage: totalActifs > 0 ? (value / totalActifs) * 100 : 0,
      color: CHART_COLORS[i % CHART_COLORS.length],
      label: CATEGORY_LABELS[category] || ASSET_TYPES.find(t => t.value === category)?.label || category,
    }))
  }, [actifs, totalActifs])

  // Segmentation CGP professionnelle
  const segmentationCGP = useMemo(() => segmenterPatrimoineCGP(actifs, passifs), [actifs, passifs])

  // Charts ready effect
  useEffect(() => {
    const timer = setTimeout(() => setChartsReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Handlers
  const handleAddActif = async (data: Partial<Actif>) => {
    try {
      const res = await fetch(`/api/advisor/clients/${clientId}/actifs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
        await queryClient.refetchQueries({ queryKey: ['clients', clientId] })
        toast({ title: 'Actif ajouté' })
        setShowAddActifModal(false)
      } else {
        const errorData = await res.json().catch(() => ({}))
        toast({ title: 'Erreur', description: errorData.error || 'Impossible d\'ajouter l\'actif', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  const handleDeleteActif = async (actif: Actif) => {
    if (!confirm(`Supprimer l'actif "${actif.name}" ?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/advisor/actifs/${actif.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Échec de la suppression')
      }
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
      await queryClient.refetchQueries({ queryKey: ['clients', clientId] })
      toast({ title: 'Actif supprimé', description: `"${actif.name}" a été supprimé` })
    } catch (error: any) {
      console.error('Delete actif error:', error)
      toast({ title: 'Erreur', description: error.message || 'Impossible de supprimer l\'actif', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const openEditActifModal = (actif: Actif) => {
    setSelectedActif(actif)
    setShowEditActifModal(true)
  }

  const handleAddPassif = async (data: Partial<Passif>) => {
    try {
      const res = await fetch(`/api/advisor/clients/${clientId}/passifs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
        await queryClient.refetchQueries({ queryKey: ['clients', clientId] })
        toast({ title: 'Passif ajouté' })
        setShowAddPassifModal(false)
      } else {
        const errorData = await res.json().catch(() => ({}))
        toast({ title: 'Erreur', description: errorData.error || 'Impossible d\'ajouter le passif', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  const handleEditPassif = async (data: Partial<Passif>) => {
    if (!selectedPassif) return
    setLoading(true)
    try {
      const res = await fetch(`/api/advisor/passifs/${selectedPassif.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
        await queryClient.refetchQueries({ queryKey: ['clients', clientId] })
        toast({ title: 'Passif modifié' })
        setShowEditPassifModal(false)
        setSelectedPassif(null)
      } else {
        const errorData = await res.json().catch(() => ({}))
        toast({ title: 'Erreur', description: errorData.error || 'Impossible de modifier le passif', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePassif = async (passif: Passif) => {
    if (!confirm(`Supprimer le passif "${passif.name}" ?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/advisor/passifs/${passif.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Échec de la suppression')
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
      await queryClient.refetchQueries({ queryKey: ['clients', clientId] })
      toast({ title: 'Passif supprimé' })
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    await queryClient.refetchQueries({ queryKey: ['clients', clientId] })
    setLoading(false)
  }

  const [showBilanWizard, setShowBilanWizard] = useState(false)

  return (
    <div className="space-y-5">
      {/* En-tête avec KPIs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total actifs</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(totalActifs)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total passifs</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(totalPassifs)}</p>
          </div>
          <div className="pl-4 border-l border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Patrimoine net</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(patrimoineNet)}</p>
          </div>
          {patrimoineGere > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Géré par cabinet</p>
              <p className="text-xl font-semibold text-[#7373FF]">{formatCurrency(patrimoineGere)}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            type="button"
            onClick={() => {
              setShowBilanWizard(true)
            }} 
            className="h-9 px-4 gap-2 bg-[#7373FF] hover:bg-[#5c5ce6] text-white font-medium shadow-sm"
          >
            <ClipboardList className="h-4 w-4" />
            Créer Bilan
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="h-8 gap-1.5">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Tabs Actifs / Passifs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-transparent p-0 h-auto border-b border-gray-200 rounded-none w-full justify-start gap-0">
          <TabsTrigger 
            value="actifs" 
            className="px-4 py-2.5 rounded-none border-b-2 -mb-px data-[state=active]:border-[#7373FF] data-[state=active]:text-[#7373FF] data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 bg-transparent font-medium"
          >
            <TrendingUp className="h-4 w-4 mr-2" />Actifs ({actifs.length})
          </TabsTrigger>
          <TabsTrigger 
            value="passifs"
            className="px-4 py-2.5 rounded-none border-b-2 -mb-px data-[state=active]:border-[#7373FF] data-[state=active]:text-[#7373FF] data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 bg-transparent font-medium"
          >
            <TrendingDown className="h-4 w-4 mr-2" />Passifs ({passifs.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB ACTIFS */}
        <TabsContent value="actifs" className="mt-6 space-y-6">
          {/* Bouton d'ajout principal */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Patrimoine actif</h3>
            <Button 
              onClick={() => setShowAddActifModal(true)}
              className="h-10 gap-2 bg-[#7373FF] hover:bg-[#5c5ce6] text-white shadow-md"
            >
              <Plus className="h-4 w-4" />
              Ajouter un actif
            </Button>
          </div>

          {/* Graphique répartition */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h4 className="text-base font-semibold text-gray-900 mb-5">Répartition par catégorie</h4>
            {repartitionByType.length > 0 ? (
              <div className="flex items-start gap-8">
                <div className="h-48 w-48 flex-shrink-0" style={{ minWidth: 192, minHeight: 192 }}>
                  {activeTab === 'actifs' && chartsReady ? (
                    <ResponsiveContainer width={192} height={192}>
                      <PieChart>
                        <Pie 
                          data={repartitionByType} 
                          cx="50%" cy="50%" 
                          innerRadius={45} outerRadius={80} 
                          dataKey="value" 
                          strokeWidth={2} stroke="#fff"
                        >
                          {repartitionByType.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip 
                          formatter={(v: number, _name: string, props: any) => [formatCurrency(v), props.payload?.label || 'Catégorie']}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <ChartPlaceholder label="Chargement..." />
                  )}
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  {repartitionByType.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(item.value)}</p>
                        <p className="text-xs text-gray-400">{formatPercentage(item.percentage)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                <Wallet className="h-12 w-12 mb-3 text-gray-200" />
                <p className="text-sm">Aucun actif enregistré</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => setShowAddActifModal(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter votre premier actif
                </Button>
              </div>
            )}
          </div>

          {/* Analyse CGP détaillée */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-500" />
              <h4 className="text-sm font-semibold text-gray-700">Analyse détaillée CGP</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RepartitionImmobilierCGP segmentation={segmentationCGP} />
              <RepartitionFinancierCGP segmentation={segmentationCGP} />
            </div>
          </div>

          {/* Cartes par catégorie avec accordion */}
          <div className="grid md:grid-cols-2 gap-4">
            {ASSET_TYPES.map((category) => (
              <CategoryCard
                key={category.value}
                category={category}
                actifs={actifs.filter(a => a.category === category.value)}
                onAddActif={() => setShowAddActifModal(true)}
                onEditActif={openEditActifModal}
                onDeleteActif={handleDeleteActif}
              />
            ))}
          </div>
        </TabsContent>

        {/* TAB PASSIFS */}
        <TabsContent value="passifs" className="mt-6 space-y-6">
          {/* Bouton d'ajout principal */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Passifs & Dettes</h3>
            <Button 
              onClick={() => setShowAddPassifModal(true)}
              className="h-10 gap-2 bg-[#7373FF] hover:bg-[#5c5ce6] text-white shadow-md"
            >
              <Plus className="h-4 w-4" />
              Ajouter un passif
            </Button>
          </div>

          {/* Graphique structure endettement CGP */}
          <RepartitionPassifsCGP segmentation={segmentationCGP} />

          {/* Liste des passifs */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            {passifs.length === 0 ? (
              <div className="py-12 text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-200" />
                <p className="text-gray-400">Aucun passif enregistré</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => setShowAddPassifModal(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter un passif
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {passifs.map((passif) => {
                  const typeLabel = CATEGORY_LABELS[passif.type] || passif.type
                  const progress = passif.initialAmount > 0 
                    ? ((passif.initialAmount - passif.remainingAmount) / passif.initialAmount) * 100
                    : 0
                  
                  return (
                    <div key={passif.id} className="p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-900">{passif.name}</p>
                          <p className="text-sm text-gray-500">{typeLabel}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{formatCurrency(passif.remainingAmount)}</p>
                            <p className="text-xs text-gray-500">sur {formatCurrency(passif.initialAmount)}</p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              onClick={() => { setSelectedPassif(passif); setShowEditPassifModal(true) }}
                            >
                              <Edit className="h-4 w-4 text-gray-500" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 hover:bg-red-50"
                              onClick={() => handleDeletePassif(passif)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-rose-500 rounded-full transition-all"
                            style={{ width: `${100 - progress}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          {passif.interestRate > 0 && (
                            <span>{formatPercentage(passif.interestRate)}</span>
                          )}
                          {passif.monthlyPayment > 0 && (
                            <span>{formatCurrency(passif.monthlyPayment)}/mois</span>
                          )}
                          {passif.endDate && (
                            <span>Fin: {formatDate(passif.endDate)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Actif Modal */}
      <Dialog open={showAddActifModal} onOpenChange={setShowAddActifModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Ajouter un actif</DialogTitle></DialogHeader>
          <ActifFormWizard
            mode="create"
            initialData={{ clientId }}
            onSuccess={async () => {
              await queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
              await queryClient.refetchQueries({ queryKey: ['clients', clientId] })
              setShowAddActifModal(false)
            }}
            onCancel={() => setShowAddActifModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Actif Modal */}
      <Dialog open={showEditActifModal} onOpenChange={(o) => { setShowEditActifModal(o); if (!o) setSelectedActif(null) }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Modifier l'actif</DialogTitle></DialogHeader>
          {selectedActif && (
            <ActifFormWizard
              mode="edit"
              initialData={{
                id: selectedActif.id,
                name: selectedActif.name,
                type: selectedActif.type,
                category: selectedActif.category,
                value: selectedActif.value,
                acquisitionDate: selectedActif.acquisitionDate || undefined,
                acquisitionValue: selectedActif.acquisitionValue,
                managedByFirm: selectedActif.managedByFirm,
                clientId,
              }}
              onSuccess={async () => {
                await queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
                await queryClient.refetchQueries({ queryKey: ['clients', clientId] })
                setShowEditActifModal(false)
                setSelectedActif(null)
              }}
              onCancel={() => { setShowEditActifModal(false); setSelectedActif(null) }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Passif Modal */}
      <Dialog open={showAddPassifModal} onOpenChange={setShowAddPassifModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Ajouter un passif</DialogTitle></DialogHeader>
          <PassifFormWizard
            mode="create"
            initialData={{ clientId }}
            onSuccess={async () => {
              await queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
              await queryClient.refetchQueries({ queryKey: ['clients', clientId] })
              setShowAddPassifModal(false)
            }}
            onCancel={() => setShowAddPassifModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Passif Modal */}
      <Dialog open={showEditPassifModal} onOpenChange={(o) => { setShowEditPassifModal(o); if (!o) setSelectedPassif(null) }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Modifier le passif</DialogTitle></DialogHeader>
          {selectedPassif && (
            <PassifFormWizard
              mode="edit"
              initialData={{
                id: selectedPassif.id,
                name: selectedPassif.name,
                type: selectedPassif.type,
                initialAmount: selectedPassif.initialAmount,
                remainingAmount: selectedPassif.remainingAmount,
                interestRate: selectedPassif.interestRate,
                monthlyPayment: selectedPassif.monthlyPayment,
                endDate: selectedPassif.endDate || undefined,
                clientId,
              }}
              onSuccess={async () => {
                await queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
                await queryClient.refetchQueries({ queryKey: ['clients', clientId] })
                setShowEditPassifModal(false)
                setSelectedPassif(null)
              }}
              onCancel={() => { setShowEditPassifModal(false); setSelectedPassif(null) }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Formulaire détaillé (PatrimoineFormModal) */}
      {detailedFormType && (
        <PatrimoineFormModal
          isOpen={true}
          onClose={() => {
            setDetailedFormType(null)
            setDetailedFormData(null)
          }}
          formType={detailedFormType}
          clientId={clientId}
          initialData={detailedFormData}
          onSuccess={() => {
            setDetailedFormType(null)
            setDetailedFormData(null)
          }}
        />
      )}

      {/* Wizard Bilan Patrimonial */}
      <BilanPatrimonialWizard
        open={showBilanWizard}
        onClose={() => setShowBilanWizard(false)}
        clientId={clientId}
      />
    </div>
  )
}

export default TabPatrimoineReporting
