'use client'

/**
 * Politique de Confidentialité
 * Page légale pour la politique de confidentialité du CRM Aura
 */

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/app/_common/components/ui/Button'

export default function PolitiqueConfidentialitePage() {
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
            Politique de Confidentialité
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Dernière mise à jour : 27 décembre 2025
          </p>

          <div className="prose prose-gray max-w-none">
            <h2>1. Introduction</h2>
            <p>
              Aura CRM s'engage à protéger la vie privée de ses utilisateurs et de leurs clients. 
              Cette politique de confidentialité décrit comment nous collectons, utilisons et 
              protégeons vos données personnelles conformément au Règlement Général sur la 
              Protection des Données (RGPD).
            </p>

            <h2>2. Responsable du Traitement</h2>
            <p>
              Le responsable du traitement des données est :<br />
              <strong>Aura CRM SAS</strong><br />
              Adresse : Paris, France<br />
              Email : <a href="mailto:dpo@aura-crm.fr">dpo@aura-crm.fr</a>
            </p>

            <h2>3. Données Collectées</h2>
            <h3>3.1 Données des Utilisateurs (CGP/Conseillers)</h3>
            <ul>
              <li>Identité : nom, prénom, fonction</li>
              <li>Coordonnées : email, téléphone, adresse professionnelle</li>
              <li>Données de connexion : identifiants, logs d'accès</li>
              <li>Données professionnelles : numéro ORIAS, agrément CIF/COA</li>
            </ul>

            <h3>3.2 Données des Clients Finaux</h3>
            <p>En tant que sous-traitant, nous traitons pour le compte des Utilisateurs :</p>
            <ul>
              <li>Données d'identification : état civil, situation familiale</li>
              <li>Données financières : patrimoine, revenus, fiscalité</li>
              <li>Données contractuelles : contrats, investissements</li>
              <li>Documents : pièces d'identité, justificatifs</li>
            </ul>

            <h2>4. Finalités du Traitement</h2>
            <p>Les données sont traitées pour :</p>
            <ul>
              <li>La fourniture et l'amélioration du service</li>
              <li>La gestion de la relation client des Utilisateurs</li>
              <li>Le respect des obligations réglementaires (KYC, LCB-FT)</li>
              <li>La génération de documents légaux</li>
              <li>L'analyse et le reporting</li>
              <li>La sécurité de la plateforme</li>
            </ul>

            <h2>5. Base Légale</h2>
            <p>Les traitements sont fondés sur :</p>
            <ul>
              <li><strong>Exécution du contrat</strong> : pour les fonctionnalités du service</li>
              <li><strong>Obligation légale</strong> : pour les exigences réglementaires</li>
              <li><strong>Intérêt légitime</strong> : pour la sécurité et l'amélioration du service</li>
              <li><strong>Consentement</strong> : pour les communications marketing</li>
            </ul>

            <h2>6. Destinataires des Données</h2>
            <p>Les données peuvent être partagées avec :</p>
            <ul>
              <li>Nos sous-traitants techniques (hébergement, sécurité)</li>
              <li>Les autorités compétentes sur demande légale</li>
            </ul>
            <p>
              Nous ne vendons jamais vos données à des tiers. Les sous-traitants sont liés 
              par des contrats garantissant la protection des données.
            </p>

            <h2>7. Transferts Internationaux</h2>
            <p>
              Les données sont principalement hébergées dans l'Union Européenne. En cas de 
              transfert hors UE, nous nous assurons de garanties appropriées (clauses 
              contractuelles types, décision d'adéquation).
            </p>

            <h2>8. Durée de Conservation</h2>
            <ul>
              <li><strong>Données utilisateurs</strong> : durée du contrat + 3 ans</li>
              <li><strong>Données clients finaux</strong> : selon instructions de l'Utilisateur, minimum légal de 5 ans pour les documents réglementaires</li>
              <li><strong>Logs de connexion</strong> : 1 an</li>
              <li><strong>Données de facturation</strong> : 10 ans (obligation légale)</li>
            </ul>

            <h2>9. Sécurité</h2>
            <p>Nous mettons en œuvre des mesures de sécurité appropriées :</p>
            <ul>
              <li>Chiffrement des données en transit et au repos</li>
              <li>Authentification forte et gestion des accès</li>
              <li>Sauvegardes régulières</li>
              <li>Audits de sécurité périodiques</li>
              <li>Formation du personnel</li>
            </ul>

            <h2>10. Vos Droits</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul>
              <li><strong>Droit d'accès</strong> : obtenir une copie de vos données</li>
              <li><strong>Droit de rectification</strong> : corriger des données inexactes</li>
              <li><strong>Droit à l'effacement</strong> : demander la suppression de vos données</li>
              <li><strong>Droit à la limitation</strong> : restreindre le traitement</li>
              <li><strong>Droit à la portabilité</strong> : récupérer vos données dans un format structuré</li>
              <li><strong>Droit d'opposition</strong> : vous opposer à certains traitements</li>
            </ul>
            <p>
              Pour exercer ces droits, contactez-nous à : <a href="mailto:dpo@aura-crm.fr">dpo@aura-crm.fr</a>
            </p>

            <h2>11. Cookies</h2>
            <p>
              Nous utilisons des cookies essentiels au fonctionnement du service (authentification, 
              session). Aucun cookie publicitaire n'est utilisé. Les cookies de session sont 
              supprimés à la déconnexion.
            </p>

            <h2>12. Modifications</h2>
            <p>
              Cette politique peut être mise à jour. Les modifications significatives seront 
              notifiées par email ou via la plateforme.
            </p>

            <h2>13. Contact et Réclamations</h2>
            <p>
              Pour toute question ou réclamation :<br />
              Délégué à la Protection des Données : <a href="mailto:dpo@aura-crm.fr">dpo@aura-crm.fr</a>
            </p>
            <p>
              Vous pouvez également adresser une réclamation à la CNIL :<br />
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>
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
