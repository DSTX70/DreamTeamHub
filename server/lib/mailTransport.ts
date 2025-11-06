/**
 * Email transport layer using Nodemailer
 * Configured via environment variables
 */

import nodemailer from "nodemailer";

/**
 * SMTP configuration from environment
 */
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025', 10),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS || '',
  } : undefined,
};

/**
 * Default "from" address
 */
export const MAIL_FROM = process.env.MAIL_FROM || 'noreply@example.com';

/**
 * Create Nodemailer transporter
 */
export const transporter = nodemailer.createTransporter(SMTP_CONFIG);

/**
 * Send transactional email
 * 
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - HTML email body
 * @param from - Sender address (defaults to MAIL_FROM)
 * 
 * @example
 * ```ts
 * import { sendTxEmail } from "./server/lib/mailTransport";
 * 
 * await sendTxEmail(
 *   "user@example.com",
 *   "Your Order Has Shipped",
 *   htmlContent,
 *   "Fab Card Co. <orders@fabcard.com>"
 * );
 * ```
 */
export async function sendTxEmail(
  to: string,
  subject: string,
  html: string,
  from: string = MAIL_FROM
): Promise<void> {
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    
    console.log('[MailTransport] Email sent:', {
      messageId: info.messageId,
      to,
      subject,
    });
  } catch (error: any) {
    console.error('[MailTransport] Failed to send email:', {
      to,
      subject,
      error: error.message,
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Verify SMTP connection (useful for health checks)
 */
export async function verifyTransport(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('[MailTransport] SMTP connection verified');
    return true;
  } catch (error: any) {
    console.error('[MailTransport] SMTP verification failed:', error.message);
    return false;
  }
}
