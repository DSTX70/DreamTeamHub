/**
 * Example: Rendering order_update email with enum validation
 * Run: tsx server/examples/sendUpdateEmail.example.ts
 */

import { renderTxEmailFromFileTyped } from "../lib/mailer.typed";
import { orderUpdateSchema } from "../../emails/tx/schemas/order_update.schema";
import fs from "fs";
import path from "path";

async function main() {
  try {
    console.log("[Example] Rendering order_update email with enum validation...\n");
    
    const html = renderTxEmailFromFileTyped(
      "emails/tx/order_update.mjml",
      orderUpdateSchema,
      {
        orderId: "67890",
        etaDate: "Nov 12, 2025",
        orderLink: "https://example.com/orders/67890",
        brandHeaderUrl: "https://example.com/static/header.png",
        brandName: "Fab Card Co.",
        
        // statusCopy must be one of: Processing, Packed, Shipped, Delayed
        statusCopy: "Shipped", // ✅ Valid enum value
        
        // Try uncommenting this to see validation error:
        // statusCopy: "Invalid Status", // ❌ Will throw ValidationError
      },
      "emails/tx/partials"
    );
    
    // Write to tmp file for inspection
    const outputPath = path.join(process.cwd(), 'tmp_order_update.html');
    fs.writeFileSync(outputPath, html);
    
    console.log("✅ Email rendered successfully!");
    console.log(`📄 Output written to: ${outputPath}`);
    console.log(`📏 Size: ${html.length} bytes\n`);
    
    // Preview first 200 chars
    console.log("Preview:");
    console.log(html.substring(0, 200) + "...\n");
    
    console.log("💡 Valid statusCopy values: Processing, Packed, Shipped, Delayed");
    
  } catch (error: any) {
    console.error("❌ Error rendering email:");
    console.error(error.message);
    
    if (error.name === 'ValidationError') {
      console.error("\n💡 Tip: statusCopy must be one of: Processing, Packed, Shipped, Delayed");
    }
    
    process.exit(1);
  }
}

// Run
main();
