"use client";

import { forwardRef } from "react";
import { formatINR, formatDate } from "@/lib/utils";
import { useReceiptSettingsStore } from "@/stores/receipt-settings-store";

// ============================================================
// Types
// ============================================================

interface BillReceiptProps {
  bill: {
    bill_number: string;
    created_at: string;
    customer_name: string | null;
    items: Array<{
      product_name: string;
      quantity: number;
      unit: string;
      unit_price: number;
      subtotal: number;
      hsn_code?: string;
    }>;
    subtotal: number;
    discount_type: "percentage" | "flat";
    discount_value: number;
    discount_amount: number;
    gst_rate: number;
    cgst_amount: number;
    sgst_amount: number;
    total: number;
    payment_method: string;
  };
  shopName?: string;
  preview?: boolean;
}

// ============================================================
// Constants
// ============================================================

const centerStyle: React.CSSProperties = {
  textAlign: "center",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
};

const boldStyle: React.CSSProperties = {
  fontWeight: 700,
};

// ============================================================
// Helpers
// ============================================================

function fmtQty(quantity: number, unit: string): string {
  const q = Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(1);
  return `${q}${unit === "piece" ? "pc" : unit}`;
}

function shortINR(amount: number): string {
  return formatINR(amount).replace("₹", "").trim();
}

// ============================================================
// Component
// ============================================================

export const BillReceipt = forwardRef<HTMLDivElement, BillReceiptProps>(
  function BillReceipt({ bill, shopName, preview }, ref) {
    // Only fetch client-side state after hydration by providing defaults if not ready
    // However, since this component only renders on print or in a preview after interaction, it should be safe.
    const { headerText, footerText, showHsn, printWidth } = useReceiptSettingsStore();

    const halfGst = bill.gst_rate / 2;
    const taxableAmount = bill.subtotal - bill.discount_amount;
    const roundedTotal = Math.round(bill.total);
    const roundOff = roundedTotal - bill.total;

    const discountLabel = "Discount";

    const receiptStyle: React.CSSProperties = {
      width: printWidth || "300px",
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: "12px",
      lineHeight: "1.4",
      color: "#000",
      background: "#fff",
      padding: "8px",
      margin: "0 auto",
    };

    return (
      <div id="receipt-print-area" ref={ref} className={preview ? "" : "receipt-print-only"} style={receiptStyle}>
        {/* ── Head: Estimated Invoice / Shop Name ── */}
        <div style={centerStyle}>
          <div style={{ ...boldStyle, fontSize: "16px", marginBottom: "4px" }}>
            {shopName || "Shop Name"}
          </div>
          <div style={{ ...boldStyle, fontSize: "14px" }}>{headerText}</div>
        </div>

        <div style={{ borderBottom: "1px dashed #000", margin: "8px 0" }} />

        {/* ── Section 1: Date, Invoice No. ── */}
        <div>
          <div style={rowStyle}>
            <span>Invoice No:</span>
            <span>{bill.bill_number}</span>
          </div>
          <div style={rowStyle}>
            <span>Date:</span>
            <span>{formatDate(bill.created_at)}</span>
          </div>
          {bill.customer_name && (
            <div style={rowStyle}>
              <span>Customer:</span>
              <span>{bill.customer_name}</span>
            </div>
          )}
        </div>

        <div style={{ borderBottom: "1px dashed #000", margin: "8px 0" }} />

        {/* ── Section 2: Item Table ── */}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginBottom: "4px" }}>
          <span style={{ flex: 1 }}>Item</span>
          <span style={{ width: "45px", textAlign: "right" }}>Rate</span>
          <span style={{ width: "45px", textAlign: "right" }}>Qty</span>
          <span style={{ width: "60px", textAlign: "right" }}>Total</span>
        </div>

        {bill.items.map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <div style={{ flex: 1, paddingRight: "4px" }}>
              <div style={{ wordBreak: "break-word" }}>
                {item.product_name}
              </div>
              {showHsn && item.hsn_code && (
                <div style={{ fontSize: "10px", color: "#444" }}>HSN: {item.hsn_code}</div>
              )}
            </div>
            <span style={{ width: "45px", textAlign: "right" }}>{shortINR(item.unit_price)}</span>
            <span style={{ width: "45px", textAlign: "right" }}>{fmtQty(item.quantity, item.unit)}</span>
            <span style={{ width: "60px", textAlign: "right" }}>{shortINR(item.subtotal)}</span>
          </div>
        ))}

        <div style={{ borderBottom: "1px dashed #000", margin: "8px 0" }} />

        {/* ── Section 3: Tax & Subtotals ── */}
        <div style={{ marginLeft: "auto", width: "85%" }}>
          <div style={rowStyle}>
            <span>Subtotal:</span>
            <span>{shortINR(bill.subtotal)}</span>
          </div>

          {bill.discount_amount > 0 && (
            <div style={rowStyle}>
              <span>{discountLabel}:</span>
              <span>-{shortINR(bill.discount_amount)}</span>
            </div>
          )}

          {bill.gst_rate > 0 && (
            <>
              <div style={rowStyle}>
                <span>Taxable:</span>
                <span>{shortINR(taxableAmount)}</span>
              </div>
              <div style={{ ...rowStyle, fontWeight: 600 }}>
                <span>GST ({bill.gst_rate}%):</span>
                <span>{shortINR(bill.cgst_amount + bill.sgst_amount)}</span>
              </div>
            </>
          )}

          {Math.abs(roundOff) > 0.005 && (
            <div style={rowStyle}>
              <span>Round Off:</span>
              <span>{roundOff > 0 ? "+" : "-"}{shortINR(Math.abs(roundOff))}</span>
            </div>
          )}
        </div>

        <div style={{ borderBottom: "1px dashed #000", margin: "8px 0" }} />

        {/* ── Section 4: Total in bold ── */}
        <div style={{ ...rowStyle, ...boldStyle, fontSize: "16px" }}>
          <span>TOTAL:</span>
          <span>₹{shortINR(roundedTotal)}</span>
        </div>

        <div style={{ borderBottom: "1px dashed #000", margin: "8px 0" }} />
        
        <div style={rowStyle}>
          <span>Payment Mode:</span>
          <span style={{ textTransform: "capitalize" }}>{bill.payment_method}</span>
        </div>

        {/* ── Section 5: Thank you for shopping ── */}
        <div style={{ ...centerStyle, marginTop: "16px", marginBottom: "8px" }}>
          <div style={{ fontWeight: "bold" }}>{footerText}</div>
        </div>
      </div>
    );
  }
);
