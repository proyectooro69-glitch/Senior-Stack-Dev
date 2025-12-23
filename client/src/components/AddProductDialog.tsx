import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Minus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product, Category } from "@shared/schema";

const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  price: z.coerce.number().min(0.01, "El precio debe ser mayor a 0"),
  quantity: z.coerce.number().int().min(0, "La cantidad no puede ser negativa"),
  categoryId: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSave: (data: ProductFormData) => void;
  editProduct?: Product | null;
}

export function AddProductDialog({
  open,
  onOpenChange,
  categories,
  onSave,
  editProduct,
}: AddProductDialogProps) {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      price: 0,
      quantity: 1,
      categoryId: undefined,
    },
  });

  useEffect(() => {
    if (editProduct) {
      form.reset({
        name: editProduct.name,
        price: editProduct.price,
        quantity: editProduct.quantity,
        categoryId: editProduct.categoryId || undefined,
      });
    } else {
      form.reset({
        name: "",
        price: 0,
        quantity: 1,
        categoryId: undefined,
      });
    }
  }, [editProduct, form, open]);

  const handleSubmit = (data: ProductFormData) => {
    onSave(data);
    onOpenChange(false);
    form.reset();
  };

  const quantity = form.watch("quantity");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="add-product-dialog">
        <DialogHeader>
          <DialogTitle>
            {editProduct ? "Editar Producto" : "Agregar Producto"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del producto</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej: Coca Cola 500ml"
                      className="h-12"
                      data-testid="input-product-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="h-12 pl-7 tabular-nums"
                        data-testid="input-product-price"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad inicial</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-12 w-12"
                        onClick={() => form.setValue("quantity", Math.max(0, quantity - 1))}
                        data-testid="decrease-quantity"
                      >
                        <Minus className="h-5 w-5" />
                      </Button>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        className="h-12 text-center tabular-nums"
                        data-testid="input-product-quantity"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-12 w-12"
                        onClick={() => form.setValue("quantity", quantity + 1)}
                        data-testid="increase-quantity"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12" data-testid="select-category">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id}
                          data-testid={`category-option-${category.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => {
                    form.reset({
                      name: "",
                      price: 0,
                      quantity: 1,
                      categoryId: undefined,
                    });
                  }}
                  data-testid="cancel-product"
                >
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="flex-1 h-12"
                data-testid="save-product"
              >
                {editProduct ? "Guardar cambios" : "Agregar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
