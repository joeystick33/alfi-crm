/**
 * Catégories et types de documents réglementaires
 */

export interface DocumentType {
  id: string;
  label: string;
  description: string;
  required: boolean;
  expiryMonths: number | null;
  reminderDays?: number;
  threshold?: number;
}

export interface DocumentCategory {
  label: string;
  required: boolean;
  color: string;
  types: DocumentType[];
}

export const DOCUMENT_CATEGORIES: Record<string, DocumentCategory> = {
  // Documents d'entrée en relation (OBLIGATOIRES)
  ENTREE_RELATION: {
    label: '📋 Entrée en Relation',
    required: true,
    color: 'red',
    types: [
      {
        id: 'LETTRE_MISSION',
        label: 'Lettre de mission signée',
        description: 'Contrat de prestation conseil',
        required: true,
        expiryMonths: null,
        reminderDays: 30,
      },
      {
        id: 'DECLARATION_ADEQUATION',
        label: 'Déclaration d\'adéquation',
        description: 'Conformité MIFID II',
        required: true,
        expiryMonths: 12,
        reminderDays: 60,
      },
      {
        id: 'PROFIL_RISQUE',
        label: 'Questionnaire profil de risque',
        description: 'Évaluation MIFID II',
        required: true,
        expiryMonths: 12,
        reminderDays: 60,
      },
      {
        id: 'CONNAISSANCE_EXPERIENCE',
        label: 'Test connaissance et expérience',
        description: 'MIFID II - Article 25',
        required: true,
        expiryMonths: 24,
        reminderDays: 90,
      },
      {
        id: 'SITUATION_FINANCIERE',
        label: 'Déclaration situation financière',
        description: 'Capacité financière',
        required: true,
        expiryMonths: 12,
        reminderDays: 60,
      },
    ],
  },

  // Documents KYC/LCB-FT (OBLIGATOIRES)
  KYC: {
    label: '🔍 KYC / LCB-FT',
    required: true,
    color: 'orange',
    types: [
      {
        id: 'PIECE_IDENTITE',
        label: 'Pièce d\'identité',
        description: 'CNI, passeport, titre séjour',
        required: true,
        expiryMonths: 120, // 10 ans
        reminderDays: 180,
      },
      {
        id: 'JUSTIF_DOMICILE',
        label: 'Justificatif de domicile',
        description: '< 3 mois',
        required: true,
        expiryMonths: 3,
        reminderDays: 15,
      },
      {
        id: 'RIB',
        label: 'RIB',
        description: 'Relevé Identité Bancaire',
        required: true,
        expiryMonths: null,
        reminderDays: 30,
      },
      {
        id: 'JUSTIF_REVENUS',
        label: 'Justificatif de revenus',
        description: 'Bulletin salaire, avis imposition',
        required: true,
        expiryMonths: 12,
        reminderDays: 60,
      },
      {
        id: 'ORIGINE_FONDS',
        label: 'Justificatif origine des fonds',
        description: 'Si patrimoine > 150k€',
        required: false,
        threshold: 150000,
        expiryMonths: 60,
        reminderDays: 180,
      },
      {
        id: 'DECLARATION_BENEFICIAIRE',
        label: 'Déclaration bénéficiaire effectif',
        description: 'LCB-FT',
        required: true,
        expiryMonths: 24,
        reminderDays: 90,
      },
    ],
  },

  // Documents fiscaux
  FISCAL: {
    label: '💰 Fiscalité',
    required: false,
    color: 'blue',
    types: [
      {
        id: 'AVIS_IMPOSITION',
        label: 'Avis d\'imposition',
        description: 'Dernière année fiscale',
        required: false,
        expiryMonths: 12,
        reminderDays: 60,
      },
      {
        id: 'DECLARATION_IFI',
        label: 'Déclaration IFI',
        description: 'Si patrimoine > 1.3M€',
        required: false,
        threshold: 1300000,
        expiryMonths: 12,
        reminderDays: 60,
      },
      {
        id: 'JUSTIF_DOMICILE_FISCAL',
        label: 'Justificatif domicile fiscal',
        description: 'Résidence fiscale',
        required: false,
        expiryMonths: 24,
        reminderDays: 90,
      },
    ],
  },

  // Documents patrimoniaux
  PATRIMOINE: {
    label: '🏠 Patrimoine',
    required: false,
    color: 'green',
    types: [
      {
        id: 'ACTE_PROPRIETE',
        label: 'Acte de propriété',
        description: 'Bien immobilier',
        required: false,
        expiryMonths: null,
      },
      {
        id: 'ESTIMATION_BIEN',
        label: 'Estimation bien immobilier',
        description: 'Valorisation récente',
        required: false,
        expiryMonths: 24,
        reminderDays: 90,
      },
      {
        id: 'RELEVE_ASSURANCE_VIE',
        label: 'Relevé assurance-vie',
        description: 'Situation du contrat',
        required: false,
        expiryMonths: 6,
        reminderDays: 30,
      },
      {
        id: 'RELEVE_COMPTE_TITRES',
        label: 'Relevé compte-titres',
        description: 'Portefeuille boursier',
        required: false,
        expiryMonths: 3,
        reminderDays: 15,
      },
      {
        id: 'ATTESTATION_PRET',
        label: 'Attestation prêt immobilier',
        description: 'Capital restant dû',
        required: false,
        expiryMonths: 12,
        reminderDays: 60,
      },
    ],
  },

  // Documents contractuels
  CONTRATS: {
    label: '📄 Contrats',
    required: false,
    color: 'purple',
    types: [
      {
        id: 'CONTRAT_ASSURANCE_VIE',
        label: 'Contrat assurance-vie',
        description: 'Conditions générales',
        required: false,
        expiryMonths: null,
      },
      {
        id: 'CONTRAT_CAPITALISATION',
        label: 'Contrat de capitalisation',
        description: 'Conditions générales',
        required: false,
        expiryMonths: null,
      },
      {
        id: 'CONTRAT_PER',
        label: 'Contrat PER',
        description: 'Plan Épargne Retraite',
        required: false,
        expiryMonths: null,
      },
      {
        id: 'CONVENTION_COMPTE_TITRES',
        label: 'Convention compte-titres',
        description: 'Ouverture compte',
        required: false,
        expiryMonths: null,
      },
    ],
  },

  // Documents produits par le conseiller
  RAPPORTS: {
    label: '📊 Rapports & Préconisations',
    required: false,
    color: 'indigo',
    types: [
      {
        id: 'RAPPORT_PATRIMONIAL',
        label: 'Rapport patrimonial',
        description: 'Audit complet',
        required: false,
        expiryMonths: 12,
        reminderDays: 90,
      },
      {
        id: 'PRECONISATIONS',
        label: 'Note de préconisations',
        description: 'Recommandations conseil',
        required: false,
        expiryMonths: 12,
        reminderDays: 90,
      },
      {
        id: 'SIMULATION_RETRAITE',
        label: 'Simulation retraite',
        description: 'Projection revenus',
        required: false,
        expiryMonths: 12,
        reminderDays: 90,
      },
      {
        id: 'SIMULATION_SUCCESSION',
        label: 'Simulation succession',
        description: 'Droits et optimisation',
        required: false,
        expiryMonths: 12,
        reminderDays: 90,
      },
    ],
  },

  // Autres documents
  AUTRES: {
    label: '📎 Autres',
    required: false,
    color: 'gray',
    types: [
      {
        id: 'COMPTE_RENDU_RDV',
        label: 'Compte-rendu rendez-vous',
        description: 'Suivi relation',
        required: false,
        expiryMonths: null,
      },
      {
        id: 'CORRESPONDANCE',
        label: 'Correspondance',
        description: 'Emails, courriers',
        required: false,
        expiryMonths: null,
      },
      {
        id: 'AUTRE',
        label: 'Autre document',
        description: 'Non classé',
        required: false,
        expiryMonths: null,
      },
    ],
  },
};

export interface DocumentCompletenessResult {
  score: number;
  totalRequired: number;
  completed: number;
  missing: number;
  missingDocs: Array<{
    category: string;
    type: string;
    label: string;
    description: string;
    expired?: boolean;
  }>;
  expiringDocs: Array<{
    category: string;
    type: string;
    label: string;
    expiryDate: Date;
    daysRemaining: number;
  }>;
  status: 'COMPLETE' | 'GOOD' | 'MEDIUM' | 'INCOMPLETE';
}

/**
 * Calcul du score de complétude documentaire
 */
export function calculateDocumentCompleteness(
  documents: Array<{ type: string; uploadedAt?: Date | string }>,
  clientPatrimoine = 0
): DocumentCompletenessResult {
  let totalRequired = 0;
  let completedRequired = 0;
  const missingDocs: DocumentCompletenessResult['missingDocs'] = [];
  const expiringDocs: DocumentCompletenessResult['expiringDocs'] = [];

  // Parcourir toutes les catégories et types
  for (const [catKey, category] of Object.entries(DOCUMENT_CATEGORIES)) {
    for (const docType of category.types) {
      // Vérifier si requis (avec seuil de patrimoine)
      const isRequired = docType.required && 
        (!docType.threshold || clientPatrimoine >= docType.threshold);

      if (isRequired) {
        totalRequired++;

        // Chercher document correspondant
        const doc = documents.find(d => d.type === docType.id);

        if (!doc) {
          missingDocs.push({
            category: category.label,
            type: docType.id,
            label: docType.label,
            description: docType.description,
          });
        } else {
          // Vérifier expiration
          if (docType.expiryMonths && doc.uploadedAt) {
            const uploadDate = new Date(doc.uploadedAt);
            const expiryDate = new Date(uploadDate);
            expiryDate.setMonth(expiryDate.getMonth() + docType.expiryMonths);

            const now = new Date();
            const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry < 0) {
              missingDocs.push({
                category: category.label,
                type: docType.id,
                label: docType.label,
                description: `Expiré le ${expiryDate.toLocaleDateString('fr-FR')}`,
                expired: true,
              });
            } else {
              completedRequired++;
              
              if (daysUntilExpiry <= (docType.reminderDays || 30)) {
                expiringDocs.push({
                  category: category.label,
                  type: docType.id,
                  label: docType.label,
                  expiryDate,
                  daysRemaining: daysUntilExpiry,
                });
              }
            }
          } else {
            completedRequired++;
          }
        }
      }
    }
  }

  const score = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 100;

  return {
    score,
    totalRequired,
    completed: completedRequired,
    missing: totalRequired - completedRequired,
    missingDocs,
    expiringDocs,
    status: score === 100 ? 'COMPLETE' : score >= 80 ? 'GOOD' : score >= 50 ? 'MEDIUM' : 'INCOMPLETE',
  };
}

/**
 * Obtenir les détails d'un type de document
 */
export function getDocumentTypeDetails(typeId: string) {
  for (const category of Object.values(DOCUMENT_CATEGORIES)) {
    const docType = category.types.find(t => t.id === typeId);
    if (docType) {
      return { ...docType, category: category.label };
    }
  }
  return null;
}

/**
 * Liste plate de tous les types pour select
 */
export function getAllDocumentTypes() {
  const types: Array<{
    value: string;
    label: string;
    category: string;
    required: boolean;
  }> = [];
  
  for (const [catKey, category] of Object.entries(DOCUMENT_CATEGORIES)) {
    for (const docType of category.types) {
      types.push({
        value: docType.id,
        label: `${category.label.replace(/[^\w\s]/gi, '')} - ${docType.label}`,
        category: category.label,
        required: docType.required,
      });
    }
  }
  
  return types.sort((a: any, b: any) => {
    if (a.required && !b.required) return -1;
    if (!a.required && b.required) return 1;
    return a.label.localeCompare(b.label);
  });
}
