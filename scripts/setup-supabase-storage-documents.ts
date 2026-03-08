/**
 * Script de configuration du bucket Supabase Storage pour les documents
 * 
 * Ce script crée le bucket "documents" et configure les options de base.
 * Les policies RLS doivent être appliquées séparément via le dashboard Supabase
 * ou le fichier SQL setup-supabase-storage-documents.sql
 * 
 * Usage: npx tsx scripts/setup-supabase-storage-documents.ts
 * 
 * Requirements: 3.8, 4.5
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config()

const BUCKET_NAME = 'documents'

async function setupDocumentsBucket() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables d\'environnement manquantes:')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
    console.error('   - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log('🚀 Configuration du bucket Supabase Storage pour les documents...\n')

  // 1. Vérifier si le bucket existe déjà
  console.log(`📦 Vérification du bucket "${BUCKET_NAME}"...`)
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    console.error('❌ Erreur lors de la liste des buckets:', listError.message)
    process.exit(1)
  }

  const existingBucket = buckets?.find(b => b.name === BUCKET_NAME)

  if (existingBucket) {
    console.log(`✅ Le bucket "${BUCKET_NAME}" existe déjà.`)
    console.log(`   - ID: ${existingBucket.id}`)
    console.log(`   - Public: ${existingBucket.public}`)
    console.log(`   - Créé le: ${existingBucket.created_at}`)
  } else {
    // 2. Créer le bucket
    console.log(`📦 Création du bucket "${BUCKET_NAME}"...`)
    
    const { data: newBucket, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: false, // Bucket privé - accès via URLs signées uniquement
      fileSizeLimit: 52428800, // 50 MB max par fichier
      allowedMimeTypes: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
      ],
    })

    if (createError) {
      console.error('❌ Erreur lors de la création du bucket:', createError.message)
      process.exit(1)
    }

    console.log(`✅ Bucket "${BUCKET_NAME}" créé avec succès!`)
    console.log(`   - ID: ${newBucket?.name}`)
  }

  // 3. Afficher les instructions pour les policies RLS
  console.log('\n' + '='.repeat(60))
  console.log('📋 PROCHAINES ÉTAPES:')
  console.log('='.repeat(60))
  console.log(`
1. Appliquez les policies RLS via le dashboard Supabase:
   - Allez dans Storage > Policies
   - Sélectionnez le bucket "${BUCKET_NAME}"
   - Ajoutez les policies définies dans:
     scripts/setup-supabase-storage-documents.sql

2. Ou exécutez le SQL directement dans l'éditeur SQL Supabase.

3. Structure des fichiers:
   {cabinetId}/{clientId}/{fileName}
   
   Exemple: cab_123/cli_456/DER_Dupont_2024-01-15.pdf

4. Types de fichiers autorisés:
   - PDF (.pdf)
   - Word (.docx)
   - Excel (.xlsx)
   - CSV (.csv)

5. Taille maximale: 50 MB par fichier
`)

  console.log('✅ Configuration terminée!')
}

// Exécuter le script
setupDocumentsBucket().catch(console.error)
