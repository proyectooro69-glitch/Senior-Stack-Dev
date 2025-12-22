import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertCategorySchema, insertSaleSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Categories endpoints
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create category" });
      }
    }
  });

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const category = await storage.updateCategory(id, updates);
      
      if (!category) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCategory(id);
      
      if (!deleted) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Products endpoints
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const product = await storage.getProduct(id);
      
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create product" });
      }
    }
  });

  app.patch("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const product = await storage.updateProduct(id, updates);
      
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteProduct(id);
      
      if (!deleted) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Sales endpoints
  app.get("/api/sales", async (req, res) => {
    try {
      const { date } = req.query;
      
      if (date && typeof date === 'string') {
        const sales = await storage.getSalesByDate(date);
        res.json(sales);
      } else {
        const sales = await storage.getSales();
        res.json(sales);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sales" });
    }
  });

  app.post("/api/sales", async (req, res) => {
    try {
      const validatedData = insertSaleSchema.parse(req.body);
      const sale = await storage.createSale(validatedData);
      res.status(201).json(sale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create sale" });
      }
    }
  });

  // Sync endpoint - for bulk operations when coming back online
  app.post("/api/sync", async (req, res) => {
    try {
      const { products, sales } = req.body;
      const results = { products: [], sales: [] } as any;

      // Sync products
      if (products && Array.isArray(products)) {
        for (const product of products) {
          try {
            if (product.action === 'add') {
              const created = await storage.createProduct(product.data);
              results.products.push({ localId: product.data.localId, serverId: created.id, status: 'synced' });
            } else if (product.action === 'update') {
              await storage.updateProduct(product.data.id, product.data);
              results.products.push({ id: product.data.id, status: 'synced' });
            } else if (product.action === 'delete') {
              await storage.deleteProduct(product.data.id);
              results.products.push({ id: product.data.id, status: 'deleted' });
            }
          } catch (err) {
            results.products.push({ localId: product.data?.localId, status: 'error' });
          }
        }
      }

      // Sync sales
      if (sales && Array.isArray(sales)) {
        for (const sale of sales) {
          try {
            const created = await storage.createSale(sale.data);
            results.sales.push({ localId: sale.data.localId, serverId: created.id, status: 'synced' });
          } catch (err) {
            results.sales.push({ localId: sale.data?.localId, status: 'error' });
          }
        }
      }

      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to sync data" });
    }
  });

  return httpServer;
}
