import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML for safe display (e.g. message body).
 * Allows common formatting tags used by the rich editor.
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'a', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

/**
 * Returns true if the string looks like HTML (contains tags).
 */
export function isHtml(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content ?? '');
}
