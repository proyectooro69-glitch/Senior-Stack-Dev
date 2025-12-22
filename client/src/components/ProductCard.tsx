import { Package, Minus, Plus, Edit2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Product, Category } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  category?: Category;
  onEdit?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  showQuantityControls?: boolean;
  cartQuantity?: number;
  onUpdateCartQuantity?: (product: Product, quantity: number) => void;
}

export function ProductCard({
  product,
  category,
  onEdit,
  onAddToCart,
  showQuantityControls = false,
  cartQuantity = 0,
  onUpdateCartQuantity,
}: ProductCardProps) {
  const isOutOfStock = product.quantity <= 0;
  const isLowStock = product.quantity > 0 && product.quantity <= 5;

  return (
    <Card
      className={`relative overflow-visible p-4 transition-all ${
        isOutOfStock ? "opacity-60" : ""
      }`}
      data-testid={`product-card-${product.id}`}
    >
      <div className="flex gap-3">
        {/* Product image placeholder */}
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>

        {/* Product info */}
        <div className="flex flex-1 flex-col min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground truncate" data-testid={`product-name-${product.id}`}>
              {product.name}
            </h3>
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0"
                onClick={() => onEdit(product)}
                data-testid={`edit-product-${product.id}`}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {category && (
            <Badge
              variant="secondary"
              className="w-fit mt-1 text-xs"
              style={{ 
                backgroundColor: `${category.color}20`,
                color: category.color,
                borderColor: `${category.color}40`
              }}
            >
              {category.name}
            </Badge>
          )}

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-foreground tabular-nums" data-testid={`product-price-${product.id}`}>
                ${product.price.toFixed(2)}
              </span>
              <span
                className={`text-xs ${
                  isOutOfStock
                    ? "text-destructive"
                    : isLowStock
                    ? "text-amber-600 dark:text-amber-500"
                    : "text-muted-foreground"
                }`}
                data-testid={`product-stock-${product.id}`}
              >
                {isOutOfStock ? "Agotado" : `${product.quantity} en stock`}
              </span>
            </div>

            {/* Action buttons */}
            {showQuantityControls ? (
              <div className="flex items-center gap-2">
                {cartQuantity > 0 ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => onUpdateCartQuantity?.(product, cartQuantity - 1)}
                      data-testid={`decrease-${product.id}`}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold tabular-nums">
                      {cartQuantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => onUpdateCartQuantity?.(product, cartQuantity + 1)}
                      disabled={cartQuantity >= product.quantity}
                      data-testid={`increase-${product.id}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => onAddToCart?.(product)}
                    disabled={isOutOfStock}
                    className="h-10 px-4"
                    data-testid={`add-to-cart-${product.id}`}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Agregar
                  </Button>
                )}
              </div>
            ) : onAddToCart ? (
              <Button
                onClick={() => onAddToCart(product)}
                disabled={isOutOfStock}
                size="icon"
                className="h-10 w-10"
                data-testid={`quick-add-${product.id}`}
              >
                <Plus className="h-5 w-5" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Sync indicator */}
      {product.synced === 0 && (
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-500" title="Pendiente de sincronizar" />
      )}
    </Card>
  );
}
