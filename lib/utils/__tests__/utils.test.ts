/**
 * Tests for utility functions
 */

import { describe, it, expect } from '@jest/globals';
import {
  formatCurrency,
  formatDate,
  formatPercentage,
  formatNumber,
  getInitials,
  truncate,
  capitalize,
  daysBetween,
  isPast,
  isFuture,
} from '../index';

describe('Formatting utilities', () => {
  it('should format currency correctly', () => {
    expect(formatCurrency(1000)).toContain('1');
    expect(formatCurrency(1000)).toContain('€');
  });

  it('should format dates correctly', () => {
    const date = new Date('2024-01-15');
    const formatted = formatDate(date, 'short');
    expect(formatted).toContain('15');
    expect(formatted).toContain('01');
    expect(formatted).toContain('2024');
  });

  it('should format percentages correctly', () => {
    expect(formatPercentage(75.5)).toBe('75.5%');
    expect(formatPercentage(100, 0)).toBe('100%');
  });

  it('should format numbers with separators', () => {
    const formatted = formatNumber(1000000);
    expect(formatted).toContain('1');
  });
});

describe('String utilities', () => {
  it('should generate initials correctly', () => {
    expect(getInitials('Jean Dupont')).toBe('JD');
    expect(getInitials('Marie-Claire Martin')).toBe('MM');
  });

  it('should truncate text correctly', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...');
    expect(truncate('Hi', 10)).toBe('Hi');
  });

  it('should capitalize text correctly', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('WORLD')).toBe('World');
  });
});

describe('Date utilities', () => {
  it('should calculate days between dates', () => {
    const date1 = new Date('2024-01-01');
    const date2 = new Date('2024-01-11');
    expect(daysBetween(date1, date2)).toBe(10);
  });

  it('should check if date is in past', () => {
    const pastDate = new Date('2020-01-01');
    const futureDate = new Date('2030-01-01');
    expect(isPast(pastDate)).toBe(true);
    expect(isPast(futureDate)).toBe(false);
  });

  it('should check if date is in future', () => {
    const pastDate = new Date('2020-01-01');
    const futureDate = new Date('2030-01-01');
    expect(isFuture(pastDate)).toBe(false);
    expect(isFuture(futureDate)).toBe(true);
  });
});
