 
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'
import { createClient, createAdminClient } from '@/app/_common/lib/supabase/server'
import { logger } from '@/app/_common/lib/logger'
// Types de fichiers acceptés pour les avatars
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

// POST - Upload d'avatar
export async function POST(request: NextRequest) {
  try {
    // Validation des variables d'environnement Supabase
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      logger.error('Avatar upload error: Supabase env vars missing')
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const context = await requireAuth(request)
    const { user } = context

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    // Vérification du type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non accepté. Utilisez JPEG, PNG, WebP ou GIF.' },
        { status: 400 }
      )
    }

    // Vérification de la taille
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Le fichier est trop volumineux. Maximum 5 MB.' },
        { status: 400 }
      )
    }

    // Créer un nom de fichier unique
    const extension = file.name.split('.').pop() || 'jpg'
    const fileName = `${user.id}-${Date.now()}.${extension}`

    // Convertir le fichier en buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload vers Supabase Storage
    // Utilise le client admin pour éviter les politiques RLS sur le bucket avatars
    const supabase = await createAdminClient()
    
    // Supprimer l'ancien avatar s'il existe
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatar: true }
    })

    if (currentUser?.avatar) {
      // Extraire le chemin du fichier de l'URL
      const oldPath = currentUser.avatar.split('/').pop()
      if (oldPath) await supabase.storage.from('avatars').remove([oldPath])
    }

    // Upload du nouveau fichier
    const { data: _data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      logger.error('Upload error: ' + uploadError.message)
      return NextResponse.json(
        { error: uploadError.message || 'Erreur lors de l\'upload du fichier' },
        { status: 500 }
      )
    }

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    // Mettre à jour le profil avec la nouvelle URL
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: publicUrl }
    })

    return NextResponse.json({
      success: true,
      avatar: publicUrl,
      message: 'Avatar mis à jour avec succès'
    })

  } catch (error: any) {
    logger.error('Avatar upload error:', { error: error instanceof Error ? error.message : String(error) })

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'upload de l\'avatar' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer l'avatar
export async function DELETE(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context

    // Récupérer l'avatar actuel
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatar: true }
    })

    if (currentUser?.avatar) {
      // Supprimer le fichier de Supabase Storage
      const supabase = await createClient()
      const path = currentUser.avatar.split('/').pop()
      if (path) await supabase.storage.from('avatars').remove([path])
    }

    // Mettre à jour le profil
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: null }
    })

    return NextResponse.json({
      success: true,
      message: 'Avatar supprimé avec succès'
    })

  } catch (error: any) {
    logger.error('Avatar delete error:', { error: error instanceof Error ? error.message : String(error) })

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'avatar' },
      { status: 500 }
    )
  }
}
