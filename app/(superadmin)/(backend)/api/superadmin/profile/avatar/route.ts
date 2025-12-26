 
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'
import { createAdminClient } from '@/app/_common/lib/supabase/server'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

// POST - Upload avatar superadmin
export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('SuperAdmin avatar upload error: Supabase env vars missing')
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 })
    }

    const context = await requireAuth(request)
    if (!context.isSuperAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { user } = context
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non accepté. Utilisez JPEG, PNG, WebP ou GIF.' },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Le fichier est trop volumineux. Maximum 5 MB.' }, { status: 400 })
    }

    const extension = file.name.split('.').pop() || 'jpg'
    const fileName = `${user.id}-${Date.now()}.${extension}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const supabase = await createAdminClient()

    // Supprimer l'ancien avatar
    const current = await prisma.superAdmin.findUnique({
      where: { id: user.id as string },
      select: { avatar: true },
    })
    if (current?.avatar) {
      const oldPath = current.avatar.split('/').pop()
      if (oldPath) await supabase.storage.from('avatars').remove([oldPath])
    }

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, { contentType: file.type, upsert: true })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message || 'Erreur lors de l’upload' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)

    await prisma.superAdmin.update({
      where: { id: user.id as string },
      data: { avatar: publicUrl },
    })

    return NextResponse.json({ success: true, avatar: publicUrl })
  } catch (error: any) {
    console.error('SuperAdmin avatar upload error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    return NextResponse.json({ error: error.message || 'Erreur lors de l’upload de l’avatar' }, { status: 500 })
  }
}

// DELETE - Supprimer l'avatar superadmin
export async function DELETE(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    if (!context.isSuperAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
    const { user } = context

    const supabase = await createAdminClient()
    const current = await prisma.superAdmin.findUnique({
      where: { id: user.id as string },
      select: { avatar: true },
    })

    if (current?.avatar) {
      const path = current.avatar.split('/').pop()
      if (path) await supabase.storage.from('avatars').remove([path])
    }

    await prisma.superAdmin.update({
      where: { id: user.id as string },
      data: { avatar: null },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('SuperAdmin avatar delete error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erreur lors de la suppression de l’avatar' }, { status: 500 })
  }
}
