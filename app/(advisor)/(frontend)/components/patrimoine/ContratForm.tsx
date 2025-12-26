 
'use client'

/**
 * ContratForm - Formulaire création/édition contrat
 * Validation Zod, 9 types, catégories, gestion cabinet
 */

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/app/_common/components/ui/Input'
import Textarea from '@/app/_common/components/ui/Textarea'
import { Button } from '@/app/_common/components/ui/Button'
import Switch from '@/app/_common/components/ui/Switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { useToast } from '@/app/_common/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { apiCall } from '@/app/_common/lib/api-client'

// Types de contrats alignés sur l'enum Prisma ContratType
const CONTRAT_TYPES = [
  { value: 'ASSURANCE_VIE', label: 'Assurance-vie', category: 'ASSURANCE' },
  { value: 'MUTUELLE', label: 'Mutuelle santé', category: 'ASSURANCE' },
  { value: 'ASSURANCE_HABITATION', label: 'Assurance habitation', category: 'ASSURANCE' },
  { value: 'ASSURANCE_AUTO', label: 'Assurance auto', category: 'ASSURANCE' },
  { value: 'ASSURANCE_PRO', label: 'Assurance professionnelle', category: 'ASSURANCE' },
  { value: 'ASSURANCE_DECES', label: 'Assurance décès', category: 'PREVOYANCE' },
  { value: 'PREVOYANCE', label: 'Prévoyance', category: 'PREVOYANCE' },
  { value: 'EPARGNE_RETRAITE', label: 'Épargne retraite (PER, PERP...)', category: 'EPARGNE' },
  { value: 'AUTRE', label: 'Autre', category: 'AUTRE' },
]

const CONTRAT_CATEGORIES = [
  { value: 'ASSURANCE', label: 'Assurance' },
  { value: 'PREVOYANCE', label: 'Prévoyance' },
  { value: 'EPARGNE', label: 'Épargne' },
  { value: 'AUTRE', label: 'Autre' },
]

// Statuts de contrats alignés sur l'enum Prisma ContratStatus
const CONTRAT_STATUS = [
  { value: 'ACTIF', label: 'Actif' },
  { value: 'SUSPENDU', label: 'Suspendu' },
  { value: 'RESILIE', label: 'Résilié' },
  { value: 'EXPIRE', label: 'Expiré' },
]

const schema = z.object({
  name: z.string().min(1, 'Le nom du contrat est requis'),
  type: z.string().min(1, 'Le type est requis'),
  category: z.string().min(1, 'La catégorie est requise'),
  status: z.enum(['ACTIF', 'SUSPENDU', 'RESILIE', 'EXPIRE']).default('ACTIF'),
  provider: z.string().min(1, 'L\'établissement est requis'),
  contractNumber: z.string().optional(),
  startDate: z.string().min(1, 'La date de début est requise'),
  endDate: z.string().optional(),
  currentValue: z.coerce.number().min(0, 'Valeur invalide'),
  monthlyPayment: z.coerce.number().min(0).optional(),
  interestRate: z.coerce.number().min(0).max(100).optional(),
  isManaged: z.boolean().default(false),
  managementFees: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
  clientId: z.string().min(1, 'Le client est requis'),
})

type ContratFormValues = z.input<typeof schema>

type ContratFormProps = {
  mode?: 'create' | 'edit'
  initialData?: Partial<ContratFormValues> & { id?: string }
  clientId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ContratForm({ mode = 'create', initialData, clientId, onSuccess, onCancel }: ContratFormProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  const form = useForm<ContratFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || '',
      category: initialData?.category || '',
      status: initialData?.status || 'ACTIF',
      provider: initialData?.provider || '',
      contractNumber: initialData?.contractNumber || '',
      startDate: initialData?.startDate || '',
      endDate: initialData?.endDate || '',
      currentValue: initialData?.currentValue || 0,
      monthlyPayment: initialData?.monthlyPayment || 0,
      interestRate: initialData?.interestRate || 0,
      isManaged: initialData?.isManaged || false,
      managementFees: initialData?.managementFees || 0,
      notes: initialData?.notes || '',
      clientId: clientId || initialData?.clientId || '',
    },
  })

  const selectedType = form.watch('type')
  const isCredit = useMemo(() => {
    const typeConfig = CONTRAT_TYPES.find(t => t.value === selectedType)
    return typeConfig?.category === 'CREDIT'
  }, [selectedType])

  // Auto-select category when type changes
  const handleTypeChange = (value: string) => {
    form.setValue('type', value)
    const typeConfig = CONTRAT_TYPES.find(t => t.value === value)
    if (typeConfig) {
      form.setValue('category', typeConfig.category)
    }
  }

  const onSubmit = async (data: ContratFormValues) => {
    try {
      setLoading(true)
      
      const endpoint = mode === 'edit' && initialData?.id
        ? `/api/advisor/clients/${data.clientId}/contracts/${initialData.id}`
        : `/api/advisor/clients/${data.clientId}/contracts`

      await apiCall(endpoint, {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        body: JSON.stringify(data),
      })

      // Invalider le cache React Query pour rafraîchir les données
      await queryClient.invalidateQueries({ queryKey: ['clients', data.clientId, 'contrats'] })
      await queryClient.invalidateQueries({ queryKey: ['clients', data.clientId, 'contracts'] })
      await queryClient.invalidateQueries({ queryKey: ['clients', data.clientId, 'wealth'] })
      await queryClient.invalidateQueries({ queryKey: ['clients', data.clientId] })

      toast({
        title: mode === 'edit' ? 'Contrat modifié' : 'Contrat créé',
        description: `Le contrat "${data.name}" a été ${mode === 'edit' ? 'modifié' : 'créé'} avec succès.`,
        variant: 'success',
      })

      onSuccess?.()
    } catch (error) {
      console.error('Erreur contrat:', error)
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de sauvegarder le contrat',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Informations générales */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Informations générales</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Nom du contrat *</label>
            <Input {...form.register('name')} placeholder="Ex: Assurance-vie Generali" />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">Établissement *</label>
            <Input {...form.register('provider')} placeholder="Ex: Generali" />
            {form.formState.errors.provider && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.provider.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Type *</label>
            <Select value={form.watch('type')} onValueChange={handleTypeChange}>
              <SelectTrigger className={form.formState.errors.type ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {CONTRAT_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">Catégorie</label>
            <Select value={form.watch('category')} onValueChange={v => form.setValue('category', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTRAT_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">Statut</label>
            <Select value={form.watch('status')} onValueChange={v => form.setValue('status', v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTRAT_STATUS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Numéro de contrat</label>
          <Input {...form.register('contractNumber')} placeholder="Ex: 123456789" />
        </div>
      </div>

      {/* Dates et montants */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Dates et montants</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Date de début *</label>
            <Input type="date" {...form.register('startDate')} />
            {form.formState.errors.startDate && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.startDate.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Date de fin</label>
            <Input type="date" {...form.register('endDate')} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              {isCredit ? 'Capital restant dû (€)' : 'Valeur actuelle (€)'}
            </label>
            <Input type="number" step="0.01" {...form.register('currentValue')} />
          </div>
          
          {isCredit && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700">Mensualité (€)</label>
                <Input type="number" step="0.01" {...form.register('monthlyPayment')} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Taux d'intérêt (%)</label>
                <Input type="number" step="0.01" {...form.register('interestRate')} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Gestion */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Gestion</h3>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch 
              checked={form.watch('isManaged')} 
              onCheckedChange={v => form.setValue('isManaged', v)} 
            />
            <span className="text-sm text-gray-700">Géré par le cabinet</span>
          </label>
        </div>

        {form.watch('isManaged') && (
          <div className="w-1/3">
            <label className="text-sm font-medium text-gray-700">Frais de gestion (%)</label>
            <Input type="number" step="0.01" {...form.register('managementFees')} />
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm font-medium text-gray-700">Notes</label>
        <Textarea {...form.register('notes')} rows={3} placeholder="Informations complémentaires..." />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {mode === 'edit' ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  )
}
