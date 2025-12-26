'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { formatCurrency, cn } from '@/app/_common/lib/utils'
import { Users, UserPlus, Edit2, Trash2, Heart, Baby, User, Phone, Mail, Briefcase } from 'lucide-react'
import type { ClientDetail } from '@/app/_common/lib/api-types'

interface TabFamilyProps {
  clientId: string
  client: ClientDetail
}

interface FamilyMember {
  id: string
  relationshipType: string
  civility?: string
  firstName: string
  lastName: string
  birthDate?: Date | string
  profession?: string
  annualIncome?: number
  isDependent?: boolean
  email?: string
  phone?: string
}

const RELATIONSHIP_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  SPOUSE: { label: 'Conjoint(e)', icon: Heart, color: 'bg-pink-100 text-pink-800' },
  CHILD: { label: 'Enfant', icon: Baby, color: 'bg-blue-100 text-blue-800' },
  ASCENDANT: { label: 'Ascendant', icon: User, color: 'bg-purple-100 text-purple-800' },
  OTHER: { label: 'Autre', icon: Users, color: 'bg-gray-100 text-gray-800' },
}

function calculateAge(birthDate: Date | string | null | undefined): number | null {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function TabFamily({ clientId, client: _client }: TabFamilyProps) {
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<FamilyMember[]>([])

  useEffect(() => { loadMembers() }, [clientId])

  async function loadMembers() {
    try {
      setLoading(true)
      const res = await fetch(`/api/advisor/clients/${clientId}/family`)
      if (res.ok) {
        const data = await res.json()
        setMembers(data.data || [])
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function deleteMember(id: string) {
    if (!confirm('Supprimer ?')) return
    await fetch(`/api/advisor/family/${id}`, { method: 'DELETE' })
    loadMembers()
  }

  const grouped = {
    SPOUSE: members.filter(m => m.relationshipType === 'CONJOINT'),
    CHILD: members.filter(m => m.relationshipType === 'ENFANT'),
    ASCENDANT: members.filter(m => m.relationshipType === 'ASCENDANT'),
    OTHER: members.filter(m => m.relationshipType === 'AUTRE'),
  }

  const totalIncome = members.reduce((s, m) => s + (m.annualIncome || 0), 0)
  const dependents = members.filter(m => m.isDependent).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600" />
            Famille
          </h2>
          <p className="text-gray-600 mt-1">Gestion des membres de la famille</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Membres</div>
            <div className="text-2xl font-bold text-gray-900">{members.length}</div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">À charge</div>
            <div className="text-2xl font-bold text-blue-600">{dependents}</div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Enfants</div>
            <div className="text-2xl font-bold text-pink-600">{grouped.CHILD.length}</div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Revenus famille</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste par catégorie */}
      {Object.entries(grouped).map(([type, list]) => {
        if (list.length === 0) return null
        const config = RELATIONSHIP_CONFIG[type]
        const Icon = config.icon

        return (
          <Card key={type} className="border border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="w-5 h-5" />
                {config.label}s ({list.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {list.map(member => {
                  const age = calculateAge(member.birthDate)
                  return (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', config.color)}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {member.civility} {member.firstName} {member.lastName}
                            {age && <span className="text-sm text-gray-500 ml-2">({age} ans)</span>}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            {member.profession && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                {member.profession}
                              </span>
                            )}
                            {member.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {member.phone}
                              </span>
                            )}
                            {member.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {member.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {member.isDependent && (
                          <Badge className="bg-blue-100 text-blue-800">À charge</Badge>
                        )}
                        {member.annualIncome && member.annualIncome > 0 && (
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(member.annualIncome)}/an
                          </span>
                        )}
                        <Button variant="ghost" size="sm">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteMember(member.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Empty state */}
      {members.length === 0 && (
        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun membre de la famille enregistré</p>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Ajouter un membre
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
