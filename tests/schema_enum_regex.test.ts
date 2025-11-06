/**
 * Test: Schema enum + regex constraints
 * Validates enum and pattern validation
 */

import { validateVars, ValidationError, object, string, number, url, array } from "../shared/email/schema";

describe("Schema - Enum + Regex Constraints", () => {
  describe("Enum constraints", () => {
    it("should validate string enum", () => {
      const schema = object({
        status: string({ enum: ['pending', 'approved', 'rejected'] as const }),
      });
      
      // Valid
      expect(() => validateVars(schema, { status: 'pending' })).not.toThrow();
      expect(() => validateVars(schema, { status: 'approved' })).not.toThrow();
      
      // Invalid
      expect(() => validateVars(schema, { status: 'invalid' })).toThrow(ValidationError);
      expect(() => validateVars(schema, { status: 'invalid' })).toThrow(/Expected one of/);
    });
    
    it("should validate number enum", () => {
      const schema = object({
        priority: number({ enum: [1, 2, 3] as const }),
      });
      
      // Valid
      expect(() => validateVars(schema, { priority: 1 })).not.toThrow();
      expect(() => validateVars(schema, { priority: 3 })).not.toThrow();
      
      // Invalid
      expect(() => validateVars(schema, { priority: 5 })).toThrow(ValidationError);
    });
  });
  
  describe("Pattern (regex) constraints", () => {
    it("should validate currency format", () => {
      const schema = object({
        price: string({ pattern: '^\\$?\\d+(?:\\.\\d{2})?$' }),
      });
      
      // Valid
      expect(() => validateVars(schema, { price: '$10.00' })).not.toThrow();
      expect(() => validateVars(schema, { price: '10.00' })).not.toThrow();
      expect(() => validateVars(schema, { price: '$10' })).not.toThrow();
      expect(() => validateVars(schema, { price: '10' })).not.toThrow();
      
      // Invalid
      expect(() => validateVars(schema, { price: '$10.5' })).toThrow(ValidationError);
      expect(() => validateVars(schema, { price: 'invalid' })).toThrow(ValidationError);
    });
    
    it("should validate SKU format", () => {
      const schema = object({
        sku: string({ pattern: '^[A-Z]{2}\\d{4}$' }),
      });
      
      // Valid
      expect(() => validateVars(schema, { sku: 'AB1234' })).not.toThrow();
      expect(() => validateVars(schema, { sku: 'XY9999' })).not.toThrow();
      
      // Invalid
      expect(() => validateVars(schema, { sku: 'ab1234' })).toThrow(ValidationError);
      expect(() => validateVars(schema, { sku: 'A1234' })).toThrow(ValidationError);
      expect(() => validateVars(schema, { sku: 'ABC123' })).toThrow(ValidationError);
    });
    
    it("should validate email format", () => {
      const schema = object({
        email: string({ pattern: '^[^@]+@[^@]+\\.[^@]+$' }),
      });
      
      // Valid
      expect(() => validateVars(schema, { email: 'user@example.com' })).not.toThrow();
      expect(() => validateVars(schema, { email: 'test.user@domain.co.uk' })).not.toThrow();
      
      // Invalid
      expect(() => validateVars(schema, { email: 'invalid' })).toThrow(ValidationError);
      expect(() => validateVars(schema, { email: '@example.com' })).toThrow(ValidationError);
      expect(() => validateVars(schema, { email: 'user@' })).toThrow(ValidationError);
    });
  });
  
  describe("Combined enum + pattern", () => {
    it("should validate order update schema", () => {
      const schema = object({
        orderId: string(),
        status: string({ enum: ['Processing', 'Packed', 'Shipped', 'Delayed'] as const }),
        trackingUrl: url(),
      });
      
      // Valid
      const validData = {
        orderId: '12345',
        status: 'Shipped',
        trackingUrl: 'https://tracking.example.com/12345',
      };
      expect(() => validateVars(schema, validData)).not.toThrow();
      
      // Invalid status
      const invalidStatus = {
        orderId: '12345',
        status: 'Delivered', // Not in enum
        trackingUrl: 'https://tracking.example.com/12345',
      };
      expect(() => validateVars(schema, invalidStatus)).toThrow(ValidationError);
      expect(() => validateVars(schema, invalidStatus)).toThrow(/Expected one of/);
    });
  });
  
  describe("Nested validation", () => {
    it("should validate arrays with constraints", () => {
      const schema = object({
        items: array(object({
          sku: string({ pattern: '^[A-Z]{2}\\d{4}$' }),
          qty: number(),
          price: string({ pattern: '^\\$?\\d+(?:\\.\\d{2})?$' }),
        })),
      });
      
      // Valid
      const validData = {
        items: [
          { sku: 'AB1234', qty: 2, price: '$10.00' },
          { sku: 'XY9999', qty: 1, price: '5.50' },
        ],
      };
      expect(() => validateVars(schema, validData)).not.toThrow();
      
      // Invalid SKU in array
      const invalidData = {
        items: [
          { sku: 'AB1234', qty: 2, price: '$10.00' },
          { sku: 'invalid', qty: 1, price: '5.50' }, // Invalid SKU
        ],
      };
      expect(() => validateVars(schema, invalidData)).toThrow(ValidationError);
      expect(() => validateVars(schema, invalidData)).toThrow(/items\[1\]\.sku/);
    });
  });
});
