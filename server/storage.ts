import { type User, type InsertUser, type Product, type InsertProduct, type Category, type InsertCategory, type Sale, type InsertSale } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  // Sales
  getSales(): Promise<Sale[]>;
  getSalesByDate(date: string): Promise<Sale[]>;
  createSale(sale: InsertSale): Promise<Sale>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private categories: Map<string, Category>;
  private products: Map<string, Product>;
  private sales: Map<string, Sale>;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.sales = new Map();
    
    // Initialize with default categories
    this.initializeDefaultCategories();
  }

  private initializeDefaultCategories() {
    const defaultCategories = [
      { name: 'Bebidas', color: '#3B82F6' },
      { name: 'Alimentos', color: '#10B981' },
      { name: 'Limpieza', color: '#F59E0B' },
      { name: 'Otros', color: '#6B7280' },
    ];

    defaultCategories.forEach((cat) => {
      const id = randomUUID();
      this.categories.set(id, { ...cat, id });
    });
  }

  // Users
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

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { ...insertCategory, id };
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

  // Products
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { 
      ...insertProduct, 
      id,
      synced: 1,
      localId: insertProduct.localId || null,
      categoryId: insertProduct.categoryId || null,
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates, synced: 1 };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  // Sales
  async getSales(): Promise<Sale[]> {
    return Array.from(this.sales.values());
  }

  async getSalesByDate(date: string): Promise<Sale[]> {
    return Array.from(this.sales.values()).filter(
      (sale) => sale.date === date
    );
  }

  async createSale(insertSale: InsertSale): Promise<Sale> {
    const id = randomUUID();
    const sale: Sale = { 
      ...insertSale, 
      id,
      synced: 1,
      localId: insertSale.localId || null,
      productId: insertSale.productId || null,
    };
    this.sales.set(id, sale);
    
    // Update product quantity
    if (insertSale.productId) {
      const product = this.products.get(insertSale.productId);
      if (product) {
        product.quantity = Math.max(0, product.quantity - insertSale.quantity);
        this.products.set(insertSale.productId, product);
      }
    }
    
    return sale;
  }
}

export const storage = new MemStorage();
