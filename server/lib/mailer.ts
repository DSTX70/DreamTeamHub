/**
 * Transactional Email Rendering with MJML
 * Supports partials, templating, caching, and HTML escaping
 */

import mjml2html from "mjml";
import fs from "fs";
import path from "path";

/**
 * Partial cache entry with mtime tracking for auto-invalidation
 */
interface PartialCacheEntry {
  content: string;
  mtime: number;
}

/**
 * In-memory cache for MJML partials
 * Key: `${directory}/${filename}`
 */
const partialCache = new Map<string, PartialCacheEntry>();

/**
 * HTML escape helper to prevent injection in transactional emails
 */
function escapeHtml(str: string): string {
  if (typeof str !== 'string') return String(str);
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Load a partial from the filesystem with mtime-aware caching
 */
function loadPartial(partialsDir: string, partialName: string): string {
  const partialPath = path.join(partialsDir, `${partialName}.mjml`);
  const cacheKey = `${partialsDir}/${partialName}`;
  
  try {
    const stats = fs.statSync(partialPath);
    const mtime = stats.mtimeMs;
    
    // Check cache and validate mtime
    const cached = partialCache.get(cacheKey);
    if (cached && cached.mtime === mtime) {
      return cached.content;
    }
    
    // Load from filesystem and cache
    const content = fs.readFileSync(partialPath, 'utf-8');
    partialCache.set(cacheKey, { content, mtime });
    
    return content;
  } catch (error) {
    console.warn(`[Mailer] Partial not found: ${partialPath}`);
    return `<!-- Partial ${partialName} not found -->`;
  }
}

/**
 * Replace variables in template with HTML escaping
 * Supports: {{var}}, {{{var}}} (unescaped for images/links)
 */
function replaceVariables(template: string, vars: Record<string, any>): string {
  let result = template;
  
  // Replace triple-brace unescaped variables first (e.g., {{{imageUrl}}})
  result = result.replace(/\{\{\{(\w+)\}\}\}/g, (match, varName) => {
    const value = vars[varName];
    return value !== undefined ? String(value) : match;
  });
  
  // Replace double-brace escaped variables (e.g., {{userName}})
  result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const value = vars[varName];
    return value !== undefined ? escapeHtml(String(value)) : match;
  });
  
  return result;
}

/**
 * Process {{#each array}} loops with shallow variable replacement
 */
function processEachLoops(template: string, vars: Record<string, any>): string {
  const eachRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
  
  return template.replace(eachRegex, (match, arrayName, loopBody) => {
    const array = vars[arrayName];
    
    if (!Array.isArray(array)) {
      console.warn(`[Mailer] {{#each ${arrayName}}} - not an array`);
      return '';
    }
    
    return array.map(item => {
      // Replace variables within loop body (with HTML escaping)
      return replaceVariables(loopBody, item);
    }).join('');
  });
}

/**
 * Process {{> partial}} includes
 */
function processPartials(template: string, partialsDir: string): string {
  const partialRegex = /\{\{>\s*(\w+)\s*\}\}/g;
  
  return template.replace(partialRegex, (match, partialName) => {
    return loadPartial(partialsDir, partialName);
  });
}

/**
 * Simple templating engine for MJML
 * 1. Process partials ({{> header}})
 * 2. Process each loops ({{#each lineItems}})
 * 3. Replace root-level variables ({{var}})
 */
function applyTemplate(mjml: string, vars: Record<string, any>, partialsDir?: string): string {
  let result = mjml;
  
  // 1. Process partials if directory provided
  if (partialsDir) {
    result = processPartials(result, partialsDir);
  }
  
  // 2. Process {{#each}} loops
  result = processEachLoops(result, vars);
  
  // 3. Replace root-level variables
  result = replaceVariables(result, vars);
  
  return result;
}

/**
 * Render MJML template to HTML
 */
export function renderTxEmail(mjml: string, vars: Record<string, any> = {}): string {
  const result = mjml2html(mjml, {
    validationLevel: 'soft', // Don't throw on warnings
  });
  
  if (result.errors.length > 0) {
    console.error('[Mailer] MJML errors:', result.errors);
  }
  
  return result.html;
}

/**
 * Render transactional email from MJML file with partials and templating
 * 
 * @param mjmlPath - Path to MJML template file (e.g., "emails/tx/order_shipped.mjml")
 * @param vars - Variables for template replacement
 * @param partialsDir - Directory containing partials (e.g., "emails/tx/partials")
 * @returns Rendered HTML email
 * 
 * @example
 * ```ts
 * const html = renderTxEmailFromFile(
 *   "emails/tx/order_shipped.mjml",
 *   {
 *     orderId: "12345",
 *     etaDate: "Jan 15, 2025",
 *     orderLink: "https://app.example.com/orders/12345",
 *     brandName: "Acme Corp",
 *     brandHeaderUrl: "https://cdn.example.com/logo.png",
 *     lineItems: [
 *       { thumbUrl: "...", title: "Product A", qty: 2, price: "$29.99" },
 *     ],
 *   },
 *   "emails/tx/partials"
 * );
 * ```
 */
export function renderTxEmailFromFile(
  mjmlPath: string,
  vars: Record<string, any> = {},
  partialsDir?: string
): string {
  try {
    // Load MJML template
    const mjml = fs.readFileSync(mjmlPath, 'utf-8');
    
    // Apply templating (partials, loops, variables)
    const processed = applyTemplate(mjml, vars, partialsDir);
    
    // Render to HTML
    return renderTxEmail(processed, {});
  } catch (error: any) {
    console.error('[Mailer] Error rendering email:', error);
    throw new Error(`Failed to render email from ${mjmlPath}: ${error.message}`);
  }
}

/**
 * Clear partial cache (useful for development/testing)
 */
export function clearPartialCache(): void {
  partialCache.clear();
}

/**
 * Get cache statistics (for monitoring)
 */
export function getCacheStats() {
  return {
    size: partialCache.size,
    entries: Array.from(partialCache.keys()),
  };
}
