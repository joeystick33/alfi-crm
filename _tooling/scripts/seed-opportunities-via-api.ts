/**
 * Script to seed opportunities via API
 * Run with: npx tsx scripts/seed-opportunities-via-api.ts
 */

export {} // Make this file a proper ES module

const API_BASE_URL = 'http://localhost:3000'

// You'll need to get a valid session token from your browser
// Open DevTools > Application > Cookies > next-auth.session-token
const SESSION_TOKEN = process.env.SESSION_TOKEN || ''

if (!SESSION_TOKEN) {
  console.error('❌ Please set SESSION_TOKEN environment variable')
  console.log('   Get it from: DevTools > Application > Cookies > next-auth.session-token')
  console.log('   Run: SESSION_TOKEN="your-token" npx tsx scripts/seed-opportunities-via-api.ts')
  process.exit(1)
}

const opportunityTypes = [
  { type: 'ASSURANCE_VIE', names: ['Contrat Assurance Vie Premium', 'Plan Épargne Retraite', 'Assurance Vie Multisupport'] },
  { type: 'IMMOBILIER', names: ['Investissement SCPI', 'Achat Résidence Principale', 'Investissement Locatif Pinel'] },
  { type: 'PLACEMENT', names: ['PEA Actions', 'Compte-Titres Diversifié', 'Plan Épargne Entreprise'] },
  { type: 'CREDIT', names: ['Rachat de Crédits', 'Prêt Immobilier', 'Crédit Travaux'] },
  { type: 'RETRAITE', names: ['PER Individuel', 'Complément Retraite', 'Optimisation Fiscale Retraite'] },
  { type: 'SUCCESSION', names: ['Donation Familiale', 'Assurance Décès', 'Optimisation Succession'] },
  { type: 'FISCALITE', names: ['Défiscalisation Immobilière', 'Optimisation IR', 'Réduction ISF/IFI'] },
  { type: 'PREVOYANCE', names: ['Assurance Santé', 'Garantie Accidents de la Vie', 'Prévoyance Professionnelle'] },
]

const statuses = ['DETECTED', 'CONTACTED', 'QUALIFIED', 'PRESENTED', 'ACCEPTED']
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

const descriptions = [
  'Client intéressé suite à notre dernier entretien',
  'Besoin identifié lors de l\'analyse patrimoniale',
  'Demande spontanée du client',
  'Opportunité détectée par l\'IA',
  'Recommandation suite à changement de situation',
  'Besoin exprimé lors du bilan annuel',
]

const notes = [
  'Client très motivé, à recontacter rapidement',
  'Attente de documents complémentaires',
  'Rendez-vous prévu pour présentation détaillée',
  'Client en phase de réflexion',
  'Budget à valider',
]

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getRandomDate(daysAhead: number): Date {
  const today = new Date()
  const randomDays = getRandomInt(7, daysAhead)
  const date = new Date(today)
  date.setDate(date.getDate() + randomDays)
  return date
}

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `next-auth.session-token=${SESSION_TOKEN}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`API Error ${response.status}: ${text}`)
  }

  return response.json()
}

async function main() {
  console.log('🌱 Seeding opportunities via API...\n')

  try {
    // Get current user info
    const userResponse = await apiCall('/api/auth/me')
    console.log(`👤 Logged in as: ${userResponse.user.firstName} ${userResponse.user.lastName}`)
    console.log(`🏢 Cabinet: ${userResponse.user.cabinet?.name}\n`)

    // Get all clients
    console.log('📋 Fetching clients...')
    const clientsResponse = await apiCall('/api/clients?pageSize=50')
    const clients = clientsResponse.data

    if (!clients || clients.length === 0) {
      console.log('❌ No clients found')
      return
    }

    console.log(`✅ Found ${clients.length} clients\n`)

    let created = 0
    let errors = 0

    // Create 2-4 opportunities per client
    for (const client of clients) {
      const numOpportunities = getRandomInt(2, 4)
      console.log(`📊 Creating ${numOpportunities} opportunities for ${client.firstName} ${client.lastName}...`)

      for (let i = 0; i < numOpportunities; i++) {
        const oppType = getRandomElement(opportunityTypes)
        const status = getRandomElement(statuses)
        const priority = getRandomElement(priorities)

        // Generate realistic values
        let estimatedValue: number
        switch (oppType.type) {
          case 'ASSURANCE_VIE':
          case 'RETRAITE':
            estimatedValue = getRandomInt(50000, 500000)
            break
          case 'IMMOBILIER':
            estimatedValue = getRandomInt(100000, 800000)
            break
          case 'CREDIT':
            estimatedValue = getRandomInt(50000, 400000)
            break
          case 'PLACEMENT':
            estimatedValue = getRandomInt(20000, 300000)
            break
          default:
            estimatedValue = getRandomInt(10000, 100000)
        }

        // Probability based on status
        let probability: number
        switch (status) {
          case 'DETECTED':
            probability = getRandomInt(10, 30)
            break
          case 'CONTACTED':
            probability = getRandomInt(25, 45)
            break
          case 'QUALIFIED':
            probability = getRandomInt(40, 60)
            break
          case 'PRESENTED':
            probability = getRandomInt(55, 75)
            break
          case 'ACCEPTED':
            probability = getRandomInt(70, 90)
            break
          default:
            probability = 50
        }

        try {
          await apiCall('/api/opportunites', {
            method: 'POST',
            body: JSON.stringify({
              clientId: client.id,
              conseillerId: userResponse.user.id,
              type: oppType.type,
              name: getRandomElement(oppType.names),
              description: getRandomElement(descriptions),
              estimatedValue,
              probability,
              priority,
              status,
              expectedCloseDate: getRandomDate(180).toISOString(),
              notes: getRandomElement(notes),
            }),
          })

          created++
          process.stdout.write('.')
        } catch (error) {
          errors++
          process.stdout.write('x')
        }
      }
      console.log('')
    }

    console.log(`\n✨ Summary:`)
    console.log(`   ✅ Created: ${created}`)
    console.log(`   ❌ Errors: ${errors}`)

    // Fetch and display statistics
    console.log('\n📈 Fetching statistics...')
    const statsResponse = await apiCall('/api/opportunites/stats')
    console.log(`   Total opportunities: ${statsResponse.total}`)
    console.log(`   Total value: ${statsResponse.totalValue?.toLocaleString('fr-FR')}€`)
    console.log(`   Conversion rate: ${statsResponse.conversionRate}%`)

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main()
