'use client';

import { useState, useEffect } from 'react';
import { ListChecks, Plus } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';

interface Task {
  id: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  status: string;
  dueDate?: string;
  completedAt?: string;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  clientName?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TachesPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<{ tasks: Task[] }>('/advisor/tasks');
      setTasks(response.tasks || []);
    } catch (err) {
      console.error('Erreur chargement tâches:', err);
      setError((err as Error).message || 'Erreur lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      await api.patch(`/advisor/tasks/${taskId}`, { status: completed ? 'COMPLETED' : 'TODO' });
      loadTasks();
    } catch (err) {
      console.error('Erreur mise à jour tâche:', err);
      setError('Erreur lors de la mise à jour');
    }
  };

  const columns = [
    {
      key: 'completed',
      label: '',
      sortable: false,
      render: (row: Task) => (
        <input
          type="checkbox"
          checked={row.status === 'COMPLETED'}
          onChange={(e) => handleToggleTask(row.id, e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          aria-label={`Marquer la tâche "${row.title}" comme ${row.status === 'COMPLETED' ? 'non terminée' : 'terminée'}`}
        />
      ),
    },
    {
      key: 'title',
      label: 'Tâche',
      render: (row: Task) => (
        <div>
          <div className={`font-medium ${row.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
            {row.title}
          </div>
          {row.description && (
            <div className="text-sm text-gray-500 mt-1">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'Priorité',
      render: (row: Task) => {
        const variants: Record<string, 'destructive' | 'warning' | 'default'> = {
          URGENT: 'destructive',
          HIGH: 'destructive',
          MEDIUM: 'warning',
          LOW: 'default',
        };
        const labels: Record<string, string> = {
          URGENT: 'Urgente',
          HIGH: 'Haute',
          MEDIUM: 'Moyenne',
          LOW: 'Basse',
        };
        return (
          <Badge variant={variants[row.priority] || 'default'}>
            {labels[row.priority] || row.priority}
          </Badge>
        );
      },
    },
    {
      key: 'dueDate',
      label: 'Échéance',
      render: (row: Task) => {
        if (!row.dueDate) return '-';
        const date = new Date(row.dueDate);
        const isOverdue = date < new Date();
        return (
          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
            {date.toLocaleDateString('fr-FR')}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Statut',
      render: (row: Task) => {
        const variants: Record<string, 'default' | 'info' | 'success' | 'destructive'> = {
          TODO: 'default',
          IN_PROGRESS: 'info',
          COMPLETED: 'success',
          CANCELLED: 'destructive',
        };
        const labels: Record<string, string> = {
          TODO: 'À faire',
          IN_PROGRESS: 'En cours',
          COMPLETED: 'Terminée',
          CANCELLED: 'Annulée',
        };
        return (
          <Badge variant={variants[row.status] || 'default'}>
            {labels[row.status] || row.status}
          </Badge>
        );
      },
    },
  ];

  const activeTasks = tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
            <ListChecks className="h-5 w-5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Mes Tâches
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {activeTasks.length} tâche{activeTasks.length > 1 ? 's' : ''} en cours
            </p>
          </div>
        </div>

        <Button
          onClick={() => {/* TODO: Open modal */}}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Tâche
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive" title="Erreur" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <DataTable
        data={tasks}
        columns={columns}
        loading={loading}
        sortable
        filterable
        emptyMessage="Aucune tâche trouvée"
      />
    </div>
  );
}
