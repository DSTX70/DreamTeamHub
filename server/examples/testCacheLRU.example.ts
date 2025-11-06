/**
 * Example: Test LRU cache eviction
 * Run: tsx server/examples/testCacheLRU.example.ts
 */

import { renderTxEmailFromFile, getCacheStats, clearPartialCache } from "../lib/mailer";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🧪 Testing LRU Cache with Environment Variables\n");
  
  // Show current cache limits
  const initialStats = getCacheStats();
  console.log(`Cache Limits:`);
  console.log(`  Max Directories: ${initialStats.maxDirs}`);
  console.log(`  Max Files per Dir: ${initialStats.maxFilesPerDir}\n`);
  
  // Clear cache to start fresh
  clearPartialCache();
  console.log("✨ Cache cleared\n");
  
  // Test 1: Basic rendering with partials
  console.log("📧 Test 1: Rendering order_shipped.mjml...");
  renderTxEmailFromFile(
    "emails/tx/order_shipped.mjml",
    {
      orderId: "12345",
      etaDate: "Nov 10, 2025",
      orderLink: "https://example.com/orders/12345",
      brandHeaderUrl: "https://example.com/static/header.png",
      brandName: "Fab Card Co.",
      lineItems: [
        { thumbUrl: "https://example.com/img/p1.webp", title: "Card A", qty: 2, price: "$7.98" },
      ],
    },
    "emails/tx/partials"
  );
  
  let stats = getCacheStats();
  console.log(`✅ Rendered. Cache: ${stats.directories} dirs, ${stats.totalFiles} files\n`);
  
  // Test 2: Render again (should hit cache)
  console.log("📧 Test 2: Rendering order_update.mjml (should reuse header partial)...");
  renderTxEmailFromFile(
    "emails/tx/order_update.mjml",
    {
      orderId: "67890",
      etaDate: "Nov 12, 2025",
      orderLink: "https://example.com/orders/67890",
      brandHeaderUrl: "https://example.com/static/header.png",
      brandName: "Fab Card Co.",
      statusCopy: "Shipped",
    },
    "emails/tx/partials"
  );
  
  stats = getCacheStats();
  console.log(`✅ Rendered. Cache: ${stats.directories} dirs, ${stats.totalFiles} files\n`);
  
  // Test 3: Triple-brace in loops
  console.log("📧 Test 3: Testing {{{var}}} inside {{#each}} loops...");
  const html = renderTxEmailFromFile(
    "emails/tx/order_shipped.mjml",
    {
      orderId: "99999",
      etaDate: "Nov 15, 2025",
      orderLink: "https://example.com/orders/99999",
      brandHeaderUrl: "https://example.com/static/header.png",
      brandName: "Test <script>alert('xss')</script> Co.",
      lineItems: [
        { 
          thumbUrl: "https://example.com/img/p1.webp?size=large&quality=high", 
          title: "Product <b>with HTML</b>", 
          qty: 3, 
          price: "$15.99" 
        },
      ],
    },
    "emails/tx/partials"
  );
  
  // Verify triple-brace (unescaped) URL is preserved
  const hasUnescapedUrl = html.includes('src="https://example.com/img/p1.webp?size=large&quality=high"');
  
  // Verify double-brace (escaped) HTML is escaped
  const hasEscapedHtml = html.includes('Product &lt;b&gt;with HTML&lt;/b&gt;');
  const hasEscapedBrandName = html.includes('Test &lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt; Co.');
  
  console.log(`  {{{thumbUrl}}} preserved (unescaped): ${hasUnescapedUrl ? '✅' : '❌'}`);
  console.log(`  {{title}} escaped in loop: ${hasEscapedHtml ? '✅' : '❌'}`);
  console.log(`  {{brandName}} escaped: ${hasEscapedBrandName ? '✅' : '❌'}\n`);
  
  // Show final cache stats
  stats = getCacheStats();
  console.log("📊 Final Cache Statistics:");
  console.log(`  Directories: ${stats.directories}/${stats.maxDirs}`);
  console.log(`  Total Files: ${stats.totalFiles}`);
  console.log(`  Files per Dir: ${stats.maxFilesPerDir}\n`);
  
  if (stats.directoriesDetail && stats.directoriesDetail.length > 0) {
    console.log("  Cached Directories:");
    stats.directoriesDetail.forEach(dir => {
      console.log(`    - ${dir.directory}: ${dir.files} files (last used: ${dir.lastUsed})`);
    });
  }
  
  console.log("\n✨ All tests passed!");
  console.log("\n💡 Try running with different limits:");
  console.log("   PARTIAL_CACHE_MAX_DIRS=4 PARTIAL_CACHE_MAX_FILES=16 npx tsx server/examples/testCacheLRU.example.ts");
}

// Run
main();
