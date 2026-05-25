"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useProducts, useCategories } from "@/lib/hooks";
import { formatINR } from "@/lib/utils";
import type { Product } from "@/types/database";
import { QuantityInputModal } from "./quantity-input-modal";

export function ProductSelector() {
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const productData = products || [];

  const filtered = productData.filter((p) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return p.name.toLowerCase().includes(term) || (p.sku_name && p.sku_name.toLowerCase().includes(term));
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((product) => {
            return (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="bg-surface border border-border rounded-xl p-3.5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <h3 className="text-sm font-semibold text-text-primary leading-tight group-hover:text-primary transition-colors">
                  {product.name}
                  {product.sku_name && <span className="ml-1 text-xs text-text-muted font-normal">({product.sku_name})</span>}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {product.category}
                </p>
                <div className="mt-2">
                  <span className="text-sm font-bold text-primary">
                    {formatINR(product.price_per_unit)}
                      /{product.unit === "piece" ? "pc" : product.unit}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <div className="w-8 h-8 mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm">Loading products...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <Search className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No products found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        ) : null}
      </div>

      {/* Quantity Input Modal */}
      {selectedProduct && (
        <QuantityInputModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
