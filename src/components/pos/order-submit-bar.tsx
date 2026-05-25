"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCartStore } from "@/stores/cart-store";
import { formatINR } from "@/lib/utils";
import type { Order } from "@/types/database";

interface OrderSubmitBarProps {
  total: number;
  orderNumber: string;
  onOrderSaved: (order: Order) => void;
}

export function OrderSubmitBar({ total, orderNumber, onOrderSaved }: OrderSubmitBarProps) {
  const { createOrder, saving } = useCartStore();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const handlePlaceOrder = async () => {
    if (!orderNumber) return;
    setError(null);

    // Require customer profile
    if (!useCartStore.getState().customer_id || !useCartStore.getState().customer_name || useCartStore.getState().customer_name === "Guest") {
      setError("Please set up your profile before placing an order.");
      return;
    }

    try {
      const savedOrder = await createOrder(orderNumber);
      if (savedOrder) {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
        queryClient.invalidateQueries({ queryKey: ["nextOrderNumber"] });

        onOrderSaved(savedOrder);
      }
    } catch (err) {
      console.error("Order failed:", err);
      setError("Failed to place order. Please try again.");
    }
  };

  return (
    <div className="border-t border-border px-4 py-4 space-y-3 bg-surface">
      {error && (
        <div className="text-xs text-red bg-red-light px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      <button
        onClick={handlePlaceOrder}
        disabled={saving}
        className="w-full py-4 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Placing Order...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Place Order — {formatINR(total)}
          </>
        )}
      </button>
    </div>
  );
}
