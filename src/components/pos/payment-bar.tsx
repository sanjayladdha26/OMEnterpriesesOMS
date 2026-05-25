"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCartStore } from "@/stores/cart-store";
import { formatINR } from "@/lib/utils";
import type { Bill } from "@/types/database";

interface PaymentBarProps {
  total: number;
  billNumber: string;
  onBillSaved: (bill: Bill) => void;
}

export function PaymentBar({ total, billNumber, onBillSaved }: PaymentBarProps) {
  const { saveBill, saving, customer_id } = useCartStore();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const handleSendRequest = async () => {
    if (!billNumber) return;
    setError(null);

    // Require customer to be selected so admin knows who is requesting
    if (!customer_id) {
      setError("Please select or add your details (Customer) before sending the request.");
      return;
    }

    try {
      const savedBill = await saveBill(billNumber, false);
      if (savedBill) {
        // Invalidate caches
        queryClient.invalidateQueries({ queryKey: ["bills"] });
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        queryClient.invalidateQueries({ queryKey: ["pending-bills"] });
        queryClient.invalidateQueries({ queryKey: ["nextBillNumber"] });

        onBillSaved(savedBill);
      }
    } catch (err) {
      console.error("Request failed:", err);
      setError("Failed to send request. Please try again.");
    }
  };

  return (
    <div className="border-t border-border px-4 py-4 space-y-3 bg-surface">
      {error && (
        <div className="text-xs text-red bg-red-light px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      <button
        onClick={handleSendRequest}
        disabled={saving}
        className="w-full py-4 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Sending Request...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Send Quotation Request — {formatINR(total)}
          </>
        )}
      </button>
    </div>
  );
}
