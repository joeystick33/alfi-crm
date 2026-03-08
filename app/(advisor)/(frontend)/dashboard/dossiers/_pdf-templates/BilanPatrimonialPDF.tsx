'use client'

import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#4f46e5',
  },
  logo: {
    width: 120,
    height: 40,
  },
  headerRight: {
    textAlign: 'right',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e1b4b',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: '40%',
    color: '#6b7280',
  },
  value: {
    width: '60%',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '50%',
    paddingRight: 10,
    marginBottom: 8,
  },
  summaryBox: {
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 12,
    color: '#c7d2fe',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    textAlign: 'center',
    flex: 1,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableCell: {
    flex: 1,
  },
  preconisation: {
    backgroundColor: '#ecfdf5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  preconisationTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 5,
  },
  preconisationDesc: {
    fontSize: 10,
    color: '#047857',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 9,
    color: '#9ca3af',
  },
})

interface BilanPatrimonialPDFProps {
  data: {
    dossier: {
      reference: string
      nom: string
      categorie: string
      type: string
      dateOuverture: string
    }
    client: {
      nom: string
      prenom: string
      email?: string
    }
    conseiller: {
      firstName: string
      lastName: string
      email?: string
    }
    cabinet: {
      name: string
      logo?: string
      address?: string
      phone?: string
      email?: string
    } | null
    snapshot: {
      identite?: {
        nom: string
        prenom: string
        dateNaissance?: string
        situationFamiliale?: string
        regimeMatrimonial?: string
        enfants?: number
      }
      revenus?: {
        total: number
        details?: Array<{ type: string; montant: number }>
      }
      charges?: {
        total: number
        totalMensualitesCredits?: number
      }
      patrimoineImmobilier?: Array<{
        nom: string
        valeur: number
        type: string
      }>
      patrimoineFinancier?: Array<{
        nom: string
        valeur: number
        type: string
      }>
    } | null
    simulations: Array<{
      nom: string
      type: string
      resultats: Record<string, unknown>
    }>
    preconisations: Array<{
      titre: string
      description: string
      argumentaire?: string
      montant?: number
    }>
    generatedAt: string
    version: number
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function BilanPatrimonialPDF({ data }: BilanPatrimonialPDFProps) {
  const { dossier, client, conseiller, cabinet, snapshot, simulations, preconisations, generatedAt, version } = data

  // Calculs
  const totalImmobilier = snapshot?.patrimoineImmobilier?.reduce((acc, b) => acc + b.valeur, 0) || 0
  const totalFinancier = snapshot?.patrimoineFinancier?.reduce((acc, c) => acc + c.valeur, 0) || 0
  const totalActifs = totalImmobilier + totalFinancier
  const totalPassifs = snapshot?.charges?.totalMensualitesCredits ? snapshot.charges.totalMensualitesCredits * 12 * 20 : 0 // Estimation
  const patrimoineNet = totalActifs - totalPassifs

  return (
    <Document>
      {/* Page 1: Couverture et synthèse */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Bilan Patrimonial</Text>
            <Text style={styles.subtitle}>
              {client.prenom} {client.nom}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={{ fontSize: 10, marginBottom: 2 }}>{cabinet?.name || 'Cabinet'}</Text>
            <Text style={{ fontSize: 9, color: '#6b7280' }}>Réf: {dossier.reference}</Text>
            <Text style={{ fontSize: 9, color: '#6b7280' }}>v{version}</Text>
          </View>
        </View>

        {/* Synthèse patrimoine */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryTitle}>Patrimoine Brut</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalActifs)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryTitle}>Endettement</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalPassifs)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryTitle}>Patrimoine Net</Text>
              <Text style={styles.summaryValue}>{formatCurrency(patrimoineNet)}</Text>
            </View>
          </View>
        </View>

        {/* Identité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identité du client</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <View style={styles.row}>
                <Text style={styles.label}>Nom complet</Text>
                <Text style={styles.value}>{snapshot?.identite?.prenom} {snapshot?.identite?.nom}</Text>
              </View>
            </View>
            <View style={styles.gridItem}>
              <View style={styles.row}>
                <Text style={styles.label}>Date de naissance</Text>
                <Text style={styles.value}>{snapshot?.identite?.dateNaissance ? formatDate(snapshot.identite.dateNaissance) : '-'}</Text>
              </View>
            </View>
            <View style={styles.gridItem}>
              <View style={styles.row}>
                <Text style={styles.label}>Situation familiale</Text>
                <Text style={styles.value}>{snapshot?.identite?.situationFamiliale || '-'}</Text>
              </View>
            </View>
            <View style={styles.gridItem}>
              <View style={styles.row}>
                <Text style={styles.label}>Régime matrimonial</Text>
                <Text style={styles.value}>{snapshot?.identite?.regimeMatrimonial || '-'}</Text>
              </View>
            </View>
            <View style={styles.gridItem}>
              <View style={styles.row}>
                <Text style={styles.label}>Enfants</Text>
                <Text style={styles.value}>{snapshot?.identite?.enfants || 0}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Revenus et charges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Situation financière</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Revenus annuels</Text>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#10b981' }}>
                  {formatCurrency(snapshot?.revenus?.total || 0)}
                </Text>
              </View>
            </View>
            <View style={styles.gridItem}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Charges annuelles</Text>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ef4444' }}>
                  {formatCurrency(snapshot?.charges?.total || 0)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Document généré le {formatDate(generatedAt)} par {conseiller.firstName} {conseiller.lastName} - {cabinet?.name}
        </Text>
        <Text style={styles.pageNumber}>1</Text>
      </Page>

      {/* Page 2: Patrimoine détaillé */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Patrimoine Immobilier</Text>
        {snapshot?.patrimoineImmobilier && snapshot.patrimoineImmobilier.length > 0 ? (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Bien</Text>
              <Text style={styles.tableCell}>Type</Text>
              <Text style={[styles.tableCell, { textAlign: 'right' }]}>Valeur</Text>
            </View>
            {snapshot.patrimoineImmobilier.map((bien, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{bien.nom}</Text>
                <Text style={styles.tableCell}>{bien.type}</Text>
                <Text style={[styles.tableCell, { textAlign: 'right' }]}>{formatCurrency(bien.valeur)}</Text>
              </View>
            ))}
            <View style={[styles.tableRow, { backgroundColor: '#f3f4f6', fontWeight: 'bold' }]}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Total</Text>
              <Text style={styles.tableCell}></Text>
              <Text style={[styles.tableCell, { textAlign: 'right' }]}>{formatCurrency(totalImmobilier)}</Text>
            </View>
          </View>
        ) : (
          <Text style={{ color: '#9ca3af', marginBottom: 20 }}>Aucun bien immobilier</Text>
        )}

        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Patrimoine Financier</Text>
          {snapshot?.patrimoineFinancier && snapshot.patrimoineFinancier.length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Contrat</Text>
                <Text style={styles.tableCell}>Type</Text>
                <Text style={[styles.tableCell, { textAlign: 'right' }]}>Encours</Text>
              </View>
              {snapshot.patrimoineFinancier.map((contrat, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{contrat.nom}</Text>
                  <Text style={styles.tableCell}>{contrat.type}</Text>
                  <Text style={[styles.tableCell, { textAlign: 'right' }]}>{formatCurrency(contrat.valeur)}</Text>
                </View>
              ))}
              <View style={[styles.tableRow, { backgroundColor: '#f3f4f6', fontWeight: 'bold' }]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Total</Text>
                <Text style={styles.tableCell}></Text>
                <Text style={[styles.tableCell, { textAlign: 'right' }]}>{formatCurrency(totalFinancier)}</Text>
              </View>
            </View>
          ) : (
            <Text style={{ color: '#9ca3af' }}>Aucun actif financier</Text>
          )}
        </View>

        <Text style={styles.pageNumber}>2</Text>
      </Page>

      {/* Page 3: Simulations et préconisations */}
      <Page size="A4" style={styles.page}>
        {simulations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Simulations réalisées</Text>
            {simulations.map((sim, i) => (
              <View key={i} style={styles.card}>
                <Text style={styles.cardTitle}>{sim.nom}</Text>
                <Text style={{ fontSize: 9, color: '#6b7280' }}>{sim.type.replace(/_/g, ' ')}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Préconisations</Text>
          {preconisations.length > 0 ? (
            preconisations.map((preco, i) => (
              <View key={i} style={styles.preconisation}>
                <Text style={styles.preconisationTitle}>
                  {i + 1}. {preco.titre}
                  {preco.montant && ` - ${formatCurrency(preco.montant)}`}
                </Text>
                <Text style={styles.preconisationDesc}>{preco.description}</Text>
                {preco.argumentaire && (
                  <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 5, fontStyle: 'italic' }}>
                    {preco.argumentaire}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={{ color: '#9ca3af' }}>Aucune préconisation</Text>
          )}
        </View>

        {/* Mentions légales */}
        <View style={{ marginTop: 30 }}>
          <Text style={{ fontSize: 8, color: '#9ca3af', lineHeight: 1.4 }}>
            Ce document est établi à titre informatif et ne constitue pas un conseil personnalisé. Les informations présentées sont basées sur les données communiquées par le client au {formatDate(generatedAt)}. Les projections et simulations ne garantissent pas les résultats futurs. Ce document est confidentiel et destiné exclusivement à l&apos;usage du client mentionné.
          </Text>
        </View>

        <Text style={styles.footer}>
          {cabinet?.name} {cabinet?.address ? `- ${cabinet.address}` : ''} {cabinet?.phone ? `- ${cabinet.phone}` : ''}
        </Text>
        <Text style={styles.pageNumber}>3</Text>
      </Page>
    </Document>
  )
}
