// ============================================================
// Zustand Cart Store — manages order cart state (simplified)
// ============================================================

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { CartItem, Unit, Order } from "@/types/database";

interface CartState {
  items: CartItem[];
  saving: boolean;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;

  // Actions
  addItem: (product: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit: Unit;
    unit_price: number;
    image_url?: string | null;
  }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setCustomer: (id: string | null, name: string | null, phone: string | null) => void;
  clearCart: () => void;
  createOrder: (orderNumber: string) => Promise<Order | null>;

  // Computed
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  saving: false,
  customer_id: null,
  customer_name: null,
  customer_phone: null,

  addItem: (product) => {
    const id = `cart-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({
      items: [
        ...state.items,
        {
          id,
          product_id: product.product_id,
          product_name: product.product_name,
          quantity: product.quantity,
          unit: product.unit,
          unit_price: product.unit_price,
          subtotal: product.quantity * product.unit_price,
          image_url: product.image_url,
        },
      ],
    }));
  },

  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },

  updateQuantity: (id, quantity) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? { ...item, quantity, subtotal: quantity * item.unit_price }
          : item
      ),
    }));
  },

  setCustomer: (id, name, phone) => {
    set({ customer_id: id, customer_name: name, customer_phone: phone });
  },

  clearCart: () => {
    set({
      items: [],
      customer_id: null,
      customer_name: null,
      customer_phone: null,
    });
  },

  createOrder: async (orderNumber: string) => {
    const state = get();
    if (state.items.length === 0) return null;

    set({ saving: true });

    const supabase = createClient();
    const subtotal = state.getSubtotal();
    const total = subtotal; // No GST or discounts

    // Build items array for the RPC
    const itemsJson = state.items.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
    }));

    try {
      const { data, error } = await supabase.rpc("create_order", {
        p_order_number: orderNumber,
        p_customer_id: state.customer_id,
        p_customer_name: state.customer_name || "Guest",
        p_customer_phone: state.customer_phone || null,
        p_subtotal: subtotal,
        p_total: total,
        p_items: itemsJson,
      });

      if (error) throw error;

      // Build the saved order object
      const savedOrder: Order = {
        id: data.id,
        order_number: orderNumber,
        customer_id: state.customer_id,
        customer_name: state.customer_name || "Guest",
        customer_phone: state.customer_phone,
        items: state.items.map((item) => ({
          id: item.id,
          order_id: data.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
        })),
        subtotal,
        total,
        status: "pending",
        created_at: data.created_at,
        updated_at: data.created_at,
      };

      // Clear cart after successful save
      set({
        items: [],
        customer_id: null,
        customer_name: null,
        customer_phone: null,
        saving: false,
      });

      return savedOrder;
    } catch (error) {
      const e = error as { message?: string; code?: string; details?: string; hint?: string };
      console.error("Failed to create order:", e?.message ?? error, {
        code: e?.code,
        details: e?.details,
        hint: e?.hint,
      });
      set({ saving: false });
      throw error;
    }
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.subtotal, 0);
  },

  getTotal: () => {
    // Total equals subtotal — no GST or discounts
    return get().getSubtotal();
  },
}));
