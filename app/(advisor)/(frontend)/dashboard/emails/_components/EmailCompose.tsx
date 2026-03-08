"use client";

import { useState, useCallback } from "react";
import { X, Paperclip, Image, Link2, Smile, Minimize2, Maximize2, Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/app/_common/components/ui/Button";
import { Input } from "@/app/_common/components/ui/Input";
import { cn } from "@/lib/utils";
import { useAI } from '@/app/(advisor)/(frontend)/hooks/useAI';

interface EmailComposeProps {
  onClose: () => void;
  onSend: (email: { to: string; cc?: string; subject: string; body: string }) => Promise<void>;
  replyTo?: { from: string; subject: string; body: string };
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

export function EmailCompose({ onClose, onSend, replyTo, minimized, onToggleMinimize }: EmailComposeProps) {
  const [to, setTo] = useState(replyTo?.from || "");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : "");
  const [body, setBody] = useState(replyTo ? `\n\n---\nLe ${new Date().toLocaleDateString("fr-FR")}, ${replyTo.from} a écrit :\n${replyTo.body}` : "");
  const [showCc, setShowCc] = useState(false);
  const [sending, setSending] = useState(false);
  const ai = useAI();
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleAIGenerate = useCallback(async () => {
    if (!subject.trim() && !to.trim()) return;
    setAiGenerating(true);
    try {
      const result = await ai.generateEmail({
        clientName: to.split('@')[0] || 'Client',
        advisorName: 'Le conseiller',
        cabinetName: 'Le cabinet',
        emailType: 'custom',
        context: subject || 'Email professionnel à un client',
        tone: 'chaleureux',
      });
      if (result) {
        if (result.subject && !subject.trim()) setSubject(result.subject);
        setBody(result.body);
      }
    } finally {
      setAiGenerating(false);
    }
  }, [subject, to, ai]);

  const handleSend = async () => {
    if (!to.trim() || !subject.trim()) return;
    setSending(true);
    try {
      await onSend({ to, cc: cc || undefined, subject, body });
      onClose();
    } catch (error) {
      console.error("Erreur envoi email:", error);
    } finally {
      setSending(false);
    }
  };

  if (minimized) {
    return (
      <div className="fixed bottom-0 right-4 w-72 bg-white rounded-t-lg shadow-xl border border-slate-200 z-50">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800 rounded-t-lg cursor-pointer" onClick={onToggleMinimize}>
          <span className="text-sm font-medium text-white truncate">{subject || "Nouveau message"}</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-slate-700" onClick={(e) => { e.stopPropagation(); onToggleMinimize?.(); }}>
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-slate-700" onClick={(e) => { e.stopPropagation(); onClose(); }}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-4 w-[560px] bg-white rounded-t-xl shadow-2xl border border-slate-200 z-50 flex flex-col max-h-[80vh]">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 rounded-t-xl">
        <span className="text-sm font-medium text-white">Nouveau message</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-slate-700" onClick={onToggleMinimize}>
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-slate-700" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-slate-100">
          <div className="flex items-center px-4 py-2">
            <span className="text-sm text-slate-500 w-12">À</span>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="destinataire@email.com" className="border-0 shadow-none focus-visible:ring-0 px-0 h-8" />
            {!showCc && (
              <Button variant="ghost" size="sm" onClick={() => setShowCc(true)} className="text-xs text-slate-500 h-6">
                Cc
              </Button>
            )}
          </div>
          {showCc && (
            <div className="flex items-center px-4 py-2 border-t border-slate-100">
              <span className="text-sm text-slate-500 w-12">Cc</span>
              <Input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="copie@email.com" className="border-0 shadow-none focus-visible:ring-0 px-0 h-8" />
            </div>
          )}
          <div className="flex items-center px-4 py-2 border-t border-slate-100">
            <span className="text-sm text-slate-500 w-12">Objet</span>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Objet du message" className="border-0 shadow-none focus-visible:ring-0 px-0 h-8" />
          </div>
        </div>

        <div className="p-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Rédigez votre message..."
            className="w-full min-h-[200px] text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
            <Image className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
            <Link2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
            <Smile className="h-4 w-4" />
          </Button>
          {ai.isAvailable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAIGenerate}
              disabled={aiGenerating}
              className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-1 text-xs font-medium"
            >
              {aiGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Rédiger par IA
            </Button>
          )}
        </div>
        <Button onClick={handleSend} disabled={sending || !to.trim()} className="bg-indigo-600 hover:bg-indigo-700">
          {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
          Envoyer
        </Button>
      </div>
    </div>
  );
}
