 
'use client'

import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { User, Mail, Shield, UserCog, Users, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UsersListProps {
  users: any[]
  currentUserId: string
}

export function UsersList({ users, currentUserId }: UsersListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return Shield
      case 'ADVISOR':
        return UserCog
      case 'ASSISTANT':
        return Users
      default:
        return User
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrateur'
      case 'ADVISOR':
        return 'Conseiller'
      case 'ASSISTANT':
        return 'Assistant'
      default:
        return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800'
      case 'ADVISOR':
        return 'bg-blue-100 text-blue-800'
      case 'ASSISTANT':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return
    }

    setDeletingId(userId)

    try {
      const response = await fetch(`/api/advisor/cabinet/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      router.refresh()
    } catch (error) {
      alert('Erreur lors de la suppression de l\'utilisateur')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="divide-y">
      {users.map((user) => {
        const RoleIcon = getRoleIcon(user.role)
        const isCurrentUser = user.id === currentUserId

        return (
          <div key={user.id} className="p-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {user.firstName[0]}{user.lastName[0]}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    {isCurrentUser && (
                      <Badge variant="outline" className="text-xs">
                        Vous
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge className={getRoleColor(user.role)}>
                  <RoleIcon className="h-3 w-3 mr-1" />
                  {getRoleLabel(user.role)}
                </Badge>

                <Badge variant={user.isActive ? 'default' : 'secondary'}>
                  {user.isActive ? 'Actif' : 'Inactif'}
                </Badge>

                {!isCurrentUser && user.role !== 'ADMIN' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                    disabled={deletingId === user.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {user.lastLogin && (
              <p className="text-xs text-muted-foreground mt-2 ml-14">
                Dernière connexion: {new Date(user.lastLogin).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        )
      })}

      {users.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          Aucun utilisateur pour le moment
        </div>
      )}
    </div>
  )
}
