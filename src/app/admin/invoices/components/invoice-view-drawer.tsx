"use client";

import { useRef } from "react";
import { Drawer } from "@/components/ui/drawer";
import { BillReceipt } from "@/components/pos/bill-receipt";
import { useBillDetails, useSettings } from "@/lib/hooks";
import { Printer, Loader2 } from "lucide-react";

interface InvoiceViewDrawerProps {
  billId: string | null;
  open: boolean;
  onClose: () => void;
}

export function InvoiceViewDrawer({ billId, open, onClose }: InvoiceViewDrawerProps) {
  const { data: bill, isLoading } = useBillDetails(billId);
  const { data: settings } = useSettings();
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Drawer open={open} onClose={onClose} title="View Invoice">
      <div className="flex flex-col h-full">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !bill ? (
          <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
            Failed to load invoice details.
          </div>
        ) : (
          <>
            {/* Scrollable Receipt Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-surface-hover rounded-xl border border-border no-print">
              <BillReceipt ref={receiptRef} bill={bill} preview shopName={settings?.shop_name} />
            </div>

            {/* Print Button */}
            <div className="mt-4 pt-4 border-t border-border no-print">
              <button
                onClick={handlePrint}
                className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>
            </div>

            {/* Hidden receipt for printing */}
            <BillReceipt bill={bill} shopName={settings?.shop_name} />
          </>
        )}
      </div>
    </Drawer>
  );
}
