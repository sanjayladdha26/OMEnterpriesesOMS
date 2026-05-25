"use client";

import { User, Phone } from "lucide-react";
import { useCustomers } from "@/lib/hooks";
import { formatINR, cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { Customer } from "@/types/database";


interface CustomerListProps {
  searchQuery: string;
}

export function CustomerList({ searchQuery }: CustomerListProps) {
  const { selectedCustomerId, setSelectedCustomerId } = useUIStore();
  const { data: queryCustomers } = useCustomers();
  const [walkInBalance, setWalkInBalance] = useState(0);

  useEffect(() => {
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
  }, []);

  let customers = (queryCustomers ? [...queryCustomers] : []) as Customer[];
  
  // Inject Walk In Customer
  const walkInCustomer: Customer = {
    id: "walk-in",
    name: "Walk In",
    phone: "-",
    address: "-",
    outstanding_balance: walkInBalance,
    created_at: new Date().toISOString()
  };
  
  customers.push(walkInCustomer);

  customers = customers.sort(
    (a, b) => Number(b.outstanding_balance) - Number(a.outstanding_balance)
  );

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    customers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }

  return (
    <div className="space-y-2">
      {customers.map((customer) => {
        const isSelected = selectedCustomerId === customer.id;
        return (
          <button
            key={customer.id}
            onClick={() => setSelectedCustomerId(customer.id)}
            className={cn(
              "w-full text-left p-3.5 rounded-xl border transition-all duration-200",
              isSelected
                ? "bg-primary-light border-primary border-l-4"
                : "bg-surface border-border hover:bg-surface-hover hover:border-border-dark"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                  isSelected ? "bg-primary text-white" : "bg-surface text-text-muted"
                )}
              >
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-text-primary truncate">
                    {customer.name}
                  </h3>
                  {customer.outstanding_balance > 0 ? (
                    <span className="text-xs font-semibold text-red whitespace-nowrap ml-2">
                      {formatINR(customer.outstanding_balance)}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-green whitespace-nowrap ml-2">
                      No Dues ✓
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-text-muted">
                  <Phone className="w-3 h-3" />
                  {customer.phone}
                </div>
              </div>
            </div>
          </button>
        );
      })}

      {customers.length === 0 && (
        <div className="text-center py-8 text-text-muted text-sm">
          No customers found
        </div>
      )}
    </div>
  );
}
