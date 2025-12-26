 
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Types
export interface CabinetUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'ADVISOR' | 'ASSISTANT'
  isActive: boolean
  createdAt: string
  lastLogin: string | null
  isPrimaryAdmin?: boolean
  permissions?: Record<string, boolean> | null
}

export interface CabinetQuotas {
  maxUsers: number
  maxAdmins: number
  maxClients: number
  maxStorageGB: number
  maxDocuments: number
}

export interface CabinetUsage {
  users: number
  clients: number
  documents: number
  storageGB: number
}

export interface CabinetInfo {
  id: string
  name: string
  email: string
  phone: string | null
  address: any
  plan: string
  planName: string
  planPrice: {
    monthly: number
    yearly: number
    name: string
  }
  status: string
  subscriptionStart: string | null
  subscriptionEnd: string | null
  trialEndsAt: string | null
  trialDaysRemaining: number | null
  quotas: CabinetQuotas
  usage: CabinetUsage
  users: CabinetUser[]
  features: any
  createdAt: string
}

export interface CreateUserRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'ADVISOR' | 'ASSISTANT'
  cabinetId: string
}

// Query keys
export const cabinetKeys = {
  all: ['cabinet'] as const,
  info: () => [...cabinetKeys.all, 'info'] as const,
  users: () => [...cabinetKeys.all, 'users'] as const,
}

// Récupérer les informations du cabinet
export function useCabinetInfo() {
  return useQuery<CabinetInfo>({
    queryKey: cabinetKeys.info(),
    queryFn: async () => {
      const response = await fetch('/api/advisor/cabinet')
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la récupération du cabinet')
      }
      return response.json()
    },
  })
}

// Mettre à jour les informations du cabinet
export function useUpdateCabinet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name?: string; email?: string; phone?: string; address?: any }) => {
      const response = await fetch('/api/advisor/cabinet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la mise à jour')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cabinetKeys.info() })
    },
  })
}

// Créer un nouvel utilisateur dans le cabinet
export function useCreateCabinetUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateUserRequest) => {
      const response = await fetch('/api/advisor/cabinet/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cabinetKeys.info() })
    },
  })
}

// Supprimer un utilisateur du cabinet
export function useDeleteCabinetUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/advisor/cabinet/users/${userId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cabinetKeys.info() })
    },
  })
}

// Mettre à jour un utilisateur du cabinet
export function useUpdateCabinetUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<CabinetUser> }) => {
      const response = await fetch(`/api/advisor/cabinet/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la mise à jour')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cabinetKeys.info() })
    },
  })
}

// ============================================================================
// BILLING & SUBSCRIPTION
// ============================================================================

export interface Invoice {
  id: string
  number: string
  amount: number
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  date: string
  dueDate: string
  pdfUrl?: string
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'sepa'
  last4: string
  expiryMonth?: number
  expiryYear?: number
  brand?: string
  isDefault: boolean
}

export interface BillingInfo {
  invoices: Invoice[]
  paymentMethods: PaymentMethod[]
  nextBillingDate: string | null
  billingEmail: string
  billingPeriod: 'monthly' | 'yearly'
}

// Récupérer les informations de facturation
export function useBillingInfo() {
  return useQuery<BillingInfo>({
    queryKey: [...cabinetKeys.all, 'billing'],
    queryFn: async () => {
      const response = await fetch('/api/advisor/cabinet/billing')
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la récupération')
      }
      return response.json()
    },
  })
}

// Changer de plan
export function useChangePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ planId, billingPeriod }: { planId: string; billingPeriod: 'monthly' | 'yearly' }) => {
      const response = await fetch('/api/advisor/cabinet/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingPeriod }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors du changement de plan')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cabinetKeys.info() })
      queryClient.invalidateQueries({ queryKey: [...cabinetKeys.all, 'billing'] })
    },
  })
}

// Annuler l'abonnement
export function useCancelSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reason, feedback }: { reason: string; feedback?: string }) => {
      const response = await fetch('/api/advisor/cabinet/subscription', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, feedback }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de l\'annulation')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cabinetKeys.info() })
    },
  })
}

// Mettre à jour le moyen de paiement
export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await fetch('/api/advisor/cabinet/billing/payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la mise à jour')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...cabinetKeys.all, 'billing'] })
    },
  })
}
