'use client';

/**
 * Panneau configuration Dashboard
 * Permet personnalisation widgets, layout, ordre
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Settings, 
  GripVertical, 
  Eye, 
  EyeOff,
  Maximize2,
  Minimize2,
  RotateCcw
} from 'lucide-react';
import { useDashboardConfig } from '@/lib/hooks/useDashboardConfig';

export default function DashboardConfigPanel() {
  const [open, setOpen] = useState(false);
  const {
    widgets,
    layout,
    toggleWidget,
    resizeWidget,
    saveLayout,
    resetConfig,
  } = useDashboardConfig();

  const [draggedItem, setDraggedItem] = useState(null);

  const handleDragStart = (e, widget) => {
    setDraggedItem(widget);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetWidget) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetWidget.id) return;

    // Réorganiser
    const draggedIndex = widgets.findIndex(w => w.id === draggedItem.id);
    const targetIndex = widgets.findIndex(w => w.id === targetWidget.id);

    const newWidgets = [...widgets];
    const [removed] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, removed);

    // Réindexer
    const reindexed = newWidgets.map((w, index) => ({ ...w, order: index }));
    localStorage.setItem('dashboard_widgets', JSON.stringify(reindexed));
    window.location.reload(); // Forcer rechargement
  };

  const handleReset = () => {
    if (confirm('Réinitialiser la configuration du dashboard ? Cette action est irréversible.')) {
      resetConfig();
      window.location.reload();
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-50 bg-white hover:bg-gray-50"
        title="Personnaliser le dashboard"
      >
        <Settings className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Configuration du Dashboard</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Réinitialiser
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 py-4">
            {/* Options générales */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Options générales</h3>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">Sidebar Services</Label>
                  <p className="text-sm text-gray-600">Afficher la barre latérale droite</p>
                </div>
                <Switch
                  checked={layout.servicesSidebarVisible}
                  onCheckedChange={(checked) => 
                    saveLayout({ servicesSidebarVisible: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">Mode compact</Label>
                  <p className="text-sm text-gray-600">Réduire les espacements</p>
                </div>
                <Switch
                  checked={layout.compactMode}
                  onCheckedChange={(checked) => 
                    saveLayout({ compactMode: checked })
                  }
                />
              </div>
            </div>

            {/* Widgets */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Widgets</h3>
                <p className="text-sm text-gray-600">
                  {widgets.filter(w => w.enabled).length} / {widgets.length} actifs
                </p>
              </div>

              <div className="space-y-2">
                {widgets.map((widget) => (
                  <div
                    key={widget.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, widget)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, widget)}
                    className={`
                      p-3 border rounded-lg cursor-move transition-all
                      ${widget.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200'}
                      hover:shadow-md hover:border-gray-300
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {widget.name}
                          </span>
                          {!widget.enabled && (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600">
                          Taille: {widget.size === 'full' ? 'Pleine largeur' : 'Demi-largeur'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Bouton taille */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newSize = widget.size === 'full' ? 'half' : 'full';
                            resizeWidget(widget.id, newSize);
                          }}
                          disabled={!widget.enabled}
                          title={widget.size === 'full' ? 'Réduire' : 'Agrandir'}
                        >
                          {widget.size === 'full' ? (
                            <Minimize2 className="w-4 h-4" />
                          ) : (
                            <Maximize2 className="w-4 h-4" />
                          )}
                        </Button>

                        {/* Toggle visibilité */}
                        <Switch
                          checked={widget.enabled}
                          onCheckedChange={() => toggleWidget(widget.id)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  💡 <strong>Astuce:</strong> Glissez-déposez les widgets pour réorganiser votre dashboard.
                  Activez/désactivez les widgets selon vos besoins.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Fermer
            </Button>
            <Button onClick={() => {
              setOpen(false);
              window.location.reload();
            }}>
              Appliquer les changements
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
