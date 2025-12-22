import { Link, useLocation } from "wouter";
import { Package, ShoppingCart, BarChart3 } from "lucide-react";

const navItems = [
  { path: "/", icon: Package, label: "Inventario" },
  { path: "/pos", icon: ShoppingCart, label: "Vender" },
  { path: "/reports", icon: BarChart3, label: "Reportes" },
];

export function BottomNavigation() {
  const [location] = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-safe"
      data-testid="bottom-navigation"
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;

          return (
            <Link key={item.path} href={item.path}>
              <button
                className={`flex flex-col items-center justify-center gap-1 rounded-lg px-6 py-2 transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon
                  className={`h-6 w-6 transition-transform ${
                    isActive ? "scale-110" : ""
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={`text-xs font-medium ${
                    isActive ? "font-semibold" : ""
                  }`}
                >
                  {item.label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
