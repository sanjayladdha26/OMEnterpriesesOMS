// ============================================================
// TheBabySteps Order System — Database Types
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
  category: string;
  price_per_unit: number;
  unit: Unit;
  image_url?: string | null;
  description?: string | null;
  created_at: string;
}

// ── Customers ───────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  school_name?: string;
  created_at: string;
}

// ── Orders ──────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: Unit;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone?: string | null;
  customers?: { address?: string; school_name?: string } | null;
  items: OrderItem[];
  subtotal: number;
  total: number;
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
  unit: Unit;
  unit_price: number;
  subtotal: number;
  image_url?: string | null;
}
