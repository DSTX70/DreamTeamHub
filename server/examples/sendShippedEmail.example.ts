/**
 * Example: Rendering order_shipped email with type safety
 * Run: tsx server/examples/sendShippedEmail.example.ts
 */

import { renderTxEmailFromFileTyped } from "../lib/mailer.typed";
import { orderShippedSchema } from "../../emails/tx/schemas/order_shipped.schema";
import fs from "fs";
import path from "path";

async function main() {
  try {
    console.log("[Example] Rendering order_shipped email with type safety...\n");
    
    const html = renderTxEmailFromFileTyped(
      "emails/tx/order_shipped.mjml",
      orderShippedSchema,
      {
        orderId: "12345",
        etaDate: "Nov 10, 2025",
        orderLink: "https://example.com/orders/12345",
        brandHeaderUrl: "https://example.com/static/header.png",
        brandName: "Fab Card Co.",
        lineItems: [
          { 
            thumbUrl: "https://example.com/img/p1.webp", 
            title: "Card A", 
            qty: 2, 
            price: "$7.98" 
          },
          { 
            thumbUrl: "https://example.com/img/p2.webp", 
            title: "Card B", 
            qty: 1, 
            price: "$4.50" 
          },
        ],
      },
      "emails/tx/partials"
    );
    
    // Write to tmp file for inspection
    const outputPath = path.join(process.cwd(), 'tmp_order_shipped.html');
    fs.writeFileSync(outputPath, html);
    
    console.log("✅ Email rendered successfully!");
    console.log(`📄 Output written to: ${outputPath}`);
    console.log(`📏 Size: ${html.length} bytes\n`);
    
    // Preview first 200 chars
    console.log("Preview:");
    console.log(html.substring(0, 200) + "...\n");
    
  } catch (error: any) {
    console.error("❌ Error rendering email:");
    console.error(error.message);
    
    if (error.name === 'ValidationError') {
      console.error("\n💡 Tip: Check that all required fields match the schema");
    }
    
    process.exit(1);
  }
}

// Run
main();
