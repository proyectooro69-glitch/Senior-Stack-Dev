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
  
  getProducts(userId?: string): Promise<Product[]>;
  getProduct(id: string, userId?: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct, userId?: string): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>, userId?: string): Promise<Product | undefined>;
  deleteProduct(id: string, userId?: string): Promise<boolean>;
  
  getSales(userId?: string): Promise<Sale[]>;
  getSalesByDate(date: string, userId?: string): Promise<Sale[]>;
  createSale(sale: InsertSale, userId?: string): Promise<Sale>;
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

  async getProducts(userId?: string): Promise<Product[]> {
    let query = supabase
      .from('inventario')
      .select('*')
      .order('nombre');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products from Supabase:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: String(row.id),
      name: row.nombre,
      price: row.precio,
      quantity: row.cantidad,
      categoryId: row.categoria_id || null,
      localId: row.local_id || null,
      synced: 1,
      userId: row.user_id || null,
    }));
  }

  async getProduct(id: string, userId?: string): Promise<Product | undefined> {
    let query = supabase
      .from('inventario')
      .select('*')
      .eq('id', id);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return undefined;
    }

    return {
      id: String(data.id),
      name: data.nombre,
      price: data.precio,
      quantity: data.cantidad,
      categoryId: data.categoria_id || null,
      localId: data.local_id || null,
      synced: 1,
      userId: data.user_id || null,
    };
  }

  async createProduct(insertProduct: InsertProduct, userId?: string): Promise<Product> {
    const { data, error } = await supabase
      .from('inventario')
      .insert({
        nombre: insertProduct.name,
        precio: insertProduct.price,
        cantidad: insertProduct.quantity,
        categoria_id: insertProduct.categoryId || null,
        local_id: insertProduct.localId || null,
        user_id: userId || (insertProduct as any).userId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product in Supabase:', error);
      throw new Error('Failed to create product');
    }

    return {
      id: String(data.id),
      name: data.nombre,
      price: data.precio,
      quantity: data.cantidad,
      categoryId: data.categoria_id || null,
      localId: data.local_id || null,
      synced: 1,
      userId: data.user_id || null,
    };
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>, userId?: string): Promise<Product | undefined> {
    const updateData: Record<string, unknown> = {};
    
    if (updates.name !== undefined) updateData.nombre = updates.name;
    if (updates.price !== undefined) updateData.precio = updates.price;
    if (updates.quantity !== undefined) updateData.cantidad = updates.quantity;
    if (updates.categoryId !== undefined) updateData.categoria_id = updates.categoryId;

    let query = supabase
      .from('inventario')
      .update(updateData)
      .eq('id', id);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.select().single();

    if (error || !data) {
      console.error('Error updating product in Supabase:', error);
      return undefined;
    }

    return {
      id: String(data.id),
      name: data.nombre,
      price: data.precio,
      quantity: data.cantidad,
      categoryId: data.categoria_id || null,
      localId: data.local_id || null,
      synced: 1,
      userId: data.user_id || null,
    };
  }

  async deleteProduct(id: string, userId?: string): Promise<boolean> {
    let query = supabase
      .from('inventario')
      .delete()
      .eq('id', id);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting product from Supabase:', error);
      return false;
    }

    return true;
  }

  async getSales(userId?: string): Promise<Sale[]> {
    let query = supabase
      .from('ventas')
      .select('*')
      .order('date', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

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
      userId: row.user_id || null,
    }));
  }

  async getSalesByDate(date: string, userId?: string): Promise<Sale[]> {
    let query = supabase
      .from('ventas')
      .select('*')
      .eq('date', date)
      .order('id');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

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
      userId: row.user_id || null,
    }));
  }

  async createSale(insertSale: InsertSale, userId?: string): Promise<Sale> {
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
        user_id: userId || (insertSale as any).userId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating sale in Supabase:', error);
      throw new Error('Failed to create sale');
    }

    if (insertSale.productId) {
      const product = await this.getProduct(insertSale.productId, userId);
      if (product) {
        await this.updateProduct(insertSale.productId, {
          quantity: Math.max(0, product.quantity - insertSale.quantity),
        }, userId);
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
      userId: data.user_id || null,
    };
  }
}

export const storage = new SupabaseStorage();
