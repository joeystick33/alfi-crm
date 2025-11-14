/**
 * QuickStats Component Tests
 * 
 * Tests for the QuickStats dashboard component including:
 * - Rendering with data
 * - Loading states
 * - Click handlers
 * - Accessibility
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuickStats from '../QuickStats';

describe('QuickStats Component', () => {
  const mockData = {
    revenue: {
      total: 45000,
      target: 50000,
      evolution: 12.5
    },
    clients: {
      total: 150,
      new: 5,
      prospects: 23
    },
    appointments: {
      week: 12,
      today: 3
    },
    projects: {
      active: 8,
      urgent: 2,
      details: '8 projets actifs'
    }
  };

  describe('Rendering', () => {
    it('should render all stat cards', () => {
      render(<QuickStats data={mockData} loading={false} />);
      
      expect(screen.getByText('CA du Mois')).toBeInTheDocument();
      expect(screen.getByText('Projets Actifs')).toBeInTheDocument();
      expect(screen.getByText('RDV Semaine')).toBeInTheDocument();
      expect(screen.getByText('Clients Actifs')).toBeInTheDocument();
    });

    it('should display formatted values', () => {
      render(<QuickStats data={mockData} loading={false} />);
      
      expect(screen.getByText('45 000 €')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('should display evolution indicators', () => {
      render(<QuickStats data={mockData} loading={false} />);
      
      const evolutionElements = screen.getAllByText(/12\.5%|5/);
      expect(evolutionElements.length).toBeGreaterThan(0);
    });

    it('should display badges for urgent items', () => {
      render(<QuickStats data={mockData} loading={false} />);
      
      const badge = screen.getByText('2');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show skeleton loaders when loading', () => {
      const { container } = render(<QuickStats data={null} loading={true} />);
      
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should not show data when loading', () => {
      render(<QuickStats data={mockData} loading={true} />);
      
      expect(screen.queryByText('CA du Mois')).not.toBeInTheDocument();
    });
  });

  describe('Click Handlers', () => {
    it('should call onCardClick with correct id when revenue card is clicked', () => {
      const handleClick = vi.fn();
      render(<QuickStats data={mockData} loading={false} onCardClick={handleClick} />);
      
      const revenueCard = screen.getByText('CA du Mois').closest('div[role="button"]');
      fireEvent.click(revenueCard);
      
      expect(handleClick).toHaveBeenCalledWith('revenue');
    });

    it('should call onCardClick for all cards', () => {
      const handleClick = vi.fn();
      render(<QuickStats data={mockData} loading={false} onCardClick={handleClick} />);
      
      const cards = screen.getAllByRole('button');
      cards.forEach(card => fireEvent.click(card));
      
      expect(handleClick).toHaveBeenCalledTimes(4);
    });

    it('should handle keyboard activation (Enter key)', () => {
      const handleClick = vi.fn();
      render(<QuickStats data={mockData} loading={false} onCardClick={handleClick} />);
      
      const revenueCard = screen.getByText('CA du Mois').closest('div[role="button"]');
      fireEvent.keyDown(revenueCard, { key: 'Enter' });
      
      expect(handleClick).toHaveBeenCalledWith('revenue');
    });

    it('should handle keyboard activation (Space key)', () => {
      const handleClick = vi.fn();
      render(<QuickStats data={mockData} loading={false} onCardClick={handleClick} />);
      
      const revenueCard = screen.getByText('CA du Mois').closest('div[role="button"]');
      fireEvent.keyDown(revenueCard, { key: ' ' });
      
      expect(handleClick).toHaveBeenCalledWith('revenue');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = render(<QuickStats data={mockData} loading={false} />);
      
      const region = container.querySelector('[role="region"]');
      expect(region).toHaveAttribute('aria-label', 'Statistiques rapides');
      expect(region).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-busy when loading', () => {
      const { container } = render(<QuickStats data={mockData} loading={true} />);
      
      const region = container.querySelector('[role="region"]');
      expect(region).toHaveAttribute('aria-busy', 'true');
    });

    it('should have accessible labels on cards', () => {
      render(<QuickStats data={mockData} loading={false} />);
      
      const revenueCard = screen.getByLabelText(/CA du Mois.*45000.*évolution.*12\.5/);
      expect(revenueCard).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      render(<QuickStats data={mockData} loading={false} />);
      
      const cards = screen.getAllByRole('button');
      cards.forEach(card => {
        expect(card).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing data gracefully', () => {
      render(<QuickStats data={{}} loading={false} />);
      
      expect(screen.getByText('0 €')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle null data', () => {
      render(<QuickStats data={null} loading={false} />);
      
      expect(screen.getByText('CA du Mois')).toBeInTheDocument();
    });

    it('should handle negative evolution', () => {
      const dataWithNegative = {
        ...mockData,
        revenue: { ...mockData.revenue, evolution: -5.2 }
      };
      
      render(<QuickStats data={dataWithNegative} loading={false} />);
      
      expect(screen.getByText('5.2%')).toBeInTheDocument();
    });

    it('should handle zero values', () => {
      const zeroData = {
        revenue: { total: 0, target: 0, evolution: 0 },
        clients: { total: 0, new: 0, prospects: 0 },
        appointments: { week: 0, today: 0 },
        projects: { active: 0, urgent: 0 }
      };
      
      render(<QuickStats data={zeroData} loading={false} />);
      
      expect(screen.getByText('0 €')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render in grid layout', () => {
      const { container } = render(<QuickStats data={mockData} loading={false} />);
      
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4');
    });
  });
});
