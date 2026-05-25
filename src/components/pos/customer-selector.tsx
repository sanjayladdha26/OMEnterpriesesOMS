"use client";

import { useState, useRef, useEffect } from "react";
import { User, Search, X, Plus, ChevronDown, Edit } from "lucide-react";
import { useCustomers } from "@/lib/hooks";
import { useCartStore } from "@/stores/cart-store";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { formatINR, cn } from "@/lib/utils";

export function CustomerSelector() {
  const { customer_id, customer_name, setCustomer } = useCartStore();
  const { data: customers } = useCustomers();
  const customerData = customers || [];
  const { openDrawer } = useUIStore();
  const role = useAuthStore((state) => state.role);
  const isAdmin = role === "admin";
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCustomers = customerData.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const handleSelect = (customerId: string, customerName: string) => {
    setCustomer(customerId, customerName);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    setCustomer(null, "");
    setSearch("");
  };

  const handleAddNew = () => {
    setIsOpen(false);
    openDrawer("add-customer");
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger */}
      {customer_id ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 rounded-xl border border-primary-100">
          <button
            onClick={() => {
              setIsOpen(!isOpen);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            className="flex-1 flex items-center gap-2 text-left min-w-0"
          >
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {customer_name}
              </p>
              <p className="text-[10px] text-text-muted">
                {customerData.find((c) => c.id === customer_id)?.phone || ""}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const customer = customerData.find((c) => c.id === customer_id);
                  if (customer) openDrawer("edit-customer", customer as unknown as Record<string, unknown>);
                }}
                className="p-1 rounded-lg hover:bg-surface-hover/50 text-text-muted hover:text-primary transition-colors"
                title="Edit customer"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 rounded-lg hover:bg-surface-hover/50 text-text-muted hover:text-red transition-colors"
              title="Remove customer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          className="w-full flex items-center gap-2 px-3 py-2 border border-primary-100 bg-primary-50/50 rounded-xl text-sm text-text-primary hover:border-primary hover:bg-primary-50 transition-colors"
        >
          <User className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="flex-1 text-left font-medium text-primary">Select Customer</span>
          <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform", isOpen && "rotate-180")} />
        </button>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border rounded-xl shadow-xl z-20 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or phone..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Customer list */}
          <div className="max-h-48 overflow-y-auto">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="w-full flex items-center gap-1 px-3 hover:bg-surface-hover transition-colors group"
              >
                <button
                  onClick={() => handleSelect(customer.id, customer.name)}
                  className="flex-1 flex items-center gap-2.5 py-2.5 text-left min-w-0"
                >
                  <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {customer.name}
                    </p>
                    <p className="text-[10px] text-text-muted">{customer.phone}</p>
                  </div>
                  {customer.outstanding_balance > 0 && (
                    <span className="text-[10px] font-medium text-red mr-1">
                      {formatINR(customer.outstanding_balance)} due
                    </span>
                  )}
                </button>
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      openDrawer("edit-customer", customer as unknown as Record<string, unknown>);
                    }}
                    className="p-1.5 text-text-muted hover:text-primary rounded-md transition-colors flex-shrink-0"
                    title="Edit Customer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            {filteredCustomers.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-text-muted">
                No customers found
              </div>
            )}
          </div>

          {/* Add new customer */}
          <div className="border-t border-border p-2">
            <button
              onClick={handleAddNew}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:bg-primary-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New Customer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
