"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, Search, RefreshCw, Filter, MoreHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/app/_common/components/ui/Button";
import { Input } from "@/app/_common/components/ui/Input";
import { useToast } from "@/app/_common/hooks/use-toast";
import { cn } from "@/lib/utils";

import { EmailList } from "./_components/EmailList";
import { EmailDetail } from "./_components/EmailDetail";
import { EmailCompose } from "./_components/EmailCompose";
import { EmailSidebar } from "./_components/EmailSidebar";
import { MailSyncModal } from "./_components/MailSyncModal";

interface Email {
  id: string;
  from: string;
  fromEmail: string;
  to: string[];
  cc?: string[];
  subject: string;
  snippet: string;
  body: string;
  bodyHtml?: string;
  receivedAt: string;
  sentAt?: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  attachments?: { id: string; name: string; size: number; mimeType: string }[];
  labels: string[];
  direction: "INBOUND" | "OUTBOUND";
  client?: { id: string; firstName: string; lastName: string };
}

export default function EmailsPage() {
  const { toast } = useToast();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("inbox");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [composeMinimized, setComposeMinimized] = useState(false);
  const [replyTo, setReplyTo] = useState<{ from: string; subject: string; body: string } | undefined>();
  const [syncModalOpen, setSyncModalOpen] = useState(false);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ folder: selectedFolder, limit: "50" });
      if (searchQuery) params.append("q", searchQuery);
      
      const res = await fetch(`/api/advisor/emails?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur chargement emails");
      
      const data = await res.json();
      const list = data.emails || data.data?.emails || [];
      setEmails(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Erreur chargement emails:", error);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }, [selectedFolder, searchQuery]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/advisor/emails/sync", { method: "POST" });
      if (!res.ok) throw new Error("Erreur synchronisation");
      toast({ title: "Synchronisation terminée", description: "Vos emails ont été mis à jour." });
      fetchEmails();
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de synchroniser les emails.", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleStar = async (id: string) => {
    const email = emails.find((e) => e.id === id);
    if (!email) return;
    
    setEmails((prev) => prev.map((e) => e.id === id ? { ...e, isStarred: !e.isStarred } : e));
    
    try {
      await fetch(`/api/advisor/emails/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isStarred: !email.isStarred }),
      });
    } catch (error) {
      setEmails((prev) => prev.map((e) => e.id === id ? { ...e, isStarred: email.isStarred } : e));
    }
  };

  const handleToggleRead = async (id: string) => {
    const email = emails.find((e) => e.id === id);
    if (!email) return;
    
    setEmails((prev) => prev.map((e) => e.id === id ? { ...e, isRead: !e.isRead } : e));
    
    try {
      await fetch(`/api/advisor/emails/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: !email.isRead }),
      });
    } catch (error) {
      setEmails((prev) => prev.map((e) => e.id === id ? { ...e, isRead: email.isRead } : e));
    }
  };

  const handleArchive = async (id: string) => {
    setEmails((prev) => prev.filter((e) => e.id !== id));
    if (selectedEmail?.id === id) setSelectedEmail(null);
    
    try {
      await fetch(`/api/advisor/emails/${id}/archive`, { method: "POST" });
      toast({ title: "Email archivé" });
    } catch (error) {
      fetchEmails();
      toast({ title: "Erreur", description: "Impossible d'archiver l'email.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    setEmails((prev) => prev.filter((e) => e.id !== id));
    if (selectedEmail?.id === id) setSelectedEmail(null);
    
    try {
      await fetch(`/api/advisor/emails/${id}`, { method: "DELETE" });
      toast({ title: "Email supprimé" });
    } catch (error) {
      fetchEmails();
      toast({ title: "Erreur", description: "Impossible de supprimer l'email.", variant: "destructive" });
    }
  };

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      handleToggleRead(email.id);
    }
  };

  const handleReply = () => {
    if (!selectedEmail) return;
    setReplyTo({
      from: selectedEmail.fromEmail || selectedEmail.from,
      subject: selectedEmail.subject,
      body: selectedEmail.body,
    });
    setShowCompose(true);
    setComposeMinimized(false);
  };

  const handleSendEmail = async (email: { to: string; cc?: string; subject: string; body: string }) => {
    try {
      const res = await fetch("/api/advisor/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(email),
      });
      if (!res.ok) throw new Error("Erreur envoi");
      toast({ title: "Email envoyé", description: `Message envoyé à ${email.to}` });
      setShowCompose(false);
      setReplyTo(undefined);
    } catch (error) {
      throw error;
    }
  };

  const handleCompose = () => {
    setReplyTo(undefined);
    setShowCompose(true);
    setComposeMinimized(false);
  };

  const folderCounts = {
    inbox: emails.filter((e) => e.direction === "INBOUND" && !e.isRead).length,
    starred: emails.filter((e) => e.isStarred).length,
    sent: emails.filter((e) => e.direction === "OUTBOUND").length,
  };

  const folders = [
    { id: "inbox", name: "Boîte de réception", icon: <Mail className="h-4 w-4" />, count: folderCounts.inbox },
    { id: "starred", name: "Favoris", icon: <Mail className="h-4 w-4" />, count: folderCounts.starred },
    { id: "sent", name: "Envoyés", icon: <Mail className="h-4 w-4" />, count: folderCounts.sent },
    { id: "drafts", name: "Brouillons", icon: <Mail className="h-4 w-4" /> },
    { id: "archive", name: "Archives", icon: <Mail className="h-4 w-4" /> },
    { id: "trash", name: "Corbeille", icon: <Mail className="h-4 w-4" /> },
  ];

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white">
      <EmailSidebar
        selectedFolder={selectedFolder}
        onSelectFolder={setSelectedFolder}
        onCompose={handleCompose}
        onSync={handleSync}
        onOpenSettings={() => setSyncModalOpen(true)}
        syncing={syncing}
        folders={folders}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-slate-900">
              {folders.find((f) => f.id === selectedFolder)?.name || "Emails"}
            </h1>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-white"
              />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={fetchEmails}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex min-h-0">
          <div className={cn(
            "border-r border-slate-200 overflow-y-auto transition-all",
            selectedEmail ? "w-96" : "flex-1"
          )}>
            <EmailList
              emails={emails}
              selectedId={selectedEmail?.id || null}
              onSelect={handleSelectEmail}
              onToggleStar={handleToggleStar}
              onToggleRead={handleToggleRead}
              onArchive={handleArchive}
              onDelete={handleDelete}
              loading={loading}
            />
          </div>

          {selectedEmail && (
            <div className="flex-1 min-w-0">
              <EmailDetail
                email={selectedEmail}
                onBack={() => setSelectedEmail(null)}
                onReply={handleReply}
                onToggleStar={() => handleToggleStar(selectedEmail.id)}
                onArchive={() => handleArchive(selectedEmail.id)}
                onDelete={() => handleDelete(selectedEmail.id)}
              />
            </div>
          )}
        </div>
      </div>

      {showCompose && (
        <EmailCompose
          onClose={() => { setShowCompose(false); setReplyTo(undefined); }}
          onSend={handleSendEmail}
          replyTo={replyTo}
          minimized={composeMinimized}
          onToggleMinimize={() => setComposeMinimized(!composeMinimized)}
        />
      )}

      <MailSyncModal
        open={syncModalOpen}
        onOpenChange={setSyncModalOpen}
        onSyncComplete={fetchEmails}
      />
    </div>
  );
}
