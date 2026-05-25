"use client";

import { useState, useCallback } from "react";
import { Receipt } from "lucide-react";
import { ProductSelector } from "@/components/pos/product-selector";
import { CartPanel } from "@/components/pos/cart-panel";
import { CustomerFormDrawer } from "@/components/customers/customer-form-drawer";
import { BillReceipt } from "@/components/pos/bill-receipt";
import { useNextBillNumber } from "@/lib/hooks";
import { useSettings } from "@/lib/hooks";
import { useCartStore } from "@/stores/cart-store";
import type { Bill } from "@/types/database";

export default function POSPage() {
  const { data: billNumber, isLoading: billLoading } = useNextBillNumber();
  const { data: settings } = useSettings();
  const [lastSavedBill, setLastSavedBill] = useState<Bill | null>(null);

  const handleBillSaved = useCallback((bill: Bill) => {
    setLastSavedBill(bill);
  }, []);

  const displayBillNumber = billLoading ? "..." : billNumber || "INV-0001";
  const cartState = useCartStore();

  const currentBill: Bill = lastSavedBill || {
    id: "temp",
    bill_number: displayBillNumber,
    customer_id: cartState.customer_id,
    customer_name: cartState.customer_name,
    items: cartState.items.map((item) => ({
      id: item.id,
      bill_id: "temp",
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
      hsn_code: item.hsn_code,
      pieces: item.pieces,
      metres_per_piece: item.metres_per_piece,
    })),
    subtotal: cartState.getSubtotal(),
    discount_type: cartState.discount_type,
    discount_value: cartState.discount_value,
    discount_amount: cartState.getDiscountAmount(),
    gst_rate: cartState.getGSTRate(),
    cgst_amount: cartState.getCGST(),
    sgst_amount: cartState.getSGST(),
    gst_amount: cartState.getGSTAmount(),
    total: cartState.getTotal(),
    amount_paid: 0,
    payment_method: cartState.payment_method,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row min-h-full lg:h-full no-print">
        {/* Left — Product Selector */}
        <div className="flex-none lg:flex-1 h-[50vh] lg:h-auto lg:w-[60%] p-4 lg:p-6 flex flex-col">
          {/* Header */}
          <div className="flex-none flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                New Quotation Request
              </h1>
              <p className="text-xs text-text-muted mt-0.5">Select products to add</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">Quotation #</p>
              <p className="text-sm font-semibold text-primary">{displayBillNumber}</p>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <ProductSelector />
          </div>
        </div>

        {/* Right — Cart */}
        <div className="flex-none lg:flex-none lg:w-[40%] lg:min-w-[360px] border-t lg:border-t-0 flex flex-col">
          <CartPanel
            billNumber={displayBillNumber}
            onBillSaved={handleBillSaved}
          />
        </div>
      </div>

      {/* Drawer for adding customer from POS */}
      <CustomerFormDrawer />

      {/* Thermal receipt — hidden on screen, shown on print */}
      <BillReceipt
        bill={currentBill}
        shopName={settings?.shop_name}
      />
    </>
  );
}
