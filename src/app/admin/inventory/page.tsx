"use client";

import { useState } from "react";
import { Package, Plus, Search } from "lucide-react";
import { useProducts } from "@/lib/hooks";
import { useUIStore } from "@/stores/ui-store";
import { ProductTable } from "@/components/inventory/product-table";
import { ProductFormDrawer } from "@/components/inventory/product-form-drawer";
import { CategoryManagerDrawer } from "@/components/inventory/category-manager-drawer";
import { useAuthStore } from "@/stores/auth-store";

export default function InventoryPage() {
  const { openDrawer } = useUIStore();
  const [searchQuery, setSearchQuery] = useState("");
  const role = useAuthStore((state) => state.role);
  const isAdmin = role === "admin";

  const { data: products } = useProducts();
  const totalProducts = products?.length || 0;

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Inventory Management
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Manage your product inventory
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <>
              <button
                onClick={() => openDrawer("manage-categories")}
                className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border text-text-primary rounded-xl text-sm font-semibold hover:bg-surface-hover transition-colors shadow-sm"
              >
                Manage Categories
              </button>
              <button
                onClick={() => openDrawer("add-product")}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add New Product
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3 inline-flex">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Total Products</p>
            <p className="text-lg font-bold text-text-primary">{totalProducts}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products by name..."
          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
      </div>

      {/* Table */}
      <ProductTable searchQuery={searchQuery} />

      {/* Drawer */}
      <ProductFormDrawer />
      <CategoryManagerDrawer />
    </div>
  );
}
