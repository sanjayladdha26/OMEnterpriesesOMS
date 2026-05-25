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
  const [lastSavedOrder, setLastSavedOrder] = useState<Order | null>(null);

  const router = useRouter();
  const handleOrderSaved = useCallback((order: Order) => {
    setLastSavedOrder(order);
    setTimeout(() => {
      router.push("/store/orders");
    }, 1500);
  }, [router]);

  const displayOrderNumber = orderLoading ? "..." : orderNumber || "ORD-0001";

  return (
    <div className="flex flex-col lg:flex-row min-h-full lg:h-full">
      {/* Left — Product Selector */}
      <div className="flex-none lg:flex-1 h-[50vh] lg:h-auto lg:w-[60%] p-4 lg:p-6 flex flex-col">
        {/* Header */}
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

      {/* Right — Cart */}
      <div className="flex-none lg:flex-none lg:w-[40%] lg:min-w-[360px] border-t lg:border-t-0 flex flex-col">
        <CartPanel
          orderNumber={displayOrderNumber}
          onOrderSaved={handleOrderSaved}
        />
      </div>
    </div>
  );
}
