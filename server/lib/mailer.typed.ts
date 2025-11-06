/**
 * Type-safe email rendering wrapper
 * Enforces template variables at compile time and validates at runtime
 */

import { renderTxEmailFromFile } from "./mailer";
import { validateVars, type Schema, type TypeOf } from "../../shared/email/schema";

/**
 * Type-safe wrapper for renderTxEmailFromFile
 * 
 * Enforces schema at compile time (TypeScript) and validates at runtime
 * 
 * @param mjmlPath - Path to MJML template file
 * @param schema - Schema definition for template variables
 * @param vars - Template variables (type-checked against schema)
 * @param partialsDir - Directory containing partials
 * @returns Rendered HTML email
 * 
 * @throws ValidationError if vars don't match schema
 * 
 * @example
 * ```ts
 * import { renderTxEmailFromFileTyped } from "./server/lib/mailer.typed";
 * import { orderShippedSchema } from "./emails/tx/schemas/order_shipped.schema";
 * 
 * const html = renderTxEmailFromFileTyped(
 *   "emails/tx/order_shipped.mjml",
 *   orderShippedSchema,
 *   {
 *     orderId: "12345",
 *     etaDate: "Nov 10, 2025",
 *     orderLink: "https://example.com/orders/12345",
 *     brandHeaderUrl: "https://example.com/logo.png",
 *     brandName: "Fab Card Co.",
 *     lineItems: [
 *       { thumbUrl: "https://example.com/p1.webp", title: "Card A", qty: 2, price: "$7.98" }
 *     ]
 *   },
 *   "emails/tx/partials"
 * );
 * ```
 */
export function renderTxEmailFromFileTyped<S extends Schema>(
  mjmlPath: string,
  schema: S,
  vars: TypeOf<S>,
  partialsDir?: string
): string {
  // Runtime validation
  validateVars(schema, vars);
  
  // Render email (vars are now validated)
  return renderTxEmailFromFile(mjmlPath, vars as any, partialsDir);
}
