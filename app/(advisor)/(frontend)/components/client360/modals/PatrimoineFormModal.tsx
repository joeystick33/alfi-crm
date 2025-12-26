'use client'
 

/**
 * Modal pour les formulaires patrimoine détaillés
 * Intègre les formulaires complets pour biens immobiliers, actifs financiers, revenus, charges, crédits
 */

import { useState, useCallback, Suspense, lazy } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/app/_common/components/ui/Dialog'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { useToast } from '@/app/_common/hooks/use-toast'
import { X, Home, Car, PiggyBank, TrendingUp, TrendingDown, CreditCard, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/app/_common/lib/utils'

// Lazy load des formulaires pour améliorer les performances
const BienImmobilierForm = lazy(() => import('../../patrimoine/forms/immobilier'))
const BienMobilierForm = lazy(() => import('../../patrimoine/forms/mobilier/BienMobilierForm'))
const ActifFinancierForm = lazy(() => import('../../patrimoine/forms/financier'))
const RevenuForm = lazy(() => import('../../patrimoine/forms/revenu/RevenuForm'))
const ChargeForm = lazy(() => import('../../patrimoine/forms/charge/ChargeForm'))
const CreditForm = lazy(() => import('../../patrimoine/forms/credit/CreditForm'))

// Types de formulaire
export type PatrimoineFormType = 
  | 'bien_immobilier'
  | 'bien_mobilier'
  | 'actif_financier'
  | 'revenu'
  | 'charge'
  | 'credit'

interface PatrimoineFormModalProps {
  isOpen: boolean
  onClose: () => void
  formType: PatrimoineFormType
  clientId: string
  initialData?: any
  onSuccess?: (data: any) => void
}

// Configuration des formulaires
const FORM_CONFIG: Record<PatrimoineFormType, { 
  title: string
  subtitle: string
  width: string
  icon: typeof Home
  color: string
}> = {
  bien_immobilier: { 
    title: 'Bien immobilier', 
    subtitle: 'Résidence, investissement locatif, terrain...',
    width: 'max-w-5xl',
    icon: Home,
    color: 'blue'
  },
  bien_mobilier: { 
    title: 'Bien mobilier', 
    subtitle: 'Véhicules, œuvres d\'art, bijoux, collections...',
    width: 'max-w-4xl',
    icon: Car,
    color: 'indigo'
  },
  actif_financier: { 
    title: 'Actif financier', 
    subtitle: 'Assurance-vie, PEA, compte-titres, livrets...',
    width: 'max-w-5xl',
    icon: PiggyBank,
    color: 'green'
  },
  revenu: { 
    title: 'Revenu', 
    subtitle: 'Salaire, loyers, dividendes, pensions...',
    width: 'max-w-3xl',
    icon: TrendingUp,
    color: 'emerald'
  },
  charge: { 
    title: 'Charge', 
    subtitle: 'Dépenses régulières, abonnements, impôts...',
    width: 'max-w-3xl',
    icon: TrendingDown,
    color: 'amber'
  },
  credit: { 
    title: 'Crédit', 
    subtitle: 'Prêt immobilier, consommation, professionnel...',
    width: 'max-w-4xl',
    icon: CreditCard,
    color: 'rose'
  },
}

// Skeleton de chargement
function FormSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}

export function PatrimoineFormModal({
  isOpen,
  onClose,
  formType,
  clientId,
  initialData,
  onSuccess,
}: PatrimoineFormModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const config = FORM_CONFIG[formType]
  const isEdit = !!initialData?.id
  const Icon = config.icon

  // Gestionnaire de soumission
  const handleSubmit = useCallback(async (data: any) => {
    setSaving(true)
    setError(null)
    
    try {
      // Normalisation des données pour l'API (évite les champs undefined / non numériques)
      const defaultType =
        formType === 'bien_immobilier' ? 'IMMOBILIER' :
        formType === 'bien_mobilier' ? 'MOBILIER' :
        formType === 'actif_financier' ? 'FINANCIER' :
        formType === 'credit' ? 'CREDIT' :
        formType === 'revenu' ? 'REVENU' :
        formType === 'charge' ? 'CHARGE' : 'AUTRE'

      const normalizedValue = (val: any) => {
        const n = Number(val)
        return Number.isFinite(n) ? n : 0
      }

      // Mapper les types détaillés vers les catégories Prisma
      const getCategoryFromType = (type: string): 'IMMOBILIER' | 'FINANCIER' | 'EPARGNE_SALARIALE' | 'EPARGNE_RETRAITE' | 'PROFESSIONNEL' | 'MOBILIER' | 'AUTRE' => {
        const immobilierTypes = ['RESIDENCE_PRINCIPALE', 'RESIDENCE_SECONDAIRE', 'INVESTISSEMENT_LOCATIF', 'TERRAIN', 'SCPI', 'SCI', 'REAL_ESTATE_MAIN', 'REAL_ESTATE_RENTAL', 'REAL_ESTATE_SECONDARY', 'IMMOBILIER']
        const financierTypes = ['ASSURANCE_VIE', 'PEA', 'PEA_PME', 'COMPTE_TITRES', 'LIVRET_A', 'LDDS', 'LEP', 'PEL', 'CEL', 'COMPTE_COURANT', 'CRYPTO', 'SECURITIES_ACCOUNT', 'BANK_ACCOUNT', 'SAVINGS_ACCOUNT', 'FINANCIER']
        const epargneSalarialeTypes = ['PEE', 'PEG', 'PERCO', 'PERECO', 'CET', 'PARTICIPATION', 'INTERESSEMENT', 'STOCK_OPTIONS', 'ACTIONS_GRATUITES', 'BSPCE', 'EPARGNE_SALARIALE']
        const epargneRetraiteTypes = ['PER', 'PERP', 'MADELIN', 'ARTICLE_83', 'PREFON', 'COREM', 'EPARGNE_RETRAITE']
        const proTypes = ['PARTS_SOCIALES', 'FONDS_COMMERCE', 'COMPANY_SHARES', 'PROFESSIONAL_REAL_ESTATE', 'PROFESSIONNEL']
        const mobilierTypes = ['VEHICULE', 'BATEAU', 'OEUVRE_ART', 'BIJOUX', 'COLLECTION', 'MOBILIER']
        
        if (immobilierTypes.includes(type)) return 'IMMOBILIER'
        if (epargneSalarialeTypes.includes(type)) return 'EPARGNE_SALARIALE'
        if (epargneRetraiteTypes.includes(type)) return 'EPARGNE_RETRAITE'
        if (financierTypes.includes(type)) return 'FINANCIER'
        if (proTypes.includes(type)) return 'PROFESSIONNEL'
        if (mobilierTypes.includes(type)) return 'MOBILIER'
        return 'AUTRE'
      }

      // Déterminer la catégorie correcte
      const rawType = data?.type || defaultType
      const category = ['IMMOBILIER', 'FINANCIER', 'EPARGNE_SALARIALE', 'EPARGNE_RETRAITE', 'PROFESSIONNEL', 'MOBILIER', 'AUTRE'].includes(data?.category) 
        ? data.category 
        : getCategoryFromType(rawType)

      const payload = {
        ...data,
        clientId,
        name: data?.name || data?.nom || '',
        type: rawType,
        category,
        // Support multiple field name variants for value
        value: normalizedValue(data?.value ?? data?.valeurActuelle ?? data?.valorisationActuelle ?? data?.montant),
        valeurActuelle: normalizedValue(data?.valeurActuelle ?? data?.valorisationActuelle ?? data?.value ?? data?.montant),
        // Zod attend string ou undefined, pas null
        acquisitionDate: data?.acquisitionDate || data?.dateAcquisition || undefined,
        acquisitionValue: normalizedValue(data?.acquisitionValue ?? data?.prixAcquisition ?? data?.valeurAcquisition),
        prixAcquisition: normalizedValue(data?.prixAcquisition ?? data?.acquisitionValue ?? data?.valeurAcquisition),
        managedByFirm: data?.managedByFirm ?? data?.gereParCabinet ?? false,
        ownershipPercentage: normalizedValue(data?.ownershipPercentage ?? data?.quotePart ?? data?.quotiteDetention ?? 100),
      }

      // Déterminer l'endpoint correct selon le type
      let endpoint = ''
      let resourceIdParam = ''
      switch (formType) {
        case 'bien_immobilier':
          endpoint = `/api/advisor/clients/${clientId}/actifs`
          resourceIdParam = 'actifId'
          break
        case 'bien_mobilier':
          endpoint = `/api/advisor/clients/${clientId}/biens-mobiliers`
          resourceIdParam = 'bienMobilierId'
          break
        case 'actif_financier':
          endpoint = `/api/advisor/clients/${clientId}/actifs`
          resourceIdParam = 'actifId'
          break
        case 'revenu':
          endpoint = `/api/advisor/clients/${clientId}/revenues`
          resourceIdParam = 'revenueId'
          break
        case 'charge':
          endpoint = `/api/advisor/clients/${clientId}/expenses`
          resourceIdParam = 'expenseId'
          break
        case 'credit':
          endpoint = `/api/advisor/clients/${clientId}/credits`
          resourceIdParam = 'creditId'
          break
      }

      const method = isEdit ? 'PUT' : 'POST'
      const url = isEdit ? `${endpoint}/${initialData.id}` : endpoint

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || 'Erreur lors de l\'enregistrement')
      }

      const result = await response.json()

      // Invalider les caches React Query pour rafraîchir les données
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'actifs'] })
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'passifs'] })
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'contrats'] })
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'revenues'] })
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'expenses'] })
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'credits'] })
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'wealth'] })
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId] })

      toast({
        title: isEdit ? 'Modification enregistrée' : 'Élément créé',
        description: `Le ${config.title.toLowerCase()} a été ${isEdit ? 'modifié' : 'créé'} avec succès.`,
      })

      onSuccess?.(result)
      onClose()
    } catch (err: any) {
      console.error('Error saving patrimoine:', err)
      setError(err.message || 'Une erreur est survenue')
      toast({
        title: 'Erreur',
        description: err.message || 'Une erreur est survenue lors de l\'enregistrement.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }, [clientId, formType, isEdit, initialData, config.title, toast, onSuccess, onClose, queryClient])

  // Rendu du formulaire selon le type
  const renderForm = () => {
    const commonProps = {
      clientId,
      initialData,
      onSave: handleSubmit,
      onCancel: onClose,
      isEdit,
    }

    switch (formType) {
      case 'bien_immobilier':
        return <BienImmobilierForm {...commonProps} />
      case 'bien_mobilier':
        return <BienMobilierForm {...commonProps} />
      case 'actif_financier':
        return <ActifFinancierForm {...commonProps} />
      case 'revenu':
        return <RevenuForm {...commonProps} />
      case 'charge':
        return <ChargeForm {...commonProps} />
      case 'credit':
        return <CreditForm {...commonProps} />
      default:
        return <div className="p-6 text-center text-gray-500">Formulaire non disponible</div>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* 
        STRUCTURE CORRIGÉE pour les formulaires longs :
        - max-h-[90vh] au lieu de h-[90vh] pour s'adapter au contenu
        - overflow-hidden sur le container principal
        - overflow-y-auto UNIQUEMENT sur la zone de contenu
        - min-h-0 pour permettre le shrink flex
      */}
      <DialogContent 
        className={cn(
          'p-0 gap-0 flex flex-col overflow-hidden',
          config.width, 
          'max-h-[90vh]'
        )}
      >
        {/* Header fixe - ne scroll pas */}
        <DialogHeader className={cn('px-6 py-4 border-b shrink-0', `bg-${config.color}-50`)}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', `bg-${config.color}-100`)}>
                <Icon className={cn('h-5 w-5', `text-${config.color}-600`)} />
              </div>
              <div>
                <DialogTitle className="text-lg">
                  {isEdit ? `Modifier le ${config.title.toLowerCase()}` : `Nouveau ${config.title.toLowerCase()}`}
                </DialogTitle>
                <DialogDescription className="text-sm mt-0.5">
                  {config.subtitle}
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        {/* Zone de contenu scrollable - min-h-0 crucial pour flex shrink */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <Suspense fallback={<FormSkeleton />}>
            {renderForm()}
          </Suspense>
        </div>

        {/* Indicateur de sauvegarde */}
        {saving && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50 rounded-lg">
            <div className="flex items-center gap-3 px-6 py-4 bg-white rounded-lg shadow-lg border">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="font-medium">Enregistrement en cours...</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default PatrimoineFormModal
