// ✅ hooks/useCurrencyFormatter.ts
// Hook pour formater les montants en euros

import { useCallback, useMemo } from 'react';

export const useCurrencyFormatter = () => {
  // Formatter memoïzé pour éviter de le recréer
  const formatter = useMemo(() => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    });
  }, []);

  // Fonction de formatage memoïzée
  const formatCurrency = useCallback(
    (value: number | undefined | null): string => {
      if (value === undefined || value === null) {
        return formatter.format(0);
      }
      return formatter.format(value);
    },
    [formatter]
  );

  return formatCurrency;
};

// Hook alternatif avec options configurables
export const useCurrencyFormatterWithOptions = (
  options?: Intl.NumberFormatOptions
) => {
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
    ...options,
  };

  const formatter = useMemo(() => {
    return new Intl.NumberFormat('fr-FR', defaultOptions);
  }, [defaultOptions]);

  const formatCurrency = useCallback(
    (value: number | undefined | null): string => {
      if (value === undefined || value === null) {
        return formatter.format(0);
      }
      return formatter.format(value);
    },
    [formatter]
  );

  return formatCurrency;
};

// Hook pour formater les pourcentages
export const usePercentageFormatter = () => {
  const formatter = useMemo(() => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }, []);

  const formatPercentage = useCallback(
    (value: number | undefined | null): string => {
      if (value === undefined || value === null) {
        return formatter.format(0);
      }
      // Convertir de 0-100 à 0-1
      return formatter.format(value / 100);
    },
    [formatter]
  );

  return formatPercentage;
};

// Hook pour formater les nombres simples
export const useNumberFormatter = () => {
  const formatter = useMemo(() => {
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0,
    });
  }, []);

  const formatNumber = useCallback(
    (value: number | undefined | null): string => {
      if (value === undefined || value === null) {
        return formatter.format(0);
      }
      return formatter.format(value);
    },
    [formatter]
  );

  return formatNumber;
};
