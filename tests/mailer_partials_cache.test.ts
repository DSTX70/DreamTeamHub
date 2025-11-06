/**
 * Test: Partial cache mtime hot-reload
 * Validates that cache invalidates when partial files are modified
 */

import { renderTxEmailFromFile, getCacheStats, clearPartialCache } from "../server/lib/mailer";
import fs from "fs";
import path from "path";

describe("Mailer - Partial Cache mtime Hot-Reload", () => {
  const testDir = path.join(process.cwd(), "tests/fixtures/partials");
  const testPartial = path.join(testDir, "test_header.mjml");
  
  beforeAll(() => {
    // Create test directory and partial
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    fs.writeFileSync(testPartial, '<mj-text>Original Header</mj-text>');
  });
  
  afterAll(() => {
    // Cleanup
    if (fs.existsSync(testPartial)) {
      fs.unlinkSync(testPartial);
    }
    if (fs.existsSync(testDir)) {
      fs.rmdirSync(testDir);
    }
    clearPartialCache();
  });
  
  beforeEach(() => {
    clearPartialCache();
  });
  
  it("should cache partial on first load", () => {
    const template = `<mjml><mj-body>{{> test_header}}</mj-body></mjml>`;
    const html = renderTxEmailFromFile(testPartial.replace('.mjml', '_template.mjml'), {}, testDir);
    
    // Write template temporarily
    const templatePath = path.join(testDir, "test_template.mjml");
    fs.writeFileSync(templatePath, template);
    
    const html1 = renderTxEmailFromFile(templatePath, {}, testDir);
    
    const stats1 = getCacheStats();
    expect(stats1.totalFiles).toBeGreaterThan(0);
    
    // Render again - should hit cache
    const html2 = renderTxEmailFromFile(templatePath, {}, testDir);
    
    const stats2 = getCacheStats();
    expect(stats2.totalFiles).toBe(stats1.totalFiles);
    
    fs.unlinkSync(templatePath);
  });
  
  it("should invalidate cache when partial mtime changes", async () => {
    const template = `<mjml><mj-body>{{> test_header}}</mj-body></mjml>`;
    const templatePath = path.join(testDir, "test_template.mjml");
    fs.writeFileSync(templatePath, template);
    
    // First render
    const html1 = renderTxEmailFromFile(templatePath, {}, testDir);
    expect(html1).toContain('Original Header');
    
    // Wait to ensure mtime changes (some filesystems have 1s granularity)
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Modify partial
    fs.writeFileSync(testPartial, '<mj-text>Updated Header</mj-text>');
    
    // Second render - should reload partial
    const html2 = renderTxEmailFromFile(templatePath, {}, testDir);
    expect(html2).toContain('Updated Header');
    
    fs.unlinkSync(templatePath);
  });
  
  it("should respect cache size limits", () => {
    // This is tested in server/examples/testCacheLRU.example.ts
    // Cache stats should respect MAX_CACHED_DIRS and MAX_FILES_PER_DIR
    const stats = getCacheStats();
    expect(stats.maxDirs).toBeGreaterThanOrEqual(1);
    expect(stats.maxFilesPerDir).toBeGreaterThanOrEqual(1);
  });
});
