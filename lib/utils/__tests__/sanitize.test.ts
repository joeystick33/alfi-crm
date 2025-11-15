/**
 * Tests for sanitization utilities
 */

import { describe, it, expect } from '@jest/globals';
import {
  sanitizeHtml,
  sanitizeText,
  escapeHtml,
  sanitizeUrl,
  sanitizeFilename,
  sanitizeTemplateVariable,
} from '../sanitize';

describe('HTML Sanitization', () => {
  it('should sanitize dangerous HTML', () => {
    const dangerous = '<script>alert("xss")</script><p>Safe content</p>';
    const sanitized = sanitizeHtml(dangerous);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('Safe content');
  });

  it('should allow safe HTML tags', () => {
    const safe = '<p>Hello <strong>World</strong></p>';
    const sanitized = sanitizeHtml(safe);
    expect(sanitized).toContain('<p>');
    expect(sanitized).toContain('<strong>');
  });

  it('should convert to text only', () => {
    const html = '<p>Hello <strong>World</strong></p>';
    const text = sanitizeText(html);
    expect(text).not.toContain('<strong>');
  });
});

describe('HTML Escaping', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    expect(escapeHtml('"quotes"')).toContain('&quot;');
    expect(escapeHtml("'apostrophe'")).toContain('&#x27;');
  });

  it('should handle empty strings', () => {
    expect(escapeHtml('')).toBe('');
  });
});

describe('URL Sanitization', () => {
  it('should allow valid HTTP URLs', () => {
    const url = 'https://example.com';
    expect(sanitizeUrl(url)).toBe(url);
  });

  it('should block javascript: URLs', () => {
    const dangerous = 'javascript:alert("xss")';
    expect(sanitizeUrl(dangerous)).toBe('');
  });

  it('should block data: URLs', () => {
    const dangerous = 'data:text/html,<script>alert("xss")</script>';
    expect(sanitizeUrl(dangerous)).toBe('');
  });
});

describe('Filename Sanitization', () => {
  it('should remove dangerous characters', () => {
    const dangerous = '../../../etc/passwd';
    const sanitized = sanitizeFilename(dangerous);
    expect(sanitized).not.toContain('..');
    expect(sanitized).not.toContain('/');
  });

  it('should allow safe filenames', () => {
    const safe = 'document-2024.pdf';
    const sanitized = sanitizeFilename(safe);
    expect(sanitized).toBe(safe);
  });

  it('should handle empty strings', () => {
    expect(sanitizeFilename('')).toBe('file');
  });
});

describe('Template Variable Sanitization', () => {
  it('should sanitize and truncate long strings', () => {
    const longString = 'a'.repeat(2000);
    const sanitized = sanitizeTemplateVariable(longString);
    expect(sanitized.length).toBeLessThanOrEqual(1000);
  });

  it('should escape HTML in variables', () => {
    const dangerous = '<script>alert("xss")</script>';
    const sanitized = sanitizeTemplateVariable(dangerous);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('&lt;');
  });
});
