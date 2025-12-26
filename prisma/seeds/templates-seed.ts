/**
 * Seed script pour les templates de documents réglementaires
 * 
 * Ce script génère des templates de démo pour:
 * - Document d'Entrée en Relation (DER)
 * - Recueil d'Informations Client
 * - Lettre de Mission
 * - Rapport de Mission
 * - Convention d'Honoraires
 * - Attestation de Conseil
 * - Questionnaire MiFID
 * 
 * Templates par association: CNCGP, ANACOFI, CNCEF, Generic
 * 
 * @module prisma/seeds/templates-seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// Template Content Structures
// ============================================

/**
 * Default document styles
 */
const DEFAULT_STYLES = {
  primaryColor: '#1e40af',
  secondaryColor: '#64748b',
  fontFamily: 'Arial, sans-serif',
  logoUrl: null,
  headerHeight: 80,
  footerHeight: 60,
};

/**
 * Association-specific styles
 */
const ASSOCIATION_STYLES: Record<string, typeof DEFAULT_STYLES> = {
  CNCGP: {
    ...DEFAULT_STYLES,
    primaryColor: '#0f4c81',
  },
  ANACOFI: {
    ...DEFAULT_STYLES,
    primaryColor: '#2563eb',
  },
  CNCEF: {
    ...DEFAULT_STYLES,
    primaryColor: '#059669',
  },
  GENERIC: DEFAULT_STYLES,
};

// ============================================
// DER Templates
// ============================================

function createDERTemplate(associationType: string) {
  const associationMention = getAssociationMention(associationType);
  
  return {
    header: {
      id: 'header',
      title: 'En-tête',
      content: `# Document d'Entrée en Relation

**{{cabinet_name}}**
{{cabinet_address}}
ORIAS n° {{orias_number}}

${associationMention}

---`,
      isMandatory: true,
      order: 0,
    },
    sections: [
      {
        id: 'advisor-info',
        title: 'Informations Conseiller',
        content: `## 1. Présentation du Conseiller

**Identité du conseiller :**
- Nom : {{advisor_name}}
- Qualité : Conseiller en Gestion de Patrimoine
- N° ORIAS : {{orias_number}}
- Catégorie : {{orias_category}}

**Assurance Responsabilité Civile Professionnelle :**
- Assureur : {{rc_insurer}}
- N° de police : {{rc_policy_number}}
- Couverture : {{rc_coverage}}`,
        isMandatory: true,
        order: 1,
      },
      {
        id: 'services',
        title: 'Services proposés',
        content: `## 2. Nature et étendue des services

Le conseiller propose les services suivants :
- Conseil en investissements financiers (CIF)
- Courtage en assurance
- Conseil en opérations de banque et services de paiement (COBSP)
- Conseil en immobilier

**Périmètre d'intervention :**
{{service_scope}}`,
        isMandatory: true,
        order: 2,
      },
      {
        id: 'fees',
        title: 'Rémunération',
        content: `## 3. Mode de rémunération

Le conseiller peut être rémunéré :
- Par des honoraires de conseil facturés au client
- Par des commissions versées par les fournisseurs de produits
- Par une combinaison des deux modes

**Transparence :**
Le détail de la rémunération sera communiqué avant toute souscription.`,
        isMandatory: true,
        order: 3,
      },
      {
        id: 'conflicts',
        title: 'Conflits d\'intérêts',
        content: `## 4. Gestion des conflits d'intérêts

Le conseiller s'engage à :
- Agir de manière honnête, loyale et professionnelle
- Servir au mieux les intérêts du client
- Identifier et gérer les conflits d'intérêts potentiels
- Informer le client de tout conflit d'intérêts non évitable`,
        isMandatory: true,
        order: 4,
      },
      {
        id: 'complaints',
        title: 'Réclamations',
        content: `## 5. Procédure de réclamation

En cas de réclamation, le client peut :
1. Contacter le conseiller par écrit à l'adresse du cabinet
2. Saisir le médiateur de l'AMF : www.amf-france.org
3. Saisir le médiateur de l'assurance : www.mediation-assurance.org

**Délai de traitement :** 2 mois maximum`,
        isMandatory: true,
        order: 5,
      },
      {
        id: 'data-protection',
        title: 'Protection des données',
        content: `## 6. Protection des données personnelles

Conformément au RGPD, le client dispose d'un droit d'accès, de rectification et de suppression de ses données personnelles.

**Responsable du traitement :** {{cabinet_name}}
**Contact DPO :** {{dpo_email}}`,
        isMandatory: true,
        order: 6,
      },
    ],
    footer: {
      id: 'footer',
      title: 'Pied de page',
      content: `---
Document généré le {{generation_date}}
{{cabinet_name}} - {{cabinet_address}}
Page {{page_number}} / {{total_pages}}`,
      isMandatory: true,
      order: 99,
    },
    styles: ASSOCIATION_STYLES[associationType] || DEFAULT_STYLES,
  };
}

// ============================================
// Recueil d'Informations Templates
// ============================================

function createRecueilTemplate(associationType: string) {
  const associationMention = getAssociationMention(associationType);
  
  return {
    header: {
      id: 'header',
      title: 'En-tête',
      content: `# Recueil d'Informations Client

**{{cabinet_name}}**
${associationMention}

**Client :** {{client_name}}
**Date :** {{generation_date}}

---`,
      isMandatory: true,
      order: 0,
    },
    sections: [
      {
        id: 'identity',
        title: 'Identité',
        content: `## 1. Identité et situation familiale

**État civil :**
- Nom : {{client_last_name}}
- Prénom : {{client_first_name}}
- Date de naissance : {{client_birth_date}}
- Lieu de naissance : {{client_birth_place}}
- Nationalité : {{client_nationality}}

**Situation familiale :**
- Situation matrimoniale : {{marital_status}}
- Régime matrimonial : {{marriage_regime}}
- Nombre d'enfants : {{children_count}}`,
        isMandatory: true,
        order: 1,
      },
      {
        id: 'professional',
        title: 'Situation professionnelle',
        content: `## 2. Situation professionnelle

- Profession : {{profession}}
- Employeur : {{employer_name}}
- Statut : {{professional_status}}
- Revenus annuels : {{annual_income}} €`,
        isMandatory: true,
        order: 2,
      },
      {
        id: 'patrimony',
        title: 'Patrimoine',
        content: `## 3. Composition du patrimoine

**Actifs :**
- Immobilier : {{real_estate_value}} €
- Financier : {{financial_assets_value}} €
- Autres : {{other_assets_value}} €

**Passifs :**
- Crédits immobiliers : {{mortgage_debt}} €
- Autres crédits : {{other_debt}} €

**Patrimoine net :** {{net_worth}} €`,
        isMandatory: true,
        order: 3,
      },
      {
        id: 'objectives',
        title: 'Objectifs',
        content: `## 4. Objectifs d'investissement

**Objectifs principaux :**
{{investment_objectives}}

**Horizon d'investissement :** {{investment_horizon}}

**Tolérance au risque :** {{risk_tolerance}}`,
        isMandatory: true,
        order: 4,
      },
      {
        id: 'knowledge',
        title: 'Connaissances financières',
        content: `## 5. Connaissances et expérience

**Niveau de connaissance financière :** {{financial_knowledge}}

**Expérience en investissement :**
{{investment_experience}}`,
        isMandatory: true,
        order: 5,
      },
    ],
    footer: {
      id: 'footer',
      title: 'Pied de page',
      content: `---
**Signature du client :**                    **Signature du conseiller :**

_________________________                    _________________________

Date : {{signature_date}}

Document généré le {{generation_date}} - {{cabinet_name}}`,
      isMandatory: true,
      order: 99,
    },
    styles: ASSOCIATION_STYLES[associationType] || DEFAULT_STYLES,
  };
}

// ============================================
// Lettre de Mission Templates
// ============================================

function createLettreMissionTemplate(associationType: string) {
  const associationMention = getAssociationMention(associationType);
  
  return {
    header: {
      id: 'header',
      title: 'En-tête',
      content: `# Lettre de Mission

**{{cabinet_name}}**
${associationMention}

**Client :** {{client_name}}
**Date :** {{generation_date}}

---`,
      isMandatory: true,
      order: 0,
    },
    sections: [
      {
        id: 'object',
        title: 'Objet de la mission',
        content: `## 1. Objet de la mission

La présente lettre de mission définit les conditions dans lesquelles {{cabinet_name}} intervient auprès de {{client_name}}.

**Nature de la mission :**
{{mission_type}}

**Périmètre :**
{{mission_scope}}`,
        isMandatory: true,
        order: 1,
      },
      {
        id: 'duration',
        title: 'Durée',
        content: `## 2. Durée de la mission

**Date de début :** {{mission_start_date}}
**Durée :** {{mission_duration}}

La mission peut être résiliée à tout moment par l'une ou l'autre des parties moyennant un préavis de 30 jours.`,
        isMandatory: true,
        order: 2,
      },
      {
        id: 'deliverables',
        title: 'Livrables',
        content: `## 3. Livrables attendus

Dans le cadre de cette mission, le conseiller s'engage à fournir :
{{deliverables}}`,
        isMandatory: true,
        order: 3,
      },
      {
        id: 'fees',
        title: 'Honoraires',
        content: `## 4. Honoraires

**Mode de rémunération :** {{fee_type}}
**Montant :** {{fee_amount}}

{{fee_details}}`,
        isMandatory: true,
        order: 4,
      },
      {
        id: 'obligations',
        title: 'Obligations',
        content: `## 5. Obligations des parties

**Obligations du conseiller :**
- Agir avec diligence et professionnalisme
- Respecter le secret professionnel
- Informer le client de tout élément pertinent

**Obligations du client :**
- Fournir les informations nécessaires
- Informer le conseiller de tout changement de situation`,
        isMandatory: true,
        order: 5,
      },
    ],
    footer: {
      id: 'footer',
      title: 'Pied de page',
      content: `---
**Fait en deux exemplaires**

**Le client :**                              **Le conseiller :**
{{client_name}}                              {{advisor_name}}

Signature :                                  Signature :

_________________________                    _________________________

Date : {{signature_date}}`,
      isMandatory: true,
      order: 99,
    },
    styles: ASSOCIATION_STYLES[associationType] || DEFAULT_STYLES,
  };
}

// ============================================
// Rapport de Mission Templates
// ============================================

function createRapportMissionTemplate(associationType: string) {
  const associationMention = getAssociationMention(associationType);
  
  return {
    header: {
      id: 'header',
      title: 'En-tête',
      content: `# Rapport de Mission

**{{cabinet_name}}**
${associationMention}

**Client :** {{client_name}}
**Date :** {{generation_date}}

---`,
      isMandatory: true,
      order: 0,
    },
    sections: [
      {
        id: 'summary',
        title: 'Synthèse',
        content: `## 1. Synthèse de la situation

**Situation patrimoniale :**
- Patrimoine brut : {{gross_assets}} €
- Patrimoine net : {{net_worth}} €
- Revenus annuels : {{annual_income}} €

**Profil investisseur :** {{risk_profile}}`,
        isMandatory: true,
        order: 1,
      },
      {
        id: 'analysis',
        title: 'Analyse',
        content: `## 2. Analyse et diagnostic

{{analysis_content}}`,
        isMandatory: true,
        order: 2,
      },
      {
        id: 'recommendations',
        title: 'Recommandations',
        content: `## 3. Recommandations

{{recommendations}}

**Justification :**
{{justification}}`,
        isMandatory: true,
        order: 3,
      },
      {
        id: 'risks',
        title: 'Avertissements',
        content: `## 4. Avertissements sur les risques

{{risk_warnings}}

**Important :** Les performances passées ne préjugent pas des performances futures.`,
        isMandatory: true,
        order: 4,
      },
    ],
    footer: {
      id: 'footer',
      title: 'Pied de page',
      content: `---
**Prise de connaissance du client :**

Je soussigné(e) {{client_name}} reconnais avoir pris connaissance des recommandations et avertissements ci-dessus.

Signature : _________________________

Date : {{signature_date}}`,
      isMandatory: true,
      order: 99,
    },
    styles: ASSOCIATION_STYLES[associationType] || DEFAULT_STYLES,
  };
}

// ============================================
// Helper Functions
// ============================================

function getAssociationMention(associationType: string): string {
  switch (associationType) {
    case 'CNCGP':
      return `*Membre de la Chambre Nationale des Conseils en Gestion de Patrimoine (CNCGP)*
*Adhérent au code de déontologie CNCGP*`;
    case 'ANACOFI':
      return `*Membre de l'Association Nationale des Conseils Financiers (ANACOFI)*
*N° adhérent ANACOFI : {{anacofi_number}}*`;
    case 'CNCEF':
      return `*Membre de la Chambre Nationale des Conseils Experts Financiers (CNCEF)*
*Certification CNCEF : {{cncef_certification}}*`;
    default:
      return '';
  }
}

// ============================================
// Main Seed Function
// ============================================

export async function seedTemplatesData(cabinetId: string, userId: string) {
  console.log('📝 Seeding document templates...');

  const associations = ['CNCGP', 'ANACOFI', 'CNCEF', 'GENERIC'] as const;
  const documentTypes = [
    { type: 'DER', name: "Document d'Entrée en Relation", createFn: createDERTemplate },
    { type: 'RECUEIL_INFORMATIONS', name: "Recueil d'Informations Client", createFn: createRecueilTemplate },
    { type: 'LETTRE_MISSION', name: 'Lettre de Mission', createFn: createLettreMissionTemplate },
    { type: 'RAPPORT_MISSION', name: 'Rapport de Mission', createFn: createRapportMissionTemplate },
  ];

  let templatesCreated = 0;

  for (const association of associations) {
    for (const docType of documentTypes) {
      const templateContent = docType.createFn(association);
      
      await prisma.regulatoryDocumentTemplate.create({
        data: {
          cabinetId,
          documentType: docType.type as 'DER' | 'RECUEIL_INFORMATIONS' | 'LETTRE_MISSION' | 'RAPPORT_MISSION' | 'CONVENTION_HONORAIRES' | 'ATTESTATION_CONSEIL' | 'MANDAT_GESTION' | 'DECLARATION_ADEQUATION' | 'QUESTIONNAIRE_MIFID' | 'BULLETIN_SOUSCRIPTION' | 'ORDRE_ARBITRAGE' | 'DEMANDE_RACHAT' | 'BULLETIN_VERSEMENT' | 'SIMULATION_FISCALE',
          associationType: association as 'CNCGP' | 'ANACOFI' | 'CNCEF' | 'GENERIC',
          name: `[DEMO] ${docType.name} - ${association}`,
          version: '1.0',
          content: templateContent,
          mandatorySections: templateContent.sections.filter(s => s.isMandatory).map(s => s.id),
          customizableSections: templateContent.sections.filter(s => !s.isMandatory).map(s => s.id),
          isActive: true,
          createdById: userId,
        },
      });
      
      templatesCreated++;
    }
  }

  // Create additional specific templates
  await createAdditionalTemplates(cabinetId, userId);

  console.log(`   ✓ ${templatesCreated} document templates created`);
  console.log('✅ Document templates seeded successfully');
}

async function createAdditionalTemplates(cabinetId: string, userId: string) {
  // Convention d'Honoraires template
  await prisma.regulatoryDocumentTemplate.create({
    data: {
      cabinetId,
      documentType: 'CONVENTION_HONORAIRES',
      associationType: 'GENERIC',
      name: "[DEMO] Convention d'Honoraires - Standard",
      version: '1.0',
      content: {
        header: {
          id: 'header',
          title: 'En-tête',
          content: `# Convention d'Honoraires\n\n**{{cabinet_name}}**\n**Client :** {{client_name}}\n**Date :** {{generation_date}}`,
          isMandatory: true,
          order: 0,
        },
        sections: [
          {
            id: 'fees-structure',
            title: 'Structure des honoraires',
            content: `## Structure des honoraires\n\n{{fee_structure}}`,
            isMandatory: true,
            order: 1,
          },
          {
            id: 'payment-terms',
            title: 'Modalités de paiement',
            content: `## Modalités de paiement\n\n{{payment_terms}}`,
            isMandatory: true,
            order: 2,
          },
        ],
        footer: {
          id: 'footer',
          title: 'Pied de page',
          content: `---\nSignatures`,
          isMandatory: true,
          order: 99,
        },
        styles: DEFAULT_STYLES,
      },
      mandatorySections: ['fees-structure', 'payment-terms'],
      customizableSections: [],
      isActive: true,
      createdById: userId,
    },
  });

  // Attestation de Conseil template
  await prisma.regulatoryDocumentTemplate.create({
    data: {
      cabinetId,
      documentType: 'ATTESTATION_CONSEIL',
      associationType: 'GENERIC',
      name: '[DEMO] Attestation de Conseil - Standard',
      version: '1.0',
      content: {
        header: {
          id: 'header',
          title: 'En-tête',
          content: `# Attestation de Conseil\n\n**{{cabinet_name}}**\n**Date :** {{generation_date}}`,
          isMandatory: true,
          order: 0,
        },
        sections: [
          {
            id: 'attestation',
            title: 'Attestation',
            content: `## Attestation\n\nJe soussigné(e) {{advisor_name}}, conseiller en gestion de patrimoine, atteste avoir fourni un conseil personnalisé à {{client_name}} concernant :\n\n{{advice_subject}}\n\nCe conseil a été formulé en tenant compte de la situation personnelle, des objectifs et du profil de risque du client.`,
            isMandatory: true,
            order: 1,
          },
        ],
        footer: {
          id: 'footer',
          title: 'Pied de page',
          content: `---\nFait à {{city}}, le {{date}}\n\nSignature du conseiller`,
          isMandatory: true,
          order: 99,
        },
        styles: DEFAULT_STYLES,
      },
      mandatorySections: ['attestation'],
      customizableSections: [],
      isActive: true,
      createdById: userId,
    },
  });

  // Questionnaire MiFID template
  await prisma.regulatoryDocumentTemplate.create({
    data: {
      cabinetId,
      documentType: 'QUESTIONNAIRE_MIFID',
      associationType: 'GENERIC',
      name: '[DEMO] Questionnaire MiFID II - Standard',
      version: '1.0',
      content: {
        header: {
          id: 'header',
          title: 'En-tête',
          content: `# Questionnaire Investisseur MiFID II\n\n**{{cabinet_name}}**\n**Client :** {{client_name}}\n**Date :** {{generation_date}}`,
          isMandatory: true,
          order: 0,
        },
        sections: [
          {
            id: 'knowledge',
            title: 'Connaissances',
            content: `## 1. Connaissances financières\n\n{{knowledge_questions}}`,
            isMandatory: true,
            order: 1,
          },
          {
            id: 'experience',
            title: 'Expérience',
            content: `## 2. Expérience en investissement\n\n{{experience_questions}}`,
            isMandatory: true,
            order: 2,
          },
          {
            id: 'situation',
            title: 'Situation financière',
            content: `## 3. Situation financière\n\n{{financial_situation_questions}}`,
            isMandatory: true,
            order: 3,
          },
          {
            id: 'objectives',
            title: 'Objectifs',
            content: `## 4. Objectifs d'investissement\n\n{{objectives_questions}}`,
            isMandatory: true,
            order: 4,
          },
          {
            id: 'risk-tolerance',
            title: 'Tolérance au risque',
            content: `## 5. Tolérance au risque\n\n{{risk_tolerance_questions}}`,
            isMandatory: true,
            order: 5,
          },
          {
            id: 'result',
            title: 'Résultat',
            content: `## Résultat du questionnaire\n\n**Profil investisseur :** {{risk_profile}}\n**Horizon d'investissement recommandé :** {{investment_horizon}}`,
            isMandatory: true,
            order: 6,
          },
        ],
        footer: {
          id: 'footer',
          title: 'Pied de page',
          content: `---\n**Signature du client :**\n\nJe certifie l'exactitude des informations fournies.\n\nSignature : _________________________\nDate : {{signature_date}}`,
          isMandatory: true,
          order: 99,
        },
        styles: DEFAULT_STYLES,
      },
      mandatorySections: ['knowledge', 'experience', 'situation', 'objectives', 'risk-tolerance', 'result'],
      customizableSections: [],
      isActive: true,
      createdById: userId,
    },
  });
}

// ============================================
// Cleanup Function
// ============================================

export async function cleanupTemplatesData(cabinetId: string) {
  console.log('🧹 Cleaning up templates demo data...');

  await prisma.regulatoryDocumentTemplate.deleteMany({
    where: { 
      cabinetId,
      name: { startsWith: '[DEMO]' }
    },
  });

  console.log('✅ Templates demo data cleaned up');
}

// ============================================
// Standalone Execution
// ============================================

async function main() {
  try {
    // Get the first cabinet for demo
    const cabinet = await prisma.cabinet.findFirst({
      include: { users: { where: { role: 'ADVISOR' }, take: 1 } },
    });

    if (!cabinet) {
      console.error('❌ No cabinet found. Please run the main seed first.');
      process.exit(1);
    }

    const userId = cabinet.users[0]?.id;
    if (!userId) {
      console.error('❌ No advisor found in cabinet. Please run the main seed first.');
      process.exit(1);
    }

    await seedTemplatesData(cabinet.id, userId);
  } catch (error) {
    console.error('❌ Templates seed error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
