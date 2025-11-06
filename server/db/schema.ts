import { pgTable, serial, text, varchar, integer, timestamp, numeric, index, uniqueIndex } from "drizzle-orm/pg-core";

export const affiliates = pgTable("affiliates", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  // for future: name, contact, custom rate, status
});

export const affClicks = pgTable("aff_clicks", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 64 }).notNull(),
  source: varchar("source", { length: 128 }),
  ua: text("ua"),
  ip: varchar("ip", { length: 128 }),
  visitorKey: varchar("visitor_key", { length: 256 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  idxCodeTime: index("aff_clicks_code_time_idx").on(t.code, t.createdAt),
}));

export const affAttributions = pgTable("aff_attributions", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 64 }), // nullable if un-attributed
  orderId: varchar("order_id", { length: 128 }).notNull(),
  orderTotal: numeric("order_total", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqOrder: uniqueIndex("aff_attr_order_unique").on(t.orderId),
  idxCodeTime: index("aff_attr_code_time_idx").on(t.code, t.createdAt),
}));

export const inventoryProducts = pgTable("inventory_products", {
  id: serial("id").primaryKey(),
  sku: varchar("sku", { length: 128 }).notNull().unique(),
  name: text("name").notNull(),
  stock: integer("stock").notNull().default(0),
  threshold: integer("threshold").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const inventoryEvents = pgTable("inventory_events", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 32 }).notNull(), // "low-stock"
  sku: varchar("sku", { length: 128 }).notNull(),
  stock: integer("stock").notNull(),
  threshold: integer("threshold").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  idxTypeTime: index("inv_events_type_time_idx").on(t.type, t.createdAt),
  idxSkuTime: index("inv_events_sku_time_idx").on(t.sku, t.createdAt),
}));
