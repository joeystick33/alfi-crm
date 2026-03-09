'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Copy, Archive, ArchiveRestore, Trash2, Eye, Variable, Mail, Tag, Calendar, User, Send } from 'lucide-react'
import { Button } from '@/app/_common/components/ui/Button'
import { Card } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import {
  useEmailTemplate,
  useDeleteEmailTemplate,
  useDuplicateEmailTemplate,
  useArchiveEmailTemplate,
  useUnarchiveEmailTemplate,
} from '@/app/_common/hooks/use-api'
import { formatDate } from '@/app/_common/lib/utils'

export default function TemplateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: template, isLoading, error } = useEmailTemplate(id)
  const deleteMutation = useDeleteEmailTemplate()
  const duplicateMutation = useDuplicateEmailTemplate()
  const archiveMutation = useArchiveEmailTemplate()
  const unarchiveMutation = useUnarchiveEmailTemplate()

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Card className="p-8 text-center">
          <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Template introuvable</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            Retour
          </Button>
        </Card>
      </div>
    )
  }

  const t = template as any

  const handleDelete = async () => {
    if (!confirm('Supprimer ce template définitivement ?')) return
    await deleteMutation.mutateAsync(id)
    router.push('/dashboard/templates/emails')
  }

  const handleDuplicate = async () => {
    await duplicateMutation.mutateAsync({ id, data: { newName: `Copie de ${t.name}` } })
    router.push('/dashboard/templates/emails')
  }

  const handleToggleArchive = async () => {
    if (t.isArchived) {
      await unarchiveMutation.mutateAsync(id)
    } else {
      if (!confirm('Archiver ce template ?')) return
      await archiveMutation.mutateAsync(id)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Templates</span>
            </button>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Mail className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-slate-900 truncate max-w-xs">{t.name}</h1>
                <p className="text-xs text-slate-500">{t.category || 'Sans catégorie'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDuplicate}>
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Dupliquer
            </Button>
            {!t.isSystem && (
              <Button variant="outline" size="sm" onClick={handleToggleArchive}>
                {t.isArchived ? (
                  <><ArchiveRestore className="w-3.5 h-3.5 mr-1.5" />Restaurer</>
                ) : (
                  <><Archive className="w-3.5 h-3.5 mr-1.5" />Archiver</>
                )}
              </Button>
            )}
            {!t.isSystem && !t.isArchived && (
              <Button
                size="sm"
                onClick={() => router.push(`/dashboard/templates/emails/${id}/edit`)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Edit className="w-3.5 h-3.5 mr-1.5" />
                Modifier
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Aperçu email */}
        <div className="xl:col-span-2 space-y-6">
          {/* Métadonnées */}
          <Card className="p-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 mb-1">Objet</p>
                <p className="font-medium text-slate-900">{t.subject}</p>
              </div>
              {t.previewText && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Texte de prévisualisation</p>
                  <p className="text-slate-600">{t.previewText}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Contenu HTML rendu */}
          <Card className="overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Aperçu rendu</span>
            </div>
            <div
              className="p-6 bg-white"
              dangerouslySetInnerHTML={{ __html: t.htmlContent }}
            />
          </Card>

          {/* Variables utilisées */}
          {t.variables && t.variables.length > 0 && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Variable className="w-4 h-4 text-indigo-500" />
                Variables utilisées ({t.variables.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {t.variables.map((v: string) => (
                  <span key={v} className="px-2 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-xs font-mono">
                    {v}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Informations */}
        <div className="space-y-5">
          {/* Statut */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Statut</h3>
            <div className="space-y-2">
              {t.isSystem && <Badge variant="info" className="w-full justify-center">Template système</Badge>}
              {t.isArchived ? (
                <Badge variant="secondary" className="w-full justify-center">Archivé</Badge>
              ) : t.isActive ? (
                <Badge variant="success" className="w-full justify-center">Actif</Badge>
              ) : (
                <Badge variant="warning" className="w-full justify-center">Inactif</Badge>
              )}
            </div>
          </Card>

          {/* Infos */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Informations</h3>
            <div className="space-y-3 text-sm">
              {t.category && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Tag className="w-4 h-4 text-slate-400" />
                  <span>{t.category}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Créé le {formatDate(t.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Modifié le {formatDate(t.updatedAt)}</span>
              </div>
              {t.createdByUser && (
                <div className="flex items-center gap-2 text-slate-600">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{t.createdByUser.firstName} {t.createdByUser.lastName}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Usages */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-500" />
              Utilisations
            </h3>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Campagnes</span>
                <span className="font-medium">{t._count?.campaigns || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Scénarios</span>
                <span className="font-medium">{t._count?.scenarios || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Messages envoyés</span>
                <span className="font-medium">{t._count?.messages || 0}</span>
              </div>
            </div>
          </Card>

          {/* Tags */}
          {t.tags && t.tags.length > 0 && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {t.tags.map((tag: string) => (
                  <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Actions destructives */}
          {!t.isSystem && (
            <Card className="p-5 border-red-100">
              <h3 className="text-sm font-semibold text-red-700 mb-3">Zone de danger</h3>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                onClick={handleDelete}
                disabled={(t._count?.campaigns || 0) + (t._count?.scenarios || 0) > 0}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Supprimer le template
              </Button>
              {(t._count?.campaigns || 0) + (t._count?.scenarios || 0) > 0 && (
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Impossible de supprimer : template utilisé dans {(t._count?.campaigns || 0) + (t._count?.scenarios || 0)} campagne(s)
                </p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
