"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Package } from "lucide-react";
import { ProductSelector } from "@/components/pos/product-selector";
import { CartPanel } from "@/components/pos/cart-panel";
import { useNextOrderNumber } from "@/lib/hooks";
import { useCartStore } from "@/stores/cart-store";
import type { Order } from "@/types/database";
import { cn } from "@/lib/utils";

type Tab = "products" | "cart";

export default function StorePage() {
  const { data: orderNumber, isLoading: orderLoading } = useNextOrderNumber();
  const [activeTab, setActiveTab] = useState<Tab>("products");
  const cartItems = useCartStore((s) => s.items);
  const router = useRouter();

  const handleOrderSaved = useCallback(
    (order: Order) => {
      setActiveTab("products");
      setTimeout(() => {
        router.push("/store/orders");
      }, 1500);
    },
    [router]
  );

  const displayOrderNumber = orderLoading ? "..." : orderNumber || "ORD-0001";

  return (
    <div className="flex flex-col lg:flex-row h-full relative">

      {/* ── Mobile Tab Bar ── */}
      <div className="flex lg:hidden border-b border-border bg-surface flex-none no-print">
        <button
          onClick={() => setActiveTab("products")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2",
            activeTab === "products"
              ? "border-primary text-primary"
              : "border-transparent text-text-muted"
          )}
        >
          <Package className="w-4 h-4" />
          Products
        </button>
        <button
          onClick={() => setActiveTab("cart")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 relative",
            activeTab === "cart"
              ? "border-primary text-primary"
              : "border-transparent text-text-muted"
          )}
        >
          <span className="relative">
            <ShoppingCart className="w-4 h-4" />
            {cartItems.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </span>
          Cart
        </button>
      </div>

      {/* ── Mobile: Products Tab ── */}
      <div
        className={cn(
          "lg:hidden flex-1 flex flex-col min-h-0 overflow-y-auto",
          activeTab === "products" ? "flex" : "hidden"
        )}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">New Order</h1>
              <p className="text-sm text-text-muted">Select products to add</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">Order #</p>
              <p className="text-sm font-semibold text-primary">{displayOrderNumber}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 px-4 pb-4">
          <ProductSelector />
        </div>
      </div>

      {/* ── Mobile: Cart Tab ── */}
      <div
        className={cn(
          "lg:hidden flex-1 flex flex-col min-h-0 overflow-y-auto",
          activeTab === "cart" ? "flex" : "hidden"
        )}
      >
        <CartPanel
          orderNumber={displayOrderNumber}
          onOrderSaved={handleOrderSaved}
          onClose={() => setActiveTab("products")}
        />
      </div>

      {/* ── Desktop: Product Selector (left) ── */}
      <div className="hidden lg:flex lg:flex-none lg:w-[60%] p-6 flex-col min-h-0">
        <div className="flex-none flex items-center justify-between mb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold leading-none">New Order</h1>
            </div>
            <p className="text-sm text-text-muted leading-none">Select products to add</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Order #</p>
            <p className="text-sm font-semibold text-primary">{displayOrderNumber}</p>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <ProductSelector />
        </div>
      </div>

      {/* ── Desktop: Cart Panel (right) ── */}
      <div className="hidden lg:flex lg:w-[40%] lg:min-w-[360px] border-l border-border flex-col">
        <CartPanel
          orderNumber={displayOrderNumber}
          onOrderSaved={handleOrderSaved}
        />
      </div>
    </div>
  );
}
