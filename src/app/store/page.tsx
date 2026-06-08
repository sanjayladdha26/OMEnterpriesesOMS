"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { ProductSelector } from "@/components/pos/product-selector";
import { CartPanel } from "@/components/pos/cart-panel";
import { useNextOrderNumber } from "@/lib/hooks";
import { useCartStore } from "@/stores/cart-store";
import type { Order } from "@/types/database";

export default function StorePage() {
  const { data: orderNumber, isLoading: orderLoading } = useNextOrderNumber();
  const cartItems = useCartStore((s) => s.items);
  const router = useRouter();

  const handleOrderSaved = useCallback(
    (order: Order) => {
      setTimeout(() => {
        router.push("/store/orders");
      }, 1500);
    },
    [router]
  );

  const displayOrderNumber = orderLoading ? "..." : orderNumber || "ORD-0001";

  return (
    <div className="flex flex-col lg:flex-row h-full relative">
      {/* ── Mobile: Products View ── */}
      <div className="lg:hidden flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">New Order</h1>
              <p className="text-sm text-text-muted">Select products to add</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-text-muted">Order #</p>
                <p className="text-sm font-semibold text-primary">{displayOrderNumber}</p>
              </div>
              {/* Mobile Cart Button */}
              <button
                onClick={() => router.push("/store/cart")}
                className="lg:hidden relative p-2 bg-surface rounded-full shadow-sm border border-border flex items-center justify-center text-primary"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 px-4 pb-4">
          <ProductSelector />
        </div>
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
