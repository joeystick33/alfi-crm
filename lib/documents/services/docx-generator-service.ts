/**
 * Service de génération de documents DOCX réels
 * 
 * Ce service génère de vrais fichiers DOCX téléchargeables pour les documents réglementaires CGP:
 * - DER (Document d'Entrée en Relation)
 * - Déclaration d'Adéquation
 * - Bulletin d'Opération
 * - Lettre de Mission
 * - Recueil d'Informations
 * 
 * Utilise la bibliothèque `docx` pour la génération DOCX côté serveur
 * 
 * @module lib/documents/services/docx-generator-service
 * @requirements 4.1, 4.2, 4.3, 4.4, 4.5
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Header,
  Footer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  PageBreak,
  ShadingType,
  convertInchesToTwip,
} from 'docx'
import { uploadDocument, CONTENT_TYPES } from '@/lib/storage/file-storage-service'

// ============================================================================
// Types (réutilisés depuis pdf-generator-service)
// ============================================================================

export interface DOCXGeneratorResult {
  success: boolean
  fileBuffer?: Buffer
  fileName?: string
  fileUrl?: string
  storagePath?: string
  fileSize?: number
  error?: string
}

export interface ClientData {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  mobile: string | null
  address?: {
    street?: string
    postalCode?: string
    city?: string
    country?: string
  } | string | null
  birthDate: Date | null
  birthPlace: string | null
  nationality: string | null
  maritalStatus: string | null
  marriageRegime: string | null
  numberOfChildren: number | null
  profession: string | null
  employerName: string | null
  annualIncome: number | null
  riskProfile: string | null
  investmentHorizon: string | null
  investmentGoals?: string[] | null
  kycStatus: string
  isPEP: boolean
  originOfFunds: string | null
}

export interface CabinetData {
  id: string
  name: string
  email: string
  phone: string | null
  address?: {
    street?: string
    postalCode?: string
    city?: string
    country?: string
  } | string | null
  oriasNumber?: string
  acprRegistration?: string
  rcProInsurance?: string
  rcProInsurer?: string
  rcProPolicyNumber?: string
  website?: string
}

export interface AdvisorData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  oriasNumber?: string
}

export interface ProductData {
  name: string
  type: string
  provider: string
  isin?: string
  riskLevel?: number
  fees?: {
    entry?: number
    management?: number
    exit?: number
  }
  description?: string
}

export interface OperationData {
  id: string
  reference: string
  type: string
  amount: number
  date: Date
  contractNumber?: string
  contractName?: string
  funds?: Array<{
    name: string
    isin?: string
    amount: number
    percentage?: number
  }>
}

export interface MissionData {
  scope: string[]
  duration: string
  deliverables: string[]
  fees: {
    type: 'FORFAIT' | 'HORAIRE' | 'COMMISSION'
    amount?: number
    hourlyRate?: number
    description: string
  }
  terminationConditions: string
}

export interface PatrimoineData {
  actifs: Array<{ type: string; description: string; valeur: number }>
  passifs: Array<{ type: string; description: string; montant: number }>
}

export interface RevenusData {
  salaires?: number
  revenus_fonciers?: number
  revenus_capitaux?: number
  autres?: number
}

export interface ChargesData {
  loyer?: number
  credits?: number
  impots?: number
  autres?: number
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(date: Date | null | undefined): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return ''
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

function formatAddress(address: ClientData['address'] | CabinetData['address']): string {
  if (!address) return ''
  if (typeof address === 'string') return address
  const parts = [address.street, address.postalCode, address.city, address.country].filter(Boolean)
  return parts.join(', ')
}

function generateFileName(
  documentType: string,
  clientLastName: string,
  clientFirstName: string
): string {
  const date = new Date().toISOString().split('T')[0]
  const sanitizedName = `${clientLastName}_${clientFirstName}`.replace(/[^a-zA-Z0-9_]/g, '')
  return `${documentType}_${sanitizedName}_${date}.docx`
}

// ============================================================================
// DOCX Building Blocks
// ============================================================================

/**
 * Crée un en-tête de document avec les informations du cabinet
 */
function createHeader(cabinet: CabinetData, advisor: AdvisorData): Header {
  return new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: cabinet.name,
            bold: true,
            size: 28,
            color: '1a365d',
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: formatAddress(cabinet.address),
            size: 18,
            color: '4a5568',
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Tél: ${cabinet.phone || 'N/A'} | Email: ${cabinet.email}`,
            size: 18,
            color: '4a5568',
          }),
        ],
      }),
      ...(cabinet.oriasNumber ? [
        new Paragraph({
          children: [
            new TextRun({
              text: `N° ORIAS: ${cabinet.oriasNumber}`,
              size: 18,
              color: '4a5568',
            }),
          ],
        }),
      ] : []),
      new Paragraph({
        children: [
          new TextRun({
            text: `Conseiller: ${advisor.firstName} ${advisor.lastName}`,
            size: 18,
            color: '4a5568',
          }),
        ],
      }),
    ],
  })
}

/**
 * Crée un pied de page avec les informations légales
 */
function createFooter(cabinet: CabinetData): Footer {
  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `${cabinet.name} - ${formatAddress(cabinet.address)}`,
          size: 16,
          color: '718096',
        }),
      ],
    }),
  ]

  if (cabinet.oriasNumber) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `Enregistré à l'ORIAS sous le n° ${cabinet.oriasNumber} - www.orias.fr`,
            size: 16,
            color: '718096',
          }),
        ],
      })
    )
  }

  if (cabinet.rcProInsurance) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `RC Professionnelle: ${cabinet.rcProInsurer} - Police n° ${cabinet.rcProPolicyNumber}`,
            size: 16,
            color: '718096',
          }),
        ],
      })
    )
  }

  return new Footer({ children })
}

/**
 * Crée un titre de section
 */
function createSectionTitle(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [
      new TextRun({
        text,
        bold: true,
        size: 24,
        color: '2d3748',
      }),
    ],
    spacing: { before: 300, after: 150 },
    border: {
      bottom: {
        color: 'e2e8f0',
        space: 1,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
  })
}

/**
 * Crée une ligne label/valeur
 */
function createLabelValueRow(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `${label}: `,
        size: 20,
        color: '4a5568',
      }),
      new TextRun({
        text: value || 'N/A',
        size: 20,
        color: '1a202c',
      }),
    ],
    spacing: { after: 80 },
  })
}

/**
 * Crée un paragraphe de texte standard
 */
function createTextParagraph(text: string, options?: { bold?: boolean; color?: string }): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        size: 20,
        bold: options?.bold,
        color: options?.color || '2d3748',
      }),
    ],
    spacing: { after: 100 },
  })
}

/**
 * Crée un élément de liste à puces
 */
function createBulletPoint(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `• ${text}`,
        size: 20,
        color: '2d3748',
      }),
    ],
    spacing: { after: 60 },
    indent: { left: convertInchesToTwip(0.25) },
  })
}

/**
 * Crée un encadré d'avertissement
 */
function createWarningBox(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `⚠️ AVERTISSEMENT: ${text}`,
        size: 18,
        color: 'c53030',
        bold: true,
      }),
    ],
    spacing: { before: 150, after: 150 },
    shading: {
      type: ShadingType.SOLID,
      color: 'fff5f5',
    },
    border: {
      top: { color: 'fc8181', space: 1, style: BorderStyle.SINGLE, size: 6 },
      bottom: { color: 'fc8181', space: 1, style: BorderStyle.SINGLE, size: 6 },
      left: { color: 'fc8181', space: 1, style: BorderStyle.SINGLE, size: 6 },
      right: { color: 'fc8181', space: 1, style: BorderStyle.SINGLE, size: 6 },
    },
  })
}

/**
 * Crée un encadré d'information
 */
function createInfoBox(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `ℹ️ ${text}`,
        size: 18,
        color: '2b6cb0',
      }),
    ],
    spacing: { before: 150, after: 150 },
    shading: {
      type: ShadingType.SOLID,
      color: 'ebf8ff',
    },
    border: {
      top: { color: '63b3ed', space: 1, style: BorderStyle.SINGLE, size: 6 },
      bottom: { color: '63b3ed', space: 1, style: BorderStyle.SINGLE, size: 6 },
      left: { color: '63b3ed', space: 1, style: BorderStyle.SINGLE, size: 6 },
      right: { color: '63b3ed', space: 1, style: BorderStyle.SINGLE, size: 6 },
    },
  })
}

/**
 * Crée la section de signatures
 */
function createSignatureSection(clientName: string, advisorName: string): Paragraph[] {
  return [
    createSectionTitle('Signatures'),
    createTextParagraph('Fait en deux exemplaires originaux, dont un pour chaque partie.'),
    new Paragraph({ spacing: { after: 200 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Le Client: ${clientName}`,
          size: 20,
          bold: true,
        }),
      ],
    }),
    createTextParagraph('Lu et approuvé, bon pour accord'),
    new Paragraph({ spacing: { after: 100 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Signature: _________________________________',
          size: 20,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Date: ____/____/________',
          size: 18,
          color: '718096',
        }),
      ],
      spacing: { after: 300 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Le Conseiller: ${advisorName}`,
          size: 20,
          bold: true,
        }),
      ],
    }),
    createTextParagraph('Lu et approuvé'),
    new Paragraph({ spacing: { after: 100 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Signature: _________________________________',
          size: 20,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Date: ____/____/________',
          size: 18,
          color: '718096',
        }),
      ],
    }),
  ]
}



// ============================================================================
// DER (Document d'Entrée en Relation) DOCX
// ============================================================================

/**
 * Génère un DER (Document d'Entrée en Relation) en DOCX
 * 
 * @requirements 4.1 - THE Document_Generator_Real SHALL produce a real .docx file using the docx library
 * @requirements 4.2 - THE Document_Generator_Real SHALL preserve all formatting, headers, footers, and styles
 */
export async function generateDERDOCX(
  clientData: ClientData,
  cabinetData: CabinetData,
  advisorData: AdvisorData,
  options?: { uploadToStorage?: boolean }
): Promise<DOCXGeneratorResult> {
  try {
    const doc = new Document({
      sections: [
        {
          properties: {},
          headers: {
            default: createHeader(cabinetData, advisorData),
          },
          footers: {
            default: createFooter(cabinetData),
          },
          children: [
            // Titre principal
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Document d'Entrée en Relation",
                  bold: true,
                  size: 36,
                  color: '1a365d',
                }),
              ],
              spacing: { after: 400 },
            }),

            // Section 1: Identification du cabinet
            createSectionTitle('1. Identification du Cabinet'),
            createLabelValueRow('Raison sociale', cabinetData.name),
            createLabelValueRow('Adresse', formatAddress(cabinetData.address)),
            createLabelValueRow('Téléphone', cabinetData.phone || 'N/A'),
            createLabelValueRow('Email', cabinetData.email),
            ...(cabinetData.website ? [createLabelValueRow('Site web', cabinetData.website)] : []),

            // Section 2: Enregistrements réglementaires
            createSectionTitle('2. Enregistrements Réglementaires'),
            createLabelValueRow('N° ORIAS', cabinetData.oriasNumber || 'À compléter'),
            createLabelValueRow('Statut ACPR', cabinetData.acprRegistration || 'Conseiller en Investissements Financiers'),
            createTextParagraph('Vérifiable sur www.orias.fr - Registre unique des intermédiaires en assurance, banque et finance'),

            // Section 3: Assurance RC Professionnelle
            createSectionTitle('3. Assurance Responsabilité Civile Professionnelle'),
            createLabelValueRow('Assureur', cabinetData.rcProInsurer || 'À compléter'),
            createLabelValueRow('N° de police', cabinetData.rcProPolicyNumber || 'À compléter'),
            createLabelValueRow('Garantie', cabinetData.rcProInsurance || 'Conforme aux exigences réglementaires'),

            // Section 4: Services proposés
            createSectionTitle('4. Services Proposés'),
            createTextParagraph('Le cabinet propose les services suivants:'),
            createBulletPoint('Conseil en investissements financiers'),
            createBulletPoint('Conseil en gestion de patrimoine'),
            createBulletPoint('Courtage en assurance'),
            createBulletPoint('Intermédiation en opérations de banque'),
            createBulletPoint('Conseil en immobilier'),

            // Section 5: Mode de rémunération
            createSectionTitle('5. Mode de Rémunération'),
            createTextParagraph('Le cabinet peut être rémunéré de différentes manières:'),
            createBulletPoint('Honoraires de conseil facturés au client'),
            createBulletPoint('Commissions versées par les fournisseurs de produits'),
            createBulletPoint('Rétrocessions sur les frais de gestion'),
            createTextParagraph('Le détail de la rémunération sera communiqué avant toute souscription.'),

            // Saut de page
            new Paragraph({ children: [new PageBreak()] }),

            // Section 6: Informations réglementaires
            createSectionTitle('6. Informations Réglementaires'),
            createWarningBox('Les performances passées ne préjugent pas des performances futures. Tout investissement comporte des risques, notamment de perte en capital.'),
            createTextParagraph('En application de la directive MIF II (2014/65/UE), le conseiller doit:'),
            createBulletPoint('Agir de manière honnête, équitable et professionnelle'),
            createBulletPoint('Servir au mieux les intérêts du client'),
            createBulletPoint('Fournir une information claire, exacte et non trompeuse'),
            createBulletPoint("Évaluer l'adéquation des produits proposés"),

            // Section 7: Réclamations
            createSectionTitle('7. Procédure de Réclamation'),
            createTextParagraph('En cas de réclamation, vous pouvez contacter:'),
            createBulletPoint(`Le cabinet par email: ${cabinetData.email}`),
            createBulletPoint("Le médiateur de l'AMF: www.amf-france.org"),
            createBulletPoint("Le médiateur de l'assurance: www.mediation-assurance.org"),

            // Section 8: Identification du client
            createSectionTitle('8. Identification du Client'),
            createLabelValueRow('Nom', clientData.lastName),
            createLabelValueRow('Prénom', clientData.firstName),
            createLabelValueRow('Date de naissance', formatDate(clientData.birthDate)),
            createLabelValueRow('Lieu de naissance', clientData.birthPlace || 'N/A'),
            createLabelValueRow('Adresse', formatAddress(clientData.address)),
            createLabelValueRow('Email', clientData.email || 'N/A'),
            createLabelValueRow('Téléphone', clientData.phone || clientData.mobile || 'N/A'),

            // Signatures
            ...createSignatureSection(
              `${clientData.firstName} ${clientData.lastName}`,
              `${advisorData.firstName} ${advisorData.lastName}`
            ),
          ],
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)
    const fileName = generateFileName('DER', clientData.lastName, clientData.firstName)

    // Upload to storage if requested
    if (options?.uploadToStorage) {
      const uploadResult = await uploadDocument(
        cabinetData.id,
        clientData.id,
        fileName,
        buffer,
        CONTENT_TYPES.DOCX
      )

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error || 'Erreur lors du stockage du fichier',
        }
      }

      return {
        success: true,
        fileBuffer: Buffer.from(buffer),
        fileName,
        fileUrl: uploadResult.signedUrl || uploadResult.publicUrl,
        storagePath: uploadResult.path,
        fileSize: buffer.byteLength,
      }
    }

    return {
      success: true,
      fileBuffer: Buffer.from(buffer),
      fileName,
      fileSize: buffer.byteLength,
    }
  } catch (error) {
    console.error('[DOCXGenerator] Error generating DER DOCX:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la génération du DOCX',
    }
  }
}


// ============================================================================
// Déclaration d'Adéquation DOCX
// ============================================================================

/**
 * Génère une Déclaration d'Adéquation en DOCX
 * 
 * @requirements 4.1 - THE Document_Generator_Real SHALL produce a real .docx file
 * @requirements 4.2 - THE Document_Generator_Real SHALL preserve all formatting
 */
export async function generateDeclarationAdequationDOCX(
  clientData: ClientData,
  cabinetData: CabinetData,
  advisorData: AdvisorData,
  productData: ProductData,
  justification: string,
  warnings?: string[],
  options?: { uploadToStorage?: boolean }
): Promise<DOCXGeneratorResult> {
  try {
    const doc = new Document({
      sections: [
        {
          properties: {},
          headers: {
            default: createHeader(cabinetData, advisorData),
          },
          footers: {
            default: createFooter(cabinetData),
          },
          children: [
            // Titre principal
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Déclaration d'Adéquation",
                  bold: true,
                  size: 36,
                  color: '1a365d',
                }),
              ],
              spacing: { after: 400 },
            }),

            // Section 1: Profil du client
            createSectionTitle('1. Profil du Client'),
            createLabelValueRow('Client', `${clientData.firstName} ${clientData.lastName}`),
            createLabelValueRow('Profil de risque', clientData.riskProfile || 'Non défini'),
            createLabelValueRow("Horizon d'investissement", clientData.investmentHorizon || 'Non défini'),
            createLabelValueRow('Objectifs', clientData.investmentGoals?.join(', ') || 'Non définis'),
            createLabelValueRow('Situation professionnelle', clientData.profession || 'Non renseignée'),
            createLabelValueRow('Revenus annuels', formatCurrency(clientData.annualIncome)),

            // Section 2: Produit recommandé
            createSectionTitle('2. Produit Recommandé'),
            createLabelValueRow('Nom du produit', productData.name),
            createLabelValueRow('Type', productData.type),
            createLabelValueRow('Fournisseur', productData.provider),
            ...(productData.isin ? [createLabelValueRow('Code ISIN', productData.isin)] : []),
            ...(productData.riskLevel !== undefined ? [createLabelValueRow('Niveau de risque (SRI)', `${productData.riskLevel}/7`)] : []),
            ...(productData.fees ? [
              createLabelValueRow("Frais d'entrée", `${productData.fees.entry}%`),
              createLabelValueRow('Frais de gestion', `${productData.fees.management}%`),
            ] : []),
            ...(productData.description ? [createTextParagraph(productData.description)] : []),

            // Section 3: Justification de l'adéquation
            createSectionTitle("3. Justification de l'Adéquation"),
            createTextParagraph(justification),
            createInfoBox(
              "Cette recommandation est fondée sur l'analyse de votre situation personnelle, " +
              "de vos objectifs d'investissement, de votre tolérance au risque et de votre " +
              "horizon de placement, conformément aux exigences de la directive MIF II."
            ),

            // Section 4: Avertissements
            createSectionTitle('4. Avertissements'),
            createWarningBox(
              'Les performances passées ne préjugent pas des performances futures. ' +
              'La valeur de votre investissement peut fluctuer à la hausse comme à la baisse. ' +
              'Vous pouvez perdre tout ou partie du capital investi.'
            ),
            ...(warnings || []).map(w => createBulletPoint(w)),
            createTextParagraph(
              "Avant toute souscription, vous devez prendre connaissance du Document d'Information " +
              "Clé (DIC) et des conditions générales du produit."
            ),

            // Signatures
            ...createSignatureSection(
              `${clientData.firstName} ${clientData.lastName}`,
              `${advisorData.firstName} ${advisorData.lastName}`
            ),
          ],
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)
    const fileName = generateFileName('DECLARATION_ADEQUATION', clientData.lastName, clientData.firstName)

    if (options?.uploadToStorage) {
      const uploadResult = await uploadDocument(
        cabinetData.id,
        clientData.id,
        fileName,
        buffer,
        CONTENT_TYPES.DOCX
      )

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error || 'Erreur lors du stockage du fichier',
        }
      }

      return {
        success: true,
        fileBuffer: Buffer.from(buffer),
        fileName,
        fileUrl: uploadResult.signedUrl || uploadResult.publicUrl,
        storagePath: uploadResult.path,
        fileSize: buffer.byteLength,
      }
    }

    return {
      success: true,
      fileBuffer: Buffer.from(buffer),
      fileName,
      fileSize: buffer.byteLength,
    }
  } catch (error) {
    console.error('[DOCXGenerator] Error generating Declaration Adequation DOCX:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la génération du DOCX',
    }
  }
}

// ============================================================================
// Bulletin d'Opération DOCX
// ============================================================================

/**
 * Génère un Bulletin d'Opération en DOCX
 * 
 * @requirements 4.1 - THE Document_Generator_Real SHALL produce a real .docx file
 * @requirements 4.3 - THE Document_Generator_Real SHALL include editable placeholders
 */
export async function generateBulletinOperationDOCX(
  clientData: ClientData,
  cabinetData: CabinetData,
  advisorData: AdvisorData,
  operationData: OperationData,
  complianceChecklist?: Array<{ label: string; checked: boolean }>,
  options?: { uploadToStorage?: boolean }
): Promise<DOCXGeneratorResult> {
  try {
    // Créer le tableau des fonds si présent
    const fundsTableRows: TableRow[] = []
    if (operationData.funds && operationData.funds.length > 0) {
      // En-tête du tableau
      fundsTableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Support', bold: true, size: 18 })] })],
              width: { size: 40, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: 'edf2f7' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'ISIN', bold: true, size: 18 })] })],
              width: { size: 20, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: 'edf2f7' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Montant', bold: true, size: 18 })] })],
              width: { size: 20, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: 'edf2f7' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: '%', bold: true, size: 18 })] })],
              width: { size: 20, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: 'edf2f7' },
            }),
          ],
        })
      )

      // Lignes de données
      for (const fund of operationData.funds) {
        fundsTableRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: fund.name, size: 18 })] })],
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: fund.isin || 'N/A', size: 18 })] })],
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(fund.amount), size: 18 })] })],
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: `${fund.percentage || 'N/A'}%`, size: 18 })] })],
              }),
            ],
          })
        )
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          headers: {
            default: createHeader(cabinetData, advisorData),
          },
          footers: {
            default: createFooter(cabinetData),
          },
          children: [
            // Titre principal
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Bulletin d'Opération",
                  bold: true,
                  size: 36,
                  color: '1a365d',
                }),
              ],
              spacing: { after: 400 },
            }),

            // Section 1: Référence de l'opération
            createSectionTitle("1. Référence de l'Opération"),
            createLabelValueRow('Référence', operationData.reference),
            createLabelValueRow("Type d'opération", operationData.type),
            createLabelValueRow('Date', formatDate(operationData.date)),

            // Section 2: Identification du client
            createSectionTitle('2. Identification du Client'),
            createLabelValueRow('Nom', `${clientData.lastName} ${clientData.firstName}`),
            createLabelValueRow('Adresse', formatAddress(clientData.address)),
            createLabelValueRow('Email', clientData.email || 'N/A'),

            // Section 3: Contrat concerné
            createSectionTitle('3. Contrat Concerné'),
            createLabelValueRow('N° de contrat', operationData.contractNumber || 'N/A'),
            createLabelValueRow('Nom du contrat', operationData.contractName || 'N/A'),

            // Section 4: Détails de l'opération
            createSectionTitle("4. Détails de l'Opération"),
            createLabelValueRow('Montant', formatCurrency(operationData.amount)),

            // Tableau des fonds si présent
            ...(fundsTableRows.length > 0 ? [
              new Paragraph({ spacing: { before: 200 } }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: fundsTableRows,
              }),
            ] : []),

            // Section 5: Checklist conformité
            ...(complianceChecklist && complianceChecklist.length > 0 ? [
              createSectionTitle('5. Checklist Conformité'),
              ...complianceChecklist.map(item =>
                new Paragraph({
                  children: [
                    new TextRun({
                      text: item.checked ? '☑ ' : '☐ ',
                      size: 20,
                    }),
                    new TextRun({
                      text: item.label,
                      size: 20,
                      color: '2d3748',
                    }),
                  ],
                  spacing: { after: 60 },
                })
              ),
            ] : []),

            // Signatures
            ...createSignatureSection(
              `${clientData.firstName} ${clientData.lastName}`,
              `${advisorData.firstName} ${advisorData.lastName}`
            ),
          ],
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)
    const fileName = generateFileName('BULLETIN_OPERATION', clientData.lastName, clientData.firstName)

    if (options?.uploadToStorage) {
      const uploadResult = await uploadDocument(
        cabinetData.id,
        clientData.id,
        fileName,
        buffer,
        CONTENT_TYPES.DOCX
      )

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error || 'Erreur lors du stockage du fichier',
        }
      }

      return {
        success: true,
        fileBuffer: Buffer.from(buffer),
        fileName,
        fileUrl: uploadResult.signedUrl || uploadResult.publicUrl,
        storagePath: uploadResult.path,
        fileSize: buffer.byteLength,
      }
    }

    return {
      success: true,
      fileBuffer: Buffer.from(buffer),
      fileName,
      fileSize: buffer.byteLength,
    }
  } catch (error) {
    console.error('[DOCXGenerator] Error generating Bulletin Operation DOCX:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la génération du DOCX',
    }
  }
}


// ============================================================================
// Lettre de Mission DOCX
// ============================================================================

/**
 * Génère une Lettre de Mission en DOCX
 * 
 * @requirements 4.1 - THE Document_Generator_Real SHALL produce a real .docx file
 * @requirements 4.4 - THE Document_Generator_Real SHALL apply cabinet branding
 */
export async function generateLettreMissionDOCX(
  clientData: ClientData,
  cabinetData: CabinetData,
  advisorData: AdvisorData,
  missionData: MissionData,
  options?: { uploadToStorage?: boolean }
): Promise<DOCXGeneratorResult> {
  try {
    const doc = new Document({
      sections: [
        {
          properties: {},
          headers: {
            default: createHeader(cabinetData, advisorData),
          },
          footers: {
            default: createFooter(cabinetData),
          },
          children: [
            // Titre principal
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'Lettre de Mission',
                  bold: true,
                  size: 36,
                  color: '1a365d',
                }),
              ],
              spacing: { after: 400 },
            }),

            // Section 1: Les parties
            createSectionTitle('1. Les Parties'),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Le Cabinet:',
                  bold: true,
                  size: 20,
                }),
              ],
            }),
            createTextParagraph(cabinetData.name),
            createTextParagraph(formatAddress(cabinetData.address)),
            createTextParagraph(`Représenté par: ${advisorData.firstName} ${advisorData.lastName}`),
            new Paragraph({ spacing: { after: 200 } }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Le Client:',
                  bold: true,
                  size: 20,
                }),
              ],
            }),
            createTextParagraph(`${clientData.firstName} ${clientData.lastName}`),
            createTextParagraph(formatAddress(clientData.address)),

            // Section 2: Périmètre de la mission
            createSectionTitle('2. Périmètre de la Mission'),
            createTextParagraph("Le cabinet s'engage à réaliser les prestations suivantes:"),
            ...missionData.scope.map(item => createBulletPoint(item)),

            // Section 3: Durée
            createSectionTitle('3. Durée de la Mission'),
            createTextParagraph(missionData.duration),

            // Section 4: Livrables
            createSectionTitle('4. Livrables'),
            createTextParagraph("À l'issue de la mission, le client recevra:"),
            ...missionData.deliverables.map(item => createBulletPoint(item)),

            // Section 5: Rémunération
            createSectionTitle('5. Rémunération'),
            createTextParagraph(missionData.fees.description),
            ...(missionData.fees.type === 'FORFAIT' && missionData.fees.amount ? [
              createLabelValueRow('Montant forfaitaire', `${formatCurrency(missionData.fees.amount)} TTC`),
            ] : []),
            ...(missionData.fees.type === 'HORAIRE' && missionData.fees.hourlyRate ? [
              createLabelValueRow('Taux horaire', `${formatCurrency(missionData.fees.hourlyRate)} TTC/heure`),
            ] : []),
            createTextParagraph('Les honoraires sont payables selon les modalités convenues entre les parties.'),

            // Section 6: Conditions de résiliation
            createSectionTitle('6. Conditions de Résiliation'),
            createTextParagraph(missionData.terminationConditions),

            // Section 7: Obligations des parties
            createSectionTitle('7. Obligations des Parties'),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Le Cabinet s'engage à:",
                  bold: true,
                  size: 20,
                }),
              ],
            }),
            createBulletPoint('Agir avec diligence et professionnalisme'),
            createBulletPoint('Respecter le secret professionnel'),
            createBulletPoint("Informer le client de tout conflit d'intérêts"),
            createBulletPoint('Fournir des conseils adaptés à la situation du client'),
            new Paragraph({ spacing: { after: 200 } }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Le Client s'engage à:",
                  bold: true,
                  size: 20,
                }),
              ],
            }),
            createBulletPoint('Fournir des informations exactes et complètes'),
            createBulletPoint('Informer le cabinet de tout changement de situation'),
            createBulletPoint('Régler les honoraires selon les modalités convenues'),

            // Signatures
            ...createSignatureSection(
              `${clientData.firstName} ${clientData.lastName}`,
              `${advisorData.firstName} ${advisorData.lastName}`
            ),
          ],
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)
    const fileName = generateFileName('LETTRE_MISSION', clientData.lastName, clientData.firstName)

    if (options?.uploadToStorage) {
      const uploadResult = await uploadDocument(
        cabinetData.id,
        clientData.id,
        fileName,
        buffer,
        CONTENT_TYPES.DOCX
      )

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error || 'Erreur lors du stockage du fichier',
        }
      }

      return {
        success: true,
        fileBuffer: Buffer.from(buffer),
        fileName,
        fileUrl: uploadResult.signedUrl || uploadResult.publicUrl,
        storagePath: uploadResult.path,
        fileSize: buffer.byteLength,
      }
    }

    return {
      success: true,
      fileBuffer: Buffer.from(buffer),
      fileName,
      fileSize: buffer.byteLength,
    }
  } catch (error) {
    console.error('[DOCXGenerator] Error generating Lettre Mission DOCX:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la génération du DOCX',
    }
  }
}

// ============================================================================
// Recueil d'Informations DOCX
// ============================================================================

/**
 * Génère un Recueil d'Informations en DOCX
 * 
 * @requirements 4.1 - THE Document_Generator_Real SHALL produce a real .docx file
 * @requirements 4.2 - THE Document_Generator_Real SHALL preserve all formatting
 */
export async function generateRecueilInformationsDOCX(
  clientData: ClientData,
  cabinetData: CabinetData,
  advisorData: AdvisorData,
  patrimoineData?: PatrimoineData,
  revenusData?: RevenusData,
  chargesData?: ChargesData,
  options?: { uploadToStorage?: boolean }
): Promise<DOCXGeneratorResult> {
  try {
    // Créer les tableaux de patrimoine si présents
    const actifsTableRows: TableRow[] = []
    const passifsTableRows: TableRow[] = []

    if (patrimoineData?.actifs && patrimoineData.actifs.length > 0) {
      // En-tête du tableau actifs
      actifsTableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Type', bold: true, size: 18 })] })],
              width: { size: 30, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: 'edf2f7' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Description', bold: true, size: 18 })] })],
              width: { size: 40, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: 'edf2f7' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Valeur', bold: true, size: 18 })] })],
              width: { size: 30, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: 'edf2f7' },
            }),
          ],
        })
      )

      for (const actif of patrimoineData.actifs) {
        actifsTableRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: actif.type, size: 18 })] })],
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: actif.description, size: 18 })] })],
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(actif.valeur), size: 18 })] })],
              }),
            ],
          })
        )
      }
    }

    if (patrimoineData?.passifs && patrimoineData.passifs.length > 0) {
      // En-tête du tableau passifs
      passifsTableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Type', bold: true, size: 18 })] })],
              width: { size: 30, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: 'edf2f7' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Description', bold: true, size: 18 })] })],
              width: { size: 40, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: 'edf2f7' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Montant', bold: true, size: 18 })] })],
              width: { size: 30, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: 'edf2f7' },
            }),
          ],
        })
      )

      for (const passif of patrimoineData.passifs) {
        passifsTableRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: passif.type, size: 18 })] })],
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: passif.description, size: 18 })] })],
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(passif.montant), size: 18 })] })],
              }),
            ],
          })
        )
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          headers: {
            default: createHeader(cabinetData, advisorData),
          },
          footers: {
            default: createFooter(cabinetData),
          },
          children: [
            // Titre principal
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Recueil d'Informations Client",
                  bold: true,
                  size: 36,
                  color: '1a365d',
                }),
              ],
              spacing: { after: 400 },
            }),

            // Section 1: Identité
            createSectionTitle('1. Identité'),
            createLabelValueRow('Nom', clientData.lastName),
            createLabelValueRow('Prénom', clientData.firstName),
            createLabelValueRow('Date de naissance', formatDate(clientData.birthDate)),
            createLabelValueRow('Lieu de naissance', clientData.birthPlace || 'N/A'),
            createLabelValueRow('Nationalité', clientData.nationality || 'Française'),
            createLabelValueRow('Adresse', formatAddress(clientData.address)),
            createLabelValueRow('Email', clientData.email || 'N/A'),
            createLabelValueRow('Téléphone', clientData.phone || clientData.mobile || 'N/A'),

            // Section 2: Situation familiale
            createSectionTitle('2. Situation Familiale'),
            createLabelValueRow('Situation matrimoniale', clientData.maritalStatus || 'Non renseignée'),
            ...(clientData.marriageRegime ? [createLabelValueRow('Régime matrimonial', clientData.marriageRegime)] : []),
            createLabelValueRow("Nombre d'enfants", String(clientData.numberOfChildren ?? 0)),

            // Section 3: Situation professionnelle
            createSectionTitle('3. Situation Professionnelle'),
            createLabelValueRow('Profession', clientData.profession || 'Non renseignée'),
            ...(clientData.employerName ? [createLabelValueRow('Employeur', clientData.employerName)] : []),
            createLabelValueRow('Revenus annuels', formatCurrency(clientData.annualIncome)),

            // Section 4: Revenus détaillés
            ...(revenusData ? [
              createSectionTitle('4. Revenus Détaillés (annuels)'),
              ...(revenusData.salaires !== undefined ? [createLabelValueRow('Salaires/Traitements', formatCurrency(revenusData.salaires))] : []),
              ...(revenusData.revenus_fonciers !== undefined ? [createLabelValueRow('Revenus fonciers', formatCurrency(revenusData.revenus_fonciers))] : []),
              ...(revenusData.revenus_capitaux !== undefined ? [createLabelValueRow('Revenus de capitaux', formatCurrency(revenusData.revenus_capitaux))] : []),
              ...(revenusData.autres !== undefined ? [createLabelValueRow('Autres revenus', formatCurrency(revenusData.autres))] : []),
            ] : []),

            // Section 5: Charges
            ...(chargesData ? [
              createSectionTitle('5. Charges (annuelles)'),
              ...(chargesData.loyer !== undefined ? [createLabelValueRow('Loyer', formatCurrency(chargesData.loyer))] : []),
              ...(chargesData.credits !== undefined ? [createLabelValueRow('Crédits', formatCurrency(chargesData.credits))] : []),
              ...(chargesData.impots !== undefined ? [createLabelValueRow('Impôts', formatCurrency(chargesData.impots))] : []),
              ...(chargesData.autres !== undefined ? [createLabelValueRow('Autres charges', formatCurrency(chargesData.autres))] : []),
            ] : []),

            // Saut de page
            new Paragraph({ children: [new PageBreak()] }),

            // Section 6: Patrimoine - Actifs
            createSectionTitle('6. Patrimoine - Actifs'),
            ...(actifsTableRows.length > 0 ? [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: actifsTableRows,
              }),
            ] : [createTextParagraph('Aucun actif renseigné')]),

            // Section 7: Patrimoine - Passifs
            createSectionTitle('7. Patrimoine - Passifs'),
            ...(passifsTableRows.length > 0 ? [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: passifsTableRows,
              }),
            ] : [createTextParagraph('Aucun passif renseigné')]),

            // Section 8: Objectifs d'investissement
            createSectionTitle("8. Objectifs d'Investissement"),
            createLabelValueRow('Profil de risque', clientData.riskProfile || 'Non défini'),
            createLabelValueRow("Horizon d'investissement", clientData.investmentHorizon || 'Non défini'),
            createLabelValueRow('Objectifs', clientData.investmentGoals?.join(', ') || 'Non définis'),

            // Section 9: Informations réglementaires
            createSectionTitle('9. Informations Réglementaires'),
            createLabelValueRow('Personne Politiquement Exposée (PPE)', clientData.isPEP ? 'Oui' : 'Non'),
            createLabelValueRow('Origine des fonds', clientData.originOfFunds || 'Non renseignée'),
            createLabelValueRow('Statut KYC', clientData.kycStatus),

            // Section 10: Attestation
            createSectionTitle('10. Attestation'),
            createTextParagraph(
              `Je soussigné(e), ${clientData.firstName} ${clientData.lastName}, certifie sur l'honneur ` +
              "l'exactitude des informations fournies dans le présent document. Je m'engage " +
              "à informer mon conseiller de tout changement significatif de ma situation."
            ),

            // Signatures
            ...createSignatureSection(
              `${clientData.firstName} ${clientData.lastName}`,
              `${advisorData.firstName} ${advisorData.lastName}`
            ),
          ],
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)
    const fileName = generateFileName('RECUEIL_INFORMATIONS', clientData.lastName, clientData.firstName)

    if (options?.uploadToStorage) {
      const uploadResult = await uploadDocument(
        cabinetData.id,
        clientData.id,
        fileName,
        buffer,
        CONTENT_TYPES.DOCX
      )

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error || 'Erreur lors du stockage du fichier',
        }
      }

      return {
        success: true,
        fileBuffer: Buffer.from(buffer),
        fileName,
        fileUrl: uploadResult.signedUrl || uploadResult.publicUrl,
        storagePath: uploadResult.path,
        fileSize: buffer.byteLength,
      }
    }

    return {
      success: true,
      fileBuffer: Buffer.from(buffer),
      fileName,
      fileSize: buffer.byteLength,
    }
  } catch (error) {
    console.error('[DOCXGenerator] Error generating Recueil Informations DOCX:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la génération du DOCX',
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Vérifie si un buffer est un DOCX valide
 * Un DOCX valide est un fichier ZIP qui commence par PK (signature ZIP)
 */
export function isValidDOCX(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 4) return false
  // DOCX files are ZIP archives, which start with PK (0x50 0x4B)
  return buffer[0] === 0x50 && buffer[1] === 0x4B
}

/**
 * Obtient la taille d'un fichier DOCX en format lisible
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Types de documents supportés pour la génération DOCX
 */
export const SUPPORTED_DOCX_DOCUMENT_TYPES = [
  'DER',
  'DECLARATION_ADEQUATION',
  'BULLETIN_OPERATION',
  'LETTRE_MISSION',
  'RECUEIL_INFORMATIONS',
] as const

export type SupportedDOCXDocumentType = typeof SUPPORTED_DOCX_DOCUMENT_TYPES[number]

/**
 * Vérifie si un type de document est supporté pour la génération DOCX
 */
export function isSupportedDOCXDocumentType(type: string): type is SupportedDOCXDocumentType {
  return SUPPORTED_DOCX_DOCUMENT_TYPES.includes(type as SupportedDOCXDocumentType)
}
