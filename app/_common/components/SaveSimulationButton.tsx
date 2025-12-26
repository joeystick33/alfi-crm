'use client'

import { useState } from 'react'
import { Button } from '@/app/_common/components/ui/Button'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '@/app/_common/components/ui/Modal'
import { Input } from '@/app/_common/components/ui/Input'
import { useSaveSimulation } from '@/app/(advisor)/(frontend)/hooks/use-save-simulation'
import { Save, Check } from 'lucide-react'
import { SimulationType } from '@prisma/client'

interface SaveSimulationButtonProps {
  type: SimulationType
  defaultName: string
  parameters: Record<string, unknown>
  results: Record<string, unknown>
  recommendations?: Record<string, unknown>
  feasibilityScore?: number
  onSaved?: () => void
}

export function SaveSimulationButton({
  type,
  defaultName,
  parameters,
  results,
  recommendations,
  feasibilityScore,
  onSaved,
}: SaveSimulationButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [clientId, setClientId] = useState('')
  const [name, setName] = useState(defaultName)
  const [description, setDescription] = useState('')
  const [sharedWithClient, setSharedWithClient] = useState(false)
  const [saved, setSaved] = useState(false)

  const { saveSimulation, saving, error } = useSaveSimulation()

  const handleSave = async () => {
    if (!clientId || !name) {
      alert('Veuillez remplir tous les champs requis')
      return
    }

    try {
      await saveSimulation({
        clientId,
        type,
        name,
        description,
        parameters,
        results,
        recommendations,
        feasibilityScore,
        sharedWithClient,
      })

      setSaved(true)
      setTimeout(() => {
        setIsOpen(false)
        setSaved(false)
        if (onSaved) onSaved()
      }, 1500)
    } catch (err) {
      // Error is handled by the hook
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline">
        <Save className="w-4 h-4 mr-2" />
        Sauvegarder dans le dossier client
      </Button>

      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Sauvegarder la simulation</ModalTitle>
          </ModalHeader>
          <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Client <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              placeholder="ID du client"
              value={clientId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClientId(e.target.value)}
              disabled={saving || saved}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Entrez l'ID du client pour lier cette simulation
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Nom de la simulation <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              placeholder="Ex: Simulation retraite 2024"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              disabled={saving || saved}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description (optionnel)
            </label>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md"
              placeholder="Ajoutez des notes ou commentaires..."
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              disabled={saving || saved}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="shareWithClient"
              checked={sharedWithClient}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSharedWithClient(e.target.checked)}
              disabled={saving || saved}
              className="rounded"
            />
            <label htmlFor="shareWithClient" className="text-sm">
              Partager avec le client
            </label>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {saved && (
            <div className="text-sm text-success bg-success/10 p-3 rounded-md flex items-center gap-2">
              <Check className="w-4 h-4" />
              Simulation sauvegardée avec succès !
            </div>
          )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={saving || saved}
              >
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving || saved}>
                {saving ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : 'Sauvegarder'}
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </>
  )
}
