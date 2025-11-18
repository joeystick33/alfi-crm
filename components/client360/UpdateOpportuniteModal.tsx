'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import Textarea from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { useToast } from '@/hooks/use-toast'

interface UpdateOpportuniteModalProps {
  isOpen: boolean
  onClose: () => void
  opportunite: any
  onSuccess: () => void
}

const opportuniteTypes = [
  { value: 'LIFE_INSURANCE', label: 'Assurance vie' },
  { value: 'RETIREMENT_SAVINGS', label: 'Épargne retraite' },
  { value: 'REAL_ESTATE_INVESTMENT', label: 'Investissement immobilier' },
  { value: 'SECURITIES_INVESTMENT', label: 'Investissement titres' },
  { value: 'TAX_OPTIMIZATION', label: 'Optimisation fiscale' },
  { value: 'LOAN_RESTRUCTURING', label: 'Restructuration crédit' },
  { value: 'WEALTH_TRANSMISSION', label: 'Transmission patrimoine' },
  { value: 'INSURANCE_REVIEW', label: 'Révision assurances' },
  { value: 'OTHER', label: 'Autre' },
]

const priorities = [
  { value: 'LOW', label: 'Basse' },
  { value: 'MEDIUM', label: 'Moyenne' },
  { value: 'HIGH', label: 'Haute' },
  { value: 'URGENT', label: 'Urgente' },
]

const statuses = [
  { value: 'DETECTED', label: 'Détectée' },
  { value: 'QUALIFIED', label: 'Qualifiée' },
  { value: 'CONTACTED', label: 'Contactée' },
  { value: 'PRESENTED', label: 'Présentée' },
  { value: 'ACCEPTED', label: 'Acceptée' },
  { value: 'CONVERTED', label: 'Convertie' },
  { value: 'REJECTED', label: 'Rejetée' },
  { value: 'LOST', label: 'Perdue' },
]

export function UpdateOpportuniteModal({
  isOpen,
  onClose,
  opportunite,
  onSuccess,
}: UpdateOpportuniteModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    description: '',
    estimatedValue: '',
    confidence: '',
    priority: '',
    status: '',
  })

  useEffect(() => {
    if (opportunite) {
      setFormData({
        type: opportunite.type || '',
        name: opportunite.name || '',
        description: opportunite.description || '',
        estimatedValue: opportunite.estimatedValue?.toString() || '',
        confidence: opportunite.confidence?.toString() || '',
        priority: opportunite.priority || '',
        status: opportunite.status || '',
      })
    }
  }, [opportunite])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/opportunites/${opportunite.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
          confidence: formData.confidence ? parseFloat(formData.confidence) : undefined,
          priority: formData.priority,
          status: formData.status,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update opportunity')
      }

      toast({
        title: 'Opportunité mise à jour',
        description: 'L\'opportunité a été mise à jour avec succès',
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error updating opportunity:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'opportunité',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!opportunite) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier l'opportunité</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                disabled
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {opportuniteTypes.map((type: any) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Le type ne peut pas être modifié</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status: any) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="estimatedValue">Valeur estimée (€)</Label>
              <Input
                id="estimatedValue"
                type="number"
                step="0.01"
                value={formData.estimatedValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, estimatedValue: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confidence">Confiance (%)</Label>
              <Input
                id="confidence"
                type="number"
                min="0"
                max="100"
                value={formData.confidence}
                onChange={(e: any) => setFormData({ ...formData, confidence: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priorité *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority: any) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
