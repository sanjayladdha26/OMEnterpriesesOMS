// ============================================================
// OM Order System — Database Types
// ============================================================

export type OrderStatus = "pending" | "accepted" | "dispatched" | "completed" | "rejected";

export type Unit = "metre" | "piece";

// ── Categories ──────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  preferred_mtr?: number | null;
  created_at: string;
}

// ── Products ────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  sku_name?: string | null;
  category?: string;
  price_per_unit: number;
  unit: string;
  description?: string | null;
  created_at: string;
}

// ── Staff ───────────────────────────────────────────────────

export interface Staff {
  id: string;
  name: string;
  code: string;
  can_create_order: boolean;
  can_accept_order: boolean;
  can_dispatch_order: boolean;
  can_complete_order: boolean;
  can_reject_order: boolean;
  can_view_orders?: boolean;
  can_view_inventory?: boolean;
  can_view_agents?: boolean;
  can_view_staff?: boolean;
  is_admin: boolean;
  created_at: string;
}

// ── Agents ──────────────────────────────────────────────────

export interface Agent {
  id: string;
  name: string;
  code: string;
  phone?: string | null;
  created_at: string;
}

// ── Parties ─────────────────────────────────────────────────

export interface Party {
  id: string;
  account_name: string;
  access_code?: string | null;
  address?: string | null;
  city?: string | null;
  pin_code?: string | null;
  state?: string | null;
  gstin?: string | null;
  phone1?: string | null;
  phone2?: string | null;
  transport?: string | null;
  delivery_city?: string | null;
  agent_id?: string | null;
  created_at: string;
}

// ── Orders ──────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
}

export interface Order {
  id: string;
  order_number: string;
  party_id: string | null;
  party_name: string;
  agent_id: string | null;
  agent_name: string;
  items: OrderItem[];
  party?: Party | null;
  status: OrderStatus;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

// ── Cart (client-side only) ─────────────────────────────────

export interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
}
