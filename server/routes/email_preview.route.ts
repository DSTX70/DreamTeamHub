/**
 * Email preview route for development
 * GET /dev/email/preview?template=order_shipped&orderId=12345&postalFrom=90001&postalTo=10001
 */

import { Router } from "express";
import { renderTxEmailFromFileTyped } from "../lib/mailer.typed";
import { orderShippedSchema } from "../../emails/tx/schemas/order_shipped.schema";
import { orderUpdateSchema } from "../../emails/tx/schemas/order_update.schema";
import { formatEta } from "../lib/eta";

export const router = Router();

/**
 * GET /dev/email/preview
 * 
 * Query params:
 * - template: order_shipped | order_update
 * - orderId: Order ID (default: "12345")
 * - postalFrom: Origin postal code (default: "90001")
 * - postalTo: Destination postal code (default: "10001")
 * - status: For order_update only (Processing|Packed|Shipped|Delayed)
 */
router.get("/dev/email/preview", (req, res) => {
  try {
    const {
      template = 'order_shipped',
      orderId = '12345',
      postalFrom = '90001',
      postalTo = '10001',
      status = 'Shipped',
    } = req.query;
    
    // Compute ETA
    const etaDate = formatEta(String(postalFrom), String(postalTo));
    
    // Common variables
    const appUrl = process.env.APP_URL || 'http://localhost:5000';
    const brandName = 'Fab Card Co.';
    const brandHeaderUrl = `${appUrl}/static/logo.png`;
    const orderLink = `${appUrl}/orders/${orderId}`;
    
    let html: string;
    
    switch (template) {
      case 'order_shipped':
        html = renderTxEmailFromFileTyped(
          'emails/tx/order_shipped.mjml',
          orderShippedSchema,
          {
            orderId: String(orderId),
            etaDate,
            orderLink,
            brandHeaderUrl,
            brandName,
            lineItems: [
              {
                thumbUrl: `${appUrl}/img?src=/static/product1.jpg&w=80&fmt=webp`,
                title: 'Premium Card Stock',
                qty: 100,
                price: '$49.99',
              },
              {
                thumbUrl: `${appUrl}/img?src=/static/product2.jpg&w=80&fmt=webp`,
                title: 'Custom Envelopes',
                qty: 100,
                price: '$29.99',
              },
            ],
          },
          'emails/tx/partials'
        );
        break;
        
      case 'order_update':
        html = renderTxEmailFromFileTyped(
          'emails/tx/order_update.mjml',
          orderUpdateSchema,
          {
            orderId: String(orderId),
            etaDate,
            orderLink,
            brandHeaderUrl,
            brandName,
            statusCopy: String(status) as any,
          },
          'emails/tx/partials'
        );
        break;
        
      default:
        return res.status(400).json({
          error: 'Invalid template',
          valid: ['order_shipped', 'order_update'],
        });
    }
    
    // Return HTML for browser preview
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
    
  } catch (error: any) {
    console.error('[EmailPreview] Error:', error);
    res.status(500).json({
      error: error.message,
      hint: error.name === 'ValidationError' ? 'Check template variables' : undefined,
    });
  }
});

export default router;
