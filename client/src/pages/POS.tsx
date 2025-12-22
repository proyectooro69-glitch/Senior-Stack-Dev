import { useState } from "react";
import { ShoppingCart, Trash2, Search, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/ProductCard";
import { useToast } from "@/hooks/use-toast";
import type { Product, Category, CartItem, InsertSale } from "@shared/schema";

interface POSPageProps {
  products: Product[];
  categories: Category[];
  onSale: (sale: InsertSale) => void;
}

export function POSPage({ products, categories, onSale }: POSPageProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const availableProducts = products.filter((p) => p.quantity > 0);

  const filteredProducts = availableProducts.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getCartQuantity = (productId: string) => {
    const item = cart.find((i) => i.product.id === productId);
    return item?.quantity || 0;
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((i) => i.product.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.quantity) {
        setCart(
          cart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      }
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateCartQuantity = (product: Product, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter((item) => item.product.id !== product.id));
    } else if (quantity <= product.quantity) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleCompleteSale = () => {
    if (cart.length === 0) return;

    const today = new Date().toISOString().split("T")[0];

    cart.forEach((item) => {
      const sale: InsertSale = {
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
        total: item.product.price * item.quantity,
        date: today,
        localId: null,
      };
      onSale(sale);
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      clearCart();
    }, 1500);

    toast({
      title: "Venta registrada",
      description: `Total: $${cartTotal.toFixed(2)}`,
    });
  };

  const getCategoryById = (id: string | null) => {
    if (!id) return undefined;
    return categories.find((c) => c.id === id);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Success overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="rounded-full bg-primary p-4 mb-4">
                <CheckCircle className="h-12 w-12 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Venta Completada
              </h2>
              <p className="text-lg text-muted-foreground mt-1">
                Total: ${cartTotal.toFixed(2)}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border px-4 py-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-bold text-foreground">Punto de Venta</h1>
          {cart.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-destructive"
              data-testid="clear-cart"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Vaciar
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 pl-10"
            data-testid="search-pos"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          <Badge
            variant={selectedCategory === null ? "default" : "secondary"}
            className="cursor-pointer whitespace-nowrap px-3 py-1.5"
            onClick={() => setSelectedCategory(null)}
          >
            Todos
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "secondary"}
              className="cursor-pointer whitespace-nowrap px-3 py-1.5"
              onClick={() => setSelectedCategory(category.id)}
              style={
                selectedCategory === category.id
                  ? { backgroundColor: category.color }
                  : {}
              }
            >
              {category.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Products grid */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: cart.length > 0 ? "180px" : "100px" }}>
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">
              No hay productos disponibles
            </h3>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              {searchQuery
                ? "No se encontraron productos"
                : "Agrega productos al inventario primero"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                category={getCategoryById(product.categoryId)}
                onAddToCart={addToCart}
                showQuantityControls
                cartQuantity={getCartQuantity(product.id)}
                onUpdateCartQuantity={updateCartQuantity}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cart summary - Fixed at bottom */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-background p-4 shadow-lg"
          >
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium text-foreground">
                    {cartItemsCount} {cartItemsCount === 1 ? "producto" : "productos"}
                  </span>
                </div>
                <span className="text-2xl font-bold text-foreground tabular-nums" data-testid="cart-total">
                  ${cartTotal.toFixed(2)}
                </span>
              </div>
              <Button
                className="w-full h-14 text-lg font-semibold"
                onClick={handleCompleteSale}
                data-testid="complete-sale"
              >
                Registrar Venta
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
