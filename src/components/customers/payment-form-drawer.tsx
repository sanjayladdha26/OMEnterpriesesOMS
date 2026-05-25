"use client";

import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Drawer } from "@/components/ui/drawer";
import { useUIStore } from "@/stores/ui-store";
import { formatINR } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Customer, Bill } from "@/types/database";
import toast from "react-hot-toast";
import { CheckCircle2, RefreshCw } from "lucide-react";

export function PaymentFormDrawer() {
  const { drawerOpen, drawerContent, drawerData, closeDrawer } = useUIStore();
  const queryClient = useQueryClient();
  const isOpen = drawerOpen && drawerContent === "add-payment";
  const customer = drawerData?.customer as unknown as Customer | undefined;

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [isAdvance, setIsAdvance] = useState(false);

  const { data: pendingBills, isLoading: billsLoading } = useQuery({
    queryKey: ["pending-bills", customer?.id],
    queryFn: async () => {
      if (!customer) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .eq("customer_id", customer.id)
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Bill[];
    },
    enabled: !!customer && isOpen,
  });

  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setMethod("cash");
      setNotes("");
      setAllocations({});
      setIsAdvance(false);
    }
  }, [isOpen]);

  const paymentAmount = parseFloat(amount) || 0;
  const hasPendingBills = pendingBills && pendingBills.length > 0;
  const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + (val || 0), 0);

  const handleAutoDistribute = () => {
    if (paymentAmount <= 0 || !pendingBills) return;

    let remainingPayment = paymentAmount;
    const newAllocations: Record<string, number> = {};

    for (const bill of pendingBills) {
      if (remainingPayment <= 0) break;
      const remainingOnBill = bill.total - (bill.amount_paid || 0);
      if (remainingOnBill <= 0) continue;

      const allocate = Math.min(remainingOnBill, remainingPayment);
      newAllocations[bill.id] = allocate;
      remainingPayment -= allocate;
    }

    setAllocations(newAllocations);
  };

  const handleAllocationChange = (billId: string, val: string) => {
    const numVal = parseFloat(val);
    const bill = pendingBills?.find(b => b.id === billId);
    const remaining = bill ? bill.total - (bill.amount_paid || 0) : 0;
    const capped = Math.max(0, Math.min(isNaN(numVal) ? 0 : numVal, remaining));
    setAllocations((prev) => ({
      ...prev,
      [billId]: capped,
    }));
  };

  const isValid = () => {
    if (paymentAmount <= 0) return false;
    if (hasPendingBills && !isAdvance) {
      if (Math.abs(totalAllocated - paymentAmount) > 0.01) return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!isValid() || !customer || saving) return;

    setSaving(true);
    const toastId = toast.loading("Recording payment...");
    try {
      const supabase = createClient();

      // Build allocations array, capping each at the bill's remaining amount
      const allocArray: { bill_id: string; amount: number }[] = [];
      for (const bill of pendingBills || []) {
        let allocated = allocations[bill.id] || 0;
        const remaining = bill.total - (bill.amount_paid || 0);
        allocated = Math.max(0, Math.min(allocated, remaining));
        if (allocated > 0) {
          allocArray.push({ bill_id: bill.id, amount: allocated });
        }
      }

      const { error } = await supabase.rpc('record_payment', {
        p_customer_id: customer.id,
        p_amount: paymentAmount,
        p_method: method,
        p_notes: notes,
        p_allocations: allocArray,
      });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      await queryClient.invalidateQueries({ queryKey: ["ledger"] });
      await queryClient.invalidateQueries({ queryKey: ["bills"] });
      await queryClient.invalidateQueries({ queryKey: ["pending-bills"] });

      closeDrawer();
      setAmount("");
      setMethod("cash");
      setNotes("");
      setAllocations({});
      setIsAdvance(false);
      toast.success("Payment recorded successfully.", { id: toastId });
    } catch (error) {
      console.error("Failed to record payment:", error);
      toast.error("Failed to record payment. Please try again.", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
  const labelClass = "text-sm font-medium text-text-primary block mb-1.5";

  return (
    <Drawer open={isOpen} onClose={closeDrawer} title="Record Payment">
      <div className="space-y-4">
        {customer && (
          <div className="p-3 bg-surface rounded-xl flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-text-primary">{customer.name}</p>
              <p className="text-xs text-text-muted mt-0.5">
                Balance due: <span className="text-red font-semibold">{formatINR(customer.outstanding_balance)}</span>
              </p>
            </div>
          </div>
        )}

        <div>
          <label className={labelClass}>
            Amount <span className="text-red">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className={inputClass + " pl-7 text-lg font-bold"}
            />
          </div>
        </div>

        {hasPendingBills && paymentAmount > 0 && (
          <div className="border border-border rounded-xl overflow-hidden bg-surface">
            <div className="bg-surface-hover px-3 py-2 flex items-center justify-between border-b border-border">
              <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">Allocate to Bills</span>
              <button 
                onClick={handleAutoDistribute}
                className="text-xs font-medium text-primary flex items-center gap-1 hover:text-primary-dark transition-colors bg-primary-light px-2 py-1 rounded-md"
              >
                <RefreshCw className="w-3 h-3" />
                Auto Distribute
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface border-b border-border text-text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Bill No.</th>
                    <th className="px-3 py-2 font-medium text-right">Remaining</th>
                    <th className="px-3 py-2 font-medium text-right w-24">Allocate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingBills.map(bill => {
                    const remaining = bill.total - (bill.amount_paid || 0);
                    if (remaining <= 0) return null;
                    return (
                      <tr key={bill.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap">{new Date(bill.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                        <td className="px-3 py-2 font-medium">{bill.bill_number}</td>
                        <td className="px-3 py-2 text-right font-medium text-red">{formatINR(remaining)}</td>
                        <td className="px-3 py-1">
                          <input
                            type="number"
                            value={allocations[bill.id] || ""}
                            onChange={(e) => handleAllocationChange(bill.id, e.target.value)}
                            className="w-full border border-border rounded px-2 py-1 text-right text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            placeholder="0"
                            max={remaining}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-3 py-2 bg-surface-hover border-t border-border flex justify-between items-center text-xs">
              <span className="text-text-muted font-medium">Allocated: <span className="text-text-primary font-bold">{formatINR(totalAllocated)}</span></span>
              <span className={paymentAmount - totalAllocated === 0 ? "text-green font-medium" : "text-amber font-medium"}>
                {paymentAmount - totalAllocated === 0 ? "Fully Allocated" : `${formatINR(paymentAmount - totalAllocated)} left`}
              </span>
            </div>
          </div>
        )}

        {(hasPendingBills ? (paymentAmount - totalAllocated > 0) : true) && paymentAmount > 0 && (
          <label className="flex items-start gap-2 cursor-pointer bg-surface p-3 rounded-xl border border-border">
            <input
              type="checkbox"
              checked={isAdvance}
              onChange={(e) => setIsAdvance(e.target.checked)}
              className="mt-0.5 rounded border-border text-primary focus:ring-primary"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-text-primary">Advance / Unlinked Payment</span>
              <span className="text-xs text-text-muted">
                {hasPendingBills 
                  ? "Record the remaining amount as advance without linking to specific bills."
                  : "Record this payment as advance since there are no pending bills."}
              </span>
            </div>
          </label>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className={inputClass}
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Notes (optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment notes..."
              className={inputClass}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!isValid() || saving}
          className="w-full mt-4 py-3 bg-green text-white rounded-xl font-semibold text-sm hover:bg-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          {saving ? "Saving..." : "Record Payment"}
        </button>
      </div>
    </Drawer>
  );
}
