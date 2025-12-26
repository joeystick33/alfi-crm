/**
 * Seed opportunities via API
 * Usage: 
 * 1. Create a file .session-token with your session token
 * 2. Run: npx tsx scripts/seed-via-api.ts
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const API_BASE = 'http://localhost:3000'

// Try to read session token from file
let sessionToken = ''
const tokenFile = join(process.cwd(), '.session-token')

if (existsSync(tokenFile)) {
  sessionToken = readFileSync(tokenFile, 'utf-8').trim()
}

if (!sessionToken) {
  console.log('❌ Session token not found!')
  console.log('')
  console.log('📋 To get your session token:')
  console.log('1. Open http://localhost:3000 in your browser')
  console.log('2. Open DevTools (F12 or Cmd+Option+I)')
  console.log('3. Go to Application > Cookies > localhost')
  console.log('4. Copy the value of "next-auth.session-token"')
  console.log('5. Save it to .session-token file:')
  console.log('   echo "YOUR_TOKEN" > .session-token')
  console.log('')
  process.exit(1)
}

const opportunityTemplates = [
  { type: 'ASSURANCE_VIE', names: ['Contrat Assurance Vie Premium', 'Plan Épargne Retraite', 'Assurance Vie Multisupport'], minValue: 50000, maxValue: 500000 },
  { type: 'IMMOBILIER', names: ['Investissement SCPI', 'Achat Résidence Principale', 'Investissement Locatif Pinel'], minValue: 100000, maxValue: 800000 },
  { type: 'PLACEMENT', names: ['PEA Actions', 'Compte-Titres Diversifié', 'Plan Épargne Entreprise'], minValue: 20000, maxValue: 300000 },
  { type: 'CREDIT', names: ['Rachat de Crédits', 'Prêt Immobilier', 'Crédit Travaux'], minValue: 50000, maxValue: 400000 },
  { type: 'RETRAITE', names: ['PER Individuel', 'Complément Retraite', 'Optimisation Fiscale Retraite'], minValue: 50000, maxValue: 500000 },
]

const statuses = ['DETECTED', 'CONTACTED', 'QUALIFIED', 'PRESENTED', 'ACCEPTED']
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

const descriptions = [
  'Client intéressé suite à notre dernier entretien',
  'Besoin identifié lors de l\'analyse patrimoniale',
  'Demande spontanée du client',
  'Opportunité détectée par l\'IA',
  'Recommandation suite à changement de situation',
]

function random<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function futureDate(daysAhead: number): string {
  const date = new Date()
  date.setDate(date.getDate() + randomInt(7, daysAhead))
  return date.toISOString()
}

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `next-auth.session-token=${sessionToken}`,
      ...options.headers,
    },
  })

  const text = await response.text()
  
  if (!response.ok) {
    throw new Error(`API Error ${response.status}: ${text}`)
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function main() {
  console.log('🌱 Seeding opportunities via API...\n')

  try {
    // Get current user
    console.log('👤 Fetching user info...')
    const userResponse = await apiCall('/api/auth/me')
    const user = userResponse.user
    
    console.log(`✅ Logged in as: ${user.firstName} ${user.lastName}`)
    console.log(`🏢 Cabinet: ${user.cabinet?.name || 'N/A'}\n`)

    // Get clients
    console.log('📋 Fetching clients...')
    const clientsResponse = await apiCall('/api/clients?pageSize=20')
    const clients = clientsResponse.data || []

    if (clients.length === 0) {
      console.log('❌ No clients found. Please create some clients first.')
      return
    }

    console.log(`✅ Found ${clients.length} clients\n`)

    let created = 0
    let errors = 0

    console.log('🚀 Creating opportunities...')

    // Create 3 opportunities per client
    for (const client of clients) {
      process.stdout.write(`\n📊 ${client.firstName} ${client.lastName}: `)

      for (let i = 0; i < 3; i++) {
        const template = random(opportunityTemplates)
        const status = random(statuses)
        const priority = random(priorities)
        
        const estimatedValue = randomInt(template.minValue, template.maxValue)
        
        // Probability based on status
        let probability: number
        switch (status) {
          case 'DETECTED': probability = randomInt(10, 30); break
          case 'CONTACTED': probability = randomInt(25, 45); break
          case 'QUALIFIED': probability = randomInt(40, 60); break
          case 'PRESENTED': probability = randomInt(55, 75); break
          case 'ACCEPTED': probability = randomInt(70, 90); break
          default: probability = 50
        }

        try {
          await apiCall('/api/opportunites', {
            method: 'POST',
            body: JSON.stringify({
              clientId: client.id,
              conseillerId: user.id,
              type: template.type,
              name: random(template.names),
              description: random(descriptions),
              estimatedValue,
              probability,
              priority,
              status,
              expectedCloseDate: futureDate(180),
              notes: 'Créé automatiquement pour test',
            }),
          })

          created++
          process.stdout.write('✓')
        } catch (error) {
          errors++
          process.stdout.write('✗')
        }

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log('\n')
    console.log('✨ Summary:')
    console.log(`   ✅ Created: ${created} opportunities`)
    console.log(`   ❌ Errors: ${errors}`)

    // Fetch statistics
    console.log('\n📈 Fetching statistics...')
    try {
      const stats = await apiCall('/api/opportunites/stats')
      console.log(`   Total opportunities: ${stats.total}`)
      console.log(`   Total value: ${stats.totalValue?.toLocaleString('fr-FR')}€`)
      console.log(`   Conversion rate: ${stats.conversionRate}%`)
    } catch (error) {
      console.log('   (Statistics not available)')
    }

    console.log('\n🎉 Done! Refresh your dashboard to see the new opportunities.')

  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.log('\n⚠️  Your session token may have expired.')
      console.log('Please get a new token and update .session-token file.')
    }
    
    process.exit(1)
  }
}

main()
