import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "./supabase/client";
import type {
  Product,
  Customer,
  Order,
  Category,
} from "@/types/database";

// Utility hook to get the Supabase client
export function useSupabase() {
  return createClient();
}

export function useCategories() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useProducts() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useCustomers() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Customer[];
    },
  });
}

// ── Orders ──────────────────────────────────────────────────

export function useOrders() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return orders as Order[];
    },
  });
}

export function useCustomerOrders(customerId: string) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["customer-orders", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return orders as Order[];
    },
    enabled: !!customerId,
  });
}

export function useOrderDetails(orderId: string | null) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error) throw error;

      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;

      return { ...order, items } as Order;
    },
    enabled: !!orderId,
  });
}

export function useNextOrderNumber() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["nextOrderNumber"],
    queryFn: async () => {
      const year = new Date().getFullYear();
      const prefix = `ORD-${year}-`;

      const { data, error } = await supabase
        .from("orders")
        .select("order_number")
        .like("order_number", `${prefix}%`)
        .order("order_number", { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNum = 1;
      if (data && data.length > 0) {
        const lastNum = parseInt(data[0].order_number.replace(prefix, ""), 10);
        if (!isNaN(lastNum)) nextNum = lastNum + 1;
      }

      return `${prefix}${String(nextNum).padStart(3, "0")}`;
    },
  });
}

export function useUpdateOrderStatus() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
      adminNotes,
    }: {
      orderId: string;
      status: string;
      adminNotes?: string;
    }) => {
      const { error } = await supabase.rpc("update_order_status", {
        p_order_id: orderId,
        p_status: status,
        p_admin_notes: adminNotes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
    },
  });
}

export function useDeleteOrder() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase.rpc("delete_order", {
        p_order_id: orderId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
    },
  });
}
