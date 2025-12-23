import { type User, type InsertUser, type Product, type InsertProduct, type Category, type InsertCategory, type Sale, type InsertSale } from "@shared/schema";
import { supabase } from "./supabase";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  getSales(): Promise<Sale[]>;
  getSalesByDate(date: string): Promise<Sale[]>;
  createSale(sale: InsertSale): Promise<Sale>;
}

export class SupabaseStorage implements IStorage {
  private users: Map<string, User>;
  private categories: Map<string, Category>;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.initializeDefaultCategories();
  }

  private async initializeDefaultCategories() {
    const defaultCategories = [
      { name: 'Bebidas', color: '#3B82F6' },
      { name: 'Alimentos', color: '#10B981' },
      { name: 'Limpieza', color: '#F59E0B' },
      { name: 'Otros', color: '#6B7280' },
    ];

    for (const cat of defaultCategories) {
      const id = randomUUID();
      this.categories.set(id, { ...cat, id });
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { 
      id,
      name: insertCategory.name,
      color: insertCategory.color || '#10B981',
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    const existing = this.categories.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('inventario')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching products from Supabase:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      price: row.price,
      quantity: row.quantity,
      categoryId: row.category_id || null,
      localId: row.local_id || null,
      synced: 1,
    }));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const { data, error } = await supabase
      .from('inventario')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return undefined;
    }

    return {
      id: data.id,
      name: data.name,
      price: data.price,
      quantity: data.quantity,
      categoryId: data.category_id || null,
      localId: data.local_id || null,
      synced: 1,
    };
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    
    const { data, error } = await supabase
      .from('inventario')
      .insert({
        id,
        name: insertProduct.name,
        price: insertProduct.price,
        quantity: insertProduct.quantity,
        category_id: insertProduct.categoryId || null,
        local_id: insertProduct.localId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product in Supabase:', error);
      throw new Error('Failed to create product');
    }

    return {
      id: data.id,
      name: data.name,
      price: data.price,
      quantity: data.quantity,
      categoryId: data.category_id || null,
      localId: data.local_id || null,
      synced: 1,
    };
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const updateData: Record<string, unknown> = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
    if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;

    const { data, error } = await supabase
      .from('inventario')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating product in Supabase:', error);
      return undefined;
    }

    return {
      id: data.id,
      name: data.name,
      price: data.price,
      quantity: data.quantity,
      categoryId: data.category_id || null,
      localId: data.local_id || null,
      synced: 1,
    };
  }

  async deleteProduct(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('inventario')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product from Supabase:', error);
      return false;
    }

    return true;
  }

  async getSales(): Promise<Sale[]> {
    const { data, error } = await supabase
      .from('ventas')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching sales from Supabase:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      productId: row.product_id || null,
      productName: row.product_name,
      quantity: row.quantity,
      unitPrice: row.unit_price,
      total: row.total,
      date: row.date,
      localId: row.local_id || null,
      synced: 1,
    }));
  }

  async getSalesByDate(date: string): Promise<Sale[]> {
    const { data, error } = await supabase
      .from('ventas')
      .select('*')
      .eq('date', date)
      .order('id');

    if (error) {
      console.error('Error fetching sales by date from Supabase:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      productId: row.product_id || null,
      productName: row.product_name,
      quantity: row.quantity,
      unitPrice: row.unit_price,
      total: row.total,
      date: row.date,
      localId: row.local_id || null,
      synced: 1,
    }));
  }

  async createSale(insertSale: InsertSale): Promise<Sale> {
    const id = randomUUID();
    
    const { data, error } = await supabase
      .from('ventas')
      .insert({
        id,
        product_id: insertSale.productId || null,
        product_name: insertSale.productName,
        quantity: insertSale.quantity,
        unit_price: insertSale.unitPrice,
        total: insertSale.total,
        date: insertSale.date,
        local_id: insertSale.localId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating sale in Supabase:', error);
      throw new Error('Failed to create sale');
    }

    if (insertSale.productId) {
      const product = await this.getProduct(insertSale.productId);
      if (product) {
        await this.updateProduct(insertSale.productId, {
          quantity: Math.max(0, product.quantity - insertSale.quantity),
        });
      }
    }

    return {
      id: data.id,
      productId: data.product_id || null,
      productName: data.product_name,
      quantity: data.quantity,
      unitPrice: data.unit_price,
      total: data.total,
      date: data.date,
      localId: data.local_id || null,
      synced: 1,
    };
  }
}

export const storage = new SupabaseStorage();
