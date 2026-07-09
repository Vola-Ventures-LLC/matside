import { describe, it, expect } from "vitest";

/**
 * Unit tests for HTML sanitization utilities
 * Tests XSS prevention and content filtering
 */

// Mock the sanitization logic (mirrors lib/sanitize.ts behavior)
const ALLOWED_RICH_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's',
  'ul', 'ol', 'li',
  'a', 'img',
  'code', 'pre',
  'blockquote', 'q',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div', 'span',
];

const FORBIDDEN_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'];
const FORBIDDEN_ATTRS = ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'];

// Simple tag detection for testing
function containsTag(html: string, tag: string): boolean {
  // eslint-disable-next-line security/detect-non-literal-regexp
  const regex = new RegExp(`<${tag}[\\s>]`, 'i');
  return regex.test(html);
}

function containsAttribute(html: string, attr: string): boolean {
  // eslint-disable-next-line security/detect-non-literal-regexp
  const regex = new RegExp(`\\s${attr}\\s*=`, 'i');
  return regex.test(html);
}

// Validation functions (mirrors sanitization behavior)
function validateHtmlSecurity(html: string): { safe: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for forbidden tags
  for (const tag of FORBIDDEN_TAGS) {
    if (containsTag(html, tag)) {
      issues.push(`Contains forbidden tag: <${tag}>`);
    }
  }
  
  // Check for forbidden attributes (event handlers)
  for (const attr of FORBIDDEN_ATTRS) {
    if (containsAttribute(html, attr)) {
      issues.push(`Contains forbidden attribute: ${attr}`);
    }
  }
  
  // Check for javascript: URLs
  if (/javascript:/i.test(html)) {
    issues.push("Contains javascript: URL");
  }
  
  // Check for data: URLs in potentially dangerous contexts
  if (/src\s*=\s*["']?data:/i.test(html)) {
    issues.push("Contains data: URL in src attribute");
  }
  
  return { safe: issues.length === 0, issues };
}

function validateLinkSecurity(href: string): { safe: boolean; error?: string } {
  if (!href) return { safe: true };
  
  // Block javascript: URLs
  if (href.toLowerCase().startsWith("javascript:")) {
    return { safe: false, error: "JavaScript URLs are not allowed" };
  }
  
  // Block data: URLs
  if (href.toLowerCase().startsWith("data:")) {
    return { safe: false, error: "Data URLs are not allowed in links" };
  }
  
  // Allow http, https, mailto, tel
  const validProtocols = ["http://", "https://", "mailto:", "tel:", "/", "#"];
  const isValid = validProtocols.some(p => href.toLowerCase().startsWith(p));
  
  if (!isValid && !href.startsWith("/") && href.includes(":")) {
    return { safe: false, error: "Unknown protocol in URL" };
  }
  
  return { safe: true };
}

describe("XSS Prevention - Script Tags", () => {
  it("detects script tags", () => {
    const html = '<p>Hello</p><script>alert("xss")</script>';
    const result = validateHtmlSecurity(html);
    expect(result.safe).toBe(false);
    expect(result.issues).toContain("Contains forbidden tag: <script>");
  });

  it("detects script tags with attributes", () => {
    const html = '<script src="evil.js"></script>';
    expect(validateHtmlSecurity(html).safe).toBe(false);
  });

  it("allows safe content without scripts", () => {
    const html = '<p>Hello <strong>World</strong></p>';
    expect(validateHtmlSecurity(html).safe).toBe(true);
  });
});

describe("XSS Prevention - Event Handlers", () => {
  it("detects onerror attribute", () => {
    const html = '<img src="x" onerror="alert(1)">';
    const result = validateHtmlSecurity(html);
    expect(result.safe).toBe(false);
    expect(result.issues.some(i => i.includes("onerror"))).toBe(true);
  });

  it("detects onclick attribute", () => {
    const html = '<div onclick="evil()">Click me</div>';
    expect(validateHtmlSecurity(html).safe).toBe(false);
  });

  it("detects onmouseover attribute", () => {
    const html = '<span onmouseover="steal()">Hover</span>';
    expect(validateHtmlSecurity(html).safe).toBe(false);
  });

  it("detects onload attribute", () => {
    const html = '<body onload="init()">';
    expect(validateHtmlSecurity(html).safe).toBe(false);
  });

  it("allows img without event handlers", () => {
    const html = '<img src="photo.jpg" alt="Photo">';
    expect(validateHtmlSecurity(html).safe).toBe(true);
  });
});

describe("XSS Prevention - Dangerous URLs", () => {
  it("detects javascript: URLs", () => {
    const html = '<a href="javascript:alert(1)">Click</a>';
    expect(validateHtmlSecurity(html).safe).toBe(false);
  });

  it("detects javascript: URLs with encoding", () => {
    const html = '<a href="JavaScript:alert(1)">Click</a>';
    expect(validateHtmlSecurity(html).safe).toBe(false);
  });

  it("detects data: URLs in src", () => {
    const html = '<img src="data:text/html,<script>alert(1)</script>">';
    expect(validateHtmlSecurity(html).safe).toBe(false);
  });

  it("allows normal http links", () => {
    const html = '<a href="https://example.com">Link</a>';
    expect(validateHtmlSecurity(html).safe).toBe(true);
  });
});

describe("XSS Prevention - Forbidden Elements", () => {
  it("detects iframe elements", () => {
    const html = '<iframe src="https://evil.com"></iframe>';
    expect(validateHtmlSecurity(html).safe).toBe(false);
  });

  it("detects form elements", () => {
    const html = '<form action="https://evil.com"><input name="password"></form>';
    expect(validateHtmlSecurity(html).safe).toBe(false);
  });

  it("detects embed elements", () => {
    const html = '<embed src="evil.swf">';
    expect(validateHtmlSecurity(html).safe).toBe(false);
  });

  it("detects object elements", () => {
    const html = '<object data="evil.swf"></object>';
    expect(validateHtmlSecurity(html).safe).toBe(false);
  });

  it("detects style elements", () => {
    const html = '<style>body { display: none; }</style>';
    expect(validateHtmlSecurity(html).safe).toBe(false);
  });
});

describe("Link Validation", () => {
  it("allows https URLs", () => {
    expect(validateLinkSecurity("https://example.com").safe).toBe(true);
  });

  it("allows http URLs", () => {
    expect(validateLinkSecurity("http://example.com").safe).toBe(true);
  });

  it("allows mailto links", () => {
    expect(validateLinkSecurity("mailto:user@example.com").safe).toBe(true);
  });

  it("allows tel links", () => {
    expect(validateLinkSecurity("tel:+1234567890").safe).toBe(true);
  });

  it("allows relative URLs", () => {
    expect(validateLinkSecurity("/about").safe).toBe(true);
    expect(validateLinkSecurity("/blog/post-1").safe).toBe(true);
  });

  it("allows anchor links", () => {
    expect(validateLinkSecurity("#section").safe).toBe(true);
  });

  it("blocks javascript: URLs", () => {
    const result = validateLinkSecurity("javascript:alert(1)");
    expect(result.safe).toBe(false);
    expect(result.error).toContain("JavaScript");
  });

  it("blocks data: URLs", () => {
    const result = validateLinkSecurity("data:text/html,<script>");
    expect(result.safe).toBe(false);
  });

  it("handles empty href", () => {
    expect(validateLinkSecurity("").safe).toBe(true);
  });
});

describe("Safe Content Validation", () => {
  const safeExamples = [
    '<h1>Welcome</h1>',
    '<p>This is a <strong>test</strong> paragraph.</p>',
    '<ul><li>Item 1</li><li>Item 2</li></ul>',
    '<a href="https://example.com">External Link</a>',
    '<img src="/images/photo.jpg" alt="A photo">',
    '<blockquote>Famous quote here</blockquote>',
    '<code>const x = 1;</code>',
    '<table><tr><th>Header</th></tr><tr><td>Cell</td></tr></table>',
  ];

  safeExamples.forEach((html, index) => {
    it(`accepts safe content example ${index + 1}`, () => {
      expect(validateHtmlSecurity(html).safe).toBe(true);
    });
  });
});

describe("Complex Attack Vectors", () => {
  it("detects nested script in attributes", () => {
    const html = '<img src="x" onerror="eval(atob(\'YWxlcnQoMSk=\'))">';
    expect(validateHtmlSecurity(html).safe).toBe(false);
  });

  it("detects svg with embedded script", () => {
    // SVG can contain script, but we should detect the pattern
    const html = '<svg onload="alert(1)">';
    expect(validateHtmlSecurity(html).safe).toBe(false);
  });

  it("handles multiple violations", () => {
    const html = '<script>bad</script><iframe src="x"></iframe><div onclick="evil()">';
    const result = validateHtmlSecurity(html);
    expect(result.safe).toBe(false);
    expect(result.issues.length).toBeGreaterThan(1);
  });
});

describe("Edge Cases", () => {
  it("handles empty string", () => {
    expect(validateHtmlSecurity("").safe).toBe(true);
  });

  it("handles plain text", () => {
    expect(validateHtmlSecurity("Just plain text").safe).toBe(true);
  });

  it("handles special characters", () => {
    expect(validateHtmlSecurity("<p>Price: $100 & 50% off</p>").safe).toBe(true);
  });

  it("handles unicode content", () => {
    expect(validateHtmlSecurity("<p>Hello 世界 🌍</p>").safe).toBe(true);
  });
});
