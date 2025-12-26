 
'use client'

/**
 * TabProfilFamille - Profil & Famille du Client 360
 * Fusion des informations personnelles, familiales et juridiques
 */

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/app/_common/components/ui/Dialog'
import { formatDate } from '@/app/_common/lib/utils'
import { useToast } from '@/app/_common/hooks/use-toast'
import { User, Users, Heart, Building2, Briefcase, Edit, Save, X, Plus, Trash2, UserPlus, Globe } from 'lucide-react'
import type { ClientDetail } from '@/app/_common/lib/api-types'
import { EntrepriseProfile } from '@/app/_common/components/EntrepriseProfile'

interface TabProfilFamilleProps {
  clientId: string
  client: ClientDetail
}

interface FamilyMember {
  id: string
  role: 'CONJOINT' | 'CHILD_MAJOR' | 'CHILD_MINOR' | 'PARENT' | 'DEPENDENT' | 'AUTRE'
  firstName: string
  lastName: string
  birthDate: string | null
  profession: string | null
  isFiscalDependent: boolean
}

interface LegalStructure {
  id: string
  type: 'SCI' | 'HOLDING' | 'SARL' | 'SAS' | 'EURL' | 'AUTRE'
  name: string
  siret: string | null
  ownership: number
  role: string
}

const MARITAL_STATUS_OPTIONS = [
  { value: 'SINGLE', label: 'Célibataire' },
  { value: 'MARRIED', label: 'Marié(e)' },
  { value: 'PACS', label: 'Pacsé(e)' },
  { value: 'DIVORCED', label: 'Divorcé(e)' },
  { value: 'WIDOWED', label: 'Veuf/Veuve' },
  { value: 'SEPARATED', label: 'Séparé(e)' },
  { value: 'CONCUBINAGE', label: 'Concubinage' },
]

const MATRIMONIAL_REGIMES = [
  { value: 'COMMUNAUTE_REDUITE', label: 'Communauté réduite aux acquêts' },
  { value: 'COMMUNAUTE_UNIVERSELLE', label: 'Communauté universelle' },
  { value: 'COMMUNAUTE_MEUBLES_ACQUETS', label: 'Communauté de meubles et acquêts' },
  { value: 'SEPARATION', label: 'Séparation de biens' },
  { value: 'PARTICIPATION', label: 'Participation aux acquêts' },
  { value: 'PACS_SEPARATION', label: 'PACS - Séparation de biens' },
  { value: 'PACS_INDIVISION', label: 'PACS - Indivision' },
  { value: 'NONE', label: 'Non applicable' },
]

const PROFESSIONAL_STATUS_OPTIONS = [
  { value: 'SALARIE', label: 'Salarié(e) non cadre' },
  { value: 'CADRE', label: 'Cadre' },
  { value: 'CADRE_DIRIGEANT', label: 'Cadre dirigeant' },
  { value: 'TNS', label: 'Travailleur Non Salarié (TNS)' },
  { value: 'LIBERAL', label: 'Profession libérale' },
  { value: 'ARTISAN', label: 'Artisan' },
  { value: 'COMMERCANT', label: 'Commerçant' },
  { value: 'AGRICULTEUR', label: 'Agriculteur' },
  { value: 'DIRIGEANT_ASSIMILE_SALARIE', label: 'Dirigeant assimilé salarié' },
  { value: 'DIRIGEANT_TNS', label: 'Dirigeant TNS' },
  { value: 'FONCTIONNAIRE', label: 'Fonctionnaire' },
  { value: 'FONCTIONNAIRE_TERRITORIAL', label: 'Fonctionnaire territorial' },
  { value: 'FONCTIONNAIRE_HOSPITALIER', label: 'Fonctionnaire hospitalier' },
  { value: 'RETRAITE', label: 'Retraité(e)' },
  { value: 'SANS_ACTIVITE', label: 'Sans activité professionnelle' },
  { value: 'ETUDIANT', label: 'Étudiant(e)' },
  { value: 'DEMANDEUR_EMPLOI', label: 'Demandeur d’emploi' },
]

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'INTERIM', label: 'Intérim' },
  { value: 'STAGE', label: 'Stage' },
  { value: 'ALTERNANCE', label: 'Alternance' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'INDEPENDANT', label: 'Indépendant' },
  { value: 'GERANT', label: 'Gérant' },
  { value: 'PRESIDENT', label: 'Président' },
  { value: 'TITULAIRE', label: 'Titulaire (fonction publique)' },
  { value: 'CONTRACTUEL', label: 'Contractuel' },
]

const CSP_OPTIONS = [
  { value: 'CADRE_SUP', label: 'Cadre supérieur' },
  { value: 'CADRE', label: 'Cadre' },
  { value: 'PROFESSION_INTERMEDIAIRE', label: 'Profession intermédiaire' },
  { value: 'EMPLOYE', label: 'Employé' },
  { value: 'OUVRIER', label: 'Ouvrier' },
  { value: 'CHEF_ENTREPRISE', label: 'Chef d’entreprise' },
  { value: 'PROFESSION_LIBERALE', label: 'Profession libérale' },
  { value: 'ARTISAN_COMMERCANT', label: 'Artisan / Commerçant' },
  { value: 'AGRICULTEUR', label: 'Agriculteur exploitant' },
  { value: 'RETRAITE', label: 'Retraité' },
  { value: 'AUTRE', label: 'Autre' },
]

const RISK_PROFILE_OPTIONS = [
  { value: 'SECURITAIRE', label: 'Sécuritaire - Pas de prise de risque' },
  { value: 'PRUDENT', label: 'Prudent - Risque très limité' },
  { value: 'EQUILIBRE', label: 'Équilibré - Risque modéré' },
  { value: 'DYNAMIQUE', label: 'Dynamique - Accepte la volatilité' },
  { value: 'OFFENSIF', label: 'Offensif - Recherche de performance' },
]

const INVESTMENT_HORIZON_OPTIONS = [
  { value: 'COURT', label: 'Court terme (< 3 ans)' },
  { value: 'MOYEN', label: 'Moyen terme (3-8 ans)' },
  { value: 'LONG', label: 'Long terme (> 8 ans)' },
]

const FAMILY_ROLE_OPTIONS = [
  { value: 'CONJOINT', label: 'Conjoint(e)' },
  { value: 'CHILD_MAJOR', label: 'Enfant majeur' },
  { value: 'CHILD_MINOR', label: 'Enfant mineur' },
  { value: 'PARENT', label: 'Parent' },
  { value: 'DEPENDENT', label: 'Personne à charge' },
]

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function TabProfilFamille({ clientId, client }: TabProfilFamilleProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showAddStructureModal, setShowAddStructureModal] = useState(false)
  
  // Form data states
  const [identityData, setIdentityData] = useState({
    firstName: client.firstName || '',
    lastName: client.lastName || '',
    birthDate: client.birthDate ? new Date(client.birthDate).toISOString().split('T')[0] : '',
    nationality: client.nationality || 'Française',
    email: client.email || '',
    phone: client.phone || '',
    address: (client as Record<string, unknown>).address as string || '',
  })
  
  const [maritalData, setMaritalData] = useState({
    status: client.maritalStatus || 'SINGLE',
    regime: (client as Record<string, unknown>).marriageRegime as string || 'NONE',
    marriageDate: (client as Record<string, unknown>).marriageDate ? new Date((client as Record<string, unknown>).marriageDate as string).toISOString().split('T')[0] : '',
    numberOfChildren: client.numberOfChildren || 0,
    dependents: (client as Record<string, unknown>).dependents as number || 0,
  })
  
  const [professionData, setProfessionData] = useState({
    status: client.professionalStatus || '',
    profession: client.profession || '',
    employer: (client as Record<string, unknown>).employerName as string || '',
    annualIncome: client.annualIncome?.toString() || '',
    employmentType: (client as Record<string, unknown>).employmentType as string || '',
    professionCategory: (client as Record<string, unknown>).professionCategory as string || '',
    employmentSince: (client as Record<string, unknown>).employmentSince ? new Date((client as Record<string, unknown>).employmentSince as string).toISOString().split('T')[0] : '',
  })

  const [investorData, setInvestorData] = useState({
    riskProfile: (client as Record<string, unknown>).riskProfile as string || '',
    investmentHorizon: (client as Record<string, unknown>).investmentHorizon as string || '',
    investmentKnowledge: (client as Record<string, unknown>).investmentKnowledge as string || '',
    investmentExperience: (client as Record<string, unknown>).investmentExperience as string || '',
  })
  
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(
     
    (client.familyMembers || []).map((m: any) => ({
      id: m.id,
      role: m.relationship === 'CONJOINT' ? 'CONJOINT' : m.relationship === 'ENFANT' ? (calculateAge(m.birthDate) && calculateAge(m.birthDate)! < 18 ? 'CHILD_MINOR' : 'CHILD_MAJOR') : 'AUTRE',
      firstName: m.firstName || '',
      lastName: m.lastName || '',
      birthDate: m.birthDate ? new Date(m.birthDate).toISOString().split('T')[0] : null,
      profession: m.profession || null,
      isFiscalDependent: m.isDependent || false,
    }))
  )
  
  const [legalStructures, setLegalStructures] = useState<LegalStructure[]>(
     
    ((client as any).legalStructures || []).map((s: any) => ({
      id: s.id,
      type: s.type || 'SCI',
      name: s.name || '',
      siret: s.siret || null,
      ownership: Number(s.ownership) || 0,
      role: s.role || 'Associé',
    }))
  )
  
  // Edit member modal
  const [showEditMemberModal, setShowEditMemberModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)

  // Sauvegarder toutes les données du profil
  const handleSaveProfile = async (section: string) => {
    setSaving(true)
    try {
      // Construire les données à envoyer selon la section
      let dataToSend: Record<string, unknown> = {}
      
      if (section === 'identity') {
        dataToSend = {
          firstName: identityData.firstName,
          lastName: identityData.lastName,
          email: identityData.email,
          phone: identityData.phone,
          birthDate: identityData.birthDate || null,
          nationality: identityData.nationality,
          address: identityData.address,
        }
      } else if (section === 'marital') {
        dataToSend = {
          maritalStatus: maritalData.status,
          marriageRegime: maritalData.regime,
          marriageDate: maritalData.marriageDate || null,
          numberOfChildren: Number(maritalData.numberOfChildren) || 0,
          dependents: Number(maritalData.dependents) || 0,
        }
      } else if (section === 'profession') {
        dataToSend = {
          professionalStatus: professionData.status,
          profession: professionData.profession,
          employerName: professionData.employer,
          annualIncome: professionData.annualIncome ? Number(professionData.annualIncome) : null,
          employmentType: professionData.employmentType || null,
          professionCategory: professionData.professionCategory || null,
          employmentSince: professionData.employmentSince || null,
        }
      } else if (section === 'investor') {
        dataToSend = {
          riskProfile: investorData.riskProfile || null,
          investmentHorizon: investorData.investmentHorizon || null,
          investmentKnowledge: investorData.investmentKnowledge || null,
          investmentExperience: investorData.investmentExperience || null,
        }
      } else if (section === 'all') {
        // Sauvegarder tout d'un coup
        dataToSend = {
          firstName: identityData.firstName,
          lastName: identityData.lastName,
          email: identityData.email,
          phone: identityData.phone,
          birthDate: identityData.birthDate || null,
          nationality: identityData.nationality,
          address: identityData.address,
          maritalStatus: maritalData.status,
          marriageRegime: maritalData.regime,
          marriageDate: maritalData.marriageDate || null,
          professionalStatus: professionData.status,
          profession: professionData.profession,
          employerName: professionData.employer,
          annualIncome: professionData.annualIncome ? Number(professionData.annualIncome) : null,
        }
      }

      const res = await fetch(`/api/advisor/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Erreur lors de la sauvegarde')
      }

      // IMPORTANT: Invalider le cache pour mettre à jour la bannière et autres composants
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
      await queryClient.invalidateQueries({ queryKey: ['client', clientId] })
      
      toast({ title: 'Modifications enregistrées', description: 'Le profil a été mis à jour' })
      setEditingSection(null)
    } catch (error) {
      toast({ 
        title: 'Erreur', 
        description: error instanceof Error ? error.message : 'Impossible de sauvegarder',
        variant: 'destructive' 
      })
    } finally {
      setSaving(false)
    }
  }

  // Mapper le role frontend vers relationship backend
  const mapRoleToRelationship = (role: string): string => {
    if (role === 'CONJOINT') return 'CONJOINT'
    if (role === 'CHILD_MINOR' || role === 'CHILD_MAJOR') return 'ENFANT'
    if (role === 'PARENT') return 'PARENT'
    if (role === 'DEPENDENT') return 'AUTRE'
    return 'AUTRE'
  }

  const handleAddMember = async (member: Omit<FamilyMember, 'id'>) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/advisor/clients/${clientId}/family`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...member, 
          relationship: mapRoleToRelationship(member.role),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setFamilyMembers([...familyMembers, { ...member, id: data.data?.id || Date.now().toString() }])
        setShowAddMemberModal(false)
        toast({ title: 'Membre ajouté' })
      }
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Supprimer ce membre ?')) return
    try {
      await fetch(`/api/advisor/family/${memberId}`, { method: 'DELETE' })
      setFamilyMembers(familyMembers.filter(m => m.id !== memberId))
      toast({ title: 'Membre supprimé' })
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  const openEditMemberModal = (member: FamilyMember) => {
    setSelectedMember(member)
    setShowEditMemberModal(true)
  }

  const handleEditMember = async (member: FamilyMember) => {
    setSaving(true)
    try {
      await fetch(`/api/advisor/family/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member),
      })
      setFamilyMembers(familyMembers.map(m => m.id === member.id ? member : m))
      setShowEditMemberModal(false)
      setSelectedMember(null)
      toast({ title: 'Membre mis à jour' })
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Structure handlers
  const handleAddStructure = async (structure: Omit<LegalStructure, 'id'>) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/advisor/clients/${clientId}/structures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(structure),
      })
      if (res.ok) {
        const data = await res.json()
        setLegalStructures([...legalStructures, { ...structure, id: data.data?.id || Date.now().toString() }])
        setShowAddStructureModal(false)
        toast({ title: 'Structure ajoutée' })
      }
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStructure = async (structureId: string) => {
    if (!confirm('Supprimer cette structure ?')) return
    try {
      await fetch(`/api/advisor/structures/${structureId}`, { method: 'DELETE' })
      setLegalStructures(legalStructures.filter(s => s.id !== structureId))
      toast({ title: 'Structure supprimée' })
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  const age = calculateAge(identityData.birthDate)
  const children = familyMembers.filter(m => m.role.includes('ENFANT'))
  const dependents = familyMembers.filter(m => m.isFiscalDependent)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            Profil & Famille
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-14">Informations personnelles, familiales et situation juridique</p>
        </div>
      </div>

      {/* Identité */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <CardTitle>Informations personnelles</CardTitle>
              {age && <Badge variant="outline">{age} ans</Badge>}
            </div>
            {editingSection !== 'identity' ? (
              <Button size="sm" variant="outline" onClick={() => setEditingSection('identity')} className="border-gray-200 hover:border-[#7373FF] hover:text-[#7373FF]">
                <Edit className="h-4 w-4 mr-2" />Modifier
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingSection(null)} className="border-gray-200"><X className="h-4 w-4 mr-2" />Annuler</Button>
                <Button size="sm" onClick={() => handleSaveProfile('identity')} disabled={saving} className="bg-[#7373FF] hover:bg-[#5c5ce6]"><Save className="h-4 w-4 mr-2" />{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingSection === 'identity' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2"><Label>Prénom</Label><Input value={identityData.firstName} onChange={(e) => setIdentityData({ ...identityData, firstName: e.target.value })} /></div>
              <div className="space-y-2"><Label>Nom</Label><Input value={identityData.lastName} onChange={(e) => setIdentityData({ ...identityData, lastName: e.target.value })} /></div>
              <div className="space-y-2"><Label>Date de naissance</Label><Input type="date" value={identityData.birthDate} onChange={(e) => setIdentityData({ ...identityData, birthDate: e.target.value })} /></div>
              <div className="space-y-2"><Label>Nationalité</Label><Input value={identityData.nationality} onChange={(e) => setIdentityData({ ...identityData, nationality: e.target.value })} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={identityData.email} onChange={(e) => setIdentityData({ ...identityData, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>Téléphone</Label><Input value={identityData.phone} onChange={(e) => setIdentityData({ ...identityData, phone: e.target.value })} /></div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100"><p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nom</p><p className="text-sm font-semibold text-gray-900">{identityData.firstName} {identityData.lastName}</p></div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100"><p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Date de naissance</p><p className="text-sm font-semibold text-gray-900">{identityData.birthDate ? formatDate(identityData.birthDate) : '-'}</p></div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100"><p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nationalité</p><p className="text-sm font-semibold text-gray-900">{identityData.nationality || '-'}</p></div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100"><p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</p><p className="text-sm font-semibold text-gray-900">{identityData.email || '-'}</p></div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100"><p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Téléphone</p><p className="text-sm font-semibold text-gray-900">{identityData.phone || '-'}</p></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Données entreprise (Clients professionnels uniquement) */}
      {client.clientType === 'PROFESSIONNEL' && client.siret && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#7373FF]" />
              <CardTitle>Informations entreprise</CardTitle>
              <Badge variant="outline">SIRENE</Badge>
            </div>
            <CardDescription>
              Données officielles enrichies depuis l'API Recherche d'Entreprises
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EntrepriseProfile
              siren={client.siret?.substring(0, 9)}
              showScore={true}
              showAlertes={true}
              showFinances={true}
              showDirigeants={true}
              compact={false}
            />
          </CardContent>
        </Card>
      )}

      {/* Situation maritale */}
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-600" />
              <CardTitle>Situation maritale</CardTitle>
            </div>
            {editingSection !== 'marital' ? (
              <Button size="sm" variant="outline" onClick={() => setEditingSection('marital')} className="border-gray-200 hover:border-[#7373FF] hover:text-[#7373FF]">
                <Edit className="h-4 w-4 mr-2" />Modifier
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingSection(null)} className="border-gray-200"><X className="h-4 w-4 mr-2" />Annuler</Button>
                <Button size="sm" onClick={() => handleSaveProfile('marital')} disabled={saving} className="bg-[#7373FF] hover:bg-[#5c5ce6]"><Save className="h-4 w-4 mr-2" />{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingSection === 'marital' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Statut marital</Label>
                <Select value={maritalData.status} onValueChange={(v) => setMaritalData({ ...maritalData, status: v })}>
                  <SelectTrigger className="h-11 bg-white border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>{MARITAL_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Régime matrimonial</Label>
                <Select value={maritalData.regime} onValueChange={(v) => setMaritalData({ ...maritalData, regime: v })}>
                  <SelectTrigger className="h-11 bg-white border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>{MATRIMONIAL_REGIMES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Date mariage/PACS</Label>
                <Input type="date" value={maritalData.marriageDate} onChange={(e) => setMaritalData({ ...maritalData, marriageDate: e.target.value })} className="h-11 bg-white border-gray-200" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Nombre d'enfants</Label>
                <Input type="number" min="0" value={maritalData.numberOfChildren} onChange={(e) => setMaritalData({ ...maritalData, numberOfChildren: Number(e.target.value) })} className="h-11 bg-white border-gray-200" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Personnes à charge</Label>
                <Input type="number" min="0" value={maritalData.dependents} onChange={(e) => setMaritalData({ ...maritalData, dependents: Number(e.target.value) })} className="h-11 bg-white border-gray-200" />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Statut</p>
                <p className="text-sm font-semibold text-gray-900">{MARITAL_STATUS_OPTIONS.find(s => s.value === maritalData.status)?.label || maritalData.status}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Régime matrimonial</p>
                <p className="text-sm font-semibold text-gray-900">{MATRIMONIAL_REGIMES.find(r => r.value === maritalData.regime)?.label || 'Non renseigné'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Date mariage/PACS</p>
                <p className="text-sm font-semibold text-gray-900">{maritalData.marriageDate ? formatDate(maritalData.marriageDate) : 'Non renseigné'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Enfants</p>
                <p className="text-sm font-semibold text-gray-900">{maritalData.numberOfChildren || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Personnes à charge</p>
                <p className="text-sm font-semibold text-gray-900">{maritalData.dependents || 0}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Situation professionnelle */}
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-amber-600" />
              <CardTitle>Situation professionnelle</CardTitle>
            </div>
            {editingSection !== 'profession' ? (
              <Button size="sm" variant="outline" onClick={() => setEditingSection('profession')} className="border-gray-200 hover:border-[#7373FF] hover:text-[#7373FF]">
                <Edit className="h-4 w-4 mr-2" />Modifier
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingSection(null)} className="border-gray-200"><X className="h-4 w-4 mr-2" />Annuler</Button>
                <Button size="sm" onClick={() => handleSaveProfile('profession')} disabled={saving} className="bg-[#7373FF] hover:bg-[#5c5ce6]"><Save className="h-4 w-4 mr-2" />{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingSection === 'profession' ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Statut professionnel</Label>
                  <Select value={professionData.status} onValueChange={(v) => setProfessionData({ ...professionData, status: v })}>
                    <SelectTrigger className="h-11 bg-white border-gray-200"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                    <SelectContent>{PROFESSIONAL_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">CSP</Label>
                  <Select value={professionData.professionCategory} onValueChange={(v) => setProfessionData({ ...professionData, professionCategory: v })}>
                    <SelectTrigger className="h-11 bg-white border-gray-200"><SelectValue placeholder="Catégorie..." /></SelectTrigger>
                    <SelectContent>{CSP_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Type de contrat</Label>
                  <Select value={professionData.employmentType} onValueChange={(v) => setProfessionData({ ...professionData, employmentType: v })}>
                    <SelectTrigger className="h-11 bg-white border-gray-200"><SelectValue placeholder="Type..." /></SelectTrigger>
                    <SelectContent>{EMPLOYMENT_TYPE_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">En poste depuis</Label>
                  <Input type="date" value={professionData.employmentSince} onChange={(e) => setProfessionData({ ...professionData, employmentSince: e.target.value })} className="h-11 bg-white border-gray-200" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Profession / Poste</Label>
                  <Input value={professionData.profession} onChange={(e) => setProfessionData({ ...professionData, profession: e.target.value })} placeholder="Ex: Directeur commercial" className="h-11 bg-white border-gray-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Employeur / Entreprise</Label>
                  <Input value={professionData.employer} onChange={(e) => setProfessionData({ ...professionData, employer: e.target.value })} placeholder="Nom de l'entreprise" className="h-11 bg-white border-gray-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Revenu annuel brut</Label>
                  <div className="relative">
                    <Input type="number" value={professionData.annualIncome} onChange={(e) => setProfessionData({ ...professionData, annualIncome: e.target.value })} placeholder="0" className="h-11 pr-10 bg-white border-gray-200" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Statut</p>
                <p className="text-sm font-semibold text-gray-900">{PROFESSIONAL_STATUS_OPTIONS.find(s => s.value === professionData.status)?.label || professionData.status || 'Non renseigné'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">CSP</p>
                <p className="text-sm font-semibold text-gray-900">{CSP_OPTIONS.find(s => s.value === professionData.professionCategory)?.label || 'Non renseigné'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Contrat</p>
                <p className="text-sm font-semibold text-gray-900">{EMPLOYMENT_TYPE_OPTIONS.find(s => s.value === professionData.employmentType)?.label || 'Non renseigné'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Profession</p>
                <p className="text-sm font-semibold text-gray-900">{professionData.profession || 'Non renseigné'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Employeur</p>
                <p className="text-sm font-semibold text-gray-900">{professionData.employer || 'Non renseigné'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Ancienneté</p>
                <p className="text-sm font-semibold text-gray-900">{professionData.employmentSince ? formatDate(professionData.employmentSince) : 'Non renseigné'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Revenu annuel</p>
                <p className="text-sm font-semibold text-[#7373FF]">{professionData.annualIncome ? `${Number(professionData.annualIncome).toLocaleString('fr-FR')} €` : 'Non renseigné'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profil investisseur */}
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-[#7373FF]" />
              <CardTitle>Profil investisseur</CardTitle>
              <Badge variant="outline">MiFID II</Badge>
            </div>
            {editingSection !== 'investor' ? (
              <Button size="sm" variant="outline" onClick={() => setEditingSection('investor')} className="border-gray-200 hover:border-[#7373FF] hover:text-[#7373FF]">
                <Edit className="h-4 w-4 mr-2" />Modifier
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingSection(null)} className="border-gray-200"><X className="h-4 w-4 mr-2" />Annuler</Button>
                <Button size="sm" onClick={() => handleSaveProfile('investor')} disabled={saving} className="bg-[#7373FF] hover:bg-[#5c5ce6]"><Save className="h-4 w-4 mr-2" />{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingSection === 'investor' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Profil de risque</Label>
                <Select value={investorData.riskProfile} onValueChange={(v) => setInvestorData({ ...investorData, riskProfile: v })}>
                  <SelectTrigger className="h-11 bg-white border-gray-200"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>{RISK_PROFILE_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Horizon d'investissement</Label>
                <Select value={investorData.investmentHorizon} onValueChange={(v) => setInvestorData({ ...investorData, investmentHorizon: v })}>
                  <SelectTrigger className="h-11 bg-white border-gray-200"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>{INVESTMENT_HORIZON_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Connaissance financière</Label>
                <Select value={investorData.investmentKnowledge} onValueChange={(v) => setInvestorData({ ...investorData, investmentKnowledge: v })}>
                  <SelectTrigger className="h-11 bg-white border-gray-200"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEBUTANT">Débutant</SelectItem>
                    <SelectItem value="INTERMEDIAIRE">Intermédiaire</SelectItem>
                    <SelectItem value="AVANCE">Avancé</SelectItem>
                    <SelectItem value="EXPERT">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Expérience investissement</Label>
                <Select value={investorData.investmentExperience} onValueChange={(v) => setInvestorData({ ...investorData, investmentExperience: v })}>
                  <SelectTrigger className="h-11 bg-white border-gray-200"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUCUNE">Aucune</SelectItem>
                    <SelectItem value="MOINS_5_ANS">Moins de 5 ans</SelectItem>
                    <SelectItem value="5_10_ANS">5 à 10 ans</SelectItem>
                    <SelectItem value="PLUS_10_ANS">Plus de 10 ans</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Profil de risque</p>
                <p className="text-sm font-semibold text-gray-900">{RISK_PROFILE_OPTIONS.find(s => s.value === investorData.riskProfile)?.label || 'Non renseigné'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Horizon</p>
                <p className="text-sm font-semibold text-gray-900">{INVESTMENT_HORIZON_OPTIONS.find(s => s.value === investorData.investmentHorizon)?.label || 'Non renseigné'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Connaissance</p>
                <p className="text-sm font-semibold text-gray-900">{investorData.investmentKnowledge || 'Non renseigné'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Expérience</p>
                <p className="text-sm font-semibold text-gray-900">{investorData.investmentExperience || 'Non renseigné'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Structure familiale */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <CardTitle>Structure familiale</CardTitle>
              </div>
              <CardDescription>{familyMembers.length} membre(s) • {children.length} enfant(s) • {dependents.length} à charge</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowAddMemberModal(true)}><UserPlus className="h-4 w-4 mr-2" />Ajouter</Button>
          </div>
        </CardHeader>
        <CardContent>
          {familyMembers.length > 0 ? (
            <div className="space-y-3">
              {familyMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {member.role === 'CONJOINT' ? <Heart className="h-5 w-5 text-primary" /> : <User className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                      <p className="font-medium">{member.firstName} {member.lastName}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">{FAMILY_ROLE_OPTIONS.find(r => r.value === member.role)?.label}</Badge>
                        {member.birthDate && <span>• {calculateAge(member.birthDate)} ans</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.isFiscalDependent && <Badge className="bg-blue-100 text-blue-700">À charge</Badge>}
                    <Button size="sm" variant="ghost" onClick={() => openEditMemberModal(member)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteMember(member.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground mb-4">Aucun membre de la famille</p>
              <Button size="sm" variant="outline" onClick={() => setShowAddMemberModal(true)}><UserPlus className="h-4 w-4 mr-2" />Ajouter</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sociétés */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              <CardTitle>Sociétés et structures juridiques</CardTitle>
            </div>
            <Button size="sm" onClick={() => setShowAddStructureModal(true)}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
          </div>
        </CardHeader>
        <CardContent>
          {legalStructures.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {legalStructures.map((s) => (
                <div key={s.id} className="p-4 rounded-lg border hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="outline">{s.type}</Badge>
                      <span className="ml-2 font-semibold">{s.name}</span>
                      {s.siret && <p className="text-xs text-muted-foreground mt-1">SIRET: {s.siret}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-2">
                        <p className="text-lg font-bold text-primary">{s.ownership}%</p>
                        <p className="text-xs text-muted-foreground">{s.role}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteStructure(s.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">Aucune structure juridique</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Modal */}
      <Dialog open={showAddMemberModal} onOpenChange={setShowAddMemberModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un membre</DialogTitle></DialogHeader>
          <AddMemberForm onAdd={handleAddMember} saving={saving} onClose={() => setShowAddMemberModal(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Member Modal */}
      <Dialog open={showEditMemberModal} onOpenChange={(o) => { setShowEditMemberModal(o); if (!o) setSelectedMember(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier le membre</DialogTitle></DialogHeader>
          {selectedMember && (
            <EditMemberForm 
              member={selectedMember} 
              onSave={handleEditMember} 
              saving={saving} 
              onClose={() => { setShowEditMemberModal(false); setSelectedMember(null) }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Structure Modal */}
      <Dialog open={showAddStructureModal} onOpenChange={setShowAddStructureModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter une structure juridique</DialogTitle></DialogHeader>
          <AddStructureForm onAdd={handleAddStructure} saving={saving} onClose={() => setShowAddStructureModal(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AddMemberForm({ onAdd, saving, onClose }: { onAdd: (m: Omit<FamilyMember, 'id'>) => void; saving: boolean; onClose: () => void }) {
  const [data, setData] = useState({ role: 'CHILD_MINOR' as FamilyMember['role'], firstName: '', lastName: '', birthDate: '', profession: '', isFiscalDependent: false })
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2"><Label>Rôle</Label><Select value={data.role} onValueChange={(v: any) => setData({ ...data, role: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FAMILY_ROLE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Prénom</Label><Input value={data.firstName} onChange={(e) => setData({ ...data, firstName: e.target.value })} /></div>
        <div className="space-y-2"><Label>Nom</Label><Input value={data.lastName} onChange={(e) => setData({ ...data, lastName: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Date de naissance</Label><Input type="date" value={data.birthDate} onChange={(e) => setData({ ...data, birthDate: e.target.value })} /></div>
        <div className="space-y-2"><Label>Profession</Label><Input value={data.profession} onChange={(e) => setData({ ...data, profession: e.target.value })} /></div>
      </div>
      <label className="flex items-center gap-2"><input type="checkbox" checked={data.isFiscalDependent} onChange={(e) => setData({ ...data, isFiscalDependent: e.target.checked })} className="rounded" /><span className="text-sm">À charge fiscalement</span></label>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button onClick={() => onAdd({ ...data, birthDate: data.birthDate || null, profession: data.profession || null })} disabled={saving || !data.firstName}>{saving ? 'Ajout...' : 'Ajouter'}</Button>
      </DialogFooter>
    </div>
  )
}

function EditMemberForm({ member, onSave, saving, onClose }: { 
  member: FamilyMember
  onSave: (m: FamilyMember) => void
  saving: boolean
  onClose: () => void 
}) {
  const [data, setData] = useState({
    ...member,
    birthDate: member.birthDate || '',
    profession: member.profession || '',
  })
  
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Rôle</Label>
        <Select value={data.role} onValueChange={(v: any) => setData({ ...data, role: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{FAMILY_ROLE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Prénom *</Label>
          <Input value={data.firstName} onChange={(e) => setData({ ...data, firstName: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Nom *</Label>
          <Input value={data.lastName} onChange={(e) => setData({ ...data, lastName: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date de naissance</Label>
          <Input type="date" value={data.birthDate} onChange={(e) => setData({ ...data, birthDate: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Profession</Label>
          <Input value={data.profession} onChange={(e) => setData({ ...data, profession: e.target.value })} />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={data.isFiscalDependent} onChange={(e) => setData({ ...data, isFiscalDependent: e.target.checked })} className="rounded" />
        <span className="text-sm">À charge fiscalement</span>
      </label>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button 
          onClick={() => onSave({ ...data, birthDate: data.birthDate || null, profession: data.profession || null })} 
          disabled={saving || !data.firstName}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </div>
  )
}

const STRUCTURE_TYPES = [
  { value: 'SCI', label: 'SCI' },
  { value: 'HOLDING', label: 'Holding' },
  { value: 'SARL', label: 'SARL' },
  { value: 'SAS', label: 'SAS' },
  { value: 'EURL', label: 'EURL' },
  { value: 'AUTRE', label: 'Autre' },
]

function AddStructureForm({ onAdd, saving, onClose }: { 
  onAdd: (s: Omit<LegalStructure, 'id'>) => void
  saving: boolean
  onClose: () => void 
}) {
  const [data, setData] = useState({
    type: 'SCI' as LegalStructure['type'],
    name: '',
    siret: '',
    ownership: '',
    role: 'Associé',
  })
  
  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type *</Label>
          <Select value={data.type} onValueChange={(v: any) => setData({ ...data, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STRUCTURE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Nom *</Label>
          <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="Ex: SCI Patrimoine" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>SIRET</Label>
          <Input value={data.siret} onChange={(e) => setData({ ...data, siret: e.target.value })} placeholder="123 456 789 00012" />
        </div>
        <div className="space-y-2">
          <Label>Part détenue (%)</Label>
          <Input type="number" min="0" max="100" value={data.ownership} onChange={(e) => setData({ ...data, ownership: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Rôle</Label>
        <Input value={data.role} onChange={(e) => setData({ ...data, role: e.target.value })} placeholder="Ex: Gérant, Associé..." />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button 
          onClick={() => onAdd({ 
            ...data, 
            siret: data.siret || null, 
            ownership: Number(data.ownership) || 0 
          })} 
          disabled={saving || !data.name}
        >
          {saving ? 'Ajout...' : 'Ajouter'}
        </Button>
      </DialogFooter>
    </div>
  )
}

export default TabProfilFamille
