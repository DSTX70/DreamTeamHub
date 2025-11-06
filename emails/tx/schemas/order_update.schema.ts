/**
 * Schema for order_update.mjml template
 * Demonstrates enum and pattern constraints
 */

import { object, string, url } from "../../../shared/email/schema";

/**
 * Order update status enum
 */
const ORDER_STATUSES = ['Processing', 'Packed', 'Shipped', 'Delayed'] as const;

export const orderUpdateSchema = object({
  orderId: string(),
  etaDate: string(),
  orderLink: url(),
  brandHeaderUrl: url(),
  brandName: string(),
  
  // statusCopy constrained by enum
  statusCopy: string({ 
    enum: ORDER_STATUSES 
  }),
});

export type OrderUpdateVars = typeof orderUpdateSchema extends { type: 'object'; properties: infer P }
  ? { [K in keyof P]: any }
  : never;
