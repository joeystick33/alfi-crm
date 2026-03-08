'use client'

/**
 * Conditions Générales de Service
 * Page légale pour les CGS du CRM Aura
 */

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/app/_common/components/ui/Button'

export default function ConditionsGeneralesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Navigation */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </Link>
        </div>

        {/* Contenu */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Conditions Générales de Service
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Dernière mise à jour : 27 décembre 2025
          </p>

          <div className="prose prose-gray max-w-none">
            <h2>1. Objet</h2>
            <p>
              Les présentes Conditions Générales de Service (CGS) régissent l'utilisation de la plateforme 
              Aura CRM, solution de gestion de la relation client destinée aux Conseillers en Gestion de 
              Patrimoine (CGP) et professionnels du conseil financier.
            </p>

            <h2>2. Définitions</h2>
            <ul>
              <li><strong>Plateforme</strong> : désigne l'application Aura CRM accessible via internet</li>
              <li><strong>Utilisateur</strong> : désigne toute personne physique ou morale utilisant la Plateforme</li>
              <li><strong>Cabinet</strong> : désigne la structure professionnelle de l'Utilisateur</li>
              <li><strong>Client Final</strong> : désigne les clients des Utilisateurs dont les données sont traitées</li>
            </ul>

            <h2>3. Accès au Service</h2>
            <p>
              L'accès à la Plateforme nécessite la création d'un compte et l'acceptation des présentes CGS. 
              L'Utilisateur s'engage à fournir des informations exactes et à maintenir la confidentialité 
              de ses identifiants de connexion.
            </p>

            <h2>4. Description du Service</h2>
            <p>Aura CRM propose les fonctionnalités suivantes :</p>
            <ul>
              <li>Gestion de portefeuille clients (Client360)</li>
              <li>Suivi patrimonial et fiscal</li>
              <li>Outils de simulation et de calcul</li>
              <li>Génération de documents réglementaires</li>
              <li>Gestion de la conformité (KYC, RGPD)</li>
              <li>Agenda et gestion des tâches</li>
              <li>Reporting et pilotage commercial</li>
            </ul>

            <h2>5. Obligations de l'Utilisateur</h2>
            <p>L'Utilisateur s'engage à :</p>
            <ul>
              <li>Utiliser le Service conformément à sa destination et aux lois en vigueur</li>
              <li>Respecter les règles de confidentialité des données de ses Clients Finaux</li>
              <li>Ne pas tenter de contourner les mesures de sécurité de la Plateforme</li>
              <li>Informer ses Clients Finaux du traitement de leurs données</li>
            </ul>

            <h2>6. Protection des Données</h2>
            <p>
              Le traitement des données personnelles est régi par notre Politique de Confidentialité. 
              Aura CRM agit en tant que sous-traitant au sens du RGPD pour les données des Clients Finaux.
            </p>

            <h2>7. Propriété Intellectuelle</h2>
            <p>
              L'ensemble des éléments de la Plateforme (logiciel, interface, contenus) reste la propriété 
              exclusive d'Aura CRM. L'Utilisateur bénéficie d'un droit d'usage limité à la durée de 
              l'abonnement.
            </p>

            <h2>8. Tarification et Paiement</h2>
            <p>
              Les tarifs applicables sont ceux en vigueur au moment de la souscription. Les paiements 
              sont effectués mensuellement ou annuellement selon l'offre choisie. Tout mois commencé 
              est dû.
            </p>

            <h2>9. Responsabilité</h2>
            <p>
              Aura CRM s'engage à assurer la disponibilité et la sécurité de la Plateforme. La responsabilité 
              d'Aura CRM est limitée aux dommages directs et ne peut excéder le montant des sommes versées 
              par l'Utilisateur au cours des 12 derniers mois.
            </p>

            <h2>10. Durée et Résiliation</h2>
            <p>
              Le contrat est conclu pour une durée indéterminée. Chaque partie peut résilier à tout moment 
              moyennant un préavis de 30 jours. En cas de manquement grave, la résiliation peut être 
              immédiate.
            </p>

            <h2>11. Modifications</h2>
            <p>
              Aura CRM se réserve le droit de modifier les présentes CGS. Les Utilisateurs seront informés 
              de toute modification significative avec un préavis de 30 jours.
            </p>

            <h2>12. Droit Applicable</h2>
            <p>
              Les présentes CGS sont régies par le droit français. Tout litige sera soumis aux tribunaux 
              compétents de Paris.
            </p>

            <h2>Contact</h2>
            <p>
              Pour toute question concernant ces conditions :<br />
              Email : <a href="mailto:legal@aura-crm.fr">legal@aura-crm.fr</a><br />
              Adresse : Aura CRM, Paris, France
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2025 Aura CRM. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  )
}
