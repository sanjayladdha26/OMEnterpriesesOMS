"use client";

import { ShoppingCart, X, Plus, Minus, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { useCartStore } from "@/stores/cart-store";
import { formatINR, cn } from "@/lib/utils";
import { OrderSubmitBar } from "./order-submit-bar";
import { useCustomerProfileStore } from "@/stores/customer-profile-store";
import type { Order } from "@/types/database";

interface CartPanelProps {
  orderNumber: string;
  onOrderSaved: (order: Order) => void;
}

export function CartPanel({ orderNumber, onOrderSaved }: CartPanelProps) {
  const profile = useCustomerProfileStore();

  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTotal,
    setCustomer,
  } = useCartStore();

  // Sync profile to cart store
  useEffect(() => {
    setCustomer(
      profile.customerId || null,
      profile.name ? `${profile.name}` : "Guest",
      profile.phone || null
    );
  }, [profile.customerId, profile.name, profile.phone, setCustomer]);

  const subtotal = getSubtotal();
  const total = getTotal();

  return (
    <div className="flex flex-col h-full bg-surface lg:border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-text-primary">Your Cart</h2>
          {items.length > 0 && (
            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full font-medium">
              {items.length}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-red hover:text-red-dark font-medium flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-[150px] lg:min-h-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted py-12">
            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
              <ShoppingCart className="w-7 h-7 opacity-40" />
            </div>
            <p className="text-sm font-medium">No items yet</p>
            <p className="text-xs mt-1">Add products to your order</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-surface rounded-xl p-3 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-text-primary truncate">
                      {item.product_name}
                    </h4>
                    <p className="text-xs text-text-muted mt-0.5">
                      {formatINR(item.unit_price)}/{item.unit === "piece" ? "pc" : item.unit}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 rounded-lg text-text-light hover:text-red hover:bg-red-light transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-surface-hover rounded-lg p-1 border border-border">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-7 h-7 rounded border border-border flex items-center justify-center hover:bg-surface-hover transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, Math.max(0, parseInt(e.target.value) || 0))}
                        step="1"
                        min="0"
                        className="w-12 text-center text-sm font-semibold bg-transparent focus:outline-none"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 mr-1 rounded border border-border flex items-center justify-center hover:bg-surface-hover transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-text-primary">
                    {formatINR(item.subtotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary - only show when items exist */}
      {items.length > 0 && (
        <div className="border-t border-border px-4 py-3 space-y-2">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-text-muted">
              <span>Subtotal ({items.length} items)</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="text-base font-bold text-text-primary">Total</span>
              <span className="text-lg font-bold text-primary">{formatINR(total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Order Submit Bar */}
      {items.length > 0 && (
        <OrderSubmitBar
          total={total}
          orderNumber={orderNumber}
          onOrderSaved={onOrderSaved}
        />
      )}
    </div>
  );
}
