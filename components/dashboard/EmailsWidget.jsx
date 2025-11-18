'use client';

import { useState, useEffect } from 'react';
import { 
  Mail,
  MailOpen,
  Star,
  Paperclip,
  ExternalLink,
  X,
  Clock,
  User,
  ChevronRight,
  Inbox,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCall } from '@/lib/api-client';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const DIRECTION_CONFIG = {
  INBOUND: {
    icon: Inbox,
    label: 'Reçu',
    color: 'text-blue-600 dark:text-blue-400'
  },
  OUTBOUND: {
    icon: Send,
    label: 'Envoyé',
    color: 'text-green-600 dark:text-green-400'
  }
};

export default function EmailsWidget({ 
  maxEmails = 5,
  className,
  settings = {}
}) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState(null);

  const {
    showUnreadOnly = false,
    refreshInterval = 120000 // 2 minutes
  } = settings;

  useEffect(() => {
    fetchEmails();

    // Setup auto-refresh
    if (refreshInterval > 0) {
      const interval = setInterval(fetchEmails, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [maxEmails, showUnreadOnly, refreshInterval]);

  const fetchEmails = async () => {
    try {
      setError(null);
      const params = new URLSearchParams({
        limit: maxEmails.toString(),
        sort: 'receivedAt',
        order: 'desc'
      });

      if (showUnreadOnly) {
        params.append('unreadOnly', 'true');
      }

      const response = await apiCall(`/api/advisor/emails?${params.toString()}`);
      
      if (response.success) {
        setEmails(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (emailId, isRead = true) => {
    setUpdatingEmail(emailId);
    
    // Optimistic update
    setEmails(current =>
      current.map(email =>
        email._id === emailId ? { ...email, isRead, readAt: isRead ? new Date().toISOString() : null } : email
      )
    );

    try {
      await apiCall(`/api/advisor/emails/${emailId}`, {
        method: 'PATCH',
        body: { isRead }
      });
    } catch (err) {
      console.error('Error updating email:', err);
      // Revert on error
      await fetchEmails();
    } finally {
      setUpdatingEmail(null);
    }
  };

  const toggleStar = async (emailId, isStarred) => {
    setUpdatingEmail(emailId);
    
    // Optimistic update
    setEmails(current =>
      current.map(email =>
        email._id === emailId ? { ...email, isStarred: !isStarred } : email
      )
    );

    try {
      await apiCall(`/api/advisor/emails/${emailId}`, {
        method: 'PATCH',
        body: { isStarred: !isStarred }
      });
    } catch (err) {
      console.error('Error updating email:', err);
      // Revert on error
      await fetchEmails();
    } finally {
      setUpdatingEmail(null);
    }
  };

  const openPreview = async (email) => {
    setSelectedEmail(email);
    setShowPreview(true);
    
    // Mark as read when opening
    if (!email.isRead) {
      await markAsRead(email._id, true);
    }
  };

  const closePreview = () => {
    setShowPreview(false);
    setSelectedEmail(null);
  };

  const unreadCount = emails.filter(e => !e.isRead).length;

  if (loading) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6', className)}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Emails</h3>
          </div>
        </div>
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  return (
    <>
      <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden', className)} role="region" aria-label="Widget des emails" aria-live="polite">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-600 rounded-lg" aria-hidden="true">
                <Mail className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white" id="emails-widget-title">Emails</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-gray-600 dark:text-gray-400" aria-live="polite">
                    {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Badge className="bg-orange-600 text-white" aria-label={`${unreadCount} emails non lus`}>
                  {unreadCount}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('/dashboard/emails', '_blank')}
                aria-label="Ouvrir la boîte email complète"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700" role="list" aria-labelledby="emails-widget-title">
          {error ? (
            <div className="p-6 text-center" role="alert" aria-live="assertive">
              <p className="text-red-600 text-sm mb-2">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchEmails} aria-label="Réessayer le chargement des emails">
                Réessayer
              </Button>
            </div>
          ) : emails.length === 0 ? (
            <div className="p-8 text-center" role="status">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-3" aria-hidden="true" />
              <p className="text-gray-500 text-sm">
                {showUnreadOnly ? 'Aucun email non lu' : 'Aucun email'}
              </p>
            </div>
          ) : (
            emails.map((email) => (
              <EmailItem
                key={email._id}
                email={email}
                onOpenPreview={openPreview}
                onMarkAsRead={markAsRead}
                onToggleStar={toggleStar}
                isUpdating={updatingEmail === email._id}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {emails.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('/dashboard/emails', '_blank')}
              className="w-full justify-center"
            >
              Voir tous les emails
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* Email Preview Modal */}
      {showPreview && selectedEmail && (
        <EmailPreviewModal
          email={selectedEmail}
          onClose={closePreview}
          onMarkAsRead={markAsRead}
          onToggleStar={toggleStar}
        />
      )}
    </>
  );
}

/**
 * Email Item Component
 */
function EmailItem({ email, onOpenPreview, onMarkAsRead, onToggleStar, isUpdating }) {
  const DirectionIcon = DIRECTION_CONFIG[email.direction]?.icon || Mail;
  const directionColor = DIRECTION_CONFIG[email.direction]?.color || 'text-gray-600';
  const directionLabel = DIRECTION_CONFIG[email.direction]?.label || 'Email';

  const handleClick = (e) => {
    // Don't open preview if clicking on action buttons
    if (e.target.closest('button')) {
      return;
    }
    onOpenPreview(email);
  };

  const emailAriaLabel = `${directionLabel} ${email.isRead ? 'lu' : 'non lu'} de ${email.direction === 'INBOUND' ? email.from : email.to?.[0] || 'destinataire inconnu'}, objet: ${email.subject || 'sans objet'}${email.hasAttachments ? ', avec pièces jointes' : ''}`;

  return (
    <div
      onClick={handleClick}
      className={cn(
        'p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer',
        !email.isRead && 'bg-blue-50/50 dark:bg-blue-900/10'
      )}
      role="listitem"
      aria-label={emailAriaLabel}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenPreview(email);
        }
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn('mt-0.5', directionColor)}>
          <DirectionIcon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className={cn(
                  'text-sm truncate',
                  email.isRead 
                    ? 'text-gray-700 dark:text-gray-300 font-normal' 
                    : 'text-gray-900 dark:text-white font-semibold'
                )}>
                  {email.direction === 'INBOUND' ? email.from : email.to?.[0] || 'Destinataire inconnu'}
                </p>
                {email.hasAttachments && (
                  <Paperclip className="h-3 w-3 text-gray-400 flex-shrink-0" />
                )}
              </div>
              
              <p className={cn(
                'text-sm truncate mb-1',
                email.isRead 
                  ? 'text-gray-600 dark:text-gray-400' 
                  : 'text-gray-900 dark:text-white font-medium'
              )}>
                {email.subject || '(Sans objet)'}
              </p>
              
              {email.snippet && (
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {email.snippet}
                </p>
              )}
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatEmailTime(email.receivedAt || email.sentAt)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2">
            {email.client && (
              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <User className="h-3 w-3" />
                <span>{email.client.prenom} {email.client.nom}</span>
              </div>
            )}

            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar(email._id, email.isStarred);
                }}
                disabled={isUpdating}
                className={cn(
                  'p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors',
                  email.isStarred && 'text-yellow-500'
                )}
                aria-label={email.isStarred ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                aria-pressed={email.isStarred}
              >
                <Star className={cn('h-3.5 w-3.5', email.isStarred && 'fill-current')} aria-hidden="true" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(email._id, !email.isRead);
                }}
                disabled={isUpdating}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label={email.isRead ? 'Marquer comme non lu' : 'Marquer comme lu'}
                aria-pressed={email.isRead}
              >
                {email.isRead ? (
                  <MailOpen className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                ) : (
                  <Mail className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Email Preview Modal Component
 */
function EmailPreviewModal({ email, onClose, onMarkAsRead, onToggleStar }) {
  const DirectionIcon = DIRECTION_CONFIG[email.direction]?.icon || Mail;
  const directionLabel = DIRECTION_CONFIG[email.direction]?.label || 'Email';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-10 bottom-10 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-3xl z-50 animate-in slide-in-from-bottom duration-300">
        <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-600 rounded-lg">
                <DirectionIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {directionLabel}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {format(new Date(email.receivedAt || email.sentAt), 'PPPp', { locale: fr })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleStar(email._id, email.isStarred)}
                className={cn(
                  'p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700 transition-colors',
                  email.isStarred && 'text-yellow-500'
                )}
              >
                <Star className={cn('h-5 w-5', email.isStarred && 'fill-current')} />
              </button>

              <button
                onClick={() => onMarkAsRead(email._id, !email.isRead)}
                className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700 transition-colors"
              >
                {email.isRead ? (
                  <Mail className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <MailOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                )}
              </button>

              <button
                onClick={onClose}
                className="p-2 hover:bg-white/50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Email Details */}
            <div className="space-y-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  De
                </label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {email.from}
                </p>
              </div>

              {email.to && email.to.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    À
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {email.to.join(', ')}
                  </p>
                </div>
              )}

              {email.cc && email.cc.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Cc
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {email.cc.join(', ')}
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Objet
                </label>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                  {email.subject || '(Sans objet)'}
                </p>
              </div>

              {email.client && (
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Client
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-900 dark:text-white">
                      {email.client.prenom} {email.client.nom}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Email Body */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {email.bodyHtml ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                  className="text-gray-700 dark:text-gray-300"
                />
              ) : (
                <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {email.body || email.snippet || 'Aucun contenu'}
                </div>
              )}
            </div>

            {/* Attachments */}
            {email.hasAttachments && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Paperclip className="h-4 w-4 text-gray-400" />
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Pièces jointes
                  </label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cet email contient des pièces jointes
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={onClose}
              >
                Fermer
              </Button>

              <Button
                onClick={() => window.open(`/dashboard/emails/${email._id}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir dans l'application
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Format email time
 */
function formatEmailTime(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  } else if (diffInHours < 168) { // Less than a week
    return format(date, 'EEE HH:mm', { locale: fr });
  } else {
    return format(date, 'dd/MM/yy', { locale: fr });
  }
}
