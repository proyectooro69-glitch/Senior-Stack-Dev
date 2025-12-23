import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Categories for products
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  color: text("color").notNull().default("#10B981"),
});

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Products in inventory
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  price: real("price").notNull(),
  quantity: integer("quantity").notNull().default(0),
  categoryId: varchar("category_id").references(() => categories.id),
  localId: varchar("local_id"), // For offline sync
  synced: integer("synced").notNull().default(1),
  userId: varchar("user_id"), // Owner of the product
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true, synced: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Sales records
export const sales = pgTable("sales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  total: real("total").notNull(),
  date: text("date").notNull(), // ISO date string for easy filtering
  localId: varchar("local_id"), // For offline sync
  synced: integer("synced").notNull().default(1),
  userId: varchar("user_id"), // Owner of the sale
});

export const insertSaleSchema = createInsertSchema(sales).omit({ id: true, synced: true });
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof sales.$inferSelect;

// Daily report aggregation type
export interface DailyReportItem {
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface DailyReport {
  date: string;
  totalSales: number;
  totalItems: number;
  averageTransaction: number;
  items: DailyReportItem[];
}

// Cart item for POS
export interface CartItem {
  product: Product;
  quantity: number;
}

// Sync status
export type SyncStatus = 'online' | 'offline' | 'syncing';

// Users table (keep existing)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
