// ============================================================
// Zustand Cart Store — manages POS cart state
// ============================================================

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { CartItem, PaymentMethod, Unit, Bill } from "@/types/database";
import { formatINR } from "@/lib/utils";

interface CartState {
  items: CartItem[];
  discount_type: "percentage" | "flat";
  discount_value: number;
  payment_method: PaymentMethod;
  amount_received: number | null; // null means full payment
  customer_id: string | null;
  customer_name: string | null;
  saving: boolean;

  // Actions
  addItem: (product: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit: Unit;
    unit_price: number;
    hsn_code?: string;
  }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateItemDetails: (id: string, updates: Partial<CartItem>) => void;
  setDiscount: (type: "percentage" | "flat", value: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setAmountReceived: (amount: number | null) => void;
  setCustomer: (id: string | null, name: string | null) => void;
  clearCart: () => void;
  saveBill: (billNumber: string, waiveBalance?: boolean) => Promise<Bill | null>;

  // Computed (as functions)
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getGSTRate: () => number;
  getGSTAmount: () => number;
  getCGST: () => number;
  getSGST: () => number;
  getTotal: () => number;
  getBalanceDue: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount_type: "percentage",
  discount_value: 0,
  payment_method: "cash",
  amount_received: null,
  customer_id: null,
  customer_name: "",
  saving: false,

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
          hsn_code: product.hsn_code,
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

  updateItemDetails: (id, updates) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          // Recalculate subtotal in case quantity or unit_price changed
          updated.subtotal = updated.quantity * updated.unit_price;
          return updated;
        }
        return item;
      }),
    }));
  },

  setDiscount: (type, value) => {
    set({ discount_type: type, discount_value: value });
  },

  setPaymentMethod: (method) => {
    // Reset amount_received when switching to khata
    if (method === "credit") {
      set({ payment_method: method, amount_received: null });
    } else {
      set({ payment_method: method });
    }
  },

  setAmountReceived: (amount) => {
    set({ amount_received: amount });
  },

  setCustomer: (id, name) => {
    set({ customer_id: id, customer_name: name });
  },

  clearCart: () => {
    set({
      items: [],
      discount_type: "percentage",
      discount_value: 0,
      payment_method: "cash",
      amount_received: null,
      customer_id: null,
      customer_name: "",
    });
  },

  saveBill: async (billNumber: string, waiveBalance?: boolean) => {
    const state = get();
    if (state.items.length === 0) return null;

    set({ saving: true });

    const supabase = createClient();
    const subtotal = state.getSubtotal();
    const discountAmount = state.getDiscountAmount();
    const gstRate = state.getGSTRate();
    const cgst = state.getCGST();
    const sgst = state.getSGST();
    const gstAmount = state.getGSTAmount();
    const total = state.getTotal();
    const originalBalanceDue = state.getBalanceDue();
    const balanceDue = waiveBalance ? 0 : originalBalanceDue;
    const actualPaidAmount = waiveBalance && state.amount_received !== null ? state.amount_received : (total - balanceDue);

    const billPaymentMethod = state.payment_method;

    // Build items array for the RPC
    const itemsJson = state.items.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
      hsn_code: item.hsn_code,
    }));

    // Payment notes
    const paymentNotes = actualPaidAmount > 0 && state.customer_id
      ? (waiveBalance
          ? `Upfront payment for Bill ${billNumber} (${formatINR(originalBalanceDue)} Waived)`
          : `Upfront payment for Bill ${billNumber}`)
      : null;

    try {
      const { data, error } = await supabase.rpc('save_bill_with_payment', {
        p_bill_number: billNumber,
        p_customer_id: state.customer_id,
        p_customer_name: state.customer_name,
        p_subtotal: subtotal,
        p_discount_type: state.discount_type,
        p_discount_value: state.discount_value,
        p_discount_amount: discountAmount,
        p_gst_rate: gstRate,
        p_cgst_amount: cgst,
        p_sgst_amount: sgst,
        p_gst_amount: gstAmount,
        p_total: total,
        p_amount_paid: actualPaidAmount,
        p_payment_method: billPaymentMethod,
        p_status: balanceDue > 0 ? "pending" : "completed",
        p_items: itemsJson,
        p_payment_notes: paymentNotes,
        p_waived_amount: waiveBalance ? originalBalanceDue : 0,
      });

      if (error) throw error;

      // Build the saved bill object for receipt printing
      const savedBill: Bill = {
        id: data.id,
        bill_number: billNumber,
        customer_id: state.customer_id,
        customer_name: state.customer_name,
        items: state.items.map((item) => ({
          id: item.id,
          bill_id: data.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
          hsn_code: item.hsn_code,
        })),
        subtotal,
        discount_type: state.discount_type,
        discount_value: state.discount_value,
        discount_amount: discountAmount,
        gst_rate: gstRate,
        cgst_amount: cgst,
        sgst_amount: sgst,
        gst_amount: gstAmount,
        total,
        amount_paid: actualPaidAmount,
        payment_method: billPaymentMethod,
        status: balanceDue > 0 ? "pending" : "completed",
        created_at: data.created_at,
      };

      // Clear cart after successful save
      set({
        items: [],
        discount_type: "percentage",
        discount_value: 0,
        payment_method: "cash",
        amount_received: null,
        customer_id: null,
        customer_name: "",
        saving: false,
      });

      return savedBill;
    } catch (error) {
      const e = error as { message?: string; code?: string; details?: string; hint?: string };
      console.error("Failed to save bill:", e?.message ?? error, {
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

  getDiscountAmount: () => {
    const { discount_type, discount_value } = get();
    const subtotal = get().getSubtotal();
    if (discount_type === "percentage") {
      return (subtotal * discount_value) / 100;
    }
    return Math.min(discount_value, subtotal);
  },

  getGSTRate: () => {
    return 5;
  },

  getGSTAmount: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount();
    const taxableAmount = subtotal - discount;
    const rate = get().getGSTRate();
    return (taxableAmount * rate) / 100;
  },

  getCGST: () => {
    return get().getGSTAmount() / 2;
  },

  getSGST: () => {
    return get().getGSTAmount() / 2;
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount();
    const gst = get().getGSTAmount();
    return subtotal - discount + gst;
  },

  getBalanceDue: () => {
    const state = get();
    const total = state.getTotal();

    // Full khata — entire amount is due
    if (state.payment_method === "credit") return total;

    // Cash/UPI with amount_received specified
    if (state.amount_received !== null && state.amount_received < total) {
      return Math.max(0, total - state.amount_received);
    }

    // Fully paid
    return 0;
  },
}));
