"use client";

import { ShopDetailsCard } from "@/components/settings/shop-details-card";
import { ReceiptSettingsCard } from "@/components/settings/receipt-settings-card";
import { AppearanceCard } from "@/components/settings/appearance-card";
import { InvoiceNumberCard } from "@/components/settings/invoice-number-card";
import { useAuthStore } from "@/stores/auth-store";
import { LogOut } from "lucide-react";

export default function SettingsPage() {
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Settings</h1>
          <p className="text-xs text-text-muted mt-0.5">Configure your shop</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 bg-red-light text-red hover:opacity-80 rounded-xl transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </div>

      {/* Cards */}
      <div className="mt-8 space-y-6">
        <AppearanceCard />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <ShopDetailsCard />
          <div className="space-y-6">
            <ReceiptSettingsCard />
            <InvoiceNumberCard />
          </div>
        </div>
      </div>
    </div>
  );
}
