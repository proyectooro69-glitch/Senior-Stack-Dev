import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/ProductCard";
import { AddProductDialog } from "@/components/AddProductDialog";
import type { Product, Category, InsertProduct } from "@shared/schema";

interface InventoryPageProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (product: InsertProduct) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
}

export function InventoryPage({
  products,
  categories,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}: InventoryPageProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setDialogOpen(true);
  };

  const handleSave = (data: InsertProduct) => {
    if (editProduct) {
      onUpdateProduct({ ...editProduct, ...data });
    } else {
      onAddProduct(data);
    }
    setEditProduct(null);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setEditProduct(null);
    }
    setDialogOpen(open);
  };

  const getCategoryById = (id: string | null) => {
    if (!id) return undefined;
    return categories.find((c) => c.id === id);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border px-4 py-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-bold text-foreground">Inventario</h1>
          <Button
            onClick={() => setDialogOpen(true)}
            className="h-10"
            data-testid="add-product-button"
          >
            <Plus className="mr-1 h-4 w-4" />
            Agregar
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 pl-10"
            data-testid="search-products"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          <Badge
            variant={selectedCategory === null ? "default" : "secondary"}
            className="cursor-pointer whitespace-nowrap px-3 py-1.5"
            onClick={() => setSelectedCategory(null)}
            data-testid="filter-all"
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
              data-testid={`filter-${category.name.toLowerCase()}`}
            >
              {category.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Product list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">
              No hay productos
            </h3>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              {searchQuery
                ? "No se encontraron productos con ese nombre"
                : "Agrega tu primer producto para comenzar"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                category={getCategoryById(product.categoryId)}
                onEdit={handleEdit}
                onDelete={onDeleteProduct}
              />
            ))}
          </div>
        )}
      </div>

      <AddProductDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        categories={categories}
        onSave={handleSave}
        editProduct={editProduct}
      />
    </div>
  );
}
