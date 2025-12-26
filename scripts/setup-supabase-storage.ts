/**
 * Script de configuration du Storage Supabase
 * 
 * Crée le bucket "avatars" pour les photos de profil
 * 
 * Usage: npx tsx scripts/setup-supabase-storage.ts
 */

import { config } from 'dotenv'
config({ path: '.env' })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('🚀 Configuration du Storage Supabase...\n')

  // 1. Lister les buckets existants
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  
  if (listError) {
    console.error('❌ Erreur liste buckets:', listError.message)
    process.exit(1)
  }

  console.log('📦 Buckets existants:', buckets.map(b => b.name).join(', ') || 'Aucun')

  // 2. Vérifier si le bucket "avatars" existe
  const avatarsBucket = buckets.find(b => b.name === 'avatars')
  
  if (!avatarsBucket) {
    console.log('\n📁 Création du bucket "avatars"...')
    
    const { data, error } = await supabase.storage.createBucket('avatars', {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5 MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    })

    if (error) {
      console.error('❌ Erreur création bucket:', error.message)
      process.exit(1)
    }

    console.log('✅ Bucket "avatars" créé avec succès')
  } else {
    console.log('\n✅ Bucket "avatars" existe déjà')
  }

  console.log('\n✅ Configuration terminée!')
  console.log('\n📝 Note: Assurez-vous que les politiques RLS sont configurées dans Supabase Dashboard')
}

main().catch(console.error)
