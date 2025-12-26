"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Star,
  Paperclip,
  Archive,
  Trash2,
  MoreHorizontal,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Button } from "@/app/_common/components/ui/Button";
import Checkbox from "@/app/_common/components/ui/Checkbox";

interface Email {
  id: string;
  from: string;
  fromEmail: string;
  to: string[];
  subject: string;
  snippet: string;
  body: string;
  receivedAt: string;
  sentAt?: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  labels: string[];
  direction: "INBOUND" | "OUTBOUND";
  client?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface EmailListProps {
  emails: Email[];
  selectedId: string | null;
  onSelect: (email: Email) => void;
  onToggleStar: (id: string) => void;
  onToggleRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

function formatEmailTime(dateString: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 1) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays < 2) return "Hier";
  if (diffDays < 7) {
    return date.toLocaleDateString("fr-FR", { weekday: "short" });
  }
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function getInitials(name: string) {
  if (!name) return "??";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-purple-100 text-purple-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function EmailList({
  emails,
  selectedId,
  onSelect,
  onToggleStar,
  onToggleRead,
  onArchive,
  onDelete,
  loading,
}: EmailListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-1 p-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-20 rounded-lg bg-slate-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-sm font-medium text-slate-700">Aucun email</h3>
        <p className="text-xs text-slate-500 mt-1">
          Votre boîte de réception est vide
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {emails.map((email) => {
        const sender = email.client
          ? `${email.client.firstName} ${email.client.lastName}`
          : email.from || "Expéditeur inconnu";
        const isSelected = selectedId === email.id;
        const isChecked = selectedIds.has(email.id);
        const isHovered = hoveredId === email.id;

        return (
          <div
            key={email.id}
            onClick={() => onSelect(email)}
            onMouseEnter={() => setHoveredId(email.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={cn(
              "group relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-all duration-150",
              isSelected
                ? "bg-indigo-50 border-l-2 border-l-indigo-500"
                : "hover:bg-slate-50 border-l-2 border-l-transparent",
              !email.isRead && "bg-blue-50/30"
            )}
          >
            {/* Checkbox ou Avatar */}
            <div className="flex-shrink-0 pt-0.5">
              {isHovered || isChecked ? (
                <Checkbox
                  checked={isChecked}
                  onClick={(e) => toggleSelection(email.id, e)}
                  className="h-5 w-5"
                />
              ) : (
                <div
                  className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold",
                    getAvatarColor(sender)
                  )}
                >
                  {getInitials(sender)}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "text-sm truncate",
                    !email.isRead
                      ? "font-semibold text-slate-900"
                      : "font-medium text-slate-700"
                  )}
                >
                  {sender}
                </span>
                <div className="flex items-center gap-1.5">
                  {email.hasAttachments && (
                    <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                  )}
                  <span
                    className={cn(
                      "text-xs whitespace-nowrap",
                      !email.isRead
                        ? "text-indigo-600 font-medium"
                        : "text-slate-400"
                    )}
                  >
                    {formatEmailTime(email.receivedAt || email.sentAt || "")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={cn(
                    "text-sm truncate",
                    !email.isRead
                      ? "font-medium text-slate-800"
                      : "text-slate-600"
                  )}
                >
                  {email.subject || "(Sans objet)"}
                </span>
              </div>

              <p className="text-xs text-slate-500 truncate mt-0.5 leading-relaxed">
                {email.snippet || email.body?.substring(0, 100) || ""}
              </p>

              {/* Labels */}
              {email.labels && email.labels.length > 0 && (
                <div className="flex gap-1 mt-1.5">
                  {email.labels.slice(0, 3).map((label) => (
                    <span
                      key={label}
                      className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-600"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Star button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar(email.id);
              }}
              className={cn(
                "flex-shrink-0 p-1 rounded transition-colors",
                email.isStarred
                  ? "text-amber-500"
                  : "text-slate-300 hover:text-amber-400"
              )}
            >
              <Star
                className={cn("h-4 w-4", email.isStarred && "fill-amber-500")}
              />
            </button>

            {/* Quick actions on hover */}
            {isHovered && (
              <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-white shadow-md rounded-lg border border-slate-200 p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-500 hover:text-slate-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive(email.id);
                  }}
                >
                  <Archive className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-500 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(email.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-500 hover:text-slate-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleRead(email.id);
                  }}
                >
                  {email.isRead ? (
                    <Circle className="h-3.5 w-3.5" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
