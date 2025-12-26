 
'use client'

/**
 * Modal pour le Wizard Client complet
 * Création ou édition d'un client avec toutes les étapes
 */

import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
} from '@/app/_common/components/ui/Dialog'
import { ClientWizard } from '../../client/wizard'
import { useToast } from '@/app/_common/hooks/use-toast'
import type { ClientDetail } from '@/app/_common/lib/api-types'

interface ClientWizardModalProps {
  isOpen: boolean
  onClose: () => void
  client?: ClientDetail | null
  onSuccess?: (client: any) => void
}

export function ClientWizardModal({
  isOpen,
  onClose,
  client,
  onSuccess,
}: ClientWizardModalProps) {
  const { toast: _toast } = useToast()
  const queryClient = useQueryClient()
  const isEdit = !!client?.id

  // Transformer les données client existantes en format wizard
  const getInitialData = () => {
    if (!client) return undefined

    return {
      identite: {
        civilite: client.civility,
        nom: client.lastName,
        prenom: client.firstName,
        dateNaissance: client.birthDate,
        lieuNaissance: client.birthPlace,
        nationalite: client.nationality,
      },
      coordonnees: {
        adresse: client.address ? {
          ligne1: client.address.street,
          codePostal: client.address.postalCode,
          ville: client.address.city,
          pays: client.address.country,
        } : undefined,
        emailPersonnel: client.email,
        telephoneMobile: client.mobile || client.phone,
      },
      situationFamiliale: {
        situationMatrimoniale: client.maritalStatus,
      },
      situationProfessionnelle: {
        profession: client.profession,
        employeur: client.employer,
      },
      // Autres données...
    }
  }

  // Gestionnaire de sauvegarde
  const handleSave = async (data: any) => {
    try {
      const endpoint = isEdit 
        ? `/api/advisor/clients/${client.id}`
        : '/api/advisor/clients'
      
      const method = isEdit ? 'PUT' : 'POST'

      // Transformer les données wizard en format API
      const payload = {
        civility: data.identite?.civilite,
        firstName: data.identite?.prenom,
        lastName: data.identite?.nom,
        birthDate: data.identite?.dateNaissance,
        birthPlace: data.identite?.lieuNaissance,
        nationality: data.identite?.nationalite,
        email: data.coordonnees?.emailPersonnel,
        phone: data.coordonnees?.telephoneMobile,
        mobile: data.coordonnees?.telephoneMobile,
        address: data.coordonnees?.adresse ? {
          street: data.coordonnees.adresse.ligne1,
          postalCode: data.coordonnees.adresse.codePostal,
          city: data.coordonnees.adresse.ville,
          country: data.coordonnees.adresse.pays || 'France',
        } : undefined,
        maritalStatus: data.situationFamiliale?.situationMatrimoniale,
        matrimonialRegime: data.situationFamiliale?.regimeMatrimonial,
        profession: data.situationProfessionnelle?.profession,
        employer: data.situationProfessionnelle?.employeur,
        employmentStatus: data.situationProfessionnelle?.statut,
        // KYC
        kycRiskLevel: data.kycLcbft?.niveauRisque,
        kycOriginFunds: data.kycLcbft?.origineFonds,
        isPEP: data.kycLcbft?.estPPE,
        isUSPerson: data.kycLcbft?.usPersonFatca,
        // Profil investisseur
        riskProfile: data.profilRisque?.profilRisque,
        investmentHorizon: data.profilRisque?.horizonInvestissement,
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement')
      }

      const result = await response.json()

      // Invalider le cache React Query pour rafraîchir les données
      await queryClient.invalidateQueries({ queryKey: ['clients'] })
      if (isEdit && client?.id) {
        await queryClient.invalidateQueries({ queryKey: ['clients', client.id] })
      }

      onSuccess?.(result)
      onClose()
    } catch (error) {
      console.error('Error saving client:', error)
      throw error
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 overflow-visible">
        <ClientWizard
          onSave={handleSave}
          onCancel={onClose}
          initialData={getInitialData()}
          isEdit={isEdit}
        />
      </DialogContent>
    </Dialog>
  )
}

export default ClientWizardModal
