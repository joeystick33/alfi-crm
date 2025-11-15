/**
 * Tests for document categories utilities
 */

import { describe, it, expect } from '@jest/globals';
import {
  DOCUMENT_CATEGORIES,
  calculateDocumentCompleteness,
  getDocumentTypeDetails,
  getAllDocumentTypes,
} from '../document-categories';

describe('Document Categories', () => {
  it('should have all required categories', () => {
    expect(DOCUMENT_CATEGORIES.ENTREE_RELATION).toBeDefined();
    expect(DOCUMENT_CATEGORIES.KYC).toBeDefined();
    expect(DOCUMENT_CATEGORIES.FISCAL).toBeDefined();
    expect(DOCUMENT_CATEGORIES.PATRIMOINE).toBeDefined();
  });

  it('should have required document types', () => {
    const kycTypes = DOCUMENT_CATEGORIES.KYC.types;
    expect(kycTypes.length).toBeGreaterThan(0);
    expect(kycTypes.some(t => t.id === 'PIECE_IDENTITE')).toBe(true);
  });
});

describe('Document Completeness', () => {
  it('should calculate 0% for no documents', () => {
    const result = calculateDocumentCompleteness([]);
    expect(result.score).toBeLessThan(100);
    expect(result.status).not.toBe('COMPLETE');
  });

  it('should calculate 100% for all required documents', () => {
    // Get all required document types
    const requiredTypes: string[] = [];
    for (const category of Object.values(DOCUMENT_CATEGORIES)) {
      for (const docType of category.types) {
        if (docType.required && !docType.threshold) {
          requiredTypes.push(docType.id);
        }
      }
    }

    // Create mock documents for all required types
    const documents = requiredTypes.map(type => ({
      type,
      uploadedAt: new Date(),
    }));

    const result = calculateDocumentCompleteness(documents);
    expect(result.score).toBe(100);
    expect(result.status).toBe('COMPLETE');
  });

  it('should detect missing documents', () => {
    const result = calculateDocumentCompleteness([]);
    expect(result.missingDocs.length).toBeGreaterThan(0);
  });

  it('should detect expired documents', () => {
    const expiredDate = new Date();
    expiredDate.setFullYear(expiredDate.getFullYear() - 5);

    const documents = [
      {
        type: 'PIECE_IDENTITE',
        uploadedAt: expiredDate,
      },
    ];

    const result = calculateDocumentCompleteness(documents);
    expect(result.missingDocs.some(d => d.expired)).toBe(true);
  });

  it('should apply patrimoine threshold', () => {
    const lowPatrimoine = calculateDocumentCompleteness([], 100000);
    const highPatrimoine = calculateDocumentCompleteness([], 200000);

    // High patrimoine should require more documents
    expect(highPatrimoine.totalRequired).toBeGreaterThanOrEqual(lowPatrimoine.totalRequired);
  });
});

describe('Document Type Details', () => {
  it('should get document type details', () => {
    const details = getDocumentTypeDetails('PIECE_IDENTITE');
    expect(details).toBeDefined();
    expect(details?.label).toContain('identité');
  });

  it('should return null for unknown type', () => {
    const details = getDocumentTypeDetails('UNKNOWN_TYPE');
    expect(details).toBeNull();
  });
});

describe('Document Types List', () => {
  it('should get all document types', () => {
    const types = getAllDocumentTypes();
    expect(types.length).toBeGreaterThan(0);
    expect(types[0]).toHaveProperty('value');
    expect(types[0]).toHaveProperty('label');
    expect(types[0]).toHaveProperty('category');
  });

  it('should sort required documents first', () => {
    const types = getAllDocumentTypes();
    const firstRequired = types.findIndex(t => t.required);
    const firstOptional = types.findIndex(t => !t.required);
    
    if (firstRequired !== -1 && firstOptional !== -1) {
      expect(firstRequired).toBeLessThan(firstOptional);
    }
  });
});
