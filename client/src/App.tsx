import { useState, useEffect, useCallback } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SplashScreen } from "@/components/SplashScreen";
import { SyncStatus } from "@/components/SyncStatus";
import { BottomNavigation } from "@/components/BottomNavigation";
import { InventoryPage } from "@/pages/Inventory";
import { POSPage } from "@/pages/POS";
import { ReportsPage } from "@/pages/Reports";
import {
  openDB,
  getProducts,
  getCategories,
  getSales,
  addProduct,
  updateProduct,
  addSale,
  initializeDefaultData,
  setProducts,
  setCategories,
  setSales,
} from "@/lib/indexedDB";
import { 
  initSyncService, 
  setSyncStatusCallback, 
  getOnlineStatus,
  fetchFromServer,
  triggerSync 
} from "@/lib/syncService";
import type { Product, Category, Sale, InsertProduct, InsertSale, SyncStatus as SyncStatusType } from "@shared/schema";

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatusType>("online");
  const [products, setProductsState] = useState<Product[]>([]);
  const [categories, setCategoriesState] = useState<Category[]>([]);
  const [sales, setSalesState] = useState<Sale[]>([]);

  // Load data - tries server first, falls back to IndexedDB
  const loadData = useCallback(async () => {
    try {
      await openDB();
      
      // Try to fetch from server if online
      if (getOnlineStatus()) {
        setSyncStatus('syncing');
        const serverData = await fetchFromServer();
        
        if (serverData) {
          // Store server data in IndexedDB for offline access
          await Promise.all([
            setProducts(serverData.products),
            setCategories(serverData.categories),
            setSales(serverData.sales),
          ]);
          
          setProductsState(serverData.products);
          setCategoriesState(serverData.categories);
          setSalesState(serverData.sales);
          setSyncStatus('online');
        } else {
          // Fallback to local data if server fetch failed
          await loadLocalData();
        }
      } else {
        // Offline - load from IndexedDB
        await loadLocalData();
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      // Try local data as final fallback
      await loadLocalData();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadLocalData = async () => {
    await initializeDefaultData();
    
    const [loadedProducts, loadedCategories, loadedSales] = await Promise.all([
      getProducts(),
      getCategories(),
      getSales(),
    ]);
    
    setProductsState(loadedProducts);
    setCategoriesState(loadedCategories);
    setSalesState(loadedSales);
  };

  // Initialize app
  useEffect(() => {
    initSyncService();
    setSyncStatusCallback((status) => {
      setSyncStatus(status);
      // Reload data when coming back online
      if (status === 'online') {
        loadData();
      }
    });
    loadData();
  }, [loadData]);

  // Handle adding product
  const handleAddProduct = async (productData: InsertProduct) => {
    try {
      const newProduct = await addProduct(productData);
      setProductsState((prev) => [...prev, newProduct]);
      
      // Try to sync immediately if online
      if (getOnlineStatus()) {
        triggerSync();
      }
    } catch (error) {
      console.error("Failed to add product:", error);
    }
  };

  // Handle updating product
  const handleUpdateProduct = async (product: Product) => {
    try {
      const updated = await updateProduct(product);
      setProductsState((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      
      // Try to sync immediately if online
      if (getOnlineStatus()) {
        triggerSync();
      }
    } catch (error) {
      console.error("Failed to update product:", error);
    }
  };

  // Handle sale
  const handleSale = async (saleData: InsertSale) => {
    try {
      const newSale = await addSale(saleData);
      setSalesState((prev) => [...prev, newSale]);
      
      // Update product quantity locally
      if (saleData.productId) {
        setProductsState((prev) =>
          prev.map((p) =>
            p.id === saleData.productId
              ? { ...p, quantity: Math.max(0, p.quantity - saleData.quantity) }
              : p
          )
        );
      }
      
      // Try to sync immediately if online
      if (getOnlineStatus()) {
        triggerSync();
      }
    } catch (error) {
      console.error("Failed to record sale:", error);
    }
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex min-h-screen flex-col bg-background">
          {/* Header with sync status */}
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4">
            <span className="text-lg font-semibold text-foreground">VentaFácil</span>
            <SyncStatus status={syncStatus} />
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-hidden">
            <Switch>
              <Route path="/">
                <InventoryPage
                  products={products}
                  categories={categories}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                />
              </Route>
              <Route path="/pos">
                <POSPage
                  products={products}
                  categories={categories}
                  onSale={handleSale}
                />
              </Route>
              <Route path="/reports">
                <ReportsPage sales={sales} />
              </Route>
            </Switch>
          </main>

          {/* Bottom navigation */}
          <BottomNavigation />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
