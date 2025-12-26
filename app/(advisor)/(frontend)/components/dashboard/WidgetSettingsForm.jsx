'use client';

import { useState, useEffect } from 'react';
import { 
  AlertCircle,
  Info,
  Check,
  X
} from 'lucide-react';
import { 
  getWidgetConfig, 
  validateWidgetSettings,
  getDefaultSettings 
} from '@/lib/dashboard/widget-registry';

/**
 * WidgetSettingsForm Component
 * Generates dynamic forms based on widget registry configuration
 * Supports: boolean, number, select, multiselect, text, color
 */
export default function WidgetSettingsForm({ 
  widgetType,
  initialSettings = {},
  onChange,
  onValidationChange,
  showLabels = true,
  compact = false
}) {
  const [settings, setSettings] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const widgetConfig = getWidgetConfig(widgetType);

  useEffect(() => {
    if (widgetConfig) {
      const defaultSettings = getDefaultSettings(widgetType);
      setSettings({ ...defaultSettings, ...initialSettings });
    }
  }, [widgetType, initialSettings]);

  useEffect(() => {
    // Validate on settings change
    if (widgetConfig) {
      const validation = validateWidgetSettings(widgetType, settings);
      const fieldErrors = {};
      
      validation.errors.forEach(error => {
        const setting = widgetConfig.availableSettings?.find(s => 
          error.includes(s.label)
        );
        if (setting) {
          fieldErrors[setting.key] = error;
        }
      });
      
      setErrors(fieldErrors);
      
      if (onValidationChange) {
        onValidationChange(validation.valid, validation.errors);
      }
    }
  }, [settings, widgetType, onValidationChange]);

  const handleChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setTouched({ ...touched, [key]: true });
    
    if (onChange) {
      onChange(newSettings);
    }
  };

  const handleBlur = (key) => {
    setTouched({ ...touched, [key]: true });
  };

  if (!widgetConfig || !widgetConfig.availableSettings) {
    return (
      <div className="text-center py-4 text-sm text-slate-500">
        Aucun paramètre disponible pour ce widget
      </div>
    );
  }

  const renderBooleanInput = (setting) => {
    const value = settings[setting.key] ?? setting.default;
    const hasError = touched[setting.key] && errors[setting.key];

    return (
      <div className={compact ? 'space-y-1' : 'space-y-2'}>
        <label className="flex items-center justify-between cursor-pointer group">
          <div className="flex-1">
            {showLabels && (
              <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'} text-slate-700 group-hover:text-slate-900`}>
                {setting.label}
              </span>
            )}
            {setting.description && (
              <p className={`${compact ? 'text-xs' : 'text-xs'} text-slate-500 mt-0.5`}>
                {setting.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleChange(setting.key, !value)}
            onBlur={() => handleBlur(setting.key)}
            className={`relative inline-flex ${compact ? 'h-5 w-9' : 'h-6 w-11'} items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              value ? 'bg-blue-600' : 'bg-slate-300'
            } ${hasError ? 'ring-2 ring-red-500' : ''}`}
            aria-checked={value}
            role="switch"
          >
            <span
              className={`inline-block ${compact ? 'h-3 w-3' : 'h-4 w-4'} transform rounded-full bg-white transition-transform ${
                value ? (compact ? 'translate-x-5' : 'translate-x-6') : 'translate-x-1'
              }`}
            />
          </button>
        </label>
        {hasError && (
          <div className="flex items-center gap-1 text-red-600 text-xs">
            <AlertCircle className="h-3 w-3" />
            <span>{errors[setting.key]}</span>
          </div>
        )}
      </div>
    );
  };

  const renderNumberInput = (setting) => {
    const value = settings[setting.key] ?? setting.default;
    const hasError = touched[setting.key] && errors[setting.key];

    return (
      <div className={compact ? 'space-y-1' : 'space-y-2'}>
        {showLabels && (
          <label className={`block font-medium ${compact ? 'text-xs' : 'text-sm'} text-slate-700`}>
            {setting.label}
            {setting.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        {setting.description && (
          <p className="text-xs text-slate-500">{setting.description}</p>
        )}
        <div className="relative">
          <input
            type="number"
            min={setting.min}
            max={setting.max}
            step={setting.step || 1}
            value={value}
            onChange={(e) => handleChange(setting.key, parseFloat(e.target.value) || 0)}
            onBlur={() => handleBlur(setting.key)}
            className={`w-full ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              hasError 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-slate-300'
            }`}
            placeholder={setting.placeholder}
          />
          {(setting.min !== undefined || setting.max !== undefined) && (
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
              <Info className="h-3 w-3" />
              <span>
                {setting.min !== undefined && setting.max !== undefined
                  ? `Entre ${setting.min} et ${setting.max}`
                  : setting.min !== undefined
                  ? `Minimum: ${setting.min}`
                  : `Maximum: ${setting.max}`}
              </span>
            </div>
          )}
        </div>
        {hasError && (
          <div className="flex items-center gap-1 text-red-600 text-xs">
            <AlertCircle className="h-3 w-3" />
            <span>{errors[setting.key]}</span>
          </div>
        )}
      </div>
    );
  };

  const renderSelectInput = (setting) => {
    const value = settings[setting.key] ?? setting.default;
    const hasError = touched[setting.key] && errors[setting.key];

    return (
      <div className={compact ? 'space-y-1' : 'space-y-2'}>
        {showLabels && (
          <label className={`block font-medium ${compact ? 'text-xs' : 'text-sm'} text-slate-700`}>
            {setting.label}
            {setting.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        {setting.description && (
          <p className="text-xs text-slate-500">{setting.description}</p>
        )}
        <select
          value={value}
          onChange={(e) => handleChange(setting.key, e.target.value)}
          onBlur={() => handleBlur(setting.key)}
          className={`w-full ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            hasError 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-slate-300'
          }`}
        >
          {setting.placeholder && (
            <option value="" disabled>
              {setting.placeholder}
            </option>
          )}
          {setting.options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hasError && (
          <div className="flex items-center gap-1 text-red-600 text-xs">
            <AlertCircle className="h-3 w-3" />
            <span>{errors[setting.key]}</span>
          </div>
        )}
      </div>
    );
  };

  const renderMultiSelectInput = (setting) => {
    const value = settings[setting.key] ?? setting.default ?? [];
    const hasError = touched[setting.key] && errors[setting.key];

    return (
      <div className={compact ? 'space-y-1' : 'space-y-2'}>
        {showLabels && (
          <label className={`block font-medium ${compact ? 'text-xs' : 'text-sm'} text-slate-700`}>
            {setting.label}
            {setting.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        {setting.description && (
          <p className="text-xs text-slate-500">{setting.description}</p>
        )}
        <div className={`space-y-2 ${compact ? 'p-2' : 'p-3'} border rounded-lg ${
          hasError ? 'border-red-500' : 'border-slate-300'
        }`}>
          {setting.options.map(opt => {
            const isSelected = value.includes(opt.value);
            return (
              <label 
                key={opt.value} 
                className="flex items-center gap-2 cursor-pointer group"
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const newValue = e.target.checked
                        ? [...value, opt.value]
                        : value.filter(v => v !== opt.value);
                      handleChange(setting.key, newValue);
                    }}
                    onBlur={() => handleBlur(setting.key)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  {isSelected && (
                    <Check className="h-3 w-3 text-white absolute top-0.5 left-0.5 pointer-events-none" />
                  )}
                </div>
                <span className={`${compact ? 'text-xs' : 'text-sm'} text-slate-700 group-hover:text-slate-900`}>
                  {opt.label}
                </span>
                {opt.description && (
                  <span className="text-xs text-slate-500">
                    ({opt.description})
                  </span>
                )}
              </label>
            );
          })}
        </div>
        {hasError && (
          <div className="flex items-center gap-1 text-red-600 text-xs">
            <AlertCircle className="h-3 w-3" />
            <span>{errors[setting.key]}</span>
          </div>
        )}
      </div>
    );
  };

  const renderTextInput = (setting) => {
    const value = settings[setting.key] ?? setting.default ?? '';
    const hasError = touched[setting.key] && errors[setting.key];

    return (
      <div className={compact ? 'space-y-1' : 'space-y-2'}>
        {showLabels && (
          <label className={`block font-medium ${compact ? 'text-xs' : 'text-sm'} text-slate-700`}>
            {setting.label}
            {setting.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        {setting.description && (
          <p className="text-xs text-slate-500">{setting.description}</p>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(setting.key, e.target.value)}
          onBlur={() => handleBlur(setting.key)}
          maxLength={setting.maxLength}
          className={`w-full ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            hasError 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-slate-300'
          }`}
          placeholder={setting.placeholder}
        />
        {setting.maxLength && (
          <div className="text-xs text-slate-500 text-right">
            {value.length}/{setting.maxLength}
          </div>
        )}
        {hasError && (
          <div className="flex items-center gap-1 text-red-600 text-xs">
            <AlertCircle className="h-3 w-3" />
            <span>{errors[setting.key]}</span>
          </div>
        )}
      </div>
    );
  };

  const renderColorInput = (setting) => {
    const value = settings[setting.key] ?? setting.default ?? '#000000';
    const hasError = touched[setting.key] && errors[setting.key];

    return (
      <div className={compact ? 'space-y-1' : 'space-y-2'}>
        {showLabels && (
          <label className={`block font-medium ${compact ? 'text-xs' : 'text-sm'} text-slate-700`}>
            {setting.label}
            {setting.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        {setting.description && (
          <p className="text-xs text-slate-500">{setting.description}</p>
        )}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            onBlur={() => handleBlur(setting.key)}
            className={`${compact ? 'w-10 h-8' : 'w-12 h-10'} border rounded cursor-pointer ${
              hasError ? 'border-red-500' : 'border-slate-300'
            }`}
          />
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            onBlur={() => handleBlur(setting.key)}
            pattern="^#[0-9A-Fa-f]{6}$"
            className={`flex-1 ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
              hasError 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-slate-300'
            }`}
            placeholder="#000000"
          />
        </div>
        {hasError && (
          <div className="flex items-center gap-1 text-red-600 text-xs">
            <AlertCircle className="h-3 w-3" />
            <span>{errors[setting.key]}</span>
          </div>
        )}
      </div>
    );
  };

  const renderSettingInput = (setting) => {
    switch (setting.type) {
      case 'boolean':
        return renderBooleanInput(setting);
      case 'number':
        return renderNumberInput(setting);
      case 'select':
        return renderSelectInput(setting);
      case 'multiselect':
        return renderMultiSelectInput(setting);
      case 'text':
        return renderTextInput(setting);
      case 'color':
        return renderColorInput(setting);
      default:
        return (
          <div className="text-xs text-slate-500">
            Type de paramètre non supporté: {setting.type}
          </div>
        );
    }
  };

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {widgetConfig.availableSettings.map(setting => (
        <div key={setting.key}>
          {renderSettingInput(setting)}
        </div>
      ))}
    </div>
  );
}

/**
 * WidgetSettingsFormGroup Component
 * Groups multiple settings with a title and description
 */
export function WidgetSettingsFormGroup({ 
  title, 
  description, 
  children,
  collapsible = false,
  defaultExpanded = true
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div 
        className={`px-4 py-3 bg-slate-50 border-b border-slate-200 ${
          collapsible ? 'cursor-pointer hover:bg-slate-100' : ''
        }`}
        onClick={() => collapsible && setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
            {description && (
              <p className="text-xs text-slate-600 mt-0.5">{description}</p>
            )}
          </div>
          {collapsible && (
            <button className="p-1 hover:bg-slate-200 rounded">
              {expanded ? (
                <X className="h-4 w-4 text-slate-600" />
              ) : (
                <Check className="h-4 w-4 text-slate-600" />
              )}
            </button>
          )}
        </div>
      </div>
      {expanded && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * WidgetSettingsPreview Component
 * Shows a preview of current settings
 */
export function WidgetSettingsPreview({ widgetType, settings }) {
  const widgetConfig = getWidgetConfig(widgetType);

  if (!widgetConfig || !settings) {
    return null;
  }

  const settingsArray = Object.entries(settings).filter(([key, value]) => {
    const setting = widgetConfig.availableSettings?.find(s => s.key === key);
    return setting && value !== undefined;
  });

  if (settingsArray.length === 0) {
    return (
      <div className="text-xs text-slate-500 italic">
        Paramètres par défaut
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {settingsArray.map(([key, value]) => {
        const setting = widgetConfig.availableSettings.find(s => s.key === key);
        if (!setting) return null;

        let displayValue = value;
        if (setting.type === 'boolean') {
          displayValue = value ? 'Oui' : 'Non';
        } else if (setting.type === 'select') {
          const option = setting.options.find(opt => opt.value === value);
          displayValue = option?.label || value;
        } else if (setting.type === 'multiselect') {
          displayValue = Array.isArray(value) 
            ? value.map(v => {
                const opt = setting.options.find(o => o.value === v);
                return opt?.label || v;
              }).join(', ')
            : '';
        }

        return (
          <div key={key} className="flex items-center justify-between text-xs">
            <span className="text-slate-600">{setting.label}:</span>
            <span className="text-slate-900 font-medium">{displayValue}</span>
          </div>
        );
      })}
    </div>
  );
}
