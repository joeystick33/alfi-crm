'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/_common/components/ui/Dialog'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import Textarea from '@/app/_common/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { useToast } from '@/app/_common/hooks/use-toast'
import { ProjetType } from '@prisma/client'

interface CreateProjetModalProps {
  open: boolean
  onClose: () => void
  clientId: string
  onSuccess: () => void
}

const projetTypeLabels: Record<ProjetType, string> = {
  ACHAT_IMMOBILIER: 'Achat immobilier',
  CREATION_ENTREPRISE: 'Création d\'entreprise',
  PREPARATION_RETRAITE: 'Préparation retraite',
  RESTRUCTURATION_PATRIMOINE: 'Restructuration patrimoniale',
  OPTIMISATION_FISCALE: 'Optimisation fiscale',
  PLANIFICATION_SUCCESSION: 'Planification succession',
  AUTRE: 'Autre',
}

export function CreateProjetModal({ open, onClose, clientId, onSuccess }: CreateProjetModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'ACHAT_IMMOBILIER' as ProjetType,
    name: '',
    description: '',
    estimatedBudget: '',
    startDate: '',
    targetDate: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/clients/${clientId}/projets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to create projet')
      }

      toast({
        title: 'Succès',
        description: 'Projet créé avec succès',
      })

      onSuccess()
      onClose()
      
      // Reset form
      setFormData({
        type: 'ACHAT_IMMOBILIER',
        name: '',
        description: '',
        estimatedBudget: '',
        startDate: '',
        targetDate: '',
      })
    } catch (error: unknown) {
      console.error('Create projet error:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le projet',
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
          <DialogTitle>Créer un projet</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type de projet *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as ProjetType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(projetTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nom du projet *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Achat résidence principale"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez le projet..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedBudget">Budget estimé (€)</Label>
            <Input
              id="estimatedBudget"
              type="number"
              step="0.01"
              value={formData.estimatedBudget}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, estimatedBudget: e.target.value })}
              placeholder="300000"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetDate">Date cible</Label>
              <Input
                id="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, targetDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer le projet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
