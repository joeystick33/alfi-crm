import { createContext, useContext, useState } from 'react';

const TabsContext = createContext();

export function Tabs({ defaultValue, value, onValueChange, children, className = '' }) {
  const [selectedTab, setSelectedTab] = useState(defaultValue || '');
  const currentValue = value !== undefined ? value : selectedTab;

  const handleChange = (newValue) => {
    if (value === undefined) setSelectedTab(newValue);
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onChange: handleChange }}>
      <div className={`${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = '' }) {
  return (
    <div
      role="tablist"
      className={`flex border-b border-gray-200 dark:border-gray-700 ${className}`}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className = '', disabled = false }) {
  const context = useContext(TabsContext);
  const isSelected = context.value === value;

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isSelected}
      aria-controls={`panel-${value}`}
      id={`tab-${value}`}
      disabled={disabled}
      onClick={() => !disabled && context.onChange(value)}
      className={`
        px-4 py-3 text-sm font-medium transition-all
        border-b-2 -mb-px
        ${isSelected
          ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${className}
      `}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className = '' }) {
  const context = useContext(TabsContext);
  const isSelected = context.value === value;

  if (!isSelected) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      tabIndex={0}
      className={`py-4 focus:outline-none ${className}`}
    >
      {children}
    </div>
  );
}
