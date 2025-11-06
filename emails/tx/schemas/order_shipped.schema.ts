/**
 * Schema for order_shipped.mjml template
 */

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
    price: string({ pattern: '^\\$?\\d+(?:\\.\\d{2})?$' }), // Currency format: $10.00 or 10.00
  })),
});

export type OrderShippedVars = typeof orderShippedSchema extends { type: 'object'; properties: infer P }
  ? { [K in keyof P]: any }
  : never;
