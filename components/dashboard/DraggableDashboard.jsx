'use client';

import { useState, useCallback, useMemo } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { WIDGET_REGISTRY } from '@/lib/dashboard/widget-registry';
import { convertToGridLayout, convertFromGridLayout } from '@/lib/dashboard/widget-utils';

const ResponsiveGridLayout = WidthProvider(Responsive);

/**
 * DraggableDashboard Component
 * Système de grid draggable pour le dashboard avec react-grid-layout
 */
export default function DraggableDashboard({ 
  layout, 
  onLayoutChange, 
  editMode = false,
  children 
}) {
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  
  // Convert layout to react-grid-layout format
  const layouts = useMemo(() => {
    if (!layout || !layout.widgets) return { lg: [], md: [], sm: [] };
    
    return {
      lg: convertToGridLayout(layout.widgets, 'desktop'),
      md: convertToGridLayout(layout.widgets, 'tablet'),
      sm: convertToGridLayout(layout.widgets, 'mobile')
    };
  }, [layout]);
  
  // Handle layout change
  const handleLayoutChange = useCallback((currentLayout, allLayouts) => {
    if (!editMode || !onLayoutChange) return;
    
    // Convert back to our format
    const breakpointMap = {
      lg: 'desktop',
      md: 'tablet',
      sm: 'mobile'
    };
    
    const updatedWidgets = layout.widgets.map(widget => {
      const newWidget = { ...widget };
      
      // Update positions for each breakpoint
      Object.entries(allLayouts).forEach(([bp, bpLayout]) => {
        const item = bpLayout.find(l => l.i === widget.id);
        if (item) {
          newWidget.position[breakpointMap[bp]] = {
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h
          };
        }
      });
      
      return newWidget;
    });
    
    onLayoutChange({
      ...layout,
      widgets: updatedWidgets
    });
  }, [editMode, layout, onLayoutChange]);
  
  // Handle breakpoint change
  const handleBreakpointChange = useCallback((breakpoint) => {
    setCurrentBreakpoint(breakpoint);
  }, []);
  
  // Get enabled widgets
  const enabledWidgets = useMemo(() => {
    return layout?.widgets?.filter(w => w.enabled) || [];
  }, [layout]);
  
  if (!layout || !layout.widgets) {
    return (
      <div className="text-center py-12 text-gray-500">
        Chargement du dashboard...
      </div>
    );
  }
  
  return (
    <div className={`dashboard-grid ${editMode ? 'edit-mode' : ''}`}>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1024, md: 768, sm: 0 }}
        cols={{ lg: 12, md: 8, sm: 4 }}
        rowHeight={80}
        isDraggable={editMode}
        isResizable={editMode}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={handleBreakpointChange}
        draggableHandle=".widget-drag-handle"
        compactType="vertical"
        preventCollision={false}
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {enabledWidgets.map(widget => (
          <div 
            key={widget.id} 
            className={`dashboard-widget ${editMode ? 'editable' : ''}`}
          >
            {children && typeof children === 'function' 
              ? children(widget, editMode)
              : children
            }
          </div>
        ))}
      </ResponsiveGridLayout>
      
      <style jsx global>{`
        .dashboard-grid {
          width: 100%;
        }
        
        .dashboard-widget {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
          overflow: hidden;
          transition: box-shadow 0.2s;
        }
        
        .dashboard-widget:hover {
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        
        .dashboard-widget.editable {
          border: 2px dashed #e5e7eb;
        }
        
        .dashboard-widget.editable:hover {
          border-color: #3b82f6;
        }
        
        .react-grid-item.react-grid-placeholder {
          background: #3b82f6;
          opacity: 0.2;
          border-radius: 0.75rem;
        }
        
        .react-grid-item.react-draggable-dragging {
          z-index: 100;
          opacity: 0.8;
        }
        
        .react-grid-item > .react-resizable-handle {
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .dashboard-widget.editable:hover > .react-resizable-handle {
          opacity: 1;
        }
        
        .react-resizable-handle::after {
          border-color: #3b82f6 !important;
        }
        
        /* Dark mode support */
        .dark .dashboard-widget {
          background: #1f2937;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.3);
        }
        
        .dark .dashboard-widget.editable {
          border-color: #374151;
        }
        
        .dark .dashboard-widget.editable:hover {
          border-color: #3b82f6;
        }
      `}</style>
    </div>
  );
}
