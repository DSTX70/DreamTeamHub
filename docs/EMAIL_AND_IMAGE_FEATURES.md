# Email Templating & Image Transformation Features

**Date:** 2025-11-06  
**Status:** Production-Ready ✅

---

## Overview

This document describes two new features added to Dream Team Hub:

1. **MJML Email Rendering System** - Transactional emails with partials, templating, and caching
2. **Sharp Image Transformation** - Responsive image resizing and format conversion

---

## 1. MJML Email Rendering System

### Features

✅ **Partial Loader** - Reusable email components (header, line items, footer)  
✅ **LRU-Capped Cache** - Limits to 8 dirs / 32 files per dir (env-tunable)  
✅ **mtime-Aware Caching** - Automatic cache invalidation when partials change  
✅ **HTML Escaping** - Prevents injection attacks with `{{var}}` syntax  
✅ **Unescaped Variants** - Triple-brace `{{{var}}}` for images/links (works in loops!)  
✅ **Loop Support** - `{{#each array}}` for rendering lists  
✅ **Type-Safe Rendering** - Compile-time type checking + runtime validation  
✅ **Schema System** - Enum & pattern constraints for template variables

### File Locations

```
server/lib/mailer.ts                            # Core rendering engine with LRU cache
server/lib/mailer.typed.ts                      # Type-safe wrapper
shared/email/schema.ts                          # Schema DSL for type safety
emails/tx/schemas/order_shipped.schema.ts       # Example: Order shipped schema
emails/tx/schemas/order_update.schema.ts        # Example: Order update schema (with enum)
emails/tx/order_shipped.mjml                    # Example: Order shipped template
emails/tx/order_update.mjml                     # Example: Order update template
emails/tx/partials/header.mjml                  # Example: Email header partial
emails/tx/partials/line_item.mjml               # Example: Line item partial
server/examples/sendShippedEmail.example.ts     # Example: Type-safe rendering
server/examples/sendUpdateEmail.example.ts      # Example: Enum validation
server/examples/testCacheLRU.example.ts         # Example: Cache testing
```

### API Reference

#### `renderTxEmailFromFile()`

```typescript
function renderTxEmailFromFile(
  mjmlPath: string,
  vars: Record<string, any>,
  partialsDir?: string
): string
```

**Parameters:**
- `mjmlPath` - Path to MJML template file (e.g., `"emails/tx/order_shipped.mjml"`)
- `vars` - Variables for template replacement
- `partialsDir` - Directory containing partials (e.g., `"emails/tx/partials"`)

**Returns:** Rendered HTML email string

### Usage Example

```typescript
import { renderTxEmailFromFile } from "./server/lib/mailer";

const html = renderTxEmailFromFile(
  "emails/tx/order_shipped.mjml",
  {
    orderId: "12345",
    etaDate: "Jan 15, 2025",
    orderLink: "https://app.example.com/orders/12345",
    brandName: "Dream Team Hub",
    brandHeaderUrl: "https://cdn.example.com/logo.png",
    lineItems: [
      {
        thumbUrl: "https://cdn.example.com/product1.jpg",
        title: "Product A",
        qty: 2,
        price: "$29.99"
      },
    ],
  },
  "emails/tx/partials"
);

// Send with your mail transport (nodemailer, sendgrid, etc.)
```

### LRU Cache System

The partial cache uses an LRU (Least Recently Used) eviction strategy with environment-tunable limits:

**Environment Variables:**
- `PARTIAL_CACHE_MAX_DIRS` - Max cached directories (default: 8, min: 1)
- `PARTIAL_CACHE_MAX_FILES` - Max files per directory (default: 32, min: 1)

**Features:**
- **mtime-aware** - Automatically invalidates cache when partials are modified
- **LRU eviction** - Keeps most recently used directories and files in memory
- **Zero-config** - Works out of the box with sensible defaults

**Cache Stats API:**

```typescript
import { getCacheStats, clearPartialCache } from "./server/lib/mailer";

// Get current cache statistics
const stats = getCacheStats();
console.log(stats);
// {
//   directories: 1,
//   totalFiles: 2,
//   maxDirs: 8,
//   maxFilesPerDir: 32,
//   directoriesDetail: [
//     { directory: 'emails/tx/partials', files: 2, lastUsed: '2025-11-06T...' }
//   ]
// }

// Clear cache (useful for testing)
clearPartialCache();
```

**Example with Custom Limits:**

```bash
# Use stricter cache limits for resource-constrained environments
PARTIAL_CACHE_MAX_DIRS=4 PARTIAL_CACHE_MAX_FILES=16 npm run start
```

### Type-Safe Rendering

Use `renderTxEmailFromFileTyped()` for compile-time type checking and runtime validation:

**1. Define Schema:**

```typescript
// emails/tx/schemas/order_shipped.schema.ts
import { object, string, url, array, number } from "../../../shared/email/schema";

export const orderShippedSchema = object({
  orderId: string(),
  etaDate: string(),
  orderLink: url(),
  brandHeaderUrl: url(),
  brandName: string(),
  lineItems: array(object({
    thumbUrl: url(),
    title: string(),
    qty: number(),
    price: string({ pattern: '^\\$?\\d+(?:\\.\\d{2})?$' }), // Currency regex
  })),
});
```

**2. Use Type-Safe Wrapper:**

```typescript
import { renderTxEmailFromFileTyped } from "./server/lib/mailer.typed";
import { orderShippedSchema } from "./emails/tx/schemas/order_shipped.schema";

// TypeScript enforces schema at compile time
const html = renderTxEmailFromFileTyped(
  "emails/tx/order_shipped.mjml",
  orderShippedSchema,
  {
    orderId: "12345",
    etaDate: "Nov 10, 2025",
    orderLink: "https://example.com/orders/12345",  // Validated as URL
    brandHeaderUrl: "https://example.com/logo.png",
    brandName: "Fab Card Co.",
    lineItems: [
      {
        thumbUrl: "https://example.com/p1.webp",
        title: "Card A",
        qty: 2,
        price: "$7.98"  // Validated against regex pattern
      }
    ]
  },
  "emails/tx/partials"
);
```

**Benefits:**
- ✅ **Compile-time errors** - TypeScript catches missing/wrong fields
- ✅ **Runtime validation** - Throws `ValidationError` with precise path (e.g., `lineItems[0].qty: Expected number`)
- ✅ **URL validation** - Ensures URLs are valid HTTP/HTTPS
- ✅ **Pattern matching** - Validates strings against regex (e.g., currency format)
- ✅ **Enum constraints** - Restricts values to specific set

### Schema System

**Supported Types:**
- `string()` - String values with optional enum/pattern constraints
- `number()` - Numeric values with optional enum constraints
- `boolean()` - Boolean values with optional enum constraints
- `url()` - URL strings (validated as HTTP/HTTPS) with optional pattern
- `array(schema)` - Arrays with item validation
- `object(properties)` - Nested objects

**Enum Constraints:**

```typescript
const orderUpdateSchema = object({
  orderId: string(),
  statusCopy: string({ 
    enum: ['Processing', 'Packed', 'Shipped', 'Delayed'] as const
  }),
});

// This will throw ValidationError at runtime:
// statusCopy: "Invalid" ❌
// Expected one of [Processing, Packed, Shipped, Delayed]
```

**Pattern (Regex) Constraints:**

```typescript
const productSchema = object({
  price: string({ pattern: '^\\$?\\d+(?:\\.\\d{2})?$' }),  // $10.00 or 10.00
  sku: string({ pattern: '^[A-Z]{2}\\d{4}$' }),            // AB1234
  email: string({ pattern: '^[^@]+@[^@]+\\.[^@]+$' }),     // Basic email
});
```

**Optional Fields:**

```typescript
const schema = object({
  name: string(),
  nickname: string({ optional: true }),  // Can be undefined
});
```

### Template Syntax

#### Partials

```mjml
{{> header}}
{{> line_item}}
{{> footer}}
```

Loads `header.mjml`, `line_item.mjml`, `footer.mjml` from partials directory.

#### Variables (Escaped)

```mjml
<mj-text>Order #{{orderId}}</mj-text>
<mj-text>Customer: {{customerName}}</mj-text>
```

All variables are HTML-escaped to prevent injection.

#### Variables (Unescaped)

```mjml
<mj-image src="{{{brandHeaderUrl}}}" />
<mj-button href="{{{orderLink}}}">View Order</mj-button>
```

Use triple-braces for images/links you control.

#### Loops

```mjml
{{#each lineItems}}
<mj-section>
  <mj-column width="20%">
    <mj-image src="{{{thumbUrl}}}" />
  </mj-column>
  <mj-column width="50%">
    <mj-text>{{title}}</mj-text>
  </mj-column>
  <mj-column width="15%">
    <mj-text>Qty: {{qty}}</mj-text>
  </mj-column>
  <mj-column width="15%">
    <mj-text>{{price}}</mj-text>
  </mj-column>
</mj-section>
{{/each}}
```

**Note:** Both `{{var}}` (escaped) and `{{{var}}}` (unescaped) work inside `{{#each}}` loops!

---

## 2. Sharp Image Transformation

### Features

✅ **No Upscaling** - Streams original if source width ≤ requested width  
✅ **Format Conversion** - webp, avif, jpeg, png  
✅ **Responsive Resizing** - Multiple widths for srcset  
✅ **Long Cache Headers** - 1-year cache for CDN/browser  
✅ **Path Security** - Secured to `/public` root only

### File Locations

```
server/routes/img.route.ts  # Image transformation endpoint
```

### API Reference

#### `GET /img`

**Query Parameters:**
- `src` (required) - Source image path (e.g., `/static/products/p1.jpg`)
- `w` (optional) - Target width in pixels (1-4000)
- `fmt` (optional) - Output format: `webp`, `avif`, `jpeg`, `png`

**Examples:**

```
/img?src=/static/products/p1.jpg&w=640&fmt=webp
/img?src=/static/products/p1.jpg&w=320
/img?src=/static/products/p1.jpg&fmt=avif
```

### Behavior

**No Transformation (streams original):**
- Width specified AND source width ≤ requested width
- AND no format conversion requested
- → Streams original file with cache headers

**Transformation (resize/convert):**
- Width specified AND source width > requested width
- OR format conversion requested
- → Resizes/converts with cache headers

### Usage in HTML

#### Basic Usage

```html
<img 
  src="/img?src=/static/products/p1.jpg&w=640&fmt=webp"
  alt="Product"
/>
```

#### Responsive Images (srcset)

```html
<img
  src="/img?src=/static/products/p1.jpg&w=640&fmt=webp"
  srcset="
    /img?src=/static/products/p1.jpg&w=320&fmt=webp 320w,
    /img?src=/static/products/p1.jpg&w=640&fmt=webp 640w,
    /img?src=/static/products/p1.jpg&w=960&fmt=webp 960w,
    /img?src=/static/products/p1.jpg&w=1280&fmt=webp 1280w
  "
  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 400px"
  alt="Product"
/>
```

#### In React Components

```tsx
const ProductImage = ({ src, alt }: { src: string; alt: string }) => {
  const widths = [320, 640, 960, 1280];
  const buildUrl = (w: number) => 
    `/img?src=${encodeURIComponent(src)}&w=${w}&fmt=webp`;
  
  return (
    <img
      src={buildUrl(640)}
      srcSet={widths.map(w => `${buildUrl(w)} ${w}w`).join(", ")}
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 400px"
      alt={alt}
    />
  );
};
```

### Security

- **Path Traversal Protection** - Only serves files from `/public` directory
- **File Existence Check** - Returns 404 if file doesn't exist
- **Size Limits** - Width capped at 4000px
- **Format Validation** - Only webp, avif, jpeg, png allowed

### Cache Headers

All responses include:
```
Cache-Control: public, max-age=31536000, immutable
```

This enables:
- 1-year browser caching
- CDN caching
- Reduced server load

---

## Dependencies Installed

```json
{
  "dependencies": {
    "sharp": "^0.x.x",
    "mjml": "^4.x.x",
    "cookie-parser": "^1.x.x"
  },
  "devDependencies": {
    "@types/mjml": "^4.x.x",
    "@types/cookie-parser": "^1.x.x"
  }
}
```

---

## Middleware Added

**server/index.ts:**

```typescript
import cookieParser from "cookie-parser";

app.use(cookieParser()); // Added for future affiliate cookie support
```

---

## Routes Mounted

**server/routes.ts:**

```typescript
// Image Transformation - Responsive image resizing (public)
const imgRoute = await import("./routes/img.route");
app.use(imgRoute.router);
```

---

## Testing

### Email Rendering Test

```typescript
import { renderTxEmailFromFile } from "./server/lib/mailer";

const html = renderTxEmailFromFile(
  "emails/tx/order_shipped.mjml",
  {
    orderId: "TEST-001",
    etaDate: "Tomorrow",
    orderLink: "http://localhost:5000/orders/TEST-001",
    brandHeaderUrl: "https://via.placeholder.com/200x60",
    brandName: "Test Brand",
    lineItems: [
      { thumbUrl: "https://via.placeholder.com/80", title: "Test Product", qty: 1, price: "$10.00" }
    ],
  },
  "emails/tx/partials"
);

console.log(html); // Should output rendered HTML
```

### Image Transformation Test

Place a test image at `public/static/test/demo.jpg` then test:

```bash
# Original image (no transformation)
curl http://localhost:5000/img?src=/static/test/demo.jpg

# Resize to 640px width
curl http://localhost:5000/img?src=/static/test/demo.jpg&w=640

# Convert to WebP format
curl http://localhost:5000/img?src=/static/test/demo.jpg&fmt=webp

# Resize and convert
curl http://localhost:5000/img?src=/static/test/demo.jpg&w=640&fmt=webp
```

---

## Performance Considerations

### Email Rendering
- Partials cached in memory with mtime tracking
- Cache automatically invalidates on file changes
- Zero overhead for repeated renders of same template

### Image Transformation
- Sharp library is highly optimized (libvips-based)
- No upscaling prevents quality degradation
- Long cache headers reduce server load
- Consider adding CDN in production for best performance

---

## Production Recommendations

### Email System
1. Configure mail transport (nodemailer, sendgrid, etc.)
2. Add email sending queue for reliability
3. Monitor partial cache size (use `getCacheStats()`)
4. Implement email preview/testing endpoints

### Image System
1. Place images in `/public/static/` directory
2. Configure CDN to cache `/img` responses
3. Monitor sharp memory usage under load
4. Consider adding image upload validation
5. Implement image optimization pipeline for uploads

---

## Future Enhancements

### Email System
- [ ] LRU cache cap for partials
- [ ] Email preview endpoint
- [ ] A/B testing support
- [ ] Email analytics tracking
- [ ] Template validation

### Image System
- [ ] Image upload API
- [ ] Automatic optimization on upload
- [ ] Blur placeholder generation
- [ ] Image CDN integration
- [ ] Lazy loading helpers

---

## Support

For issues or questions:
- Email system: Check `server/lib/mailer.ts` and `server/lib/mailer.example.ts`
- Image system: Check `server/routes/img.route.ts`
- MJML syntax: https://mjml.io/documentation/
- Sharp API: https://sharp.pixelplumbing.com/

---

**Status:** Both features are production-ready and deployed ✅
