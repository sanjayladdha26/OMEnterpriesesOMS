"use client";

import { useState, useEffect } from "react";
import { Plus, ArrowLeft, Phone, MapPin, Trash2, Edit, Eye } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useCustomers, useLedgerEntries } from "@/lib/hooks";
import { formatINR, formatDateTime, cn } from "@/lib/utils";
import { confirmToast } from "@/lib/toast-utils";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import toast from "react-hot-toast";
import { InvoiceViewDrawer } from "@/app/invoices/components/invoice-view-drawer";

export function CustomerLedger() {
  const { selectedCustomerId, setSelectedCustomerId, openDrawer } = useUIStore();
  const role = useAuthStore((state) => state.role);
  const isAdmin = role === "admin";
  const { data: customers } = useCustomers();
  const { data: ledgerEntries } = useLedgerEntries(selectedCustomerId || "");
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [viewBillId, setViewBillId] = useState<string | null>(null);
  const [walkInBalance, setWalkInBalance] = useState(0);

  // Fetch walk-in balance separately since it's not in useCustomers
  useEffect(() => {
    if (selectedCustomerId === "walk-in") {
      async function fetchWalkInBalance() {
        const supabase = createClient();
        const { data } = await supabase
          .from("bills")
          .select("total")
          .is("customer_id", null)
          .eq("status", "pending");
        let balance = 0;
        data?.forEach(b => balance += Number(b.total));
        setWalkInBalance(balance);
      }
      fetchWalkInBalance();
    }
  }, [selectedCustomerId]);

  const handleDeleteCustomer = () => {
    confirmToast("Are you sure you want to delete this customer? All their bills, payments, and associated data will be permanently deleted. This action cannot be undone.", async () => {
      setIsDeletingCustomer(true);
      const toastId = toast.loading("Deleting customer...");

      try {
        const supabase = createClient();
        
        const { error } = await supabase.rpc('delete_customer', {
          p_customer_id: selectedCustomerId,
        });
        
        if (error) throw error;

        setSelectedCustomerId(null);
        await queryClient.invalidateQueries({ queryKey: ["customers"] });
        await queryClient.invalidateQueries({ queryKey: ["bills"] });
        await queryClient.invalidateQueries({ queryKey: ["ledger"] });
        toast.success("Customer and all associated invoices deleted successfully.", { id: toastId });
      } catch (error) {
        console.error("Failed to delete customer:", error);
        toast.error("Failed to delete customer. Please try again.", { id: toastId });
      } finally {
        setIsDeletingCustomer(false);
      }
    });
  };

  const handleDeleteWalkInData = () => {
    confirmToast("Are you sure you want to delete ALL Walk In data? All walk-in invoices and their items will be permanently deleted. This action cannot be undone.", async () => {
      setIsDeletingCustomer(true);
      const toastId = toast.loading("Deleting all Walk In data...");

      try {
        const supabase = createClient();

        const { error } = await supabase.rpc('delete_walk_in_data');

        if (error) throw error;

        setSelectedCustomerId(null);
        await queryClient.invalidateQueries({ queryKey: ["bills"] });
        await queryClient.invalidateQueries({ queryKey: ["ledger"] });
        await queryClient.invalidateQueries({ queryKey: ["pending-bills"] });
        setWalkInBalance(0);
        toast.success("All Walk In data deleted successfully.", { id: toastId });
      } catch (error) {
        console.error("Failed to delete Walk In data:", error);
        toast.error("Failed to delete Walk In data. Please try again.", { id: toastId });
      } finally {
        setIsDeletingCustomer(false);
      }
    });
  };

  const handleDeleteEntry = (id: string, type: "purchase" | "payment") => {
    confirmToast(`Are you sure you want to delete this ${type}?`, async () => {
      setIsDeleting(id);
      const toastId = toast.loading(`Deleting ${type}...`);

      try {
        const supabase = createClient();

        if (type === "payment") {
          const { error } = await supabase.rpc('delete_payment', {
            p_payment_id: id,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.rpc('delete_bill', {
            p_bill_id: id,
          });
          if (error) throw error;
        }

        await queryClient.invalidateQueries({ queryKey: ["customers"] });
        await queryClient.invalidateQueries({ queryKey: ["ledger"] });
        await queryClient.invalidateQueries({ queryKey: ["bills"] });
        await queryClient.invalidateQueries({ queryKey: ["pending-bills"] });
        toast.success(`${type === "purchase" ? "Purchase" : "Payment"} deleted successfully.`, { id: toastId });
      } catch (error) {
        console.error("Failed to delete entry:", error);
        toast.error("Failed to delete entry. Please try again.", { id: toastId });
      } finally {
        setIsDeleting(null);
      }
    });
  };

  if (!selectedCustomerId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-muted py-16">
        <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
          <span className="text-2xl">📒</span>
        </div>
        <p className="text-sm font-medium">Select a customer</p>
        <p className="text-xs mt-1">to view their khata ledger</p>
      </div>
    );
  }

  let customer;
  if (selectedCustomerId === "walk-in") {
    customer = {
      id: "walk-in",
      name: "Walk In",
      phone: "-",
      address: "-",
      outstanding_balance: walkInBalance,
    };
  } else {
    customer = customers?.find((c) => c.id === selectedCustomerId);
  }

  if (!customer) return null;

  const sortedEntries = ledgerEntries || [];
  const isWalkIn = selectedCustomerId === "walk-in";

  return (
    <div className="flex flex-col h-full">
      {/* Back button (mobile) */}
      <button
        onClick={() => setSelectedCustomerId(null)}
        className="flex items-center gap-1.5 text-sm text-text-muted mb-3 lg:hidden hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to list
      </button>

      {/* Customer Header */}
      <div className="bg-surface border border-border rounded-xl p-4 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-text-primary">{customer.name}</h2>
              {isAdmin && !isWalkIn && (
                <>
                  <button
                    onClick={() => openDrawer("edit-customer", customer as unknown as Record<string, unknown>)}
                    className="p-1 rounded-md text-text-muted hover:text-primary hover:bg-surface-hover transition-colors"
                    title="Edit Customer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDeleteCustomer}
                    disabled={isDeletingCustomer}
                    className="p-1 rounded-md text-text-muted hover:text-red hover:bg-red-light transition-colors disabled:opacity-50"
                    title="Delete Customer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              {isAdmin && isWalkIn && (
                <button
                  onClick={handleDeleteWalkInData}
                  disabled={isDeletingCustomer}
                  className="p-1 rounded-md text-text-muted hover:text-red hover:bg-red-light transition-colors disabled:opacity-50"
                  title="Delete All Walk In Data"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-text-muted mt-1">
              <Phone className="w-3 h-3" />
              {customer.phone}
            </div>
            <div className="flex items-center gap-1 text-xs text-text-muted mt-0.5">
              <MapPin className="w-3 h-3" />
              {customer.address}
            </div>
          </div>
          {isAdmin && !isWalkIn && (
            <button
              onClick={() => openDrawer("add-payment", { customer: customer as unknown as Record<string, unknown> })}
              className="flex items-center gap-1.5 px-3 py-2 bg-green text-white rounded-xl text-xs font-semibold hover:bg-green-dark transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Payment
            </button>
          )}
        </div>

        {/* Outstanding Balance */}
        <div className={cn(
          "mt-3 p-3 rounded-xl",
          customer.outstanding_balance > 0 ? "bg-red-light" : "bg-green-light"
        )}>
          <p className="text-xs text-text-muted">Outstanding Balance</p>
          <p className={cn(
            "text-2xl font-bold mt-0.5",
            customer.outstanding_balance > 0 ? "text-red" : "text-green"
          )}>
            {formatINR(customer.outstanding_balance)}
          </p>
        </div>
      </div>

      {/* Ledger Timeline */}
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Transaction History
      </h3>
      <div className="flex-1 overflow-y-auto">
        {sortedEntries.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">
            No transactions yet
          </p>
        ) : (
          <div className="space-y-0">
            {sortedEntries.map((entry, idx) => {
              const isPurchase = entry.type === "purchase";
              return (
                <div key={entry.id} className="flex gap-3 group">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full border-2 mt-1.5 flex-shrink-0",
                        isPurchase
                          ? "bg-amber border-amber"
                          : "bg-green border-green"
                      )}
                    />
                    {idx < sortedEntries.length - 1 && (
                      <div className="w-px flex-1 bg-border" />
                    )}
                  </div>

                  {/* Entry content */}
                  <div className="pb-4 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={cn(
                            "text-[10px] font-medium px-1.5 py-0.5 rounded",
                            isPurchase
                              ? "bg-amber-light text-amber-dark"
                              : "bg-green-light text-green-dark"
                          )}
                        >
                          {isPurchase ? "Purchase" : "Payment"}
                        </span>
                        <p className="text-sm text-text-primary mt-1">
                          {entry.description}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {formatDateTime(entry.date)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center justify-end gap-2">
                          <p
                            className={cn(
                              "text-sm font-semibold",
                              isPurchase ? "text-red" : "text-green"
                            )}
                          >
                            {isPurchase ? "+" : "-"}{formatINR(entry.amount)}
                          </p>
                          {isPurchase && (
                            <button
                              onClick={() => setViewBillId(entry.id)}
                              className="text-text-muted hover:text-primary transition-colors p-1 rounded-md hover:bg-primary-light"
                              title="View Bill"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteEntry(entry.id, entry.type)}
                              disabled={isDeleting === entry.id}
                              className="text-text-muted hover:text-red transition-colors p-1 rounded-md hover:bg-red-light disabled:opacity-50"
                              title="Delete entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-text-muted mt-1">
                          Bal: {formatINR(entry.balance_after)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <InvoiceViewDrawer 
        billId={viewBillId} 
        open={!!viewBillId} 
        onClose={() => setViewBillId(null)} 
      />
    </div>
  );
}
