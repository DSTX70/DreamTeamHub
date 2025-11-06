/**
 * Example usage of MJML email rendering system
 * 
 * This file demonstrates how to use the transactional email system
 * with partials, templating, and variable replacement.
 */

import { renderTxEmailFromFile } from "./mailer";

/**
 * Example 1: Order shipped notification
 */
export async function sendOrderShippedEmail(orderId: string, orderData: any) {
  const html = renderTxEmailFromFile(
    "emails/tx/order_shipped.mjml",
    {
      orderId,
      etaDate: new Date(orderData.eta.etaDate).toLocaleDateString(),
      orderLink: `${process.env.APP_URL || 'http://localhost:5000'}/orders/${orderId}`,
      brandHeaderUrl: "https://via.placeholder.com/200x60?text=Brand+Logo",
      brandName: "Dream Team Hub",
      lineItems: orderData.lineItems.map((item: any) => ({
        thumbUrl: item.image || "https://via.placeholder.com/80",
        title: item.name,
        qty: item.quantity,
        price: `$${item.price.toFixed(2)}`,
      })),
    },
    "emails/tx/partials"
  );
  
  // Send email using your preferred mail transport
  // e.g., nodemailer, sendgrid, etc.
  console.log("[Email] Order shipped email rendered:", html.substring(0, 100) + "...");
  
  return html;
}

/**
 * Example 2: Order update notification
 */
export async function sendOrderUpdateEmail(orderId: string, orderData: any) {
  const html = renderTxEmailFromFile(
    "emails/tx/order_update.mjml",
    {
      orderId,
      etaDate: new Date(orderData.eta.etaDate).toLocaleDateString(),
      orderLink: `${process.env.APP_URL || 'http://localhost:5000'}/orders/${orderId}`,
      brandHeaderUrl: "https://via.placeholder.com/200x60?text=Brand+Logo",
      brandName: "Dream Team Hub",
      statusCopy: "Your order status has been updated. We're working hard to get it to you!",
    },
    "emails/tx/partials"
  );
  
  console.log("[Email] Order update email rendered:", html.substring(0, 100) + "...");
  
  return html;
}

/**
 * Example 3: Using image transformation in emails
 */
export function getResponsiveImageUrl(src: string, width: number, format: 'webp' | 'avif' = 'webp') {
  const baseUrl = process.env.APP_URL || 'http://localhost:5000';
  return `${baseUrl}/img?src=${encodeURIComponent(src)}&w=${width}&fmt=${format}`;
}

/**
 * Example 4: Building srcSet for responsive images
 */
export function buildImageSrcSet(src: string, format: 'webp' | 'avif' = 'webp') {
  const widths = [320, 640, 960, 1280];
  return widths.map(w => `${getResponsiveImageUrl(src, w, format)} ${w}w`).join(", ");
}
