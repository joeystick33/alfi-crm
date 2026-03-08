/**
 * Seeder pour les fournisseurs (assureurs français)
 * 
 * Liste complète des principaux assureurs et sociétés de gestion
 * utilisés par les CGP en France.
 * 
 * Usage: npx ts-node prisma/seed-providers.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Liste des principaux assureurs français
const ASSUREURS = [
  // Grands groupes
  { name: 'AXA France', siren: '310499959', type: 'ASSUREUR' },
  { name: 'Generali France', siren: '552062663', type: 'ASSUREUR' },
  { name: 'Allianz Vie', siren: '340234962', type: 'ASSUREUR' },
  { name: 'CNP Assurances', siren: '341737062', type: 'ASSUREUR' },
  { name: 'BNP Paribas Cardif', siren: '732028154', type: 'ASSUREUR' },
  { name: 'Crédit Agricole Assurances', siren: '451746077', type: 'ASSUREUR' },
  { name: 'Swiss Life France', siren: '320646573', type: 'ASSUREUR' },
  { name: 'AG2R La Mondiale', siren: '775685399', type: 'ASSUREUR' },
  { name: 'Groupama Gan Vie', siren: '340427483', type: 'ASSUREUR' },
  { name: 'MACSF Épargne Retraite', siren: '403071095', type: 'ASSUREUR' },
  
  // Assureurs spécialisés CGP
  { name: 'Apicil Épargne', siren: '440022935', type: 'ASSUREUR' },
  { name: 'Suravenir', siren: '330033127', type: 'ASSUREUR' },
  { name: 'Spirica', siren: '487739963', type: 'ASSUREUR' },
  { name: 'Nortia', siren: '353115135', type: 'PLATEFORME' },
  { name: 'UAF Life Patrimoine', siren: '433912516', type: 'PLATEFORME' },
  { name: 'Primonial', siren: '484304696', type: 'PLATEFORME' },
  { name: 'Patrimea', siren: '500207468', type: 'PLATEFORME' },
  { name: 'Eres Group', siren: '402199178', type: 'PLATEFORME' },
  { name: 'Crystal Finance', siren: '790254823', type: 'PLATEFORME' },
  
  // Banques privées
  { name: 'Rothschild Martin Maurel', siren: '784393340', type: 'BANQUE' },
  { name: 'Edmond de Rothschild', siren: '572023498', type: 'BANQUE' },
  { name: 'Lazard Frères Gestion', siren: '352213552', type: 'SOCIETE_GESTION' },
  { name: 'ODDO BHF', siren: '652027384', type: 'BANQUE' },
  
  // Sociétés de gestion
  { name: 'Amundi', siren: '314222902', type: 'SOCIETE_GESTION' },
  { name: 'Carmignac Gestion', siren: '349501676', type: 'SOCIETE_GESTION' },
  { name: 'Comgest', siren: '399920475', type: 'SOCIETE_GESTION' },
  { name: 'DNCA Investments', siren: '432518041', type: 'SOCIETE_GESTION' },
  { name: 'Sycomore Asset Management', siren: '438566988', type: 'SOCIETE_GESTION' },
  { name: 'Tikehau Capital', siren: '491909498', type: 'SOCIETE_GESTION' },
  { name: 'H2O Asset Management', siren: '529082878', type: 'SOCIETE_GESTION' },
  { name: 'La Financière de l\'Échiquier', siren: '352045673', type: 'SOCIETE_GESTION' },
  { name: 'Mandarine Gestion', siren: '479455820', type: 'SOCIETE_GESTION' },
  { name: 'Moneta Asset Management', siren: '450514252', type: 'SOCIETE_GESTION' },
  
  // SCPI / Pierre-papier
  { name: 'Corum Asset Management', siren: '531636539', type: 'SOCIETE_GESTION' },
  { name: 'Sofidy', siren: '379990553', type: 'SOCIETE_GESTION' },
  { name: 'Primonial REIM', siren: '531636521', type: 'SOCIETE_GESTION' },
  { name: 'Perial Asset Management', siren: '380723649', type: 'SOCIETE_GESTION' },
  { name: 'La Française REM', siren: '399922000', type: 'SOCIETE_GESTION' },
  { name: 'BNP Paribas REIM', siren: '300794278', type: 'SOCIETE_GESTION' },
  { name: 'Amundi Immobilier', siren: '315429886', type: 'SOCIETE_GESTION' },
  { name: 'Advenis REIM', siren: '832434452', type: 'SOCIETE_GESTION' },
  
  // Prévoyance / Santé
  { name: 'Malakoff Humanis', siren: '352415389', type: 'ASSUREUR' },
  { name: 'Harmonie Mutuelle', siren: '538518473', type: 'ASSUREUR' },
  { name: 'MGEN', siren: '775685522', type: 'ASSUREUR' },
  { name: 'Pro BTP', siren: '394270659', type: 'ASSUREUR' },
  { name: 'April', siren: '309707727', type: 'PLATEFORME' },
  
  // Crédit immobilier
  { name: 'Crédit Foncier', siren: '542029848', type: 'BANQUE' },
  { name: 'LCL', siren: '954509741', type: 'BANQUE' },
  { name: 'Société Générale', siren: '552120222', type: 'BANQUE' },
  { name: 'BNP Paribas', siren: '662042449', type: 'BANQUE' },
  { name: 'Crédit Mutuel', siren: '588505354', type: 'BANQUE' },
  { name: 'Caisse d\'Épargne', siren: '383680220', type: 'BANQUE' },
  { name: 'Boursorama', siren: '351058151', type: 'BANQUE' },
  { name: 'Fortuneo', siren: '384288953', type: 'BANQUE' },
]

// Produits types par assureur (utilise les types Prisma OperationProductType)
const PRODUITS_TYPES = {
  ASSURANCE_VIE: [
    { name: 'Contrat Multisupport', code: 'AV-MULTI', minInvestment: 1000, type: 'ASSURANCE_VIE' as const },
    { name: 'Contrat Euro', code: 'AV-EURO', minInvestment: 500, type: 'ASSURANCE_VIE' as const },
    { name: 'Contrat Luxembourgeois', code: 'AV-LUX', minInvestment: 250000, type: 'ASSURANCE_VIE' as const },
    { name: 'Contrat de Capitalisation', code: 'CAP', minInvestment: 10000, type: 'CAPITALISATION' as const },
  ],
  PER: [
    { name: 'PER Individuel', code: 'PERIN', minInvestment: 500, type: 'PER_INDIVIDUEL' as const },
    { name: 'PER Entreprise', code: 'PERE', minInvestment: 0, type: 'PER_ENTREPRISE' as const },
  ],
  SCPI: [
    { name: 'SCPI Diversifiée', code: 'SCPI-DIV', minInvestment: 1000, type: 'SCPI' as const },
    { name: 'SCPI Bureaux', code: 'SCPI-BUR', minInvestment: 1000, type: 'SCPI' as const },
    { name: 'SCPI Commerces', code: 'SCPI-COM', minInvestment: 1000, type: 'SCPI' as const },
    { name: 'SCPI Résidentiel', code: 'SCPI-RES', minInvestment: 1000, type: 'SCPI' as const },
    { name: 'OPCI', code: 'OPCI', minInvestment: 1000, type: 'OPCI' as const },
  ],
  VALEURS_MOBILIERES: [
    { name: 'Compte-Titres Ordinaire', code: 'CTO', minInvestment: 1000, type: 'COMPTE_TITRES' as const },
    { name: 'PEA', code: 'PEA', minInvestment: 500, type: 'PEA' as const },
    { name: 'PEA-PME', code: 'PEA-PME', minInvestment: 500, type: 'PEA_PME' as const },
  ],
  PRIVATE_EQUITY: [
    { name: 'FCPR', code: 'FCPR', minInvestment: 10000, type: 'FCPR' as const },
    { name: 'FCPI', code: 'FCPI', minInvestment: 1000, type: 'FCPI' as const },
    { name: 'FIP', code: 'FIP', minInvestment: 1000, type: 'FIP' as const },
  ],
}

async function seedProviders(cabinetId: string) {
  console.log('🏦 Seeding providers for cabinet:', cabinetId)

  for (const assureur of ASSUREURS) {
    // Vérifier si le provider existe déjà
    const existing = await prisma.operationProvider.findFirst({
      where: {
        cabinetId,
        name: assureur.name,
      },
    })

    if (existing) {
      console.log(`  ⏭️  ${assureur.name} already exists`)
      continue
    }

    // Créer le provider
    const provider = await prisma.operationProvider.create({
      data: {
        cabinetId,
        name: assureur.name,
        siren: assureur.siren,
        type: assureur.type as any,
        conventionStatus: 'ACTIVE',
        isFavorite: false,
      },
    })

    console.log(`  ✅ Created: ${assureur.name}`)

    // Ajouter des produits types selon le type de fournisseur
    if (assureur.type === 'ASSUREUR') {
      // Assurance vie et PER
      for (const product of [...PRODUITS_TYPES.ASSURANCE_VIE, ...PRODUITS_TYPES.PER]) {
        await prisma.operationProduct.create({
          data: {
            providerId: provider.id,
            name: `${product.name} ${assureur.name}`,
            code: `${product.code}-${assureur.siren?.slice(0, 4) || 'XXX'}`,
            type: product.type,
            characteristics: {
              entryFees: { min: 0, max: 5, default: 2 },
              managementFees: { min: 0.5, max: 1.5, default: 0.8 },
            },
            minimumInvestment: product.minInvestment,
            isActive: true,
          },
        })
      }
    } else if (assureur.type === 'SOCIETE_GESTION' && assureur.name.includes('REIM')) {
      // SCPI pour les sociétés de gestion immobilière
      for (const product of PRODUITS_TYPES.SCPI) {
        await prisma.operationProduct.create({
          data: {
            providerId: provider.id,
            name: `${product.name} ${assureur.name.split(' ')[0]}`,
            code: `${product.code}-${assureur.siren?.slice(0, 4) || 'XXX'}`,
            type: product.type,
            characteristics: {
              entryFees: { min: 8, max: 12, default: 10 },
              managementFees: { min: 8, max: 12, default: 10 },
            },
            minimumInvestment: product.minInvestment,
            isActive: true,
          },
        })
      }
    }
  }

  console.log('✅ Providers seeding complete!')
}

async function main() {
  // Récupérer tous les cabinets actifs
  const cabinets = await prisma.cabinet.findMany({
    where: { status: 'ACTIVE' },
  })

  if (cabinets.length === 0) {
    console.log('⚠️  No active cabinets found. Creating demo cabinet...')
    
    // Vérifier s'il y a des cabinets en trial
    const trialCabinets = await prisma.cabinet.findMany({
      where: { status: 'TRIALING' },
    })
    
    if (trialCabinets.length > 0) {
      for (const cabinet of trialCabinets) {
        await seedProviders(cabinet.id)
      }
    } else {
      console.log('❌ No cabinets found at all. Please create a cabinet first.')
    }
  } else {
    for (const cabinet of cabinets) {
      await seedProviders(cabinet.id)
    }
  }
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

export { seedProviders, ASSUREURS }
