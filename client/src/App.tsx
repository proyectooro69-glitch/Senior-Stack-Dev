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
import { LoginPage } from "@/pages/Login";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import caimanLogo from "@assets/caiman_1766446614725.png";
import {
  openDB,
  getProducts,
  getCategories,
  getSales,
  addProduct,
  updateProduct,
  deleteProduct,
  addSale,
  initializeDefaultData,
  setProducts,
  setCategories,
  setSales,
  clearAllData,
} from "@/lib/indexedDB";
import { 
  initSyncService, 
  setSyncStatusCallback, 
  getOnlineStatus,
  fetchFromServer,
  triggerSync,
  setAuthToken,
} from "@/lib/syncService";
import type { Product, Category, Sale, InsertProduct, InsertSale, SyncStatus as SyncStatusType } from "@shared/schema";

function AuthenticatedApp() {
  const { user, signOut, session } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatusType>("online");
  const [products, setProductsState] = useState<Product[]>([]);
  const [categories, setCategoriesState] = useState<Category[]>([]);
  const [sales, setSalesState] = useState<Sale[]>([]);

  const loadData = useCallback(async () => {
    try {
      await openDB();
      
      if (getOnlineStatus() && session?.access_token) {
        setSyncStatus('syncing');
        setAuthToken(session.access_token);
        const serverData = await fetchFromServer();
        
        if (serverData) {
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
          await loadLocalData();
        }
      } else {
        await loadLocalData();
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      await loadLocalData();
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

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

  useEffect(() => {
    if (session?.access_token) {
      setAuthToken(session.access_token);
    }
    initSyncService();
    setSyncStatusCallback((status) => {
      setSyncStatus(status);
      if (status === 'online') {
        loadData();
      }
    });
    loadData();
  }, [loadData, session?.access_token]);

  const handleAddProduct = async (productData: InsertProduct) => {
    try {
      const productWithUser = {
        ...productData,
        userId: user?.id,
      };
      const newProduct = await addProduct(productWithUser);
      setProductsState((prev) => [...prev, newProduct]);
      
      if (getOnlineStatus()) {
        triggerSync();
      }
    } catch (error) {
      console.error("Failed to add product:", error);
    }
  };

  const handleUpdateProduct = async (product: Product) => {
    try {
      const updated = await updateProduct(product);
      setProductsState((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      
      if (getOnlineStatus()) {
        triggerSync();
      }
    } catch (error) {
      console.error("Failed to update product:", error);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      await deleteProduct(product.id);
      setProductsState((prev) => prev.filter((p) => p.id !== product.id));
      
      if (getOnlineStatus()) {
        triggerSync();
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  const handleSale = async (saleData: InsertSale) => {
    try {
      const saleWithUser = {
        ...saleData,
        userId: user?.id,
      };
      const newSale = await addSale(saleWithUser);
      setSalesState((prev) => [...prev, newSale]);
      
      if (saleData.productId) {
        setProductsState((prev) =>
          prev.map((p) =>
            p.id === saleData.productId
              ? { ...p, quantity: Math.max(0, p.quantity - saleData.quantity) }
              : p
          )
        );
      }
      
      if (getOnlineStatus()) {
        triggerSync();
      }
    } catch (error) {
      console.error("Failed to record sale:", error);
    }
  };

  const handleSignOut = async () => {
    await clearAllData();
    await signOut();
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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4">
        <div className="flex items-center gap-2">
          <img 
            src={caimanLogo} 
            alt="Caimán" 
            className="h-8 w-8 object-contain"
          />
          <div className="flex flex-col leading-none">
            <span className="text-xs text-muted-foreground">Solución Digital</span>
            <span className="text-sm font-semibold text-foreground">CAIMÁN</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SyncStatus status={syncStatus} />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            title="Cerrar sesión"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Switch>
          <Route path="/">
            <InventoryPage
              products={products}
              categories={categories}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
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
            <ReportsPage sales={sales} userEmail={user?.email} />
          </Route>
        </Switch>
      </main>

      <BottomNavigation />
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
