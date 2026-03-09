'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Eye, Plus, X, Variable, Mail, Sparkles } from 'lucide-react'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Card } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { useCreateEmailTemplate, useEmailTemplateVariables } from '@/app/_common/hooks/use-api'
import { useToast } from '@/app/_common/hooks/use-toast'
import { cn } from '@/lib/utils'

// ── Variables disponibles pour les templates ──
const VARIABLE_CATEGORIES = [
  {
    label: 'Client',
    vars: [
      { key: '{{clientFirstName}}', desc: 'Prénom du client' },
      { key: '{{clientLastName}}', desc: 'Nom du client' },
      { key: '{{clientFullName}}', desc: 'Nom complet' },
      { key: '{{clientEmail}}', desc: 'Email du client' },
      { key: '{{clientPhone}}', desc: 'Téléphone' },
    ],
  },
  {
    label: 'Conseiller',
    vars: [
      { key: '{{advisorFirstName}}', desc: 'Prénom du conseiller' },
      { key: '{{advisorLastName}}', desc: 'Nom du conseiller' },
      { key: '{{advisorEmail}}', desc: 'Email du conseiller' },
      { key: '{{advisorPhone}}', desc: 'Tél. du conseiller' },
      { key: '{{cabinetName}}', desc: 'Nom du cabinet' },
    ],
  },
  {
    label: 'Rendez-vous',
    vars: [
      { key: '{{rdvDate}}', desc: 'Date du RDV' },
      { key: '{{rdvTime}}', desc: 'Heure du RDV' },
      { key: '{{rdvLocation}}', desc: 'Lieu du RDV' },
      { key: '{{rdvType}}', desc: 'Type de RDV' },
    ],
  },
  {
    label: 'Divers',
    vars: [
      { key: '{{today}}', desc: "Date d'aujourd'hui" },
      { key: '{{year}}', desc: 'Année en cours' },
      { key: '{{unsubscribeLink}}', desc: 'Lien désinscription' },
    ],
  },
]

const CATEGORIES = [
  'PROSPECTION',
  'SUIVI',
  'RELANCE',
  'BIENVENUE',
  'NEWSLETTER',
  'RDV',
  'DOCUMENT',
  'ANNIVERSAIRE',
  'INFORMATION',
  'AUTRE',
]

// ── Éditeur HTML simple avec toolbar ──
function HtmlEditor({
  value,
  onChange,
  onInsertVariable,
}: {
  value: string
  onChange: (v: string) => void
  onInsertVariable?: (variable: string) => void
}) {
  const [mode, setMode] = useState<'visual' | 'html'>('visual')

  const applyFormat = useCallback((tag: string, style?: string) => {
    const textarea = document.getElementById('html-editor') as HTMLTextAreaElement
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.slice(start, end)

    let newText = value
    if (style) {
      newText = value.slice(0, start) + `<span style="${style}">${selected}</span>` + value.slice(end)
    } else {
      newText = value.slice(0, start) + `<${tag}>${selected}</${tag}>` + value.slice(end)
    }
    onChange(newText)
  }, [value, onChange])

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 bg-slate-50 border-b border-slate-200 flex-wrap">
        <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
          <button
            type="button"
            onClick={() => setMode('visual')}
            className={cn('px-2 py-1 text-xs rounded font-medium', mode === 'visual' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100')}
          >
            Visuel
          </button>
          <button
            type="button"
            onClick={() => setMode('html')}
            className={cn('px-2 py-1 text-xs rounded font-mono', mode === 'html' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100')}
          >
            HTML
          </button>
        </div>
        {[
          { label: 'G', action: () => applyFormat('strong'), title: 'Gras' },
          { label: 'I', action: () => applyFormat('em'), title: 'Italique' },
          { label: 'S', action: () => applyFormat('u'), title: 'Souligné' },
        ].map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={btn.action}
            title={btn.title}
            className="w-7 h-7 rounded text-xs font-bold text-slate-600 hover:bg-slate-200 flex items-center justify-center"
          >
            {btn.label}
          </button>
        ))}
        <div className="flex items-center gap-1 border-l border-slate-200 pl-2 ml-1">
          <button
            type="button"
            onClick={() => {
              const url = prompt('URL du lien :')
              if (url) applyFormat('a', undefined)
            }}
            className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
          >
            Lien
          </button>
          <button
            type="button"
            onClick={() => {
              const textarea = document.getElementById('html-editor') as HTMLTextAreaElement
              if (!textarea) return
              const pos = textarea.selectionStart
              const newVal = value.slice(0, pos) + '<br />' + value.slice(pos)
              onChange(newVal)
            }}
            className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
          >
            Saut ligne
          </button>
          <button
            type="button"
            onClick={() => {
              const pTag = '<p style="margin: 0 0 16px 0; font-family: Arial, sans-serif; font-size: 15px; color: #1a1a2e; line-height: 1.6;"></p>'
              const textarea = document.getElementById('html-editor') as HTMLTextAreaElement
              if (!textarea) return
              const pos = textarea.selectionStart
              onChange(value.slice(0, pos) + pTag + value.slice(pos))
            }}
            className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
          >
            Paragraphe
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        {mode === 'html' ? (
          <textarea
            id="html-editor"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-72 p-4 text-sm font-mono text-slate-700 bg-slate-900 text-green-400 resize-none focus:outline-none"
            placeholder="<p>Votre contenu HTML ici...</p>"
            spellCheck={false}
          />
        ) : (
          <div className="flex">
            <textarea
              id="html-editor"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 h-72 p-4 text-sm text-slate-700 resize-none focus:outline-none"
              placeholder="Rédigez votre email ici (supporte le HTML)..."
            />
            <div
              className="w-1/2 h-72 p-4 text-sm border-l border-slate-200 overflow-auto bg-white"
              dangerouslySetInnerHTML={{ __html: value || '<p class="text-slate-400">Aperçu...</p>' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default function NewEmailTemplatePage() {
  const router = useRouter()
  const { toast } = useToast()
  const createMutation = useCreateEmailTemplate()

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    subject: '',
    previewText: '',
    htmlContent: getDefaultTemplate(),
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
  const [saving, setSaving] = useState(false)

  const update = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const insertVariable = useCallback((variable: string) => {
    const textarea = document.getElementById('html-editor') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const newContent = form.htmlContent.slice(0, start) + variable + form.htmlContent.slice(start)
      update('htmlContent', newContent)
      // Track used variables
      if (!form.variables.includes(variable)) {
        update('variables', [...form.variables, variable])
      }
    }
  }, [form.htmlContent, form.variables])

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !form.tags.includes(tag)) {
      update('tags', [...form.tags, tag])
      setTagInput('')
    }
  }

  const handleSave = async () => {
    if (!form.name) { toast({ title: 'Le nom est obligatoire', variant: 'destructive' }); return }
    if (!form.subject) { toast({ title: 'Le sujet est obligatoire', variant: 'destructive' }); return }
    if (!form.htmlContent) { toast({ title: 'Le contenu est obligatoire', variant: 'destructive' }); return }

    setSaving(true)
    try {
      await createMutation.mutateAsync({
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
      })
      router.push('/dashboard/templates/emails')
    } catch {
      // error handled by hook
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Retour</span>
            </button>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Mail className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-slate-900">Nouveau template email</h1>
                <p className="text-xs text-slate-500">Créez un modèle réutilisable</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-4 h-4 mr-1.5" />
              {showPreview ? 'Masquer' : 'Aperçu'}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Formulaire principal */}
          <div className="xl:col-span-2 space-y-6">

            {/* Informations générales */}
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                Informations générales
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Nom du template <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Ex: Bienvenue nouveau client"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Catégorie</label>
                    <Select value={form.category} onValueChange={(v) => update('category', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Description</label>
                  <Input
                    placeholder="Décrivez l'usage de ce template..."
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* Objet et preview */}
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                Objet et aperçu
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Objet de l'email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Ex: Bienvenue chez {{cabinetName}}, {{clientFirstName}} !"
                      value={form.subject}
                      onChange={(e) => update('subject', e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                      title="Insérer une variable"
                      onClick={() => setShowVarPanel(true)}
                    >
                      <Variable className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Texte de prévisualisation
                    <span className="ml-1 text-slate-400 font-normal">(affiché dans la boîte de réception avant ouverture)</span>
                  </label>
                  <Input
                    placeholder="Un court résumé qui apparaît dans la liste des emails..."
                    value={form.previewText}
                    onChange={(e) => update('previewText', e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* Éditeur de contenu */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                  Corps de l'email <span className="text-red-500 ml-1">*</span>
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVarPanel(!showVarPanel)}
                  className="text-xs"
                >
                  <Variable className="w-3.5 h-3.5 mr-1" />
                  Variables
                </Button>
              </div>

              {/* Variables Panel */}
              {showVarPanel && (
                <div className="mb-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-2 mb-3">
                    {VARIABLE_CATEGORIES.map((cat, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveVarCat(i)}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                          activeVarCat === i ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                        )}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {VARIABLE_CATEGORIES[activeVarCat].vars.map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => insertVariable(v.key)}
                        title={v.desc}
                        className="px-2 py-1 bg-white border border-indigo-200 rounded-lg text-xs font-mono text-indigo-600 hover:bg-indigo-100 hover:border-indigo-400 transition-colors"
                      >
                        {v.key}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <HtmlEditor
                value={form.htmlContent}
                onChange={(v) => update('htmlContent', v)}
                onInsertVariable={insertVariable}
              />

              {form.variables.length > 0 && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-500">Variables utilisées :</span>
                  {form.variables.map((v) => (
                    <span key={v} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-xs font-mono">
                      {v}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Panneau latéral */}
          <div className="space-y-6">
            {/* Statut */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Publication</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Actif</p>
                    <p className="text-xs text-slate-500">Disponible pour les campagnes</p>
                  </div>
                  <div
                    onClick={() => update('isActive', !form.isActive)}
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-colors cursor-pointer',
                      form.isActive ? 'bg-indigo-600' : 'bg-slate-200'
                    )}
                  >
                    <div className={cn(
                      'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                      form.isActive ? 'translate-x-5' : 'translate-x-0'
                    )} />
                  </div>
                </label>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Enregistrement...' : 'Enregistrer le template'}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.back()}>
                  Annuler
                </Button>
              </div>
            </Card>

            {/* Tags */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Tags</h3>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Ajouter un tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 h-8 text-xs"
                />
                <Button size="sm" variant="outline" onClick={handleAddTag} className="h-8 px-2">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              {form.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {form.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs"
                    >
                      {tag}
                      <button onClick={() => update('tags', form.tags.filter((t) => t !== tag))}>
                        <X className="w-3 h-3 hover:text-red-500" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Aucun tag ajouté</p>
              )}
            </Card>

            {/* Notes internes */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Notes internes</h3>
              <textarea
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Notes sur l'usage de ce template (visible uniquement en interne)..."
                className="w-full h-24 text-xs text-slate-600 resize-none border-none focus:outline-none"
              />
            </Card>

            {/* Aperçu email */}
            {showPreview && (
              <Card className="p-5 overflow-hidden">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-500" />
                  Aperçu rendu
                </h3>
                <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 mb-2">
                  <strong>Objet :</strong> {form.subject || '(aucun objet)'}
                </div>
                <div
                  className="border border-slate-200 rounded-lg overflow-auto max-h-96 bg-white p-4 text-sm"
                  dangerouslySetInnerHTML={{ __html: form.htmlContent }}
                />
              </Card>
            )}

            {/* Tips */}
            <Card className="p-5 bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-100">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-indigo-900">Conseils</h3>
              </div>
              <ul className="space-y-2 text-xs text-indigo-700">
                <li>• Utilisez <code className="bg-white px-1 rounded">{'{{clientFirstName}}'}</code> pour personnaliser</li>
                <li>• Testez le rendu en cliquant sur "Aperçu"</li>
                <li>• Un bon objet augmente le taux d'ouverture</li>
                <li>• Ajoutez toujours un lien de désinscription</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function getDefaultTemplate() {
  return `<div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 32px; text-align: center;">
    <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0;">{{cabinetName}}</h1>
    <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 8px 0 0;">Votre conseiller en gestion de patrimoine</p>
  </div>

  <!-- Body -->
  <div style="padding: 40px 32px;">
    <p style="font-size: 16px; color: #1a1a2e; margin: 0 0 16px;">Bonjour {{clientFirstName}},</p>

    <p style="font-size: 15px; color: #4a5568; line-height: 1.7; margin: 0 0 16px;">
      Votre message ici...
    </p>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Prendre rendez-vous
      </a>
    </div>

    <p style="font-size: 14px; color: #718096; margin: 0;">
      Cordialement,<br />
      <strong>{{advisorFirstName}} {{advisorLastName}}</strong><br />
      {{cabinetName}}
    </p>
  </div>

  <!-- Footer -->
  <div style="background: #f7f8fc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="font-size: 12px; color: #a0aec0; margin: 0;">
      © {{year}} {{cabinetName}} — <a href="{{unsubscribeLink}}" style="color: #a0aec0;">Se désinscrire</a>
    </p>
  </div>
</div>`
}
