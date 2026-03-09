'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { ArrowLeft, Save, Eye, Plus, X, Variable, Mail, Sparkles } from 'lucide-react'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Card } from '@/app/_common/components/ui/Card'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { useEmailTemplate, useUpdateEmailTemplate } from '@/app/_common/hooks/use-api'
import { useToast } from '@/app/_common/hooks/use-toast'
import { cn } from '@/lib/utils'

const VARIABLE_CATEGORIES = [
  {
    label: 'Client',
    vars: [
      { key: '{{clientFirstName}}', desc: 'Prénom du client' },
      { key: '{{clientLastName}}', desc: 'Nom du client' },
      { key: '{{clientFullName}}', desc: 'Nom complet' },
      { key: '{{clientEmail}}', desc: 'Email du client' },
    ],
  },
  {
    label: 'Conseiller',
    vars: [
      { key: '{{advisorFirstName}}', desc: 'Prénom conseiller' },
      { key: '{{advisorLastName}}', desc: 'Nom conseiller' },
      { key: '{{cabinetName}}', desc: 'Nom du cabinet' },
    ],
  },
  {
    label: 'RDV',
    vars: [
      { key: '{{rdvDate}}', desc: 'Date RDV' },
      { key: '{{rdvTime}}', desc: 'Heure RDV' },
      { key: '{{rdvLocation}}', desc: 'Lieu' },
    ],
  },
  {
    label: 'Divers',
    vars: [
      { key: '{{today}}', desc: "Aujourd'hui" },
      { key: '{{year}}', desc: 'Année' },
      { key: '{{unsubscribeLink}}', desc: 'Désinscription' },
    ],
  },
]

const CATEGORIES = [
  'PROSPECTION', 'SUIVI', 'RELANCE', 'BIENVENUE',
  'NEWSLETTER', 'RDV', 'DOCUMENT', 'ANNIVERSAIRE', 'INFORMATION', 'AUTRE',
]

export default function EditTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const id = params.id as string

  const { data: template, isLoading } = useEmailTemplate(id)
  const updateMutation = useUpdateEmailTemplate()

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    subject: '',
    previewText: '',
    htmlContent: '',
    plainContent: '',
    variables: [] as string[],
    tags: [] as string[],
    notes: '',
    isActive: true,
  })
  const [tagInput, setTagInput] = useState('')
  const [showVarPanel, setShowVarPanel] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [activeVarCat, setActiveVarCat] = useState(0)
  const [mode, setMode] = useState<'visual' | 'html'>('visual')
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Initialize form when template loads
  useEffect(() => {
    if (template && !initialized) {
      const t = template as any
      setForm({
        name: t.name || '',
        description: t.description || '',
        category: t.category || '',
        subject: t.subject || '',
        previewText: t.previewText || '',
        htmlContent: t.htmlContent || '',
        plainContent: t.plainContent || '',
        variables: t.variables || [],
        tags: t.tags || [],
        notes: t.notes || '',
        isActive: t.isActive ?? true,
      })
      setInitialized(true)
    }
  }, [template, initialized])

  const update = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const insertVariable = useCallback((variable: string) => {
    const textarea = document.getElementById('html-editor-edit') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const newContent = form.htmlContent.slice(0, start) + variable + form.htmlContent.slice(start)
      update('htmlContent', newContent)
      if (!form.variables.includes(variable)) {
        update('variables', [...form.variables, variable])
      }
    }
  }, [form.htmlContent, form.variables])

  const handleSave = async () => {
    if (!form.name) { toast({ title: 'Le nom est obligatoire', variant: 'destructive' }); return }
    if (!form.subject) { toast({ title: 'Le sujet est obligatoire', variant: 'destructive' }); return }
    if (!form.htmlContent) { toast({ title: 'Le contenu est obligatoire', variant: 'destructive' }); return }

    setSaving(true)
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          name: form.name,
          description: form.description || undefined,
          category: form.category || undefined,
          subject: form.subject,
          previewText: form.previewText || undefined,
          htmlContent: form.htmlContent,
          plainContent: form.plainContent || undefined,
          variables: form.variables,
          tags: form.tags,
          notes: form.notes || undefined,
          isActive: form.isActive,
        },
      })
      router.push(`/dashboard/templates/emails/${id}`)
    } catch {
      // handled by hook
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  const t = template as any
  if (t?.isSystem) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center mt-20">
        <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-700 mb-2">Template système</h2>
        <p className="text-sm text-slate-500 mb-4">Les templates système ne peuvent pas être modifiés. Dupliquez-le pour créer votre version.</p>
        <Button onClick={() => router.back()}>Retour</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-700">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Retour</span>
            </button>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Mail className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-slate-900">Modifier le template</h1>
                <p className="text-xs text-slate-500">{form.name}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="w-4 h-4 mr-1.5" />
              {showPreview ? 'Masquer' : 'Aperçu'}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              <Save className="w-4 h-4 mr-1.5" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            {/* Infos générales */}
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">1</span>
                Informations générales
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Nom <span className="text-red-500">*</span></label>
                    <Input value={form.name} onChange={(e) => update('name', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Catégorie</label>
                    <Select value={form.category} onValueChange={(v) => update('category', v)}>
                      <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Description</label>
                  <Input value={form.description} onChange={(e) => update('description', e.target.value)} />
                </div>
              </div>
            </Card>

            {/* Objet */}
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                Objet et aperçu
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Objet <span className="text-red-500">*</span></label>
                  <Input value={form.subject} onChange={(e) => update('subject', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Texte de prévisualisation</label>
                  <Input value={form.previewText} onChange={(e) => update('previewText', e.target.value)} />
                </div>
              </div>
            </Card>

            {/* Éditeur */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">3</span>
                  Corps de l'email <span className="text-red-500 ml-1">*</span>
                </h2>
                <Button variant="outline" size="sm" onClick={() => setShowVarPanel(!showVarPanel)} className="text-xs">
                  <Variable className="w-3.5 h-3.5 mr-1" />
                  Variables
                </Button>
              </div>

              {showVarPanel && (
                <div className="mb-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-2 mb-3">
                    {VARIABLE_CATEGORIES.map((cat, i) => (
                      <button key={i} type="button" onClick={() => setActiveVarCat(i)}
                        className={cn('px-3 py-1 rounded-full text-xs font-medium', activeVarCat === i ? 'bg-amber-500 text-white' : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-100')}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {VARIABLE_CATEGORIES[activeVarCat].vars.map((v) => (
                      <button key={v.key} type="button" onClick={() => insertVariable(v.key)} title={v.desc}
                        className="px-2 py-1 bg-white border border-amber-200 rounded-lg text-xs font-mono text-amber-700 hover:bg-amber-100 hover:border-amber-400 transition-colors">
                        {v.key}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Toolbar */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-1 px-3 py-2 bg-slate-50 border-b border-slate-200">
                  <button type="button" onClick={() => setMode('visual')}
                    className={cn('px-2 py-1 text-xs rounded font-medium', mode === 'visual' ? 'bg-amber-100 text-amber-700' : 'text-slate-500 hover:bg-slate-100')}>
                    Visuel
                  </button>
                  <button type="button" onClick={() => setMode('html')}
                    className={cn('px-2 py-1 text-xs rounded font-mono', mode === 'html' ? 'bg-amber-100 text-amber-700' : 'text-slate-500 hover:bg-slate-100')}>
                    HTML
                  </button>
                </div>
                {mode === 'html' ? (
                  <textarea id="html-editor-edit" value={form.htmlContent} onChange={(e) => update('htmlContent', e.target.value)}
                    className="w-full h-80 p-4 text-sm font-mono bg-slate-900 text-green-400 resize-none focus:outline-none" />
                ) : (
                  <div className="flex">
                    <textarea id="html-editor-edit" value={form.htmlContent} onChange={(e) => update('htmlContent', e.target.value)}
                      className="flex-1 h-80 p-4 text-sm resize-none focus:outline-none" />
                    <div className="w-1/2 h-80 p-4 text-sm border-l border-slate-200 overflow-auto bg-white"
                      dangerouslySetInnerHTML={{ __html: form.htmlContent }} />
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Publication</h3>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-slate-700">Actif</p>
                  <p className="text-xs text-slate-500">Disponible pour les campagnes</p>
                </div>
                <div onClick={() => update('isActive', !form.isActive)}
                  className={cn('relative w-11 h-6 rounded-full transition-colors cursor-pointer', form.isActive ? 'bg-indigo-600' : 'bg-slate-200')}>
                  <div className={cn('absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', form.isActive ? 'translate-x-5' : 'translate-x-0')} />
                </div>
              </label>
              <div className="mt-4 pt-4 border-t space-y-2">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />{saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.back()}>Annuler</Button>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Tags</h3>
              <div className="flex gap-2 mb-3">
                <Input placeholder="Ajouter..." value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const t = tagInput.trim(); if (t && !form.tags.includes(t)) { update('tags', [...form.tags, t]); setTagInput('') } } }}
                  className="flex-1 h-8 text-xs" />
                <Button size="sm" variant="outline" onClick={() => { const t = tagInput.trim(); if (t && !form.tags.includes(t)) { update('tags', [...form.tags, t]); setTagInput('') } }} className="h-8 px-2">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                    {tag}
                    <button onClick={() => update('tags', form.tags.filter((t) => t !== tag))}><X className="w-3 h-3 hover:text-red-500" /></button>
                  </span>
                ))}
              </div>
            </Card>

            {showPreview && (
              <Card className="p-5 overflow-hidden">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-500" />Aperçu rendu
                </h3>
                <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 mb-2">
                  <strong>Objet :</strong> {form.subject || '(aucun objet)'}
                </div>
                <div className="border border-slate-200 rounded-lg overflow-auto max-h-80 bg-white p-4 text-sm"
                  dangerouslySetInnerHTML={{ __html: form.htmlContent }} />
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
