/**
 * QuickActions Component
 * Contextual quick action buttons for tabs
 */

import { Button } from '@/components/ui/Button';
import { Plus, RefreshCw, LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface QuickActionsProps {
  onAdd?: () => void;
  onRefresh?: () => void;
  addLabel?: string;
  addIcon?: LucideIcon;
  showRefresh?: boolean;
  children?: ReactNode;
  className?: string;
}

export function QuickActions({ 
  onAdd, 
  onRefresh, 
  addLabel = 'Ajouter',
  addIcon: AddIcon = Plus,
  showRefresh = true,
  children,
  className = '',
}: QuickActionsProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {children}
      
      {onAdd && (
        <Button 
          onClick={onAdd}
          className="bg-blue-600 hover:bg-blue-700 transition-all duration-300"
        >
          <AddIcon className="w-4 h-4 mr-2" />
          {addLabel}
        </Button>
      )}
      
      {showRefresh && onRefresh && (
        <Button 
          variant="outline" 
          onClick={onRefresh}
          className="transition-all duration-300 hover:shadow-md"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      )}
    </div>
  );
}

interface QuickActionButtonProps {
  icon?: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  className?: string;
}

export function QuickActionButton({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = 'outline',
  className = '',
}: QuickActionButtonProps) {
  return (
    <Button 
      variant={variant} 
      onClick={onClick}
      className={`transition-all duration-300 hover:shadow-md ${className}`}
    >
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {label}
    </Button>
  );
}

export default QuickActions;
