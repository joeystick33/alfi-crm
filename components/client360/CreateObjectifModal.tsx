'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import Textarea from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { useToast } from '@/hooks/use-toast'
import { ObjectifType, ObjectifPriority } from '@prisma/client'

interface CreateObjectifModalProps {
  open: boolean
  onClose: () => void
  clientId: string
  onSuccess: () => void
}

const objectifTypeLabels: Record<ObjectifType, string> = {
  RETIREMENT: 'Retraite',
  REAL_ESTATE_PURCHASE: 'Achat immobilier',
  EDUCATION: 'Éducation',
  WEALTH_TRANSMISSION: 'Transmission',
  TAX_OPTIMIZATION: 'Optimisation fiscale',
  INCOME_GENERATION: 'Génération de revenus',
  CAPITAL_PROTECTION: 'Protection du capital',
  OTHER: 'Autre',
}

const priorityLabels: Record<ObjectifPriority, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyenne',
  HIGH: 'Élevée',
  CRITICAL: 'Critique',
}

export function CreateObjectifModal({ open, onClose, clientId, onSuccess }: CreateObjectifModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'RETIREMENT' as ObjectifType,
    name: '',
    description: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    priority: 'MEDIUM' as ObjectifPriority,
    monthlyContribution: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/clients/${clientId}/objectifs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to create objectif')
      }

      toast({
        title: 'Succès',
        description: 'Objectif créé avec succès',
      })

      onSuccess()
      onClose()
      
      // Reset form
      setFormData({
        type: 'RETIREMENT',
        name: '',
        description: '',
        targetAmount: '',
        currentAmount: '',
        targetDate: '',
        priority: 'MEDIUM',
        monthlyContribution: '',
      })
    } catch (error) {
      console.error('Create objectif error:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de créer l\'objectif',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un objectif</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Type d'objectif *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as ObjectifType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(objectifTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priorité *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as ObjectifPriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nom de l'objectif *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Préparer ma retraite"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez l'objectif..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Montant cible (€) *</Label>
              <Input
                id="targetAmount"
                type="number"
                step="0.01"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                placeholder="500000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentAmount">Montant actuel (€)</Label>
              <Input
                id="currentAmount"
                type="number"
                step="0.01"
                value={formData.currentAmount}
                onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                placeholder="150000"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="targetDate">Date cible *</Label>
              <Input
                id="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyContribution">Contribution mensuelle (€)</Label>
              <Input
                id="monthlyContribution"
                type="number"
                step="0.01"
                value={formData.monthlyContribution}
                onChange={(e) => setFormData({ ...formData, monthlyContribution: e.target.value })}
                placeholder="2000"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer l\'objectif'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
