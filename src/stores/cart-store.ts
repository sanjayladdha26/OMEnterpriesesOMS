// ============================================================
// Zustand Cart Store — manages order cart state
// ============================================================

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "./auth-store";
import type { CartItem, Order } from "@/types/database";

interface CartState {
  items: CartItem[];
  saving: boolean;
  party_id: string | null;
  party_name: string | null;
  agent_id: string | null;
  agent_name: string | null;

  // Actions
  addItem: (product: {
    product_id: string;
    product_name: string;
    quantity: number;
  }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setParty: (id: string | null, name: string | null) => void;
  setAgent: (id: string | null, name: string | null) => void;
  clearCart: () => void;
  createOrder: (orderNumber: string) => Promise<Order | null>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  saving: false,
  saving: false,
  party_id: null,
  party_name: null,
  agent_id: null,
  agent_name: null,

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
          ? { ...item, quantity }
          : item
      ),
    }));
  },

  setParty: (id, name) => {
    set({ party_id: id, party_name: name });
  },

  setAgent: (id, name) => {
    set({ agent_id: id, agent_name: name });
  },

  clearCart: () => {
    set({
      items: [],
      party_id: null,
      party_name: null,
      agent_id: null,
      agent_name: null,
    });
  },

  createOrder: async (orderNumber: string) => {
    const state = get();
    const authStore = useAuthStore.getState();
    const authAgent = authStore.agent;
    const authParty = authStore.party;
    
    // Determine party details
    const finalPartyId = authStore.role === "party" ? authParty?.id : state.party_id;
    const finalPartyName = authStore.role === "party" ? authParty?.account_name : state.party_name;

    // Determine agent details
    const finalAgentId = authStore.role === "party" ? authParty?.agent_id : (state.agent_id || authAgent?.id);
    const finalAgentName = authStore.role === "party" ? "Assigned Agent" : (state.agent_id ? state.agent_name : authAgent?.name);

    if (state.items.length === 0 || !finalPartyId || !finalAgentId || !finalAgentName) return null;

    set({ saving: true });

    const supabase = createClient();

    // Build items array for the RPC
    const itemsJson = state.items.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit: "metre",
      unit_price: 0,
      subtotal: 0,
    }));

    try {
      const { data, error } = await supabase.rpc("create_order", {
        p_order_number: orderNumber,
        p_party_id: finalPartyId,
        p_party_name: finalPartyName || "Unknown Party",
        p_agent_id: finalAgentId,
        p_agent_name: finalAgentName,
        p_subtotal: 0,
        p_total: 0,
        p_items: itemsJson,
      });

      if (error) throw error;

      // Build the saved order object
      const savedOrder: Order = {
        id: data.id,
        order_number: orderNumber,
        party_id: finalPartyId,
        party_name: finalPartyName || "Unknown Party",
        agent_id: finalAgentId,
        agent_name: finalAgentName,
        items: state.items.map((item) => ({
          id: item.id,
          order_id: data.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
        })),
        status: "pending",
        created_at: data.created_at,
        updated_at: data.created_at,
      };

      // Clear cart after successful save
      set({
        items: [],
        party_id: null,
        party_name: null,
        agent_id: null,
        agent_name: null,
        saving: false,
      });

      return savedOrder;
    } catch (error) {
      console.error("Failed to create order:", error);
      set({ saving: false });
      throw error;
    }
  },
}));
