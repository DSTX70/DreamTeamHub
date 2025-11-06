/**
 * Tiny schema DSL for type-safe email template variables
 * Provides compile-time type inference and runtime validation
 * 
 * Features:
 * - Basic types: string, number, boolean, url
 * - Enum constraints for string/number/boolean
 * - Pattern (regex) validation for string/url
 * - Nested objects and arrays
 * - Optional fields
 */

/**
 * Base schema types
 */
export type Schema = 
  | StringSchema
  | NumberSchema
  | BooleanSchema
  | UrlSchema
  | ArraySchema
  | ObjectSchema;

export interface StringSchema {
  type: 'string';
  optional?: boolean;
  enum?: readonly (string | number | boolean)[];
  pattern?: string; // JS regex source (e.g., "^\\$?\\d+(?:\\.\\d{2})?$")
}

export interface NumberSchema {
  type: 'number';
  optional?: boolean;
  enum?: readonly (string | number | boolean)[];
}

export interface BooleanSchema {
  type: 'boolean';
  optional?: boolean;
  enum?: readonly (string | number | boolean)[];
}

export interface UrlSchema {
  type: 'url';
  optional?: boolean;
  pattern?: string; // JS regex source
}

export interface ArraySchema {
  type: 'array';
  items: Schema;
  optional?: boolean;
}

export interface ObjectSchema {
  type: 'object';
  properties: Record<string, Schema>;
  optional?: boolean;
}

/**
 * Schema builder functions
 */
export const string = (options?: { optional?: boolean; enum?: readonly (string | number | boolean)[]; pattern?: string }): StringSchema => ({ 
  type: 'string', 
  optional: options?.optional,
  enum: options?.enum,
  pattern: options?.pattern,
});

export const number = (options?: { optional?: boolean; enum?: readonly (string | number | boolean)[] }): NumberSchema => ({ 
  type: 'number', 
  optional: options?.optional,
  enum: options?.enum,
});

export const boolean = (options?: { optional?: boolean; enum?: readonly (string | number | boolean)[] }): BooleanSchema => ({ 
  type: 'boolean', 
  optional: options?.optional,
  enum: options?.enum,
});

export const url = (options?: { optional?: boolean; pattern?: string }): UrlSchema => ({ 
  type: 'url', 
  optional: options?.optional,
  pattern: options?.pattern,
});

export const array = (items: Schema, optional = false): ArraySchema => ({ type: 'array', items, optional });

export const object = (properties: Record<string, Schema>, optional = false): ObjectSchema => ({ 
  type: 'object', 
  properties, 
  optional 
});

/**
 * Type inference: Extract TypeScript type from schema
 */
export type TypeOf<S extends Schema> =
  S extends StringSchema ? (
    S['enum'] extends readonly (infer E)[] 
      ? (S['optional'] extends true ? E | undefined : E)
      : (S['optional'] extends true ? string | undefined : string)
  ) :
  S extends NumberSchema ? (
    S['enum'] extends readonly (infer E)[] 
      ? (S['optional'] extends true ? E | undefined : E)
      : (S['optional'] extends true ? number | undefined : number)
  ) :
  S extends BooleanSchema ? (
    S['enum'] extends readonly (infer E)[] 
      ? (S['optional'] extends true ? E | undefined : E)
      : (S['optional'] extends true ? boolean | undefined : boolean)
  ) :
  S extends UrlSchema ? (S['optional'] extends true ? string | undefined : string) :
  S extends ArraySchema ? (S['optional'] extends true ? TypeOf<S['items']>[] | undefined : TypeOf<S['items']>[]) :
  S extends ObjectSchema ? (S['optional'] extends true 
    ? { [K in keyof S['properties']]: TypeOf<S['properties'][K]> } | undefined 
    : { [K in keyof S['properties']]: TypeOf<S['properties'][K]> }) :
  never;

/**
 * Validation error with path
 */
export class ValidationError extends Error {
  constructor(public path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = 'ValidationError';
  }
}

/**
 * URL validation helper
 */
function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Pattern (regex) validation helper
 */
function matchesPattern(value: string, pattern: string): boolean {
  try {
    const regex = new RegExp(pattern);
    return regex.test(value);
  } catch (error) {
    console.error(`[Schema] Invalid regex pattern: ${pattern}`, error);
    return false;
  }
}

/**
 * Enum validation helper
 */
function isInEnum(value: unknown, enumValues: readonly (string | number | boolean)[]): boolean {
  return enumValues.includes(value as any);
}

/**
 * Runtime validator: Validate value against schema
 */
export function validateVars<S extends Schema>(
  schema: S,
  value: unknown,
  path = 'root'
): asserts value is TypeOf<S> {
  // Handle optional fields
  if (value === undefined || value === null) {
    if (schema.optional) {
      return;
    }
    throw new ValidationError(path, `Expected ${schema.type}, got ${value}`);
  }
  
  switch (schema.type) {
    case 'string':
      if (typeof value !== 'string') {
        throw new ValidationError(path, `Expected string, got ${typeof value}`);
      }
      
      // Check enum constraint
      if (schema.enum && !isInEnum(value, schema.enum)) {
        throw new ValidationError(path, `Expected one of [${schema.enum.join(', ')}], got "${value}"`);
      }
      
      // Check pattern constraint
      if (schema.pattern && !matchesPattern(value, schema.pattern)) {
        throw new ValidationError(path, `String does not match pattern /${schema.pattern}/`);
      }
      break;
      
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        throw new ValidationError(path, `Expected number, got ${typeof value}`);
      }
      
      // Check enum constraint
      if (schema.enum && !isInEnum(value, schema.enum)) {
        throw new ValidationError(path, `Expected one of [${schema.enum.join(', ')}], got ${value}`);
      }
      break;
      
    case 'boolean':
      if (typeof value !== 'boolean') {
        throw new ValidationError(path, `Expected boolean, got ${typeof value}`);
      }
      
      // Check enum constraint
      if (schema.enum && !isInEnum(value, schema.enum)) {
        throw new ValidationError(path, `Expected one of [${schema.enum.join(', ')}], got ${value}`);
      }
      break;
      
    case 'url':
      if (typeof value !== 'string') {
        throw new ValidationError(path, `Expected url (string), got ${typeof value}`);
      }
      if (!isValidUrl(value)) {
        throw new ValidationError(path, `Invalid URL: ${value}`);
      }
      
      // Check pattern constraint
      if (schema.pattern && !matchesPattern(value, schema.pattern)) {
        throw new ValidationError(path, `URL does not match pattern /${schema.pattern}/`);
      }
      break;
      
    case 'array':
      if (!Array.isArray(value)) {
        throw new ValidationError(path, `Expected array, got ${typeof value}`);
      }
      value.forEach((item, index) => {
        validateVars(schema.items, item, `${path}[${index}]`);
      });
      break;
      
    case 'object':
      if (typeof value !== 'object' || Array.isArray(value)) {
        throw new ValidationError(path, `Expected object, got ${typeof value}`);
      }
      const obj = value as Record<string, unknown>;
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        validateVars(propSchema, obj[key], `${path}.${key}`);
      }
      break;
      
    default:
      throw new ValidationError(path, `Unknown schema type: ${(schema as any).type}`);
  }
}
