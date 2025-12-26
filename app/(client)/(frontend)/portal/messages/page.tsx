 
'use client'

/**
 * Client Portal - Messages
 * 
 * Interface de messagerie avec le conseiller:
 * - Liste des messages (conversation)
 * - Formulaire d'envoi de message
 * - Informations du conseiller
 * 
 * UX Pédagogique:
 * - Langage simple et rassurant
 * - Aide contextuelle sur comment contacter son conseiller
 * - Indication claire des délais de réponse
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { useAuth } from '@/app/_common/hooks/use-auth'
import { useClientMessages, useSendClientMessage } from '@/app/_common/hooks/use-api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import Textarea from '@/app/_common/components/ui/Textarea'
import { Label } from '@/app/_common/components/ui/Label'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import {
  MessageSquare,
  Send,
  User,
  Clock,
  CheckCircle,
  HelpCircle,
  Phone,
  Mail,
  Info,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

// Structure vide par défaut
const EMPTY_ADVISOR = {
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
}

export default function MessagesPage() {
  const { user } = useAuth()
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [newMessage, setNewMessage] = useState({ subject: '', content: '', priority: 'NORMAL' })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: apiData, isLoading, refetch } = useClientMessages(user?.id || '')
  const sendMessageMutation = useSendClientMessage()

  const messages = useMemo(() => {
    if (apiData?.messages) return apiData.messages
    return []
  }, [apiData])

  const advisor = useMemo(() => {
    if (apiData?.advisor) return apiData.advisor
    return EMPTY_ADVISOR
  }, [apiData])

  const hasData = apiData !== null && apiData !== undefined

  const unreadCount = apiData?.unreadCount || 0

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    }
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleSendMessage = async () => {
    if (!newMessage.subject.trim() || !newMessage.content.trim()) return

    await sendMessageMutation.mutateAsync({
      clientId: user?.id || '',
      subject: newMessage.subject,
      content: newMessage.content,
      priority: newMessage.priority,
    })

    setNewMessage({ subject: '', content: '', priority: 'NORMAL' })
    setShowNewMessage(false)
    refetch()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-96" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  // État sans données
  if (!hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-500 mt-1">
            Échangez avec votre conseiller en toute simplicité
          </p>
        </div>
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Messagerie indisponible
            </h3>
            <p className="text-gray-500 mb-4 max-w-md">
              Nous n'avons pas pu charger vos messages. Veuillez réessayer.
            </p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-500 mt-1">
            Échangez avec votre conseiller en toute simplicité
          </p>
        </div>
        <Button onClick={() => setShowNewMessage(true)}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Nouveau message
        </Button>
      </div>

      {/* Info Box - Pédagogique */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">Comment ça fonctionne ?</p>
            <p className="text-blue-700 mt-1">
              Envoyez un message à votre conseiller et recevez une réponse sous <strong>24 à 48 heures ouvrées</strong>. 
              Pour les questions urgentes, privilégiez le téléphone.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-2 space-y-4">
          {/* New Message Form */}
          {showNewMessage && (
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Nouveau message
                </CardTitle>
                <CardDescription>
                  Posez votre question ou partagez une information avec votre conseiller
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="subject">Sujet</Label>
                  <Input
                    id="subject"
                    placeholder="Ex: Question sur mon épargne, Demande de rendez-vous..."
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <HelpCircle className="h-3 w-3" />
                    Un sujet clair aide votre conseiller à répondre plus rapidement
                  </p>
                </div>
                <div>
                  <Label htmlFor="content">Votre message</Label>
                  <Textarea
                    id="content"
                    placeholder="Décrivez votre demande ou posez votre question..."
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                    rows={5}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {newMessage.content.length}/2000 caractères
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowNewMessage(false)}>
                      Annuler
                    </Button>
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.subject.trim() || !newMessage.content.trim() || sendMessageMutation.isPending}
                    >
                      {sendMessageMutation.isPending ? (
                        <>Envoi en cours...</>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Envoyer
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Conversation
                </span>
                {unreadCount > 0 && (
                  <Badge variant="destructive">{unreadCount} non lu(s)</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-900 font-medium">Aucun message</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Commencez une conversation avec votre conseiller
                  </p>
                  <Button className="mt-4" onClick={() => setShowNewMessage(true)}>
                    Envoyer un premier message
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {messages.map((msg: any) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isFromClient ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          msg.isFromClient
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className={`text-xs font-medium mb-1 ${
                          msg.isFromClient ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {msg.subject}
                        </p>
                        <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                        <div className={`flex items-center gap-2 mt-2 text-xs ${
                          msg.isFromClient ? 'text-blue-200' : 'text-gray-400'
                        }`}>
                          <Clock className="h-3 w-3" />
                          {formatDate(msg.createdAt)}
                          {msg.isFromClient && msg.isRead && (
                            <CheckCircle className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Advisor Info */}
        <div className="space-y-4">
          {/* Advisor Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Votre conseiller</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-10 w-10 text-blue-600" />
                </div>
                <p className="font-semibold text-gray-900 text-lg">
                  {advisor.firstName} {advisor.lastName}
                </p>
                <p className="text-sm text-gray-500">Conseiller en gestion de patrimoine</p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{advisor.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Téléphone</p>
                    <p className="text-sm font-medium text-gray-900">{advisor.phone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Card - Pédagogique */}
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-amber-900">
                <HelpCircle className="h-5 w-5" />
                Questions fréquentes
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-800 space-y-2">
              <p className="font-medium">Quand serai-je recontacté ?</p>
              <p className="text-amber-700">Sous 24 à 48h ouvrées maximum.</p>
              
              <p className="font-medium mt-3">Pour les urgences ?</p>
              <p className="text-amber-700">Appelez directement votre conseiller.</p>
              
              <p className="font-medium mt-3">Quels sujets aborder ?</p>
              <p className="text-amber-700">Placements, impôts, retraite, projets...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
