"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Reply,
  ReplyAll,
  Forward,
  Star,
  Archive,
  Trash2,
  MoreHorizontal,
  Paperclip,
  Download,
  ExternalLink,
  Clock,
  User,
} from "lucide-react";
import { Button } from "@/app/_common/components/ui/Button";

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

interface EmailDetailProps {
  email: Email;
  onBack: () => void;
  onReply: () => void;
  onToggleStar: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

function formatDate(dateString: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " o";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " Ko";
  return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
}

function getInitials(name: string) {
  if (!name) return "??";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function EmailDetail({ email, onBack, onReply, onToggleStar, onArchive, onDelete }: EmailDetailProps) {
  const senderName = email.client
    ? `${email.client.firstName} ${email.client.lastName}`
    : email.from || "Expéditeur inconnu";

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-sm font-medium text-slate-700">Retour</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onReply} className="h-8 gap-1.5 text-slate-600">
            <Reply className="h-4 w-4" />
            <span className="hidden sm:inline">Répondre</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-slate-600">
            <Forward className="h-4 w-4" />
            <span className="hidden sm:inline">Transférer</span>
          </Button>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <Button variant="ghost" size="icon" onClick={onToggleStar}
            className={cn("h-8 w-8", email.isStarred ? "text-amber-500" : "text-slate-400")}>
            <Star className={cn("h-4 w-4", email.isStarred && "fill-amber-500")} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onArchive} className="h-8 w-8 text-slate-500">
            <Archive className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-slate-500 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100">
          <h1 className="text-xl font-semibold text-slate-900">{email.subject || "(Sans objet)"}</h1>
          {email.labels && email.labels.length > 0 && (
            <div className="flex gap-1.5 mt-2">
              {email.labels.map((label) => (
                <span key={label} className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {getInitials(senderName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900">{senderName}</span>
                  <span className="text-sm text-slate-500 ml-2">&lt;{email.fromEmail || email.from}&gt;</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDate(email.receivedAt || email.sentAt || "")}
                </div>
              </div>
              <div className="mt-1 text-sm text-slate-500">à {email.to?.join(", ") || "moi"}</div>
              {email.client && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs">
                  <User className="h-3 w-3" />
                  <span>Client: {email.client.firstName} {email.client.lastName}</span>
                  <ExternalLink className="h-3 w-3 ml-1" />
                </div>
              )}
            </div>
          </div>
        </div>

        {email.attachments && email.attachments.length > 0 && (
          <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 mb-2">
              <Paperclip className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">
                {email.attachments.length} pièce{email.attachments.length > 1 ? "s" : ""} jointe{email.attachments.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {email.attachments.map((att) => (
                <div key={att.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <Paperclip className="h-4 w-4 text-slate-400" />
                  <div className="text-sm">
                    <p className="font-medium text-slate-700 truncate max-w-[150px]">{att.name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(att.size)}</p>
                  </div>
                  <Download className="h-4 w-4 text-slate-400 ml-2" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-6 py-6">
          {email.bodyHtml ? (
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: email.bodyHtml }} />
          ) : (
            <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">{email.body}</div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50">
        <Button onClick={onReply} className="bg-indigo-600 hover:bg-indigo-700">
          <Reply className="h-4 w-4 mr-2" />
          Répondre
        </Button>
      </div>
    </div>
  );
}
