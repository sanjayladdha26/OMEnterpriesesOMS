import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "./supabase/client";
import type {
  Product,
  Customer,
  Bill,
  Staff,
  ShopSettings,
  LedgerEntry,
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

export function useStaff() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Staff[];
    },
  });
}

export function useSettings() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") throw error; // PGRST116 is no rows
      // Map flat DB settings to ShopSettings format
      if (data) {
        return {
          id: data.id,
          shop_name: data.shop_name,
          gst_config: {
            low_threshold: data.gst_low_threshold,
            low_rate: data.gst_low_rate,
            high_rate: data.gst_high_rate,
          },
          printer_enabled: data.printer_enabled,
          whatsapp_enabled: data.whatsapp_enabled,
          whatsapp_number: data.whatsapp_number,
          low_stock_threshold: data.low_stock_threshold,
          invoice_start_number: data.invoice_start_number ?? 1,
        } as ShopSettings;
      }
      return null;
    },
  });
}

export function useBills() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["bills"],
    queryFn: async () => {
      const { data: bills, error } = await supabase
        .from("bills")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      return bills as Bill[];
    },
  });
}

export function useLedgerEntries(customerId: string) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["ledger", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      
      let billsData: any[] = [];
      let paymentsData: any[] = [];

      if (customerId === "walk-in") {
        // Fetch bills for Walk In (customer_id is null)
        const { data: bData, error: bErr } = await supabase
          .from("bills")
          .select("*")
          .is("customer_id", null);
          
        if (bErr) throw bErr;
        billsData = bData || [];
        paymentsData = []; // Walk in doesn't have records in payments table
      } else {
        // Fetch bills
        const { data: bData, error: bErr } = await supabase
          .from("bills")
          .select("*")
          .eq("customer_id", customerId);
          
        if (bErr) throw bErr;
        billsData = bData || [];
        
        // Fetch payments
        const { data: pData, error: pErr } = await supabase
          .from("payments")
          .select("*")
          .eq("customer_id", customerId);
          
        if (pErr) throw pErr;
        paymentsData = pData || [];
      }
      
      const entries: LedgerEntry[] = [];
      
      billsData?.forEach(b => {
        entries.push({
          id: b.id,
          type: "purchase",
          date: b.created_at,
          description: `Bill ${b.bill_number}`,
          amount: b.total,
          balance_after: 0, // Computed below
        });
        
        // For walk-in bills that are completed, synthesize a payment
        // because we don't store walk-in payments in the payments table
        if (customerId === "walk-in" && b.status === "completed") {
          // Add 1ms to make the payment appear after the purchase when sorting
          const paymentDate = new Date(new Date(b.created_at).getTime() + 1).toISOString();
          entries.push({
            id: `${b.id}-payment`,
            type: "payment",
            date: paymentDate,
            description: `Payment (${b.payment_method})`,
            amount: b.total,
            balance_after: 0,
          });
        }
      });
      
      paymentsData?.forEach(p => {
        entries.push({
          id: p.id,
          type: "payment",
          date: p.created_at,
          description: p.notes || `Payment (${p.payment_method})`,
          amount: p.amount,
          balance_after: 0,
        });
      });
      
      // Sort by date ascending
      entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Compute running balance
      let balance = 0;
      entries.forEach(e => {
        if (e.type === "purchase") balance += Number(e.amount);
        else balance -= Number(e.amount);
        e.balance_after = balance;
      });
      
      // Return sorted descending (newest first)
      return entries.reverse();
    },
    enabled: !!customerId,
  });
}

export function useNextBillNumber() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["nextBillNumber"],
    queryFn: async () => {
      const year = new Date().getFullYear();
      const prefix = `INV-${year}-`;

      // Fetch the last bill number and the configured start number in parallel
      const [billsRes, settingsRes] = await Promise.all([
        supabase
          .from("bills")
          .select("bill_number")
          .like("bill_number", `${prefix}%`)
          .order("bill_number", { ascending: false })
          .limit(1),
        Promise.resolve(
          supabase
            .from("settings")
            .select("invoice_start_number")
            .limit(1)
            .maybeSingle()
        ).catch(() => ({ data: null, error: null })),
      ]);

      if (billsRes.error) throw billsRes.error;

      // If the column doesn't exist yet, fall back to 1
      const startNum: number =
        (settingsRes as any)?.data?.invoice_start_number ?? 1;

      let nextNum = startNum;
      if (billsRes.data && billsRes.data.length > 0) {
        const lastNum = parseInt(billsRes.data[0].bill_number.replace(prefix, ""), 10);
        if (!isNaN(lastNum)) nextNum = Math.max(startNum, lastNum + 1);
      }

      return `${prefix}${String(nextNum).padStart(3, "0")}`;
    },
  });
}

export function useUpdateInvoiceStartNumber() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (startNumber: number) => {
      const { data: existing } = await supabase
        .from("settings")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        const { error } = await supabase
          .from("settings")
          .update({ invoice_start_number: startNumber })
          .eq("id", existing.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["nextBillNumber"] });
    },
  });
}

export function useBillDetails(billId: string | null) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ["bill", billId],
    queryFn: async () => {
      if (!billId) return null;
      const { data: bill, error } = await supabase
        .from("bills")
        .select("*")
        .eq("id", billId)
        .single();
      
      if (error) throw error;
      
      const { data: items, error: itemsError } = await supabase
        .from("bill_items")
        .select("*")
        .eq("bill_id", billId);
        
      if (itemsError) throw itemsError;

      const amount_received = bill.amount_paid || 0;
      
      return { ...bill, items, amount_received } as Bill & { amount_received: number };
    },
    enabled: !!billId,
  });
}

export function useDeleteBill() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bill: Bill) => {
      const { error } = await supabase.rpc('delete_bill', {
        p_bill_id: bill.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
    },
  });
}

export function useUpdateBill() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      originalBill,
      updatedBill,
    }: {
      originalBill: Bill;
      updatedBill: Partial<Bill> & { items: any[]; amount_received?: number | null };
    }) => {
      // Calculate final payment amount
      const newTotal = Number(updatedBill.total);
      let newPaidAmount = 0;
      
      if (updatedBill.payment_method === "credit") {
        newPaidAmount = 0;
      } else {
        if (updatedBill.amount_received === undefined || updatedBill.amount_received === null) {
          newPaidAmount = newTotal;
        } else {
          newPaidAmount = updatedBill.amount_received;
        }
      }
      
      newPaidAmount = Math.max(0, Math.min(newTotal, newPaidAmount));
      const newBalanceDue = newTotal - newPaidAmount;
      const computedStatus = newBalanceDue > 0 ? "pending" : "completed";

      // Build items JSON for the RPC
      const itemsJson = updatedBill.items.map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        hsn_code: item.hsn_code,
      }));

      const paymentNotes = newPaidAmount > 0
        ? `Upfront payment for Bill ${originalBill.bill_number}`
        : null;

      const { error } = await supabase.rpc('update_bill_with_payment', {
        p_bill_id: originalBill.id,
        p_customer_id: updatedBill.customer_id || null,
        p_customer_name: updatedBill.customer_name || null,
        p_subtotal: Number(updatedBill.subtotal),
        p_discount_type: updatedBill.discount_type || 'percentage',
        p_discount_value: Number(updatedBill.discount_value),
        p_discount_amount: Number(updatedBill.discount_amount),
        p_gst_rate: Number(updatedBill.gst_rate),
        p_cgst_amount: Number(updatedBill.cgst_amount),
        p_sgst_amount: Number(updatedBill.sgst_amount),
        p_gst_amount: Number(updatedBill.gst_amount),
        p_total: newTotal,
        p_amount_paid: newPaidAmount,
        p_payment_method: updatedBill.payment_method || 'cash',
        p_status: computedStatus,
        p_items: itemsJson,
        p_payment_notes: paymentNotes,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["bill"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
    },
  });
}

export function useUpdateSettings() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedSettings: Partial<ShopSettings> & { id?: string }) => {
      // Map back from ShopSettings to flat DB format where necessary
      const payload: any = {};
      
      if (updatedSettings.shop_name !== undefined) payload.shop_name = updatedSettings.shop_name;
      if (updatedSettings.printer_enabled !== undefined) payload.printer_enabled = updatedSettings.printer_enabled;
      if (updatedSettings.whatsapp_enabled !== undefined) payload.whatsapp_enabled = updatedSettings.whatsapp_enabled;
      if (updatedSettings.whatsapp_number !== undefined) payload.whatsapp_number = updatedSettings.whatsapp_number;
      if (updatedSettings.low_stock_threshold !== undefined) payload.low_stock_threshold = updatedSettings.low_stock_threshold;
      if (updatedSettings.invoice_start_number !== undefined) payload.invoice_start_number = updatedSettings.invoice_start_number;
      
      if (updatedSettings.gst_config !== undefined) {
        payload.gst_low_threshold = updatedSettings.gst_config.low_threshold;
        payload.gst_low_rate = updatedSettings.gst_config.low_rate;
        payload.gst_high_rate = updatedSettings.gst_config.high_rate;
      }

      let targetId = updatedSettings.id;
      
      if (!targetId) {
        const { data } = await supabase.from("settings").select("id").limit(1).maybeSingle();
        if (data?.id) {
          targetId = data.id;
        }
      }

      if (targetId) {
        const { error } = await supabase
          .from("settings")
          .update(payload)
          .eq("id", targetId);

        if (error) throw error;
      } else {
        // Initialize defaults if they are missing
        if (payload.shop_name === undefined) payload.shop_name = "";
        if (payload.printer_enabled === undefined) payload.printer_enabled = false;
        if (payload.whatsapp_enabled === undefined) payload.whatsapp_enabled = false;
        if (payload.whatsapp_number === undefined) payload.whatsapp_number = "";
        if (payload.low_stock_threshold === undefined) payload.low_stock_threshold = 10;
        if (payload.gst_low_threshold === undefined) payload.gst_low_threshold = 1000;
        if (payload.gst_low_rate === undefined) payload.gst_low_rate = 5;
        if (payload.gst_high_rate === undefined) payload.gst_high_rate = 12;

        const { error } = await supabase
          .from("settings")
          .insert(payload);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["nextBillNumber"] });
    },
  });
}
