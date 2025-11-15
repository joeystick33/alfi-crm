/**
 * Sanitisation HTML pour prévenir XSS
 * Utilise DOMPurify (isomorphic pour SSR)
 */

const DOMPurify = require('isomorphic-dompurify');

/**
 * Configuration stricte par défaut
 */
const DEFAULT_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'a', 'span', 'div', 'blockquote', 'hr', 'table',
    'thead', 'tbody', 'tr', 'th', 'td', 'img'
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'class', 'id', 'style', 'alt', 'src', 'title'
  ],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover'],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  FORCE_BODY: false,
  SANITIZE_DOM: true,
  IN_PLACE: false
};

/**
 * Configuration permissive pour templates emails
 */
const EMAIL_CONFIG = {
  ...DEFAULT_CONFIG,
  ALLOWED_TAGS: [
    ...DEFAULT_CONFIG.ALLOWED_TAGS,
    'font', 'b', 'i', 'center', 'small', 'big'
  ],
  ALLOWED_ATTR: [
    ...DEFAULT_CONFIG.ALLOWED_ATTR,
    'color', 'bgcolor', 'align', 'valign', 'width', 'height', 'border',
    'cellpadding', 'cellspacing'
  ]
};

/**
 * Configuration ultra-stricte (texte simple uniquement)
 */
const TEXT_ONLY_CONFIG = {
  ALLOWED_TAGS: ['p', 'br'],
  ALLOWED_ATTR: [],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover'],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  FORCE_BODY: false,
  SANITIZE_DOM: true,
  IN_PLACE: false
};

/**
 * Sanitise du HTML avec configuration par défaut
 */
export function sanitizeHtml(dirty: string, config = DEFAULT_CONFIG): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  
  try {
    return DOMPurify.sanitize(dirty, config);
  } catch (error) {
    console.error('[Sanitize] Erreur sanitisation HTML:', error);
    return '';
  }
}

/**
 * Sanitise HTML pour templates email (plus permissif)
 */
export function sanitizeEmailHtml(dirty: string): string {
  return sanitizeHtml(dirty, EMAIL_CONFIG);
}

/**
 * Sanitise en texte simple uniquement
 */
export function sanitizeText(dirty: string): string {
  return sanitizeHtml(dirty, TEXT_ONLY_CONFIG);
}

/**
 * Échappe les caractères spéciaux pour prévenir injection
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Nettoie les variables pour templates (prévent injection)
 */
export function sanitizeTemplateVariable(value: any): string {
  if (!value) return '';
  
  // Convertir en string
  const stringValue = String(value);
  
  // Limiter longueur
  const maxLength = 1000;
  const truncated = stringValue.slice(0, maxLength);
  
  // Échapper HTML
  return escapeHtml(truncated);
}

/**
 * Valide et sanitise une URL
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  try {
    const parsed = new URL(url);
    
    // Autoriser uniquement http(s)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    
    return parsed.href;
  } catch (error) {
    return '';
  }
}

/**
 * Sanitise objet récursivement (pour JSON)
 */
export function sanitizeObject(obj: any, depth = 0): any {
  if (depth > 10) return {}; // Prévenir récursion infinie
  
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeText(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }
  
  if (typeof obj === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitiser la clé aussi
      const cleanKey = key.replace(/[^\w-]/g, '_');
      sanitized[cleanKey] = sanitizeObject(value, depth + 1);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Remplace les variables {{var}} dans un template de manière sécurisée
 */
export function renderTemplate(template: string, variables: Record<string, any> = {}): string {
  if (!template || typeof template !== 'string') {
    return '';
  }

  let rendered = template;
  
  // Sanitiser toutes les variables d'abord
  const sanitizedVars: Record<string, string> = {};
  for (const [key, value] of Object.entries(variables)) {
    sanitizedVars[key] = sanitizeTemplateVariable(value);
  }

  // Remplacer les variables
  Object.entries(sanitizedVars).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    rendered = rendered.replace(regex, value || '');
  });

  // Sanitiser le HTML final
  return sanitizeEmailHtml(rendered);
}

/**
 * Nettoie filename pour éviter path traversal
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'file';
  }

  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '_')
    .slice(0, 255);
}

export default {
  sanitizeHtml,
  sanitizeEmailHtml,
  sanitizeText,
  escapeHtml,
  sanitizeTemplateVariable,
  sanitizeUrl,
  sanitizeObject,
  renderTemplate,
  sanitizeFilename
};
