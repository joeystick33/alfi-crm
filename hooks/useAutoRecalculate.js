/**
 * useAutoRecalculate Hook
 * Automatically recalculates metrics when dependencies change
 */

import { useEffect, useMemo, useCallback } from 'react';

/**
 * Hook pour recalculer automatiquement les métriques patrimoniales
 */
export function usePatrimoineRecalculate(assets, liabilities, onUpdate) {
  const metrics = useMemo(() => {
    const totalAssets = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + (l.remainingAmount || 0), 0);
    const netWealth = totalAssets - totalLiabilities;
    const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
    
    return {
      totalAssets,
      totalLiabilities,
      netWealth,
      debtRatio,
      lastUpdated: new Date(),
    };
  }, [assets, liabilities]);

  useEffect(() => {
    if (onUpdate) {
      onUpdate(metrics);
    }
  }, [metrics, onUpdate]);

  return metrics;
}

/**
 * Hook pour recalculer automatiquement les métriques fiscales
 */
export function useTaxRecalculate(taxation, revenue, onUpdate) {
  const taxMetrics = useMemo(() => {
    const ir = taxation?.incomeTax?.annualAmount || 0;
    const ifi = taxation?.ifi?.ifiAmount || 0;
    const ps = (taxation?.socialContributions?.taxableAssetIncome || 0) * 0.172;
    
    const totalTaxes = ir + ifi + ps;
    const pressureRate = revenue > 0 ? (totalTaxes / revenue) * 100 : 0;
    
    return {
      totalTaxes,
      pressureRate,
      lastUpdated: new Date(),
    };
  }, [taxation, revenue]);

  useEffect(() => {
    if (onUpdate) {
      onUpdate(taxMetrics);
    }
  }, [taxMetrics, onUpdate]);

  return taxMetrics;
}

/**
 * Hook pour recalculer automatiquement les métriques familiales
 */
export function useFamilyRecalculate(client, familyMembers, onUpdate) {
  const familyMetrics = useMemo(() => {
    let shares = 1;
    
    // Conjoint
    const spouse = familyMembers.find(m => m.relationshipType === 'SPOUSE');
    if (spouse) shares += 1;
    
    // Enfants à charge
    const dependentChildren = familyMembers.filter(m => 
      m.relationshipType === 'CHILD' && 
      m.isDependent
    );
    
    dependentChildren.forEach((child, index) => {
      if (index < 2) shares += 0.5;
      else shares += 1;
    });
    
    // Revenu du foyer
    let totalIncome = client.professionalIncome?.netSalary || 0;
    if (spouse) totalIncome += spouse.annualIncome || 0;
    
    return {
      taxShares: shares,
      householdIncome: totalIncome,
      dependentChildren: dependentChildren.length,
      lastUpdated: new Date(),
    };
  }, [client, familyMembers]);

  useEffect(() => {
    if (onUpdate) {
      onUpdate(familyMetrics);
    }
  }, [familyMetrics, onUpdate]);

  return familyMetrics;
}

/**
 * Hook pour déclencher un refresh automatique
 */
export function useAutoRefresh(dependencies, onRefresh, delay = 1000) {
  const debouncedRefresh = useCallback(() => {
    const timer = setTimeout(() => {
      if (onRefresh) {
        onRefresh();
      }
    }, delay);
    
    return () => clearTimeout(timer);
  }, [onRefresh, delay]);

  useEffect(() => {
    return debouncedRefresh();
  }, dependencies);
}
