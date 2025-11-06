/**
 * Transactional Email Rendering with MJML
 * Features:
 * - Partials loader with mtime-aware cache
 * - LRU-capped cache (configurable via env vars)
 * - HTML escaping for {{var}}, unescaped {{{var}}} for trusted content
 * - {{> partial}} and {{#each}} support
 */

import mjml2html from "mjml";
import fs from "fs";
import path from "path";

/**
 * Environment-tunable cache limits
 */
const MAX_CACHED_DIRS = Math.max(1, parseInt(process.env.PARTIAL_CACHE_MAX_DIRS || '8', 10));
const MAX_FILES_PER_DIR = Math.max(1, parseInt(process.env.PARTIAL_CACHE_MAX_FILES || '32', 10));

/**
 * Partial cache entry with mtime tracking
 */
interface PartialCacheEntry {
  content: string;
  mtime: number;
  lastUsed: number; // For LRU eviction
}

/**
 * Directory cache structure
 */
interface DirectoryCache {
  files: Map<string, PartialCacheEntry>;
  lastUsed: number; // For LRU eviction
}

/**
 * LRU cache for MJML partials
 * Key: directory path
 * Value: Map of filename -> PartialCacheEntry
 */
const partialCache = new Map<string, DirectoryCache>();

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
 * Evict least-recently-used files from a directory cache
 */
function evictLRUFiles(dirCache: DirectoryCache): void {
  if (dirCache.files.size <= MAX_FILES_PER_DIR) return;
  
  // Sort by lastUsed ascending (oldest first)
  const entries = Array.from(dirCache.files.entries())
    .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
  
  // Remove oldest entries until within limit
  const toRemove = dirCache.files.size - MAX_FILES_PER_DIR;
  for (let i = 0; i < toRemove; i++) {
    dirCache.files.delete(entries[i][0]);
  }
}

/**
 * Evict least-recently-used directory caches
 */
function evictLRUDirectories(): void {
  if (partialCache.size <= MAX_CACHED_DIRS) return;
  
  // Sort directories by lastUsed ascending (oldest first)
  const entries = Array.from(partialCache.entries())
    .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
  
  // Remove oldest entries until within limit
  const toRemove = partialCache.size - MAX_CACHED_DIRS;
  for (let i = 0; i < toRemove; i++) {
    partialCache.delete(entries[i][0]);
  }
}

/**
 * Load a partial from the filesystem with LRU-capped mtime-aware caching
 */
function loadPartial(partialsDir: string, partialName: string): string {
  const partialPath = path.join(partialsDir, `${partialName}.mjml`);
  const now = Date.now();
  
  try {
    const stats = fs.statSync(partialPath);
    const mtime = stats.mtimeMs;
    
    // Get or create directory cache
    let dirCache = partialCache.get(partialsDir);
    if (!dirCache) {
      dirCache = { files: new Map(), lastUsed: now };
      partialCache.set(partialsDir, dirCache);
      evictLRUDirectories(); // Evict if needed
    }
    
    // Update directory last used time
    dirCache.lastUsed = now;
    
    // Check file cache and validate mtime
    const cached = dirCache.files.get(partialName);
    if (cached && cached.mtime === mtime) {
      // Cache hit - update last used time
      cached.lastUsed = now;
      return cached.content;
    }
    
    // Cache miss or stale - load from filesystem
    const content = fs.readFileSync(partialPath, 'utf-8');
    
    dirCache.files.set(partialName, { content, mtime, lastUsed: now });
    evictLRUFiles(dirCache); // Evict oldest files if needed
    
    return content;
  } catch (error) {
    console.warn(`[Mailer] Partial not found: ${partialPath}`);
    return `<!-- Partial ${partialName} not found -->`;
  }
}

/**
 * Replace variables in template with HTML escaping
 * Supports: {{var}} (escaped), {{{var}}} (unescaped for trusted content)
 */
function replaceVariables(template: string, vars: Record<string, any>): string {
  let result = template;
  
  // Replace triple-brace unescaped variables first (e.g., {{{imageUrl}}})
  // For trusted content: image URLs, anchor hrefs, small HTML snippets
  result = result.replace(/\{\{\{(\w+)\}\}\}/g, (match, varName) => {
    const value = vars[varName];
    return value !== undefined ? String(value) : match;
  });
  
  // Replace double-brace escaped variables (e.g., {{userName}})
  // For user-provided content: names, addresses, messages
  result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const value = vars[varName];
    return value !== undefined ? escapeHtml(String(value)) : match;
  });
  
  return result;
}

/**
 * Process {{#each array}} loops with shallow variable replacement
 * Supports both {{var}} (escaped) and {{{var}}} (unescaped) inside loops
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
      // Replace variables within loop body
      // replaceVariables handles both {{var}} and {{{var}}}
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
 * 3. Replace root-level variables ({{var}} or {{{var}}})
 */
function applyTemplate(mjml: string, vars: Record<string, any>, partialsDir?: string): string {
  let result = mjml;
  
  // 1. Process partials if directory provided
  if (partialsDir) {
    result = processPartials(result, partialsDir);
  }
  
  // 2. Process {{#each}} loops (supports both {{var}} and {{{var}}} inside)
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
 * Environment Variables:
 * - PARTIAL_CACHE_MAX_DIRS: Max cached directories (default: 8, min: 1)
 * - PARTIAL_CACHE_MAX_FILES: Max files per directory (default: 32, min: 1)
 * 
 * Variable Syntax:
 * - {{var}} - Escaped (safe for user content: names, messages)
 * - {{{var}}} - Unescaped (trusted content: URLs, HTML)
 * 
 * @example
 * ```ts
 * const html = renderTxEmailFromFile(
 *   "emails/tx/order_shipped.mjml",
 *   {
 *     orderId: "12345",                                    // Escaped
 *     etaDate: "Jan 15, 2025",                             // Escaped
 *     orderLink: "https://app.example.com/orders/12345",   // Use {{{orderLink}}}
 *     brandHeaderUrl: "https://cdn.example.com/logo.png",  // Use {{{brandHeaderUrl}}}
 *     lineItems: [
 *       { 
 *         thumbUrl: "...",  // Use {{{thumbUrl}}} in template
 *         title: "Product", // Use {{title}} in template (escaped)
 *         qty: 2, 
 *         price: "$29.99" 
 *       },
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
  const totalFiles = Array.from(partialCache.values())
    .reduce((sum, dir) => sum + dir.files.size, 0);
  
  const dirStats = Array.from(partialCache.entries()).map(([dir, cache]) => ({
    directory: dir,
    files: cache.files.size,
    lastUsed: new Date(cache.lastUsed).toISOString(),
  }));
  
  return {
    directories: partialCache.size,
    totalFiles,
    maxDirs: MAX_CACHED_DIRS,
    maxFilesPerDir: MAX_FILES_PER_DIR,
    directoriesDetail: dirStats,
  };
}
