 'use client'

 import { useState, useEffect, useMemo } from 'react'
 import { useRouter } from 'next/navigation'
 import { Card } from '@/app/_common/components/ui/Card'
 import { Button } from '@/app/_common/components/ui/Button'
 import { Input } from '@/app/_common/components/ui/Input'
 import { Mail, Paperclip, Plus, Search, Star, Trash2, Reply, ExternalLink } from 'lucide-react'
 import { cn } from '@/app/_common/lib/utils'
 import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/_common/components/ui/Tabs'
 import { apiCall } from '@/app/_common/lib/api-client'
 import { usePresentationMode } from '@/app/(advisor)/(frontend)/components/dashboard/PresentationModeContext'

function formatEmailTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays < 1) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }
  if (diffDays < 2) return 'Hier'
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function getInitials(source) {
  if (!source) return '??'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const COLOR_CLASSES = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-purple-100 text-purple-700',
  'bg-slate-100 text-slate-700',
]

function colorForSender(sender) {
  let hash = 0
  for (let i = 0; i < sender.length; i++) {
    hash = (hash * 31 + sender.charCodeAt(i)) >>> 0
  }
  return COLOR_CLASSES[hash % COLOR_CLASSES.length]
}

export default function EmailsWidget() {
  const router = useRouter()
  const [tab, setTab] = useState('inbox')
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const presentationMode = usePresentationMode()

  useEffect(() => {
    let cancelled = false

    async function loadEmails() {
      try {
        setError(null)
        const data = await apiCall('/api/advisor/emails?limit=30&order=desc')
        const list = (data && (data.emails || data.data?.emails)) || []
        if (!cancelled) {
          setEmails(Array.isArray(list) ? list : [])
        }
      } catch (e) {
        console.error('Erreur chargement emails:', e)
        if (!cancelled) {
          setError(e?.message || 'Impossible de charger les emails')
          setEmails([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadEmails()
    return () => {
      cancelled = true
    }
  }, [])

  const { primary, other } = useMemo(() => {
    const inbound = emails.filter((e) => e.direction === 'INBOUND')
    const outbound = emails.filter((e) => e.direction === 'OUTBOUND')
    return {
      primary: inbound.length ? inbound : emails,
      other: outbound,
    }
  }, [emails])

  const renderList = (list) => {
    if (loading) {
      return (
        <div className="space-y-2 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-md bg-slate-100 animate-pulse" />
          ))}
        </div>
      )
    }

    if (error) {
      return (
        <div className="p-6 text-center text-sm text-red-600">
          {error}
        </div>
      )
    }

    if (!list.length) {
      return (
        <div className="p-6 text-center text-sm text-slate-500">
          Aucun email à afficher.
        </div>
      )
    }

    return (
      <div className="divide-y divide-slate-100">
        {list.map((email) => {
          const rawSender =
            email.client?.firstName && email.client?.lastName
              ? `${email.client.firstName} ${email.client.lastName}`
              : email.from || (Array.isArray(email.to) ? email.to[0] : '') || 'Correspondant inconnu'
          const sender = presentationMode ? 'Contact' : rawSender

          const unread = email.isRead === false
          const hasAttachment = email.hasAttachments
          const time = formatEmailTime(email.receivedAt || email.sentAt)
          const avatar = getInitials(sender)
          const color = colorForSender(sender)
          const preview = email.snippet || email.body || ''
          const contentPreview = presentationMode ? 'Contenu masqué en mode présentation' : preview
          const subject = presentationMode ? 'Sujet masqué' : (email.subject || '(Sans objet)')

          return (
            <div
              key={email.id}
              className={cn(
                'group flex items-start gap-3 p-4 hover:bg-slate-50 transition-all duration-200 cursor-pointer relative',
                unread ? 'bg-blue-50/30' : ''
              )}
            >
              {unread && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500" />}

               <div className="flex-shrink-0 pt-1">
                 <div
                   className={cn(
                     'h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm transition-transform group-hover:scale-105',
                     color
                   )}
                 >
                   {avatar}
                 </div>
               </div>

               <div className="flex-1 min-w-0 space-y-0.5">
                 <div className="flex items-center justify-between">
                   <span
                     className={cn(
                       'text-sm truncate',
                       unread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                     )}
                   >
                     {sender}
                   </span>
                   <span
                     className={cn(
                       'text-[10px] whitespace-nowrap',
                       unread ? 'text-blue-600 font-medium' : 'text-slate-400'
                     )}
                   >
                     {time}
                   </span>
                 </div>

                 <div className="flex items-center gap-2">
                   <span
                     className={cn(
                       'text-xs truncate block',
                       unread ? 'text-slate-900 font-medium' : 'text-slate-600'
                     )}
                   >
                     {presentationMode ? 'Sujet masqué' : (email.subject || '(Sans objet)')}
                   </span>
                   {hasAttachment && <Paperclip className="h-3 w-3 text-slate-400 flex-shrink-0" />}
                 </div>

                 <p className="text-[11px] text-slate-400 truncate leading-relaxed">
                   {contentPreview}
                 </p>

                 <div className="absolute right-4 bottom-3 hidden group-hover:flex items-center gap-1 bg-white/90 p-1 rounded-md shadow-sm backdrop-blur-sm border border-slate-200">
                   <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-blue-500">
                     <Reply className="h-3.5 w-3.5" />
                   </Button>
                   <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-yellow-500">
                     <Star className="h-3.5 w-3.5" />
                   </Button>
                   <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-500">
                     <Trash2 className="h-3.5 w-3.5" />
                   </Button>
                 </div>
               </div>
             </div>
           )
         })}
       </div>
     )
   }

   return (
     <Card className="h-full shadow-sm border-slate-200 bg-white flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-slate-900">Messagerie</h3>
        </div>
        
        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="relative w-full max-w-[200px] hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder="Chercher..." 
              className="h-8 pl-8 bg-white border-slate-200 text-xs"
            />
          </div>
          <Button size="sm" className="h-8 gap-2 px-3">
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Nouveau</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="inbox" value={tab} onValueChange={setTab} className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="grid w-full grid-cols-2 h-9 bg-slate-100 p-1">
            <TabsTrigger value="inbox" className="text-xs">Principal</TabsTrigger>
            <TabsTrigger value="other" className="text-xs">Autres</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="inbox" className="flex-1 overflow-y-auto mt-0 p-0">
          {renderList(primary)}
        </TabsContent>
        <TabsContent value="other" className="flex-1 overflow-y-auto mt-0 p-0">
          {renderList(other)}
        </TabsContent>
      </Tabs>
      
      <div className="p-3 border-t border-slate-100 bg-slate-50/30">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
          onClick={() => router.push('/dashboard/emails')}
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
          Voir tous les emails
        </Button>
      </div>
    </Card>
  )
}
