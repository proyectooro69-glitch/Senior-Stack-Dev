import type { Product, Category, Sale, InsertProduct, InsertCategory, InsertSale } from "@shared/schema";

const DB_NAME = 'ventafacil-db';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Categories store
      if (!database.objectStoreNames.contains('categories')) {
        const categoryStore = database.createObjectStore('categories', { keyPath: 'id' });
        categoryStore.createIndex('name', 'name', { unique: false });
      }

      // Products store
      if (!database.objectStoreNames.contains('products')) {
        const productStore = database.createObjectStore('products', { keyPath: 'id' });
        productStore.createIndex('categoryId', 'categoryId', { unique: false });
        productStore.createIndex('localId', 'localId', { unique: false });
        productStore.createIndex('synced', 'synced', { unique: false });
      }

      // Sales store
      if (!database.objectStoreNames.contains('sales')) {
        const saleStore = database.createObjectStore('sales', { keyPath: 'id' });
        saleStore.createIndex('productId', 'productId', { unique: false });
        saleStore.createIndex('date', 'date', { unique: false });
        saleStore.createIndex('localId', 'localId', { unique: false });
        saleStore.createIndex('synced', 'synced', { unique: false });
      }

      // Pending sync store for tracking offline changes
      if (!database.objectStoreNames.contains('pendingSync')) {
        database.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Generate local UUID
export function generateLocalId(): string {
  return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Categories CRUD
export async function getCategories(): Promise<Category[]> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['categories'], 'readonly');
    const store = transaction.objectStore('categories');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addCategory(category: InsertCategory): Promise<Category> {
  const database = await openDB();
  const newCategory: Category = {
    id: generateLocalId(),
    name: category.name,
    color: category.color || '#10B981',
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['categories'], 'readwrite');
    const store = transaction.objectStore('categories');
    const request = store.add(newCategory);

    request.onsuccess = () => resolve(newCategory);
    request.onerror = () => reject(request.error);
  });
}

export async function updateCategory(category: Category): Promise<Category> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['categories'], 'readwrite');
    const store = transaction.objectStore('categories');
    const request = store.put(category);

    request.onsuccess = () => resolve(category);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteCategory(id: string): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['categories'], 'readwrite');
    const store = transaction.objectStore('categories');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Bulk set categories (for sync from server)
export async function setCategories(categories: Category[]): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['categories'], 'readwrite');
    const store = transaction.objectStore('categories');
    
    // Clear and repopulate
    store.clear();
    categories.forEach(cat => store.put(cat));
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Products CRUD
export async function getProducts(): Promise<Product[]> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addProduct(product: InsertProduct): Promise<Product> {
  const database = await openDB();
  const localId = generateLocalId();
  const newProduct: Product = {
    id: localId,
    name: product.name,
    price: product.price,
    quantity: product.quantity ?? 0,
    categoryId: product.categoryId || null,
    localId: localId,
    synced: 0,
    userId: (product as any).userId || null,
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['products', 'pendingSync'], 'readwrite');
    const productStore = transaction.objectStore('products');
    const syncStore = transaction.objectStore('pendingSync');

    productStore.add(newProduct);
    syncStore.add({ type: 'product', action: 'add', data: newProduct, timestamp: Date.now() });

    transaction.oncomplete = () => resolve(newProduct);
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function updateProduct(product: Product): Promise<Product> {
  const database = await openDB();
  const updatedProduct = { ...product, synced: 0 };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['products', 'pendingSync'], 'readwrite');
    const productStore = transaction.objectStore('products');
    const syncStore = transaction.objectStore('pendingSync');

    productStore.put(updatedProduct);
    syncStore.add({ type: 'product', action: 'update', data: updatedProduct, timestamp: Date.now() });

    transaction.oncomplete = () => resolve(updatedProduct);
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function deleteProduct(id: string): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['products', 'pendingSync'], 'readwrite');
    const productStore = transaction.objectStore('products');
    const syncStore = transaction.objectStore('pendingSync');

    productStore.delete(id);
    syncStore.add({ type: 'product', action: 'delete', data: { id }, timestamp: Date.now() });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Bulk set products (for sync from server)
export async function setProducts(products: Product[]): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    
    // Clear and repopulate
    store.clear();
    products.forEach(prod => store.put({ ...prod, synced: 1 }));
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Sales CRUD
export async function getSales(): Promise<Sale[]> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['sales'], 'readonly');
    const store = transaction.objectStore('sales');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getSalesByDate(date: string): Promise<Sale[]> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['sales'], 'readonly');
    const store = transaction.objectStore('sales');
    const index = store.index('date');
    const request = index.getAll(date);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addSale(sale: InsertSale): Promise<Sale> {
  const database = await openDB();
  const localId = generateLocalId();
  const newSale: Sale = {
    id: localId,
    productId: sale.productId || null,
    productName: sale.productName,
    quantity: sale.quantity,
    unitPrice: sale.unitPrice,
    total: sale.total,
    date: sale.date,
    localId: localId,
    synced: 0,
    userId: (sale as any).userId || null,
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['sales', 'products', 'pendingSync'], 'readwrite');
    const saleStore = transaction.objectStore('sales');
    const productStore = transaction.objectStore('products');
    const syncStore = transaction.objectStore('pendingSync');

    // Add the sale
    saleStore.add(newSale);
    syncStore.add({ type: 'sale', action: 'add', data: newSale, timestamp: Date.now() });

    // Update product quantity if productId exists
    if (sale.productId) {
      const productRequest = productStore.get(sale.productId);
      productRequest.onsuccess = () => {
        const product = productRequest.result;
        if (product) {
          product.quantity = Math.max(0, product.quantity - sale.quantity);
          product.synced = 0;
          productStore.put(product);
        }
      };
    }

    transaction.oncomplete = () => resolve(newSale);
    transaction.onerror = () => reject(transaction.error);
  });
}

// Bulk set sales (for sync from server)
export async function setSales(sales: Sale[]): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['sales'], 'readwrite');
    const store = transaction.objectStore('sales');
    
    // Clear and repopulate
    store.clear();
    sales.forEach(sale => store.put({ ...sale, synced: 1 }));
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Pending sync operations
export async function getPendingSync(): Promise<any[]> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['pendingSync'], 'readonly');
    const store = transaction.objectStore('pendingSync');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function clearPendingSync(): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['pendingSync'], 'readwrite');
    const store = transaction.objectStore('pendingSync');
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function markAsSynced(storeName: 'products' | 'sales', id: string): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => {
      const item = request.result;
      if (item) {
        item.synced = 1;
        store.put(item);
      }
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Initialize with default categories if empty (only used when offline)
export async function initializeDefaultData(): Promise<void> {
  const categories = await getCategories();
  if (categories.length === 0) {
    const defaultCategories = [
      { name: 'Bebidas', color: '#3B82F6' },
      { name: 'Alimentos', color: '#10B981' },
      { name: 'Limpieza', color: '#F59E0B' },
      { name: 'Otros', color: '#6B7280' },
    ];

    for (const cat of defaultCategories) {
      await addCategory(cat);
    }
  }
}

// Clear all data (used when logging out)
export async function clearAllData(): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['products', 'sales', 'categories', 'pendingSync'], 'readwrite');
    
    transaction.objectStore('products').clear();
    transaction.objectStore('sales').clear();
    transaction.objectStore('categories').clear();
    transaction.objectStore('pendingSync').clear();
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
