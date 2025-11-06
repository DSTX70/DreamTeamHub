/**
 * Development route for sending test emails
 * POST /dev/email/send-shipped
 */

import { Router } from "express";
import { renderTxEmailFromFileTyped } from "../lib/mailer.typed";
import { sendTxEmail, MAIL_FROM } from "../lib/mailTransport";
import { orderShippedSchema } from "../../emails/tx/schemas/order_shipped.schema";
import { formatEta } from "../lib/eta";

export const router = Router();

/**
 * POST /dev/email/send-shipped
 * 
 * Body:
 * {
 *   "to": "user@example.com",
 *   "orderId": "12345",
 *   "postalFrom": "90001",
 *   "postalTo": "10001"
 * }
 */
router.post("/dev/email/send-shipped", async (req, res) => {
  try {
    const {
      to,
      orderId = '12345',
      postalFrom = '90001',
      postalTo = '10001',
    } = req.body;
    
    if (!to) {
      return res.status(400).json({ error: 'Missing required field: to' });
    }
    
    // Compute ETA
    const etaDate = formatEta(postalFrom, postalTo);
    
    // Render email
    const appUrl = process.env.APP_URL || 'http://localhost:5000';
    const brandName = 'Fab Card Co.';
    const brandHeaderUrl = `${appUrl}/static/logo.png`;
    const orderLink = `${appUrl}/orders/${orderId}`;
    
    const html = renderTxEmailFromFileTyped(
      'emails/tx/order_shipped.mjml',
      orderShippedSchema,
      {
        orderId,
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
    
    // Send email
    await sendTxEmail(
      to,
      `Your Order #${orderId} Has Shipped`,
      html,
      MAIL_FROM
    );
    
    res.json({
      success: true,
      message: `Email sent to ${to}`,
      orderId,
      etaDate,
    });
    
  } catch (error: any) {
    console.error('[DevSendEmail] Error:', error);
    res.status(500).json({
      error: error.message,
      hint: error.name === 'ValidationError' ? 'Check template variables' : undefined,
    });
  }
});

export default router;
