'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/_common/components/ui/Dialog'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import Textarea from '@/app/_common/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { useToast } from '@/app/_common/hooks/use-toast'

interface CreateOpportuniteModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string
  onSuccess: () => void
}

const opportuniteTypes = [
  { value: 'ASSURANCE_VIE', label: 'Assurance vie' },
  { value: 'EPARGNE_RETRAITE', label: 'Épargne retraite' },
  { value: 'INVESTISSEMENT_IMMOBILIER', label: 'Investissement immobilier' },
  { value: 'INVESTISSEMENT_FINANCIER', label: 'Investissement titres' },
  { value: 'OPTIMISATION_FISCALE', label: 'Optimisation fiscale' },
  { value: 'RESTRUCTURATION_CREDIT', label: 'Restructuration crédit' },
  { value: 'TRANSMISSION', label: 'Transmission patrimoine' },
  { value: 'AUDIT_ASSURANCES', label: 'Révision assurances' },
  { value: 'AUTRE', label: 'Autre' },
]

const priorities = [
  { value: 'BASSE', label: 'Basse' },
  { value: 'MOYENNE', label: 'Moyenne' },
  { value: 'HAUTE', label: 'Haute' },
  { value: 'URGENTE', label: 'Urgente' },
]

export function CreateOpportuniteModal({
  isOpen,
  onClose,
  clientId,
  onSuccess,
}: CreateOpportuniteModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'ASSURANCE_VIE',
    name: '',
    description: '',
    estimatedValue: '',
    confidence: '50',
    priority: 'MOYENNE',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/clients/${clientId}/opportunites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          name: formData.name,
          description: formData.description || undefined,
          estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
          confidence: parseFloat(formData.confidence),
          priority: formData.priority,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create opportunity')
      }

      toast({
        title: 'Opportunité créée',
        description: 'L\'opportunité a été créée avec succès',
      })

      onSuccess()
      onClose()
      
      // Reset form
      setFormData({
        type: 'ASSURANCE_VIE',
        name: '',
        description: '',
        estimatedValue: '',
        confidence: '50',
        priority: 'MOYENNE',
      })
    } catch (error: unknown) {
      console.error('Error creating opportunity:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de créer l\'opportunité',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouvelle opportunité</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: string) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {opportuniteTypes.map((type: { value: string; label: string }) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priorité *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: string) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority: { value: string; label: string }) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Optimisation fiscale 2024"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez l'opportunité..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="estimatedValue">Valeur estimée (€)</Label>
              <Input
                id="estimatedValue"
                type="number"
                step="0.01"
                value={formData.estimatedValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, estimatedValue: e.target.value })}
                placeholder="0.00"
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, confidence: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer l\'opportunité'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
