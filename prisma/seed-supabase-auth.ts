import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  console.log('🔐 Création des utilisateurs dans Supabase Auth...\n')

  const users = [
    {
      email: 'superadmin@aura.fr',
      password: 'superadmin123',
      user_metadata: {
        firstName: 'Super',
        lastName: 'Admin',
        role: 'OWNER',
        isSuperAdmin: true,
      }
    },
    {
      email: 'admin@cabinet-test.fr',
      password: 'admin123',
      user_metadata: {
        firstName: 'Jean',
        lastName: 'Administrateur',
        role: 'ADMIN',
        isSuperAdmin: false,
      }
    },
    {
      email: 'conseiller@cabinet-test.fr',
      password: 'conseiller123',
      user_metadata: {
        firstName: 'Marie',
        lastName: 'Conseillère',
        role: 'ADVISOR',
        isSuperAdmin: false,
      }
    },
    {
      email: 'assistant@cabinet-test.fr',
      password: 'assistant123',
      user_metadata: {
        firstName: 'Pierre',
        lastName: 'Assistant',
        role: 'ASSISTANT',
        isSuperAdmin: false,
      }
    },
  ]

  for (const userData of users) {
    try {
      // Vérifier si l'utilisateur existe déjà
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const exists = existingUsers?.users.some(u => u.email === userData.email)

      if (exists) {
        console.log(`⏭️  ${userData.email} existe déjà dans Supabase Auth`)
        continue
      }

      // Créer l'utilisateur
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: userData.user_metadata
      })

      if (error) {
        console.error(`❌ Erreur pour ${userData.email}:`, error.message)
      } else {
        console.log(`✅ ${userData.email} créé dans Supabase Auth`)
      }
    } catch (error: any) {
      console.error(`❌ Erreur pour ${userData.email}:`, error.message)
    }
  }

  console.log('\n🎉 Synchronisation Supabase Auth terminée !')
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
