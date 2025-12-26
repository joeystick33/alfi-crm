"use client";

import { cn } from "@/lib/utils";
import {
  Inbox,
  Send,
  Star,
  FileText,
  Trash2,
  Archive,
  AlertCircle,
  Tag,
  Plus,
  Settings,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/app/_common/components/ui/Button";

interface Folder {
  id: string;
  name: string;
  icon: React.ReactNode;
  count?: number;
  color?: string;
}

interface Label {
  id: string;
  name: string;
  color: string;
  count?: number;
}

interface EmailSidebarProps {
  selectedFolder: string;
  onSelectFolder: (folderId: string) => void;
  onCompose: () => void;
  onSync: () => void;
  onOpenSettings: () => void;
  syncing?: boolean;
  folders?: Folder[];
  labels?: Label[];
}

const DEFAULT_FOLDERS: Folder[] = [
  { id: "inbox", name: "Boîte de réception", icon: <Inbox className="h-4 w-4" />, count: 0 },
  { id: "starred", name: "Favoris", icon: <Star className="h-4 w-4" />, count: 0 },
  { id: "sent", name: "Envoyés", icon: <Send className="h-4 w-4" />, count: 0 },
  { id: "drafts", name: "Brouillons", icon: <FileText className="h-4 w-4" />, count: 0 },
  { id: "spam", name: "Spam", icon: <AlertCircle className="h-4 w-4" />, count: 0 },
  { id: "archive", name: "Archives", icon: <Archive className="h-4 w-4" />, count: 0 },
  { id: "trash", name: "Corbeille", icon: <Trash2 className="h-4 w-4" />, count: 0 },
];

const DEFAULT_LABELS: Label[] = [
  { id: "important", name: "Important", color: "bg-red-500" },
  { id: "work", name: "Travail", color: "bg-blue-500" },
  { id: "personal", name: "Personnel", color: "bg-green-500" },
  { id: "clients", name: "Clients", color: "bg-purple-500" },
];

export function EmailSidebar({
  selectedFolder,
  onSelectFolder,
  onCompose,
  onSync,
  onOpenSettings,
  syncing = false,
  folders = DEFAULT_FOLDERS,
  labels = DEFAULT_LABELS,
}: EmailSidebarProps) {
  return (
    <div className="w-56 flex-shrink-0 border-r border-slate-200 bg-slate-50/50 flex flex-col h-full">
      <div className="p-3">
        <Button onClick={onCompose} className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-md">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        <nav className="space-y-0.5">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                selectedFolder === folder.id
                  ? "bg-indigo-100 text-indigo-700 font-medium"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <span className={cn(selectedFolder === folder.id ? "text-indigo-600" : "text-slate-500")}>
                {folder.icon}
              </span>
              <span className="flex-1 text-left">{folder.name}</span>
              {folder.count !== undefined && folder.count > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  selectedFolder === folder.id
                    ? "bg-indigo-200 text-indigo-700"
                    : "bg-slate-200 text-slate-600"
                )}>
                  {folder.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-6">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Libellés</span>
            <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-400 hover:text-slate-600">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <nav className="space-y-0.5">
            {labels.map((label) => (
              <button
                key={label.id}
                onClick={() => onSelectFolder(`label:${label.id}`)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  selectedFolder === `label:${label.id}`
                    ? "bg-slate-100 text-slate-900 font-medium"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <span className={cn("w-2.5 h-2.5 rounded-full", label.color)} />
                <span className="flex-1 text-left">{label.name}</span>
                {label.count !== undefined && label.count > 0 && (
                  <span className="text-xs text-slate-400">{label.count}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-3 border-t border-slate-200 space-y-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSync}
          disabled={syncing}
          className="w-full justify-start text-slate-600 hover:text-slate-900"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", syncing && "animate-spin")} />
          {syncing ? "Synchronisation..." : "Synchroniser"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenSettings}
          className="w-full justify-start text-slate-600 hover:text-slate-900"
        >
          <Settings className="h-4 w-4 mr-2" />
          Paramètres
        </Button>
      </div>
    </div>
  );
}
