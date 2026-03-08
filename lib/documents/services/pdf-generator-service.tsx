/**
 * Service de génération de documents PDF réels
 * 
 * Ce service génère de vrais fichiers PDF téléchargeables pour les documents réglementaires CGP:
 * - DER (Document d'Entrée en Relation)
 * - Déclaration d'Adéquation
 * - Bulletin d'Opération
 * - Lettre de Mission
 * - Recueil d'Informations
 * 
 * Utilise @react-pdf/renderer pour la génération PDF côté serveur
 * 
 * @module lib/documents/services/pdf-generator-service
 * @requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */

import { renderToBuffer } from '@react-pdf/renderer'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import React from 'react'
import { uploadDocument, CONTENT_TYPES } from '@/lib/storage/file-storage-service'

// ============================================================================
// Types
// ============================================================================

export interface PDFGeneratorResult {
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

// ============================================================================
// Styles PDF
// ============================================================================

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1a365d',
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 9,
    color: '#4a5568',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d3748',
    marginTop: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 5,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
    backgroundColor: '#f7fafc',
    padding: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: '40%',
    fontSize: 9,
    color: '#4a5568',
  },
  value: {
    width: '60%',
    fontSize: 9,
    color: '#1a202c',
  },
  text: {
    fontSize: 9,
    color: '#2d3748',
    marginBottom: 5,
    lineHeight: 1.5,
  },
  boldText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  warning: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fc8181',
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  warningText: {
    fontSize: 8,
    color: '#c53030',
  },
  info: {
    backgroundColor: '#ebf8ff',
    borderWidth: 1,
    borderColor: '#63b3ed',
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 8,
    color: '#2b6cb0',
  },
  signatureSection: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 20,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  signatureBox: {
    width: '45%',
  },
  signatureLabel: {
    fontSize: 9,
    color: '#4a5568',
    marginBottom: 5,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#2d3748',
    height: 40,
    marginBottom: 5,
  },
  dateLine: {
    fontSize: 8,
    color: '#718096',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 7,
    color: '#718096',
    textAlign: 'center',
  },
  table: {
    marginTop: 10,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#edf2f7',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e0',
    padding: 5,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 5,
  },
  tableCell: {
    fontSize: 8,
    color: '#4a5568',
  },
  checkbox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: '#4a5568',
    marginRight: 5,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
})

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
  return `${documentType}_${sanitizedName}_${date}.pdf`
}

// ============================================================================
// PDF Document Components
// ============================================================================

interface HeaderProps {
  cabinet: CabinetData
  advisor: AdvisorData
}

const Header: React.FC<HeaderProps> = ({ cabinet, advisor }) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>{cabinet.name}</Text>
    <Text style={styles.headerSubtitle}>
      {formatAddress(cabinet.address)}
    </Text>
    <Text style={styles.headerSubtitle}>
      Tél: {cabinet.phone || 'N/A'} | Email: {cabinet.email}
    </Text>
    {cabinet.oriasNumber && (
      <Text style={styles.headerSubtitle}>
        N° ORIAS: {cabinet.oriasNumber}
      </Text>
    )}
    <Text style={styles.headerSubtitle}>
      Conseiller: {advisor.firstName} {advisor.lastName}
    </Text>
  </View>
)

interface FooterProps {
  cabinet: CabinetData
  pageNumber?: number
}

const Footer: React.FC<FooterProps> = ({ cabinet }) => (
  <View style={styles.footer}>
    <Text style={styles.footerText}>
      {cabinet.name} - {formatAddress(cabinet.address)}
    </Text>
    {cabinet.oriasNumber && (
      <Text style={styles.footerText}>
        Enregistré à l&apos;ORIAS sous le n° {cabinet.oriasNumber} - www.orias.fr
      </Text>
    )}
    {cabinet.rcProInsurance && (
      <Text style={styles.footerText}>
        RC Professionnelle: {cabinet.rcProInsurer} - Police n° {cabinet.rcProPolicyNumber}
      </Text>
    )}
  </View>
)

interface SignatureSectionProps {
  clientName: string
  advisorName: string
}

const SignatureSection: React.FC<SignatureSectionProps> = ({ clientName, advisorName }) => (
  <View style={styles.signatureSection}>
    <Text style={styles.sectionTitle}>Signatures</Text>
    <Text style={styles.text}>
      Fait en deux exemplaires originaux, dont un pour chaque partie.
    </Text>
    <View style={styles.signatureRow}>
      <View style={styles.signatureBox}>
        <Text style={styles.signatureLabel}>Le Client: {clientName}</Text>
        <Text style={styles.text}>Lu et approuvé, bon pour accord</Text>
        <View style={styles.signatureLine} />
        <Text style={styles.dateLine}>Date: ____/____/________</Text>
      </View>
      <View style={styles.signatureBox}>
        <Text style={styles.signatureLabel}>Le Conseiller: {advisorName}</Text>
        <Text style={styles.text}>Lu et approuvé</Text>
        <View style={styles.signatureLine} />
        <Text style={styles.dateLine}>Date: ____/____/________</Text>
      </View>
    </View>
  </View>
)

// ============================================================================
// DER (Document d'Entrée en Relation) PDF
// ============================================================================

interface DERDocumentProps {
  client: ClientData
  cabinet: CabinetData
  advisor: AdvisorData
}

const DERDocument: React.FC<DERDocumentProps> = ({ client, cabinet, advisor }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Header cabinet={cabinet} advisor={advisor} />
      
      <Text style={styles.title}>Document d&apos;Entrée en Relation</Text>
      
      {/* Identification du cabinet */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Identification du Cabinet</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Raison sociale:</Text>
          <Text style={styles.value}>{cabinet.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Adresse:</Text>
          <Text style={styles.value}>{formatAddress(cabinet.address)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Téléphone:</Text>
          <Text style={styles.value}>{cabinet.phone || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{cabinet.email}</Text>
        </View>
        {cabinet.website && (
          <View style={styles.row}>
            <Text style={styles.label}>Site web:</Text>
            <Text style={styles.value}>{cabinet.website}</Text>
          </View>
        )}
      </View>

      {/* Enregistrements réglementaires */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Enregistrements Réglementaires</Text>
        <View style={styles.row}>
          <Text style={styles.label}>N° ORIAS:</Text>
          <Text style={styles.value}>{cabinet.oriasNumber || 'À compléter'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Statut ACPR:</Text>
          <Text style={styles.value}>{cabinet.acprRegistration || 'Conseiller en Investissements Financiers'}</Text>
        </View>
        <Text style={styles.text}>
          Vérifiable sur www.orias.fr - Registre unique des intermédiaires en assurance, banque et finance
        </Text>
      </View>

      {/* Assurance RC Professionnelle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Assurance Responsabilité Civile Professionnelle</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Assureur:</Text>
          <Text style={styles.value}>{cabinet.rcProInsurer || 'À compléter'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>N° de police:</Text>
          <Text style={styles.value}>{cabinet.rcProPolicyNumber || 'À compléter'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Garantie:</Text>
          <Text style={styles.value}>{cabinet.rcProInsurance || 'Conforme aux exigences réglementaires'}</Text>
        </View>
      </View>

      {/* Services proposés */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Services Proposés</Text>
        <Text style={styles.text}>Le cabinet propose les services suivants:</Text>
        <Text style={styles.text}>• Conseil en investissements financiers</Text>
        <Text style={styles.text}>• Conseil en gestion de patrimoine</Text>
        <Text style={styles.text}>• Courtage en assurance</Text>
        <Text style={styles.text}>• Intermédiation en opérations de banque</Text>
        <Text style={styles.text}>• Conseil en immobilier</Text>
      </View>

      {/* Tarification */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Mode de Rémunération</Text>
        <Text style={styles.text}>
          Le cabinet peut être rémunéré de différentes manières:
        </Text>
        <Text style={styles.text}>• Honoraires de conseil facturés au client</Text>
        <Text style={styles.text}>• Commissions versées par les fournisseurs de produits</Text>
        <Text style={styles.text}>• Rétrocessions sur les frais de gestion</Text>
        <Text style={styles.text}>
          Le détail de la rémunération sera communiqué avant toute souscription.
        </Text>
      </View>

      <Footer cabinet={cabinet} />
    </Page>

    <Page size="A4" style={styles.page}>
      <Header cabinet={cabinet} advisor={advisor} />

      {/* Mentions légales AMF/ACPR */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. Informations Réglementaires</Text>
        
        <View style={styles.warning}>
          <Text style={styles.warningText}>
            AVERTISSEMENT AMF: Les performances passées ne préjugent pas des performances futures. 
            Tout investissement comporte des risques, notamment de perte en capital.
          </Text>
        </View>

        <Text style={styles.text}>
          En application de la directive MIF II (2014/65/UE), le conseiller doit:
        </Text>
        <Text style={styles.text}>• Agir de manière honnête, équitable et professionnelle</Text>
        <Text style={styles.text}>• Servir au mieux les intérêts du client</Text>
        <Text style={styles.text}>• Fournir une information claire, exacte et non trompeuse</Text>
        <Text style={styles.text}>• Évaluer l&apos;adéquation des produits proposés</Text>
      </View>

      {/* Réclamations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. Procédure de Réclamation</Text>
        <Text style={styles.text}>
          En cas de réclamation, vous pouvez contacter:
        </Text>
        <Text style={styles.text}>• Le cabinet par email: {cabinet.email}</Text>
        <Text style={styles.text}>• Le médiateur de l&apos;AMF: www.amf-france.org</Text>
        <Text style={styles.text}>• Le médiateur de l&apos;assurance: www.mediation-assurance.org</Text>
      </View>

      {/* Identification du client */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>8. Identification du Client</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Nom:</Text>
          <Text style={styles.value}>{client.lastName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Prénom:</Text>
          <Text style={styles.value}>{client.firstName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date de naissance:</Text>
          <Text style={styles.value}>{formatDate(client.birthDate)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Lieu de naissance:</Text>
          <Text style={styles.value}>{client.birthPlace || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Adresse:</Text>
          <Text style={styles.value}>{formatAddress(client.address)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{client.email || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Téléphone:</Text>
          <Text style={styles.value}>{client.phone || client.mobile || 'N/A'}</Text>
        </View>
      </View>

      {/* Signatures */}
      <SignatureSection 
        clientName={`${client.firstName} ${client.lastName}`}
        advisorName={`${advisor.firstName} ${advisor.lastName}`}
      />

      <Footer cabinet={cabinet} />
    </Page>
  </Document>
)



// ============================================================================
// Déclaration d'Adéquation PDF
// ============================================================================

interface DeclarationAdequationProps {
  client: ClientData
  cabinet: CabinetData
  advisor: AdvisorData
  product: ProductData
  justification: string
  warnings?: string[]
}

const DeclarationAdequationDocument: React.FC<DeclarationAdequationProps> = ({
  client,
  cabinet,
  advisor,
  product,
  justification,
  warnings = [],
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Header cabinet={cabinet} advisor={advisor} />
      
      <Text style={styles.title}>Déclaration d&apos;Adéquation</Text>
      
      {/* Profil client */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Profil du Client</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Client:</Text>
          <Text style={styles.value}>{client.firstName} {client.lastName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Profil de risque:</Text>
          <Text style={styles.value}>{client.riskProfile || 'Non défini'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Horizon d&apos;investissement:</Text>
          <Text style={styles.value}>{client.investmentHorizon || 'Non défini'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Objectifs:</Text>
          <Text style={styles.value}>
            {client.investmentGoals?.join(', ') || 'Non définis'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Situation professionnelle:</Text>
          <Text style={styles.value}>{client.profession || 'Non renseignée'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Revenus annuels:</Text>
          <Text style={styles.value}>{formatCurrency(client.annualIncome)}</Text>
        </View>
      </View>

      {/* Produit recommandé */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Produit Recommandé</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Nom du produit:</Text>
          <Text style={styles.value}>{product.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Type:</Text>
          <Text style={styles.value}>{product.type}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Fournisseur:</Text>
          <Text style={styles.value}>{product.provider}</Text>
        </View>
        {product.isin && (
          <View style={styles.row}>
            <Text style={styles.label}>Code ISIN:</Text>
            <Text style={styles.value}>{product.isin}</Text>
          </View>
        )}
        {product.riskLevel !== undefined && (
          <View style={styles.row}>
            <Text style={styles.label}>Niveau de risque (SRI):</Text>
            <Text style={styles.value}>{product.riskLevel}/7</Text>
          </View>
        )}
        {product.fees && (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Frais d&apos;entrée:</Text>
              <Text style={styles.value}>{product.fees.entry}%</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Frais de gestion:</Text>
              <Text style={styles.value}>{product.fees.management}%</Text>
            </View>
          </>
        )}
        {product.description && (
          <Text style={styles.text}>{product.description}</Text>
        )}
      </View>

      {/* Justification de l'adéquation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Justification de l&apos;Adéquation</Text>
        <Text style={styles.text}>{justification}</Text>
        
        <View style={styles.info}>
          <Text style={styles.infoText}>
            Cette recommandation est fondée sur l&apos;analyse de votre situation personnelle, 
            de vos objectifs d&apos;investissement, de votre tolérance au risque et de votre 
            horizon de placement, conformément aux exigences de la directive MIF II.
          </Text>
        </View>
      </View>

      {/* Avertissements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Avertissements</Text>
        
        <View style={styles.warning}>
          <Text style={styles.warningText}>
            ATTENTION: Les performances passées ne préjugent pas des performances futures. 
            La valeur de votre investissement peut fluctuer à la hausse comme à la baisse. 
            Vous pouvez perdre tout ou partie du capital investi.
          </Text>
        </View>

        {warnings.map((warning, index) => (
          <Text key={index} style={styles.text}>• {warning}</Text>
        ))}

        <Text style={styles.text}>
          Avant toute souscription, vous devez prendre connaissance du Document d&apos;Information 
          Clé (DIC) et des conditions générales du produit.
        </Text>
      </View>

      {/* Signatures */}
      <SignatureSection 
        clientName={`${client.firstName} ${client.lastName}`}
        advisorName={`${advisor.firstName} ${advisor.lastName}`}
      />

      <Footer cabinet={cabinet} />
    </Page>
  </Document>
)

// ============================================================================
// Bulletin d'Opération PDF
// ============================================================================

interface BulletinOperationProps {
  client: ClientData
  cabinet: CabinetData
  advisor: AdvisorData
  operation: OperationData
  complianceChecklist?: Array<{ label: string; checked: boolean }>
}

const BulletinOperationDocument: React.FC<BulletinOperationProps> = ({
  client,
  cabinet,
  advisor,
  operation,
  complianceChecklist = [],
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Header cabinet={cabinet} advisor={advisor} />
      
      <Text style={styles.title}>Bulletin d&apos;Opération</Text>
      
      {/* Référence opération */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Référence de l&apos;Opération</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Référence:</Text>
          <Text style={styles.value}>{operation.reference}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Type d&apos;opération:</Text>
          <Text style={styles.value}>{operation.type}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{formatDate(operation.date)}</Text>
        </View>
      </View>

      {/* Identification client */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Identification du Client</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Nom:</Text>
          <Text style={styles.value}>{client.lastName} {client.firstName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Adresse:</Text>
          <Text style={styles.value}>{formatAddress(client.address)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{client.email || 'N/A'}</Text>
        </View>
      </View>

      {/* Détails du contrat */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Contrat Concerné</Text>
        <View style={styles.row}>
          <Text style={styles.label}>N° de contrat:</Text>
          <Text style={styles.value}>{operation.contractNumber || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Nom du contrat:</Text>
          <Text style={styles.value}>{operation.contractName || 'N/A'}</Text>
        </View>
      </View>

      {/* Détails de l'opération */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Détails de l&apos;Opération</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Montant:</Text>
          <Text style={styles.value}>{formatCurrency(operation.amount)}</Text>
        </View>
        
        {operation.funds && operation.funds.length > 0 && (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '40%' }]}>Support</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>ISIN</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Montant</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>%</Text>
            </View>
            {operation.funds.map((fund, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '40%' }]}>{fund.name}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{fund.isin || 'N/A'}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{formatCurrency(fund.amount)}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{fund.percentage || 'N/A'}%</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Checklist conformité */}
      {complianceChecklist.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Checklist Conformité</Text>
          {complianceChecklist.map((item, index) => (
            <View key={index} style={styles.checkboxRow}>
              <View style={styles.checkbox}>
                {item.checked && <Text style={{ fontSize: 8 }}>✓</Text>}
              </View>
              <Text style={styles.text}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Signatures */}
      <SignatureSection 
        clientName={`${client.firstName} ${client.lastName}`}
        advisorName={`${advisor.firstName} ${advisor.lastName}`}
      />

      <Footer cabinet={cabinet} />
    </Page>
  </Document>
)


// ============================================================================
// Lettre de Mission PDF
// ============================================================================

interface LettreMissionProps {
  client: ClientData
  cabinet: CabinetData
  advisor: AdvisorData
  mission: {
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
}

const LettreMissionDocument: React.FC<LettreMissionProps> = ({
  client,
  cabinet,
  advisor,
  mission,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Header cabinet={cabinet} advisor={advisor} />
      
      <Text style={styles.title}>Lettre de Mission</Text>
      
      {/* Parties */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Les Parties</Text>
        <Text style={styles.boldText}>Le Cabinet:</Text>
        <Text style={styles.text}>{cabinet.name}</Text>
        <Text style={styles.text}>{formatAddress(cabinet.address)}</Text>
        <Text style={styles.text}>Représenté par: {advisor.firstName} {advisor.lastName}</Text>
        
        <Text style={[styles.boldText, { marginTop: 10 }]}>Le Client:</Text>
        <Text style={styles.text}>{client.firstName} {client.lastName}</Text>
        <Text style={styles.text}>{formatAddress(client.address)}</Text>
      </View>

      {/* Périmètre de la mission */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Périmètre de la Mission</Text>
        <Text style={styles.text}>
          Le cabinet s&apos;engage à réaliser les prestations suivantes:
        </Text>
        {mission.scope.map((item, index) => (
          <Text key={index} style={styles.text}>• {item}</Text>
        ))}
      </View>

      {/* Durée */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Durée de la Mission</Text>
        <Text style={styles.text}>{mission.duration}</Text>
      </View>

      {/* Livrables */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Livrables</Text>
        <Text style={styles.text}>
          À l&apos;issue de la mission, le client recevra:
        </Text>
        {mission.deliverables.map((item, index) => (
          <Text key={index} style={styles.text}>• {item}</Text>
        ))}
      </View>

      {/* Tarification */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Rémunération</Text>
        <Text style={styles.text}>{mission.fees.description}</Text>
        {mission.fees.type === 'FORFAIT' && mission.fees.amount && (
          <View style={styles.row}>
            <Text style={styles.label}>Montant forfaitaire:</Text>
            <Text style={styles.value}>{formatCurrency(mission.fees.amount)} TTC</Text>
          </View>
        )}
        {mission.fees.type === 'HORAIRE' && mission.fees.hourlyRate && (
          <View style={styles.row}>
            <Text style={styles.label}>Taux horaire:</Text>
            <Text style={styles.value}>{formatCurrency(mission.fees.hourlyRate)} TTC/heure</Text>
          </View>
        )}
        <Text style={styles.text}>
          Les honoraires sont payables selon les modalités convenues entre les parties.
        </Text>
      </View>

      {/* Conditions de résiliation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. Conditions de Résiliation</Text>
        <Text style={styles.text}>{mission.terminationConditions}</Text>
      </View>

      {/* Obligations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. Obligations des Parties</Text>
        <Text style={styles.boldText}>Le Cabinet s&apos;engage à:</Text>
        <Text style={styles.text}>• Agir avec diligence et professionnalisme</Text>
        <Text style={styles.text}>• Respecter le secret professionnel</Text>
        <Text style={styles.text}>• Informer le client de tout conflit d&apos;intérêts</Text>
        <Text style={styles.text}>• Fournir des conseils adaptés à la situation du client</Text>
        
        <Text style={[styles.boldText, { marginTop: 10 }]}>Le Client s&apos;engage à:</Text>
        <Text style={styles.text}>• Fournir des informations exactes et complètes</Text>
        <Text style={styles.text}>• Informer le cabinet de tout changement de situation</Text>
        <Text style={styles.text}>• Régler les honoraires selon les modalités convenues</Text>
      </View>

      {/* Signatures */}
      <SignatureSection 
        clientName={`${client.firstName} ${client.lastName}`}
        advisorName={`${advisor.firstName} ${advisor.lastName}`}
      />

      <Footer cabinet={cabinet} />
    </Page>
  </Document>
)

// ============================================================================
// Recueil d'Informations PDF
// ============================================================================

interface RecueilInformationsProps {
  client: ClientData
  cabinet: CabinetData
  advisor: AdvisorData
  patrimoine?: {
    actifs: Array<{ type: string; description: string; valeur: number }>
    passifs: Array<{ type: string; description: string; montant: number }>
  }
  revenus?: {
    salaires?: number
    revenus_fonciers?: number
    revenus_capitaux?: number
    autres?: number
  }
  charges?: {
    loyer?: number
    credits?: number
    impots?: number
    autres?: number
  }
}

const RecueilInformationsDocument: React.FC<RecueilInformationsProps> = ({
  client,
  cabinet,
  advisor,
  patrimoine,
  revenus,
  charges,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Header cabinet={cabinet} advisor={advisor} />
      
      <Text style={styles.title}>Recueil d&apos;Informations Client</Text>
      
      {/* Identité */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Identité</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Nom:</Text>
          <Text style={styles.value}>{client.lastName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Prénom:</Text>
          <Text style={styles.value}>{client.firstName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date de naissance:</Text>
          <Text style={styles.value}>{formatDate(client.birthDate)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Lieu de naissance:</Text>
          <Text style={styles.value}>{client.birthPlace || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Nationalité:</Text>
          <Text style={styles.value}>{client.nationality || 'Française'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Adresse:</Text>
          <Text style={styles.value}>{formatAddress(client.address)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{client.email || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Téléphone:</Text>
          <Text style={styles.value}>{client.phone || client.mobile || 'N/A'}</Text>
        </View>
      </View>

      {/* Situation familiale */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Situation Familiale</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Situation matrimoniale:</Text>
          <Text style={styles.value}>{client.maritalStatus || 'Non renseignée'}</Text>
        </View>
        {client.marriageRegime && (
          <View style={styles.row}>
            <Text style={styles.label}>Régime matrimonial:</Text>
            <Text style={styles.value}>{client.marriageRegime}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>Nombre d&apos;enfants:</Text>
          <Text style={styles.value}>{client.numberOfChildren ?? 0}</Text>
        </View>
      </View>

      {/* Situation professionnelle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Situation Professionnelle</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Profession:</Text>
          <Text style={styles.value}>{client.profession || 'Non renseignée'}</Text>
        </View>
        {client.employerName && (
          <View style={styles.row}>
            <Text style={styles.label}>Employeur:</Text>
            <Text style={styles.value}>{client.employerName}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>Revenus annuels:</Text>
          <Text style={styles.value}>{formatCurrency(client.annualIncome)}</Text>
        </View>
      </View>

      {/* Revenus détaillés */}
      {revenus && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Revenus Détaillés (annuels)</Text>
          {revenus.salaires !== undefined && (
            <View style={styles.row}>
              <Text style={styles.label}>Salaires/Traitements:</Text>
              <Text style={styles.value}>{formatCurrency(revenus.salaires)}</Text>
            </View>
          )}
          {revenus.revenus_fonciers !== undefined && (
            <View style={styles.row}>
              <Text style={styles.label}>Revenus fonciers:</Text>
              <Text style={styles.value}>{formatCurrency(revenus.revenus_fonciers)}</Text>
            </View>
          )}
          {revenus.revenus_capitaux !== undefined && (
            <View style={styles.row}>
              <Text style={styles.label}>Revenus de capitaux:</Text>
              <Text style={styles.value}>{formatCurrency(revenus.revenus_capitaux)}</Text>
            </View>
          )}
          {revenus.autres !== undefined && (
            <View style={styles.row}>
              <Text style={styles.label}>Autres revenus:</Text>
              <Text style={styles.value}>{formatCurrency(revenus.autres)}</Text>
            </View>
          )}
        </View>
      )}

      {/* Charges */}
      {charges && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Charges (annuelles)</Text>
          {charges.loyer !== undefined && (
            <View style={styles.row}>
              <Text style={styles.label}>Loyer:</Text>
              <Text style={styles.value}>{formatCurrency(charges.loyer)}</Text>
            </View>
          )}
          {charges.credits !== undefined && (
            <View style={styles.row}>
              <Text style={styles.label}>Crédits:</Text>
              <Text style={styles.value}>{formatCurrency(charges.credits)}</Text>
            </View>
          )}
          {charges.impots !== undefined && (
            <View style={styles.row}>
              <Text style={styles.label}>Impôts:</Text>
              <Text style={styles.value}>{formatCurrency(charges.impots)}</Text>
            </View>
          )}
          {charges.autres !== undefined && (
            <View style={styles.row}>
              <Text style={styles.label}>Autres charges:</Text>
              <Text style={styles.value}>{formatCurrency(charges.autres)}</Text>
            </View>
          )}
        </View>
      )}

      <Footer cabinet={cabinet} />
    </Page>

    <Page size="A4" style={styles.page}>
      <Header cabinet={cabinet} advisor={advisor} />

      {/* Patrimoine */}
      {patrimoine && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Patrimoine - Actifs</Text>
            {patrimoine.actifs.length > 0 ? (
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Type</Text>
                  <Text style={[styles.tableHeaderCell, { width: '40%' }]}>Description</Text>
                  <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Valeur</Text>
                </View>
                {patrimoine.actifs.map((actif, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: '30%' }]}>{actif.type}</Text>
                    <Text style={[styles.tableCell, { width: '40%' }]}>{actif.description}</Text>
                    <Text style={[styles.tableCell, { width: '30%' }]}>{formatCurrency(actif.valeur)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.text}>Aucun actif renseigné</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Patrimoine - Passifs</Text>
            {patrimoine.passifs.length > 0 ? (
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Type</Text>
                  <Text style={[styles.tableHeaderCell, { width: '40%' }]}>Description</Text>
                  <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Montant</Text>
                </View>
                {patrimoine.passifs.map((passif, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: '30%' }]}>{passif.type}</Text>
                    <Text style={[styles.tableCell, { width: '40%' }]}>{passif.description}</Text>
                    <Text style={[styles.tableCell, { width: '30%' }]}>{formatCurrency(passif.montant)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.text}>Aucun passif renseigné</Text>
            )}
          </View>
        </>
      )}

      {/* Objectifs d'investissement */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>8. Objectifs d&apos;Investissement</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Profil de risque:</Text>
          <Text style={styles.value}>{client.riskProfile || 'Non défini'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Horizon d&apos;investissement:</Text>
          <Text style={styles.value}>{client.investmentHorizon || 'Non défini'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Objectifs:</Text>
          <Text style={styles.value}>
            {client.investmentGoals?.join(', ') || 'Non définis'}
          </Text>
        </View>
      </View>

      {/* Conformité */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>9. Informations Réglementaires</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Personne Politiquement Exposée (PPE):</Text>
          <Text style={styles.value}>{client.isPEP ? 'Oui' : 'Non'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Origine des fonds:</Text>
          <Text style={styles.value}>{client.originOfFunds || 'Non renseignée'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Statut KYC:</Text>
          <Text style={styles.value}>{client.kycStatus}</Text>
        </View>
      </View>

      {/* Attestation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>10. Attestation</Text>
        <Text style={styles.text}>
          Je soussigné(e), {client.firstName} {client.lastName}, certifie sur l&apos;honneur 
          l&apos;exactitude des informations fournies dans le présent document. Je m&apos;engage 
          à informer mon conseiller de tout changement significatif de ma situation.
        </Text>
      </View>

      {/* Signatures */}
      <SignatureSection 
        clientName={`${client.firstName} ${client.lastName}`}
        advisorName={`${advisor.firstName} ${advisor.lastName}`}
      />

      <Footer cabinet={cabinet} />
    </Page>
  </Document>
)


// ============================================================================
// PDF Generation Functions
// ============================================================================

/**
 * Génère un DER (Document d'Entrée en Relation) en PDF
 * 
 * @requirements 3.1 - THE Document_Generator_Real SHALL produce a real PDF file with cabinet header, 
 * client info, ORIAS, RC Pro, services, fees, regulatory disclosures, signature placeholders
 * @requirements 3.6 - THE Document_Generator_Real SHALL use a real PDF library
 */
export async function generateDERPDF(
  clientData: ClientData,
  cabinetData: CabinetData,
  advisorData: AdvisorData,
  options?: { uploadToStorage?: boolean }
): Promise<PDFGeneratorResult> {
  try {
    const doc = React.createElement(DERDocument, {
      client: clientData,
      cabinet: cabinetData,
      advisor: advisorData,
    }) as React.ReactElement<DocumentProps>

    const buffer = await renderToBuffer(doc)
    const fileName = generateFileName('DER', clientData.lastName, clientData.firstName)

    // Upload to storage if requested
    if (options?.uploadToStorage) {
      const uploadResult = await uploadDocument(
        cabinetData.id,
        clientData.id,
        fileName,
        buffer,
        CONTENT_TYPES.PDF
      )

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error || 'Erreur lors du stockage du fichier',
        }
      }

      return {
        success: true,
        fileBuffer: buffer,
        fileName,
        fileUrl: uploadResult.signedUrl || uploadResult.publicUrl,
        storagePath: uploadResult.path,
        fileSize: buffer.length,
      }
    }

    return {
      success: true,
      fileBuffer: buffer,
      fileName,
      fileSize: buffer.length,
    }
  } catch (error) {
    console.error('[PDFGenerator] Error generating DER PDF:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la génération du PDF',
    }
  }
}

/**
 * Génère une Déclaration d'Adéquation en PDF
 * 
 * @requirements 3.2 - THE Document_Generator_Real SHALL produce a real PDF file with client profile,
 * recommended product, adequacy justification, risk warnings, signature placeholders
 */
export async function generateDeclarationAdequationPDF(
  clientData: ClientData,
  cabinetData: CabinetData,
  advisorData: AdvisorData,
  productData: ProductData,
  justification: string,
  warnings?: string[],
  options?: { uploadToStorage?: boolean }
): Promise<PDFGeneratorResult> {
  try {
    const doc = React.createElement(DeclarationAdequationDocument, {
      client: clientData,
      cabinet: cabinetData,
      advisor: advisorData,
      product: productData,
      justification,
      warnings,
    }) as React.ReactElement<DocumentProps>

    const buffer = await renderToBuffer(doc)
    const fileName = generateFileName('DECLARATION_ADEQUATION', clientData.lastName, clientData.firstName)

    if (options?.uploadToStorage) {
      const uploadResult = await uploadDocument(
        cabinetData.id,
        clientData.id,
        fileName,
        buffer,
        CONTENT_TYPES.PDF
      )

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error || 'Erreur lors du stockage du fichier',
        }
      }

      return {
        success: true,
        fileBuffer: buffer,
        fileName,
        fileUrl: uploadResult.signedUrl || uploadResult.publicUrl,
        storagePath: uploadResult.path,
        fileSize: buffer.length,
      }
    }

    return {
      success: true,
      fileBuffer: buffer,
      fileName,
      fileSize: buffer.length,
    }
  } catch (error) {
    console.error('[PDFGenerator] Error generating Declaration Adequation PDF:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la génération du PDF',
    }
  }
}

/**
 * Génère un Bulletin d'Opération en PDF
 * 
 * @requirements 3.3 - THE Document_Generator_Real SHALL produce a real PDF file with operation type,
 * reference, client, contract, details, compliance checklist, signature placeholders
 */
export async function generateBulletinOperationPDF(
  clientData: ClientData,
  cabinetData: CabinetData,
  advisorData: AdvisorData,
  operationData: OperationData,
  complianceChecklist?: Array<{ label: string; checked: boolean }>,
  options?: { uploadToStorage?: boolean }
): Promise<PDFGeneratorResult> {
  try {
    const doc = React.createElement(BulletinOperationDocument, {
      client: clientData,
      cabinet: cabinetData,
      advisor: advisorData,
      operation: operationData,
      complianceChecklist,
    }) as React.ReactElement<DocumentProps>

    const buffer = await renderToBuffer(doc)
    const fileName = generateFileName('BULLETIN_OPERATION', clientData.lastName, clientData.firstName)

    if (options?.uploadToStorage) {
      const uploadResult = await uploadDocument(
        cabinetData.id,
        clientData.id,
        fileName,
        buffer,
        CONTENT_TYPES.PDF
      )

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error || 'Erreur lors du stockage du fichier',
        }
      }

      return {
        success: true,
        fileBuffer: buffer,
        fileName,
        fileUrl: uploadResult.signedUrl || uploadResult.publicUrl,
        storagePath: uploadResult.path,
        fileSize: buffer.length,
      }
    }

    return {
      success: true,
      fileBuffer: buffer,
      fileName,
      fileSize: buffer.length,
    }
  } catch (error) {
    console.error('[PDFGenerator] Error generating Bulletin Operation PDF:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la génération du PDF',
    }
  }
}

/**
 * Génère une Lettre de Mission en PDF
 * 
 * @requirements 3.4 - THE Document_Generator_Real SHALL produce a real PDF file with mission scope,
 * duration, deliverables, fees, termination conditions, signature placeholders
 */
export async function generateLettreMissionPDF(
  clientData: ClientData,
  cabinetData: CabinetData,
  advisorData: AdvisorData,
  missionData: {
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
  },
  options?: { uploadToStorage?: boolean }
): Promise<PDFGeneratorResult> {
  try {
    const doc = React.createElement(LettreMissionDocument, {
      client: clientData,
      cabinet: cabinetData,
      advisor: advisorData,
      mission: missionData,
    }) as unknown as React.ReactElement<DocumentProps>

    const buffer = await renderToBuffer(doc)
    const fileName = generateFileName('LETTRE_MISSION', clientData.lastName, clientData.firstName)

    if (options?.uploadToStorage) {
      const uploadResult = await uploadDocument(
        cabinetData.id,
        clientData.id,
        fileName,
        buffer,
        CONTENT_TYPES.PDF
      )

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error || 'Erreur lors du stockage du fichier',
        }
      }

      return {
        success: true,
        fileBuffer: buffer,
        fileName,
        fileUrl: uploadResult.signedUrl || uploadResult.publicUrl,
        storagePath: uploadResult.path,
        fileSize: buffer.length,
      }
    }

    return {
      success: true,
      fileBuffer: buffer,
      fileName,
      fileSize: buffer.length,
    }
  } catch (error) {
    console.error('[PDFGenerator] Error generating Lettre Mission PDF:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la génération du PDF',
    }
  }
}

/**
 * Génère un Recueil d'Informations en PDF
 * 
 * @requirements 3.5 - THE Document_Generator_Real SHALL produce a real PDF file with client identity,
 * family situation, professional situation, patrimony, income, objectives
 */
export async function generateRecueilInformationsPDF(
  clientData: ClientData,
  cabinetData: CabinetData,
  advisorData: AdvisorData,
  patrimoineData?: {
    actifs: Array<{ type: string; description: string; valeur: number }>
    passifs: Array<{ type: string; description: string; montant: number }>
  },
  revenusData?: {
    salaires?: number
    revenus_fonciers?: number
    revenus_capitaux?: number
    autres?: number
  },
  chargesData?: {
    loyer?: number
    credits?: number
    impots?: number
    autres?: number
  },
  options?: { uploadToStorage?: boolean }
): Promise<PDFGeneratorResult> {
  try {
    const doc = React.createElement(RecueilInformationsDocument, {
      client: clientData,
      cabinet: cabinetData,
      advisor: advisorData,
      patrimoine: patrimoineData,
      revenus: revenusData,
      charges: chargesData,
    }) as unknown as React.ReactElement<DocumentProps>

    const buffer = await renderToBuffer(doc)
    const fileName = generateFileName('RECUEIL_INFORMATIONS', clientData.lastName, clientData.firstName)

    if (options?.uploadToStorage) {
      const uploadResult = await uploadDocument(
        cabinetData.id,
        clientData.id,
        fileName,
        buffer,
        CONTENT_TYPES.PDF
      )

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error || 'Erreur lors du stockage du fichier',
        }
      }

      return {
        success: true,
        fileBuffer: buffer,
        fileName,
        fileUrl: uploadResult.signedUrl || uploadResult.publicUrl,
        storagePath: uploadResult.path,
        fileSize: buffer.length,
      }
    }

    return {
      success: true,
      fileBuffer: buffer,
      fileName,
      fileSize: buffer.length,
    }
  } catch (error) {
    console.error('[PDFGenerator] Error generating Recueil Informations PDF:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la génération du PDF',
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Vérifie si un buffer est un PDF valide
 * Un PDF valide commence par %PDF-
 */
export function isValidPDF(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 5) return false
  const header = buffer.slice(0, 5).toString('ascii')
  return header === '%PDF-'
}

/**
 * Obtient la taille d'un fichier PDF en format lisible
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Types de documents supportés pour la génération PDF
 */
export const SUPPORTED_PDF_DOCUMENT_TYPES = [
  'DER',
  'DECLARATION_ADEQUATION',
  'BULLETIN_OPERATION',
  'LETTRE_MISSION',
  'RECUEIL_INFORMATIONS',
] as const

export type SupportedPDFDocumentType = typeof SUPPORTED_PDF_DOCUMENT_TYPES[number]

/**
 * Vérifie si un type de document est supporté pour la génération PDF
 */
export function isSupportedPDFDocumentType(type: string): type is SupportedPDFDocumentType {
  return SUPPORTED_PDF_DOCUMENT_TYPES.includes(type as SupportedPDFDocumentType)
}
