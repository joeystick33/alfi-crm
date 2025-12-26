import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Mettre à jour les SIRET des clients professionnels avec des valeurs valides
  const updates = [
    { email: 'f.leblanc@leblanc-sarl.fr', siret: '80795315300015' },
    { email: 'i.rousseau@rousseau-tech.fr', siret: '79219798000019' },
    { email: 'dr.moreau@clinique.fr', siret: '93352902600017' },
    { email: 'elon@tesla.com', siret: '44306184100047' },
    { email: 'cesar@bar-marine.fr', siret: '35248953800017' },
  ]

  for (const u of updates) {
    const result = await prisma.client.updateMany({
      where: { email: u.email },
      data: { siret: u.siret }
    })
    console.log(`Updated ${u.email}: ${result.count} client(s)`)
  }

  console.log('✅ SIRET mis à jour avec succès')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
