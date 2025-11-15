/**
 * Tests for plan definitions utilities
 */

import { describe, it, expect } from '@jest/globals';
import {
  PLAN_DEFINITIONS,
  getPlanDefinition,
  getAllPlans,
  isUnlimited,
  formatQuota,
  calculateMRR,
  getNextPlan,
  comparePlans,
} from '../plan-definitions';

describe('Plan Definitions', () => {
  it('should have all required plans', () => {
    expect(PLAN_DEFINITIONS.TRIAL).toBeDefined();
    expect(PLAN_DEFINITIONS.STARTER).toBeDefined();
    expect(PLAN_DEFINITIONS.PROFESSIONAL).toBeDefined();
    expect(PLAN_DEFINITIONS.ENTERPRISE).toBeDefined();
    expect(PLAN_DEFINITIONS.CUSTOM).toBeDefined();
  });

  it('should get plan definition', () => {
    const trial = getPlanDefinition('TRIAL');
    expect(trial.name).toBe('Trial');
    expect(trial.price).toBe(0);
  });

  it('should return TRIAL for unknown plan', () => {
    const unknown = getPlanDefinition('UNKNOWN');
    expect(unknown.name).toBe('Trial');
  });

  it('should get all plans', () => {
    const plans = getAllPlans();
    expect(plans.length).toBeGreaterThan(0);
    expect(plans[0]).toHaveProperty('key');
    expect(plans[0]).toHaveProperty('name');
  });
});

describe('Quota Utilities', () => {
  it('should detect unlimited quotas', () => {
    expect(isUnlimited(-1)).toBe(true);
    expect(isUnlimited(0)).toBe(false);
    expect(isUnlimited(100)).toBe(false);
  });

  it('should format quotas', () => {
    expect(formatQuota(-1)).toBe('Illimité');
    expect(formatQuota(100)).toBe('100');
  });
});

describe('Plan Calculations', () => {
  it('should calculate MRR', () => {
    expect(calculateMRR('TRIAL')).toBe(0);
    expect(calculateMRR('STARTER')).toBe(49);
    expect(calculateMRR('PROFESSIONAL')).toBe(99);
    expect(calculateMRR('CUSTOM', 299)).toBe(299);
  });

  it('should get next plan', () => {
    expect(getNextPlan('TRIAL')).toBe('STARTER');
    expect(getNextPlan('STARTER')).toBe('PROFESSIONAL');
    expect(getNextPlan('PROFESSIONAL')).toBe('ENTERPRISE');
    expect(getNextPlan('ENTERPRISE')).toBeNull();
  });

  it('should compare plans', () => {
    expect(comparePlans('TRIAL', 'STARTER')).toBeLessThan(0);
    expect(comparePlans('ENTERPRISE', 'TRIAL')).toBeGreaterThan(0);
    expect(comparePlans('STARTER', 'STARTER')).toBe(0);
  });
});
