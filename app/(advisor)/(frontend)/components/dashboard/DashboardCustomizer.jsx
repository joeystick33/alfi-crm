'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/app/_common/components/ui/Card';
import { 
  Settings,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Layout,
  Sparkles
} from 'lucide-react';
import { WIDGET_REGISTRY, getAllWidgets, getDefaultSettings } from '@/lib/dashboard/widget-registry';
import { LAYOUT_PRESETS, getPresetById } from '@/lib/dashboard/layout-presets';
import { apiCall } from '@/app/_common/lib/api-client';

export default function DashboardCustomizer({ 
  currentLayout, 
  onLayoutChange, 
  onClose,
  userRole = 'ADVISOR'
}) {
  const [widgets, setWidgets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState('default');
  const [expandedWidget, setExpandedWidget] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    initializeWidgets();
  }, [currentLayout]);

  const initializeWidgets = () => {
    const allWidgets = getAllWidgets();
    const widgetsWithState = allWidgets.map(widget => {
      const currentWidget = currentLayout?.widgets?.find(w => w.type === widget.type);
      return {
        ...widget,
        enabled: currentWidget?.enabled ?? true,
        settings: currentWidget?.settings || getDefaultSettings(widget.type)
      };
    });
    setWidgets(widgetsWithState);
  };

  const toggleWidget = (widgetType) => {
    if (WIDGET_REGISTRY[widgetType]?.required) return;
    
    setWidgets(prev => prev.map(w => 
      w.type === widgetType ? { ...w, enabled: !w.enabled } : w
    ));
    setHasChanges(true);
  };

  const updateWidgetSetting = (widgetType, settingKey, value) => {
    setWidgets(prev => prev.map(w => 
      w.type === widgetType 
        ? { ...w, settings: { ...w.settings, [settingKey]: value } }
        : w
    ));
    setHasChanges(true);
  };

  const toggleWidgetExpanded = (widgetType) => {
    setExpandedWidget(expandedWidget === widgetType ? null : widgetType);
  };

  const applyPreset = (presetId) => {
    const preset = getPresetById(presetId);
    if (!preset) return;

    setSelectedPreset(presetId);
    
    const presetWidgets = getAllWidgets().map(widget => {
      const presetWidget = preset.widgets.find(w => w.type === widget.type);
      return {
        ...widget,
        enabled: !!presetWidget,
        settings: presetWidget?.settings || getDefaultSettings(widget.type)
      };
    });
    
    setWidgets(presetWidgets);
    setHasChanges(true);
  };

  const resetToDefault = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser aux paramètres par défaut ?')) {
      applyPreset('default');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const layoutData = {
        widgets: widgets.map(w => ({
          type: w.type,
          enabled: w.enabled,
          settings: w.settings
        }))
      };

      await apiCall('/api/advisor/dashboard/layout', {
        method: 'PUT',
        body: JSON.stringify(layoutData)
      });

      setSaveSuccess(true);
      setHasChanges(false);
      
      if (onLayoutChange) {
        onLayoutChange(layoutData);
      }

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde des préférences');
    } finally {
      setSaving(false);
    }
  };

  const renderSettingInput = (widget, setting) => {
    const currentValue = widget.settings[setting.key] ?? setting.default;

    switch (setting.type) {
      case 'boolean':
        return (
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-slate-700">{setting.label}</span>
            <button
              type="button"
              onClick={() => updateWidgetSetting(widget.type, setting.key, !currentValue)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                currentValue ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  currentValue ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        );

      case 'number':
        return (
          <div>
            <label className="block text-sm text-slate-700 mb-1">
              {setting.label}
            </label>
            <input
              type="number"
              min={setting.min}
              max={setting.max}
              value={currentValue}
              onChange={(e) => updateWidgetSetting(widget.type, setting.key, parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );

      case 'select':
        return (
          <div>
            <label className="block text-sm text-slate-700 mb-1">
              {setting.label}
            </label>
            <select
              value={currentValue}
              onChange={(e) => updateWidgetSetting(widget.type, setting.key, e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {setting.options.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'multiselect':
        return (
          <div>
            <label className="block text-sm text-slate-700 mb-2">
              {setting.label}
            </label>
            <div className="space-y-2">
              {setting.options.map(opt => {
                const isSelected = currentValue?.includes(opt.value);
                return (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const newValue = e.target.checked
                          ? [...(currentValue || []), opt.value]
                          : (currentValue || []).filter(v => v !== opt.value);
                        updateWidgetSetting(widget.type, setting.key, newValue);
                      }}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getWidgetIcon = (iconName) => {
    const icons = {
      BarChart3: Settings,
      Calendar: Settings,
      CheckSquare: Settings,
      CalendarDays: Settings,
      Mail: Settings,
      AlertTriangle: Settings,
      Bell: Settings,
      TrendingUp: Settings,
      FileText: Settings,
      Megaphone: Settings,
      Users: Settings
    };
    return icons[iconName] || Settings;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardContent className="p-6 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Personnaliser le dashboard
                </h2>
                <p className="text-sm text-slate-600">
                  Configurez vos widgets et leur affichage
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          {/* Presets Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Layout className="h-4 w-4 inline mr-1" />
              Modèles prédéfinis
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {LAYOUT_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={`p-3 border-2 rounded-lg text-left transition-all ${
                    selectedPreset === preset.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className={`h-4 w-4 ${
                      selectedPreset === preset.id ? 'text-blue-600' : 'text-slate-400'
                    }`} />
                    <span className="font-medium text-sm text-slate-900">
                      {preset.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Widgets List */}
          <div className="flex-1 overflow-y-auto mb-6">
            <h3 className="text-sm font-medium text-slate-700 mb-3">
              Widgets disponibles ({widgets.filter(w => w.enabled).length}/{widgets.length})
            </h3>
            <div className="space-y-2">
              {widgets.map(widget => {
                const Icon = getWidgetIcon(widget.icon);
                const isExpanded = expandedWidget === widget.type;
                const hasSettings = widget.availableSettings && widget.availableSettings.length > 0;

                return (
                  <div
                    key={widget.type}
                    className={`border rounded-lg transition-all ${
                      widget.enabled ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    {/* Widget Header */}
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${
                          widget.enabled ? 'bg-blue-50' : 'bg-slate-100'
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            widget.enabled ? 'text-blue-600' : 'text-slate-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-medium text-sm ${
                              widget.enabled ? 'text-slate-900' : 'text-slate-500'
                            }`}>
                              {widget.name}
                            </h4>
                            {widget.required && (
                              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs rounded-full">
                                Requis
                              </span>
                            )}
                            {widget.roleRequired && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                {widget.roleRequired.join(', ')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {widget.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasSettings && (
                          <button
                            onClick={() => toggleWidgetExpanded(widget.type)}
                            disabled={!widget.enabled}
                            className={`p-2 rounded-lg transition-colors ${
                              widget.enabled
                                ? 'hover:bg-slate-100 text-slate-600'
                                : 'text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => toggleWidget(widget.type)}
                          disabled={widget.required}
                          className={`p-2 rounded-lg transition-colors ${
                            widget.required
                              ? 'cursor-not-allowed opacity-50'
                              : 'hover:bg-slate-100'
                          }`}
                        >
                          {widget.enabled ? (
                            <Eye className="h-5 w-5 text-blue-600" />
                          ) : (
                            <EyeOff className="h-5 w-5 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Widget Settings */}
                    {isExpanded && hasSettings && widget.enabled && (
                      <div className="px-4 pb-4 border-t border-slate-200">
                        <div className="pt-4 space-y-4">
                          {widget.availableSettings.map(setting => (
                            <div key={setting.key}>
                              {renderSettingInput(widget, setting)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              onClick={resetToDefault}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="text-sm font-medium">Réinitialiser</span>
            </button>

            <div className="flex items-center gap-3">
              {saveSuccess && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <Check className="h-4 w-4" />
                  <span>Sauvegardé</span>
                </div>
              )}
              <button
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
