import { useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, TrendingUp, Package, DollarSign, User, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Sale, DailyReportItem } from "@shared/schema";

interface ReportsPageProps {
  sales: Sale[];
  userEmail?: string;
}

export function ReportsPage({ sales, userEmail }: ReportsPageProps) {
  const today = new Date();
  const dateString = format(today, "yyyy-MM-dd");

  const todaysSales = useMemo(() => {
    return sales.filter((sale) => sale.date === dateString);
  }, [sales, dateString]);

  const reportData = useMemo(() => {
    const totalSales = todaysSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalItems = todaysSales.reduce((sum, sale) => sum + sale.quantity, 0);
    const averageTransaction =
      todaysSales.length > 0 ? totalSales / todaysSales.length : 0;

    // Group by product
    const productMap = new Map<string, DailyReportItem>();
    todaysSales.forEach((sale) => {
      const existing = productMap.get(sale.productName);
      if (existing) {
        existing.quantitySold += sale.quantity;
        existing.revenue += sale.total;
      } else {
        productMap.set(sale.productName, {
          productName: sale.productName,
          quantitySold: sale.quantity,
          revenue: sale.total,
        });
      }
    });

    const items = Array.from(productMap.values()).sort(
      (a, b) => b.revenue - a.revenue
    );

    return {
      date: dateString,
      totalSales,
      totalItems,
      averageTransaction,
      items,
      transactionCount: todaysSales.length,
    };
  }, [todaysSales, dateString]);

  const handlePrintReport = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cierre de Caja - ${format(today, "d 'de' MMMM yyyy", { locale: es })}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
          h1 { text-align: center; font-size: 18px; margin-bottom: 5px; }
          .subtitle { text-align: center; color: #666; font-size: 14px; margin-bottom: 20px; }
          .info { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 5px 0; border-bottom: 1px dashed #ccc; }
          .label { color: #666; }
          .value { font-weight: bold; }
          .total { font-size: 24px; text-align: center; margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
          .items { margin-top: 20px; }
          .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <h1>CIERRE DE CAJA</h1>
        <div class="subtitle">${format(today, "EEEE, d 'de' MMMM yyyy", { locale: es })}</div>
        
        <div class="info">
          <span class="label">Vendedor:</span>
          <span class="value">${userEmail || 'N/A'}</span>
        </div>
        
        <div class="total">
          <div style="color: #666; font-size: 14px;">TOTAL VENDIDO</div>
          <div style="font-size: 32px; font-weight: bold; color: #10B981;">$${reportData.totalSales.toFixed(2)}</div>
        </div>
        
        <div class="info">
          <span class="label">Transacciones:</span>
          <span class="value">${reportData.transactionCount}</span>
        </div>
        <div class="info">
          <span class="label">Productos vendidos:</span>
          <span class="value">${reportData.totalItems}</span>
        </div>
        <div class="info">
          <span class="label">Promedio por venta:</span>
          <span class="value">$${reportData.averageTransaction.toFixed(2)}</span>
        </div>
        
        ${reportData.items.length > 0 ? `
          <div class="items">
            <h3 style="font-size: 14px; margin-bottom: 10px;">Detalle por Producto:</h3>
            ${reportData.items.map(item => `
              <div class="item">
                <span>${item.productName} (x${item.quantitySold})</span>
                <span>$${item.revenue.toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        <div class="footer">
          Generado el ${format(new Date(), "d/MM/yyyy 'a las' HH:mm", { locale: es })}
          <br/>Caiman-POS
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border px-4 py-4">
        <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-report-title">
          Ventas de hoy
        </h1>
        {userEmail && (
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground" data-testid="text-seller-email">
              {userEmail}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">
            {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {/* Print button */}
        <Button
          onClick={handlePrintReport}
          className="w-full mb-6"
          size="lg"
          data-testid="button-print-report"
        >
          <Printer className="mr-2 h-5 w-5" />
          Cierre de Caja Diario
        </Button>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card data-testid="total-sales-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                ${reportData.totalSales.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                Total Ventas
              </p>
            </CardContent>
          </Card>

          <Card data-testid="total-items-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-lg bg-chart-2/10 p-2">
                  <Package className="h-4 w-4 text-chart-2" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {reportData.totalItems}
              </p>
              <p className="text-xs text-muted-foreground">
                Productos Vendidos
              </p>
            </CardContent>
          </Card>

          <Card data-testid="transactions-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-lg bg-chart-3/10 p-2">
                  <TrendingUp className="h-4 w-4 text-chart-3" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {reportData.transactionCount}
              </p>
              <p className="text-xs text-muted-foreground">
                Transacciones
              </p>
            </CardContent>
          </Card>

          <Card data-testid="average-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-lg bg-chart-4/10 p-2">
                  <DollarSign className="h-4 w-4 text-chart-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                ${reportData.averageTransaction.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                Promedio/Venta
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Product breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Desglose por Producto</CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.items.length === 0 ? (
              <div className="py-8 text-center">
                <div className="rounded-full bg-muted p-3 mx-auto w-fit mb-3">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No hay ventas para este día
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reportData.items.map((item, index) => (
                  <div
                    key={item.productName}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    data-testid={`report-item-${index}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {item.productName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantitySold}{" "}
                        {item.quantitySold === 1 ? "unidad" : "unidades"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground tabular-nums">
                        ${item.revenue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visual chart - Simple bar representation */}
        {reportData.items.length > 0 && (
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Distribución de Ventas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.items.slice(0, 5).map((item, index) => {
                  const percentage =
                    (item.revenue / reportData.totalSales) * 100;
                  const colors = [
                    "bg-primary",
                    "bg-chart-2",
                    "bg-chart-3",
                    "bg-chart-4",
                    "bg-chart-5",
                  ];
                  return (
                    <div key={item.productName}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-foreground truncate max-w-[60%]">
                          {item.productName}
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${colors[index % colors.length]}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
