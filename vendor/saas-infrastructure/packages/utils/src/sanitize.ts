import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Used for rendering user-generated or admin-generated HTML content.
 */

// Configuration for rich content (blog posts, guides, articles)
const RICH_CONTENT_CONFIG = {
  ALLOWED_TAGS: [
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Text formatting
    'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins',
    'mark', 'small', 'sub', 'sup',
    // Lists
    'ul', 'ol', 'li',
    // Links and media
    'a', 'img',
    // Code
    'code', 'pre', 'kbd', 'samp', 'var',
    // Quotes and citations
    'blockquote', 'q', 'cite', 'abbr',
    // Tables
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
    // Semantic elements
    'article', 'section', 'aside', 'header', 'footer', 'nav', 'main',
    'figure', 'figcaption', 'details', 'summary',
    // Other block elements
    'div', 'span', 'address', 'dl', 'dt', 'dd',
  ],
  ALLOWED_ATTR: [
    // Global attributes
    'id', 'class', 'style', 'title', 'lang', 'dir',
    // Links
    'href', 'target', 'rel',
    // Images
    'src', 'alt', 'width', 'height', 'loading',
    // Tables
    'colspan', 'rowspan', 'scope', 'headers',
    // Accessibility
    'aria-label', 'aria-labelledby', 'aria-describedby', 'role',
  ],
  // Force all links to open in new tab safely
  ADD_ATTR: ['target', 'rel'],
  // Ensure external links have proper rel attributes
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
};

// Configuration for simple text content (comments, short descriptions)
const SIMPLE_TEXT_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'a', 'code'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
};

/**
 * Sanitize rich HTML content (blog posts, guides, articles)
 */
export function sanitizeRichContent(html: string): string {
  if (!html) return '';

  // Add hooks to ensure external links are safe
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Fix links
    if (node.tagName === 'A') {
      const href = node.getAttribute('href');
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }
    // Fix images - remove broken onerror handlers
    if (node.tagName === 'IMG') {
      node.removeAttribute('onerror');
      node.removeAttribute('onload');
    }
  });

  const sanitized = DOMPurify.sanitize(html, RICH_CONTENT_CONFIG);

  // Remove the hook after use to avoid side effects
  DOMPurify.removeHook('afterSanitizeAttributes');

  return sanitized as string;
}

/**
 * Sanitize simple text content (short descriptions, comments)
 */
export function sanitizeSimpleText(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, SIMPLE_TEXT_CONFIG) as string;
}

/**
 * Sanitize email template content (admin only, allows more tags)
 * Note: This is only used in admin preview, actual emails are sent server-side
 */
export function sanitizeEmailPreview(html: string): string {
  if (!html) return '';
  // Email previews can be more permissive as they're admin-only
  // and the actual sending happens server-side with its own sanitization
  return DOMPurify.sanitize(html, {
    ...RICH_CONTENT_CONFIG,
    ALLOWED_TAGS: [...RICH_CONTENT_CONFIG.ALLOWED_TAGS, 'center', 'font'],
    ALLOWED_ATTR: [...RICH_CONTENT_CONFIG.ALLOWED_ATTR, 'bgcolor', 'color', 'face', 'size', 'align', 'valign', 'border', 'cellpadding', 'cellspacing'],
  }) as string;
}
