"use client"

/**
 * Template Manager Page - Manage regulatory document templates
 * 
 * Features:
 * - List templates by type and association
 * - Edit customizable sections
 * - Preview templates
 * 
 * @requirements 15.6-15.7, 17.5
 */

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  useRegulatoryTemplates,
  useUpdateRegulatoryTemplate,
  useDeleteRegulatoryTemplate,
} from '@/app/_common/hooks/api/use-regulatory-documents-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/_common/components/ui/Dialog'
import { Textarea } from '@/app/_common/components/ui/Textarea'
import { Label } from '@/app/_common/components/ui/Label'
import { Input } from '@/app/_common/components/ui/Input'
import { Switch } from '@/app/_common/components/ui/Switch'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/app/_common/components/ui/DropdownMenu'
import { cn } from '@/app/_common/lib/utils'
import {
  FileText,
  Settings,
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Filter,
  ChevronDown,
  FileCheck,
  Building2,
  Loader2,
  Save,
  X,
} from 'lucide-react'
import {
  REGULATORY_DOCUMENT_TYPES,
  REGULATORY_DOCUMENT_TYPE_LABELS,
  ASSOCIATION_TYPES,
  ASSOCIATION_TYPE_LABELS,
  type RegulatoryDocumentType,
  type AssociationType,
  type DocumentTemplate,
  type DocumentTemplateContent,
  type TemplateSection,
} from '@/lib/documents/types'

// ============================================================================
// Types
// ============================================================================

interface TemplateFiltersState {
  documentType: RegulatoryDocumentType[]
  associationType: AssociationType[]
  isActive: boolean | null
}

// ============================================================================
// Filter Dropdown Component
// ============================================================================

interface FilterDropdownProps<T extends string> {
  label: string
  options: readonly T[]
  selected: T[]
  onChange: (selected: T[]) => void
  getLabel: (value: T) => string
}

function FilterDropdown<T extends string>({ 
  label, 
  options, 
  selected, 
  onChange,
  getLabel 
}: FilterDropdownProps<T>) {
  const toggleOption = (option: T) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option))
    } else {
      onChange([...selected, option])
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {label}
          {selected.length > 0 && (
            <Badge variant="primary" size="xs">{selected.length}</Badge>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 max-h-80 overflow-auto">
        {options.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => toggleOption(option)}
            className="flex items-center gap-2"
          >
            <div className={cn(
              'h-4 w-4 rounded border flex items-center justify-center',
              selected.includes(option) 
                ? 'bg-[#7373FF] border-[#7373FF]' 
                : 'border-gray-300'
            )}>
              {selected.includes(option) && (
                <CheckCircle className="h-3 w-3 text-white" />
              )}
            </div>
            <span className="truncate">{getLabel(option)}</span>
          </DropdownMenuItem>
        ))}
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onChange([])}>
              <X className="h-4 w-4 mr-2" />
              Effacer la sélection
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================================================
// Template Card Component
// ============================================================================

interface TemplateCardProps {
  template: DocumentTemplate
  onEdit: () => void
  onPreview: () => void
  onToggleActive: () => void
  onDelete: () => void
}

function TemplateCard({ template, onEdit, onPreview, onToggleActive, onDelete }: TemplateCardProps) {
  return (
    <Card className={cn(
      'transition-all hover:shadow-md',
      !template.isActive && 'opacity-60'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn(
              'p-2 rounded-lg',
              template.isActive ? 'bg-[#7373FF]/10' : 'bg-gray-100'
            )}>
              <FileCheck className={cn(
                'h-5 w-5',
                template.isActive ? 'text-[#7373FF]' : 'text-gray-400'
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-gray-900 truncate">
                  {template.name}
                </h3>
                <Badge variant="outline" size="xs">
                  v{template.version}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {REGULATORY_DOCUMENT_TYPE_LABELS[template.documentType as RegulatoryDocumentType]}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant={template.isActive ? 'success' : 'secondary'}
                  size="xs"
                >
                  {template.isActive ? 'Actif' : 'Inactif'}
                </Badge>
                <Badge variant="outline" size="xs" className="gap-1">
                  <Building2 className="h-3 w-3" />
                  {ASSOCIATION_TYPE_LABELS[template.associationType as AssociationType]?.split(' ')[0] || template.associationType}
                </Badge>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onPreview}>
                <Eye className="h-4 w-4 mr-2" />
                Prévisualiser
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleActive}>
                {template.isActive ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Désactiver
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Activer
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-rose-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Template Edit Dialog
// ============================================================================

interface TemplateEditDialogProps {
  open: boolean
  template: DocumentTemplate | null
  onOpenChange: (open: boolean) => void
  onSave: (data: { name: string; version: string; content: DocumentTemplateContent }) => void
  isSaving: boolean
}

function TemplateEditDialog({ open, template, onOpenChange, onSave, isSaving }: TemplateEditDialogProps) {
  const [name, setName] = useState('')
  const [version, setVersion] = useState('')
  const [sections, setSections] = useState<TemplateSection[]>([])
  const [activeSection, setActiveSection] = useState<string | null>(null)

  // Initialize form when template changes
  useState(() => {
    if (template) {
      setName(template.name)
      setVersion(template.version)
      const content = template.content as DocumentTemplateContent
      setSections(content?.sections || [])
      if (content?.sections?.length > 0) {
        setActiveSection(content.sections[0].id)
      }
    }
  })

  const handleSectionContentChange = (sectionId: string, newContent: string) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, content: newContent } : s
    ))
  }

  const handleSave = () => {
    if (!template) return
    
    const content = template.content as DocumentTemplateContent
    onSave({
      name,
      version,
      content: {
        ...content,
        sections,
      },
    })
  }

  if (!template) return null

  const content = template.content as DocumentTemplateContent
  const customizableSections = sections.filter(s => 
    template.customizableSections.includes(s.id)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-[#7373FF]" />
            Modifier le template
          </DialogTitle>
          <DialogDescription>
            {REGULATORY_DOCUMENT_TYPE_LABELS[template.documentType as RegulatoryDocumentType]}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du template</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              />
            </div>
          </div>

          {/* Sections Editor */}
          <div className="space-y-3">
            <Label>Sections personnalisables</Label>
            
            {customizableSections.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                Ce template n'a pas de sections personnalisables
              </div>
            ) : (
              <Tabs value={activeSection || ''} onValueChange={setActiveSection}>
                <TabsList className="flex-wrap h-auto gap-1">
                  {customizableSections.map((section) => (
                    <TabsTrigger key={section.id} value={section.id} className="text-xs">
                      {section.title}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {customizableSections.map((section) => (
                  <TabsContent key={section.id} value={section.id} className="mt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>{section.title}</Label>
                        {section.isMandatory && (
                          <Badge variant="warning" size="xs">Obligatoire</Badge>
                        )}
                      </div>
                      <Textarea
                        value={section.content}
                        onChange={(e) => handleSectionContentChange(section.id, e.target.value)}
                        rows={10}
                        className="font-mono text-sm"
                        placeholder="Contenu de la section (supporte les placeholders {{variable}})"
                      />
                      <p className="text-xs text-gray-500">
                        Utilisez {'{{variable}}'} pour les données dynamiques (ex: {'{{clientFullName}}'}, {'{{generationDate}}'})
                      </p>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>

          {/* Mandatory Sections Info */}
          {template.mandatorySections.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm font-medium text-amber-800">Sections obligatoires</p>
              <p className="text-xs text-amber-700 mt-1">
                Les sections suivantes ne peuvent pas être supprimées: {template.mandatorySections.join(', ')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Template Preview Dialog
// ============================================================================

interface TemplatePreviewDialogProps {
  open: boolean
  template: DocumentTemplate | null
  onOpenChange: (open: boolean) => void
}

function TemplatePreviewDialog({ open, template, onOpenChange }: TemplatePreviewDialogProps) {
  if (!template) return null

  const content = template.content as DocumentTemplateContent

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-[#7373FF]" />
            Prévisualisation: {template.name}
          </DialogTitle>
          <DialogDescription>
            {REGULATORY_DOCUMENT_TYPE_LABELS[template.documentType as RegulatoryDocumentType]} - v{template.version}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="bg-white border rounded-lg p-8 prose prose-sm max-w-none">
            {/* Header */}
            {content?.header && (
              <div className="border-b pb-4 mb-6">
                <h2 className="text-lg font-semibold">{content.header.title}</h2>
                <div className="text-gray-600 whitespace-pre-wrap">
                  {content.header.content}
                </div>
              </div>
            )}

            {/* Sections */}
            {content?.sections?.sort((a, b) => a.order - b.order).map((section) => (
              <div key={section.id} className="mb-6">
                <h3 className="text-base font-medium flex items-center gap-2">
                  {section.title}
                  {section.isMandatory && (
                    <Badge variant="outline" size="xs">Obligatoire</Badge>
                  )}
                </h3>
                <div className="text-gray-600 whitespace-pre-wrap mt-2">
                  {section.content}
                </div>
              </div>
            ))}

            {/* Footer */}
            {content?.footer && (
              <div className="border-t pt-4 mt-6">
                <h4 className="text-sm font-medium">{content.footer.title}</h4>
                <div className="text-gray-500 text-sm whitespace-pre-wrap">
                  {content.footer.content}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function TemplatesPage() {
  const router = useRouter()
  
  // State
  const [filters, setFilters] = useState<TemplateFiltersState>({
    documentType: [],
    associationType: [],
    isActive: null,
  })
  const [editDialog, setEditDialog] = useState<{ open: boolean; template: DocumentTemplate | null }>({
    open: false,
    template: null,
  })
  const [previewDialog, setPreviewDialog] = useState<{ open: boolean; template: DocumentTemplate | null }>({
    open: false,
    template: null,
  })

  // Fetch templates
  const { data: templatesData, isLoading, refetch } = useRegulatoryTemplates({
    documentType: filters.documentType.length > 0 ? filters.documentType : undefined,
    associationType: filters.associationType.length > 0 ? filters.associationType : undefined,
    isActive: filters.isActive ?? undefined,
  })

  // Mutations
  const updateMutation = useUpdateRegulatoryTemplate()
  const deleteMutation = useDeleteRegulatoryTemplate()

  // Group templates by document type
  const templatesByType = useMemo(() => {
    const templates = templatesData?.data || []
    return templates.reduce<Record<string, DocumentTemplate[]>>((acc, template) => {
      const type = template.documentType
      if (!acc[type]) acc[type] = []
      acc[type].push(template)
      return acc
    }, {})
  }, [templatesData?.data])

  // Handlers
  const handleToggleActive = async (template: DocumentTemplate) => {
    await updateMutation.mutateAsync({
      id: template.id,
      data: { isActive: !template.isActive },
    })
    refetch()
  }

  const handleDelete = async (template: DocumentTemplate) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le template "${template.name}" ?`)) return
    await deleteMutation.mutateAsync(template.id)
    refetch()
  }

  const handleSaveEdit = async (data: { name: string; version: string; content: DocumentTemplateContent }) => {
    if (!editDialog.template) return
    await updateMutation.mutateAsync({
      id: editDialog.template.id,
      data,
    })
    setEditDialog({ open: false, template: null })
    refetch()
  }

  const hasFilters = filters.documentType.length > 0 || 
    filters.associationType.length > 0 || 
    filters.isActive !== null

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/dashboard/settings')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-[#7373FF]/10 rounded-xl">
                <FileText className="h-6 w-6 text-[#7373FF]" />
              </div>
              Templates de documents
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gérez les modèles de documents réglementaires
            </p>
          </div>
        </div>
      </header>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter className="h-4 w-4" />
              Filtres:
            </div>
            
            <FilterDropdown
              label="Type de document"
              options={REGULATORY_DOCUMENT_TYPES}
              selected={filters.documentType}
              onChange={(documentType) => setFilters(prev => ({ ...prev, documentType }))}
              getLabel={(t) => REGULATORY_DOCUMENT_TYPE_LABELS[t]}
            />
            
            <FilterDropdown
              label="Association"
              options={ASSOCIATION_TYPES}
              selected={filters.associationType}
              onChange={(associationType) => setFilters(prev => ({ ...prev, associationType }))}
              getLabel={(a) => ASSOCIATION_TYPE_LABELS[a]?.split(' ')[0] || a}
            />
            
            <Button
              variant={filters.isActive === true ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters(prev => ({ 
                ...prev, 
                isActive: prev.isActive === true ? null : true 
              }))}
            >
              Actifs uniquement
            </Button>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ documentType: [], associationType: [], isActive: null })}
                className="text-gray-500"
              >
                <X className="h-4 w-4 mr-1" />
                Effacer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : Object.keys(templatesByType).length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun template trouvé"
          description={
            hasFilters
              ? "Aucun template ne correspond à vos critères de recherche."
              : "Aucun template de document n'a été créé."
          }
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(templatesByType).map(([type, templates]) => (
            <div key={type} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-gray-400" />
                {REGULATORY_DOCUMENT_TYPE_LABELS[type as RegulatoryDocumentType]}
                <Badge variant="secondary" size="xs">{templates.length}</Badge>
              </h2>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onEdit={() => setEditDialog({ open: true, template })}
                    onPreview={() => setPreviewDialog({ open: true, template })}
                    onToggleActive={() => handleToggleActive(template)}
                    onDelete={() => handleDelete(template)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <TemplateEditDialog
        open={editDialog.open}
        template={editDialog.template}
        onOpenChange={(open) => setEditDialog({ open, template: open ? editDialog.template : null })}
        onSave={handleSaveEdit}
        isSaving={updateMutation.isPending}
      />

      {/* Preview Dialog */}
      <TemplatePreviewDialog
        open={previewDialog.open}
        template={previewDialog.template}
        onOpenChange={(open) => setPreviewDialog({ open, template: open ? previewDialog.template : null })}
      />
    </div>
  )
}
