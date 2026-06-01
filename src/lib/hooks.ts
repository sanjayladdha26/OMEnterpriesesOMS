import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "./supabase/client";
import type {
  Product,
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

// ── Agents ───────────────────────────────────────────────────

export function useAgents() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as import("@/types/database").Agent[];
    },
  });
}

// ── Staff ────────────────────────────────────────────────────

export function useStaff() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as import("@/types/database").Staff[];
    },
  });
}

export function useCreateStaff() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newStaff: Omit<import("@/types/database").Staff, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("staff")
        .insert([newStaff])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useUpdateStaff() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<import("@/types/database").Staff> & { id: string }) => {
      const { data, error } = await supabase
        .from("staff")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useDeleteStaff() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("staff")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

// ── Parties ──────────────────────────────────────────────────

export function useParties() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["parties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parties")
        .select("*")
        .order("account_name", { ascending: true });
      if (error) throw error;
      return data as import("@/types/database").Party[];
    },
  });
}

export function useAgentParties(agentId: string) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["agent-parties", agentId],
    queryFn: async () => {
      if (!agentId) return [];
      const { data, error } = await supabase
        .from("parties")
        .select("*")
        .eq("agent_id", agentId)
        .order("account_name", { ascending: true });
      if (error) throw error;
      return data as import("@/types/database").Party[];
    },
    enabled: !!agentId,
  });
}

export function useParty(id: string) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["party", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("parties")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as import("@/types/database").Party;
    },
    enabled: !!id,
  });
}

export function useCreateParty() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newParty: Omit<import("@/types/database").Party, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("parties")
        .insert([newParty])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parties"] });
      queryClient.invalidateQueries({ queryKey: ["agent-parties"] });
    },
  });
}

export function useUpdateParty() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<import("@/types/database").Party> & { id: string }) => {
      const { data, error } = await supabase
        .from("parties")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parties"] });
      queryClient.invalidateQueries({ queryKey: ["agent-parties"] });
    },
  });
}

export function useDeleteParty() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("parties")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parties"] });
      queryClient.invalidateQueries({ queryKey: ["agent-parties"] });
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
        .select("*, items:order_items(*, products(sku_name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return orders as Order[];
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function useAgentOrders(agentId: string) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["agent-orders", agentId],
    queryFn: async () => {
      if (!agentId) return [];
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*, items:order_items(*, products(sku_name))")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return orders as Order[];
    },
    enabled: !!agentId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function usePartyOrders(partyId: string) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["party-orders", partyId],
    queryFn: async () => {
      if (!partyId) return [];
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*, items:order_items(*, products(sku_name))")
        .eq("party_id", partyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return orders as Order[];
    },
    enabled: !!partyId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
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
        .select("*, products(sku_name)")
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;

      let party = null;
      if (order.party_id) {
        const { data: partyData } = await supabase
          .from("parties")
          .select("*")
          .eq("id", order.party_id)
          .single();
        party = partyData || null;
      }

      return { ...order, items, party } as Order;
    },
    enabled: !!orderId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
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
      const { error } = await supabase.from("orders").update({
        status: status,
        ...(adminNotes !== undefined && { admin_notes: adminNotes || null }),
      }).eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["agent-orders"] });
    },
  });
}

export function useUpdateOrderNote() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      adminNotes,
    }: {
      orderId: string;
      adminNotes: string;
    }) => {
      const { error } = await supabase.from("orders").update({
        admin_notes: adminNotes || null,
      }).eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["agent-orders"] });
    },
  });
}

export function useDeleteOrder() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["agent-orders"] });
    },
  });
}
