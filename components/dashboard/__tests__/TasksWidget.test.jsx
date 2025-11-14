/**
 * TasksWidget Component Tests
 * 
 * Tests for the TasksWidget dashboard component including:
 * - Task list rendering
 * - Task completion toggle
 * - Priority and due date display
 * - Accessibility
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TasksWidget from '../TasksWidget';
import { apiCall } from '@/lib/api';

// Mock API
vi.mock('@/lib/api', () => ({
  apiCall: vi.fn()
}));

// Mock router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}));

describe('TasksWidget Component', () => {
  const mockTasks = [
    {
      _id: '1',
      title: 'Préparer dossier retraite',
      dueDate: new Date().toISOString(),
      priority: 'URGENTE',
      status: 'A_FAIRE',
      relatedParticulierId: {
        prenom: 'Jean',
        nom: 'Dupont'
      }
    },
    {
      _id: '2',
      title: 'Appeler client',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      priority: 'HAUTE',
      status: 'EN_COURS',
      relatedParticulierId: {
        prenom: 'Marie',
        nom: 'Martin'
      }
    },
    {
      _id: '3',
      title: 'Envoyer document',
      dueDate: new Date(Date.now() - 86400000).toISOString(),
      priority: 'NORMALE',
      status: 'A_FAIRE'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    apiCall.mockResolvedValue({
      success: true,
      data: mockTasks
    });
  });

  describe('Rendering', () => {
    it('should render widget title', async () => {
      render(<TasksWidget />);
      
      await waitFor(() => {
        expect(screen.getByText('Mes tâches')).toBeInTheDocument();
      });
    });

    it('should render task list', async () => {
      render(<TasksWidget />);
      
      await waitFor(() => {
        expect(screen.getByText('Préparer dossier retraite')).toBeInTheDocument();
        expect(screen.getByText('Appeler client')).toBeInTheDocument();
        expect(screen.getByText('Envoyer document')).toBeInTheDocument();
      });
    });

    it('should display task count badge', async () => {
      render(<TasksWidget />);
      
      await waitFor(() => {
        const badge = screen.getByText('3');
        expect(badge).toBeInTheDocument();
      });
    });

    it('should display priority badges', async () => {
      render(<TasksWidget />);
      
      await waitFor(() => {
        expect(screen.getByText('Urgent')).toBeInTheDocument();
        expect(screen.getByText('Haute')).toBeInTheDocument();
        expect(screen.getByText('Normale')).toBeInTheDocument();
      });
    });

    it('should display client names', async () => {
      render(<TasksWidget />);
      
      await waitFor(() => {
        expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
        expect(screen.getByText('Marie Martin')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show skeleton loader while loading', () => {
      apiCall.mockImplementation(() => new Promise(() => {}));
      
      const { container } = render(<TasksWidget />);
      
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no tasks', async () => {
      apiCall.mockResolvedValue({
        success: true,
        data: []
      });
      
      render(<TasksWidget />);
      
      await waitFor(() => {
        expect(screen.getByText('Aucune tâche en cours')).toBeInTheDocument();
      });
    });
  });

  describe('Task Completion', () => {
    it('should toggle task status when checkbox clicked', async () => {
      apiCall.mockResolvedValueOnce({
        success: true,
        data: mockTasks
      }).mockResolvedValueOnce({
        success: true,
        data: { ...mockTasks[0], status: 'TERMINEE' }
      });
      
      render(<TasksWidget />);
      
      await waitFor(() => {
        expect(screen.getByText('Préparer dossier retraite')).toBeInTheDocument();
      });
      
      const checkboxes = screen.getAllByRole('button', { name: /Marquer comme/ });
      fireEvent.click(checkboxes[0]);
      
      await waitFor(() => {
        expect(apiCall).toHaveBeenCalledWith(
          expect.stringContaining('/advisor/tasks/1'),
          expect.objectContaining({
            method: 'PUT',
            body: { status: 'TERMINEE' }
          })
        );
      });
    });

    it('should show loading state on checkbox during update', async () => {
      apiCall.mockResolvedValueOnce({
        success: true,
        data: mockTasks
      }).mockImplementation(() => new Promise(() => {}));
      
      render(<TasksWidget />);
      
      await waitFor(() => {
        expect(screen.getByText('Préparer dossier retraite')).toBeInTheDocument();
      });
      
      const checkboxes = screen.getAllByRole('button', { name: /Marquer comme/ });
      fireEvent.click(checkboxes[0]);
      
      await waitFor(() => {
        const loader = screen.getByRole('button', { name: /Marquer comme/ }).querySelector('.animate-spin');
        expect(loader).toBeInTheDocument();
      });
    });
  });

  describe('Due Date Display', () => {
    it('should show "Aujourd\'hui" for today\'s tasks', async () => {
      render(<TasksWidget />);
      
      await waitFor(() => {
        expect(screen.getByText("Aujourd'hui")).toBeInTheDocument();
      });
    });

    it('should show overdue indicator for past due tasks', async () => {
      render(<TasksWidget />);
      
      await waitFor(() => {
        expect(screen.getByText(/En retard/)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to task details when task clicked', async () => {
      const mockPush = vi.fn();
      vi.mocked(useRouter).mockReturnValue({ push: mockPush });
      
      render(<TasksWidget />);
      
      await waitFor(() => {
        expect(screen.getByText('Préparer dossier retraite')).toBeInTheDocument();
      });
      
      const taskButton = screen.getByLabelText(/Voir les détails.*Préparer dossier/);
      fireEvent.click(taskButton);
      
      expect(mockPush).toHaveBeenCalledWith('/dashboard/taches/1');
    });

    it('should navigate to all tasks when "Voir tout" clicked', async () => {
      const mockPush = vi.fn();
      vi.mocked(useRouter).mockReturnValue({ push: mockPush });
      
      render(<TasksWidget />);
      
      await waitFor(() => {
        expect(screen.getByText('Voir tout')).toBeInTheDocument();
      });
      
      const viewAllButton = screen.getByText('Voir tout');
      fireEvent.click(viewAllButton);
      
      expect(mockPush).toHaveBeenCalledWith('/dashboard/taches');
    });
  });

  describe('Error Handling', () => {
    it('should show error message on API failure', async () => {
      apiCall.mockRejectedValue(new Error('API Error'));
      
      render(<TasksWidget />);
      
      await waitFor(() => {
        expect(screen.getByText(/Erreur/)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      apiCall.mockRejectedValue(new Error('API Error'));
      
      render(<TasksWidget />);
      
      await waitFor(() => {
        const retryButton = screen.getByText('Réessayer');
        expect(retryButton).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on widget', async () => {
      const { container } = render(<TasksWidget />);
      
      await waitFor(() => {
        const region = container.querySelector('[role="region"]');
        expect(region).toHaveAttribute('aria-label', 'Widget des tâches');
      });
    });

    it('should have proper ARIA attributes on task list', async () => {
      const { container } = render(<TasksWidget />);
      
      await waitFor(() => {
        const list = container.querySelector('[role="list"]');
        expect(list).toHaveAttribute('aria-labelledby', 'tasks-widget-title');
      });
    });

    it('should have accessible labels on tasks', async () => {
      render(<TasksWidget />);
      
      await waitFor(() => {
        const task = screen.getByLabelText(/Préparer dossier retraite.*priorité.*Urgent/);
        expect(task).toBeInTheDocument();
      });
    });

    it('should have aria-pressed on checkboxes', async () => {
      render(<TasksWidget />);
      
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('button', { name: /Marquer comme/ });
        checkboxes.forEach(checkbox => {
          expect(checkbox).toHaveAttribute('aria-pressed');
        });
      });
    });
  });

  describe('Task Sorting', () => {
    it('should sort tasks by priority and due date', async () => {
      render(<TasksWidget />);
      
      await waitFor(() => {
        const tasks = screen.getAllByRole('listitem');
        // Urgent task should be first
        expect(tasks[0]).toHaveTextContent('Préparer dossier retraite');
      });
    });
  });
});
