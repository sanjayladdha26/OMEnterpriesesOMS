// ============================================================
// KapdaKart POS — Database Types
// ============================================================

export interface Category {
  id: string;
  created_at: string;
}

export type PaymentMethod = "cash" | "upi" | "credit";

export type StaffRole = "owner" | "manager" | "billing";

export type BillStatus = "completed" | "pending" | "cancelled";

export type Unit = "metre" | "piece";

// ── Products ────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  sku_name?: string | null;
  category: string;
  price_per_unit: number;
  unit: Unit;
  hsn_code: string;
  created_at: string;
}

// ── Customers ───────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  outstanding_balance: number;
  created_at: string;
}

// ── Bills ───────────────────────────────────────────────────

export interface BillItem {
  id: string;
  bill_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: Unit;
  unit_price: number;
  subtotal: number;
  hsn_code?: string;
}

export interface Bill {
  id: string;
  bill_number: string;
  customer_id: string | null;
  customer_name: string | null;
  items: BillItem[];
  subtotal: number;
  discount_type: "percentage" | "flat";
  discount_value: number;
  discount_amount: number;
  gst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  gst_amount: number;
  total: number;
  amount_paid: number;
  payment_method: PaymentMethod;
  status: BillStatus;
  created_at: string;
}

// ── Payment Allocations ─────────────────────────────────────

export interface PaymentAllocation {
  id: string;
  payment_id: string;
  bill_id: string;
  amount: number;
  created_at: string;
}

// ── Payments (Khata) ────────────────────────────────────────

export interface Payment {
  id: string;
  customer_id: string;
  amount: number;
  payment_method: PaymentMethod;
  notes: string;
  created_at: string;
}

// ── Settings ────────────────────────────────────────────────

export interface GSTConfig {
  low_threshold: number;
  low_rate: number;
  high_rate: number;
}

export interface ShopSettings {
  id: string;
  shop_name: string;
  gst_config: GSTConfig;
  printer_enabled: boolean;
  whatsapp_enabled: boolean;
  whatsapp_number: string;
  low_stock_threshold: number;
  invoice_start_number: number;
}

// ── Staff ───────────────────────────────────────────────────

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  email: string;
  is_active: boolean;
  created_at: string;
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
  hsn_code?: string;
  pieces?: number;
  metres_per_piece?: number;
}


// ── Ledger Entry ────────────────────────────────────────────

export interface LedgerEntry {
  id: string;
  type: "purchase" | "payment";
  date: string;
  description: string;
  amount: number;
  balance_after: number;
}
