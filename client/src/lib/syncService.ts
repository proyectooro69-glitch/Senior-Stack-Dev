import { 
  getPendingSync, 
  clearPendingSync, 
  markAsSynced,
  getProducts,
  getCategories,
  getSales,
  openDB
} from './indexedDB';
import type { SyncStatus, Product, Category, Sale } from '@shared/schema';

type SyncStatusCallback = (status: SyncStatus) => void;

let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let syncStatusCallback: SyncStatusCallback | null = null;
let syncInProgress = false;

export function setSyncStatusCallback(callback: SyncStatusCallback) {
  syncStatusCallback = callback;
  callback(isOnline ? 'online' : 'offline');
}

export function getOnlineStatus(): boolean {
  return isOnline;
}

// Fetch data from server
export async function fetchFromServer(): Promise<{ products: Product[]; categories: Category[]; sales: Sale[] } | null> {
  if (!isOnline) return null;
  
  try {
    const [productsRes, categoriesRes, salesRes] = await Promise.all([
      fetch('/api/products'),
      fetch('/api/categories'),
      fetch('/api/sales'),
    ]);
    
    if (!productsRes.ok || !categoriesRes.ok || !salesRes.ok) {
      return null;
    }
    
    const [products, categories, sales] = await Promise.all([
      productsRes.json(),
      categoriesRes.json(),
      salesRes.json(),
    ]);
    
    return { products, categories, sales };
  } catch (error) {
    console.error('Failed to fetch from server:', error);
    return null;
  }
}

// Sync pending data to server
export async function syncToServer(): Promise<boolean> {
  if (syncInProgress || !isOnline) return false;

  try {
    syncInProgress = true;
    syncStatusCallback?.('syncing');

    const pendingItems = await getPendingSync();

    if (pendingItems.length === 0) {
      syncStatusCallback?.('online');
      syncInProgress = false;
      return true;
    }

    // Sort by timestamp to maintain order
    pendingItems.sort((a, b) => a.timestamp - b.timestamp);

    const results = { success: 0, failed: 0 };

    for (const item of pendingItems) {
      try {
        let endpoint = '';
        let method = 'POST';
        let body = item.data;

        switch (item.type) {
          case 'product':
            endpoint = '/api/products';
            if (item.action === 'update') {
              endpoint = `/api/products/${item.data.id}`;
              method = 'PATCH';
            } else if (item.action === 'delete') {
              endpoint = `/api/products/${item.data.id}`;
              method = 'DELETE';
              body = null;
            }
            break;
          case 'sale':
            endpoint = '/api/sales';
            break;
          case 'category':
            endpoint = '/api/categories';
            if (item.action === 'update') {
              endpoint = `/api/categories/${item.data.id}`;
              method = 'PATCH';
            } else if (item.action === 'delete') {
              endpoint = `/api/categories/${item.data.id}`;
              method = 'DELETE';
              body = null;
            }
            break;
        }

        if (endpoint) {
          const options: RequestInit = {
            method,
            headers: { 'Content-Type': 'application/json' },
          };
          
          if (body && method !== 'DELETE') {
            options.body = JSON.stringify(body);
          }

          const response = await fetch(endpoint, options);

          if (response.ok && item.data?.id && item.type !== 'category') {
            await markAsSynced(item.type === 'sale' ? 'sales' : 'products', item.data.id);
            results.success++;
          } else if (response.ok) {
            results.success++;
          } else {
            console.error(`Sync failed for ${item.type}:`, await response.text());
            results.failed++;
          }
        }
      } catch (err) {
        console.error('Failed to sync item:', item, err);
        results.failed++;
      }
    }

    // Clear all pending items after processing (even if some failed, to prevent infinite retry loop)
    await clearPendingSync();
    
    syncStatusCallback?.(isOnline ? 'online' : 'offline');
    return results.failed === 0;
  } catch (error) {
    console.error('Sync failed:', error);
    syncStatusCallback?.(isOnline ? 'online' : 'offline');
    return false;
  } finally {
    syncInProgress = false;
  }
}

// Initialize online/offline listeners
export function initSyncService() {
  if (typeof window === 'undefined') return;

  // Listen for online event - silent sync
  window.addEventListener('online', () => {
    isOnline = true;
    syncStatusCallback?.('syncing');
    // Attempt sync after coming back online
    setTimeout(() => {
      syncToServer().catch(console.error);
    }, 1000);
  });

  // Listen for offline event
  window.addEventListener('offline', () => {
    isOnline = false;
    syncStatusCallback?.('offline');
  });
}

// Manual sync trigger
export function triggerSync(): Promise<boolean> {
  if (!isOnline) {
    return Promise.resolve(false);
  }
  return syncToServer();
}
