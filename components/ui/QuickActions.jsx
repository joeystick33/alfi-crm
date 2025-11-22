/**
 * QuickActions Component
 * Contextual quick action buttons for tabs
 */

import Button from '@/components/ui/Button';
import { Plus, RefreshCw } from 'lucide-react';

export function QuickActions({ 
  onAdd, 
  onRefresh, 
  addLabel = 'Ajouter',
  addIcon = Plus,
  showRefresh = true,
  children,
  className = '',
}) {
  const AddIcon = addIcon;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {children}
      
      {onAdd && (
        <Button 
          onClick={onAdd}
          className="bg-blue-600 hover:bg-blue-700 transition-smooth"
        >
          <AddIcon className="w-4 h-4 mr-2" />
          {addLabel}
        </Button>
      )}
      
      {showRefresh && onRefresh && (
        <Button 
          variant="outline" 
          onClick={onRefresh}
          className="transition-smooth hover-lift"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      )}
    </div>
  );
}

export function QuickActionButton({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = 'outline',
  className = '',
}) {
  return (
    <Button 
      variant={variant} 
      onClick={onClick}
      className={`transition-smooth hover-lift ${className}`}
    >
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {label}
    </Button>
  );
}
