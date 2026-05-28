"use client";

import { useState } from "react";
import { Search, ImageIcon, ZoomIn } from "lucide-react";
import { useProducts, useCategories } from "@/lib/hooks";
import { formatINR } from "@/lib/utils";
import type { Product } from "@/types/database";
import { QuantityInputModal } from "./quantity-input-modal";
import { ImageViewerModal } from "../ui/image-viewer-modal";

export function ProductSelector() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewingImageProduct, setViewingImageProduct] = useState<Product | null>(null);
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const productData = products || [];

  const filtered = productData.filter((p) => {
    if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
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

      {/* Category Tags */}
      <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 px-1 -mx-1 mb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          onClick={() => setSelectedCategory("All")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
            selectedCategory === "All"
              ? "bg-primary text-white shadow-md ring-2 ring-primary/20 ring-offset-2 ring-offset-background scale-105"
              : "bg-surface shadow-sm border border-border/40 text-text-muted hover:border-primary/30 hover:bg-primary/5 hover:text-primary hover:-translate-y-0.5"
          }`}
        >
          All
        </button>
        {categories?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.name)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
              selectedCategory === cat.name
                ? "bg-primary text-white shadow-md ring-2 ring-primary/20 ring-offset-2 ring-offset-background scale-105"
                : "bg-surface shadow-sm border border-border/40 text-text-muted hover:border-primary/30 hover:bg-primary/5 hover:text-primary hover:-translate-y-0.5"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((product) => {
            return (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedProduct(product);
                  }
                }}
                role="button"
                tabIndex={0}
                className="bg-surface border border-border rounded-xl overflow-hidden text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {/* Product Image */}
                {product.image_url ? (
                  <div className="relative w-full h-28 bg-surface overflow-hidden group/image">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingImageProduct(product);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-sm opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shadow-sm z-10 pointer-events-auto"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative w-full h-28 bg-surface/80 border-b border-border flex items-center justify-center overflow-hidden">
                    <ImageIcon className="w-8 h-8 text-text-muted/30 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                )}

                {/* Product Info */}
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-text-primary leading-tight group-hover:text-primary transition-colors">
                    {product.name}
                    {product.sku_name && <span className="ml-1 text-xs text-text-muted font-normal">({product.sku_name})</span>}
                  </h3>
                  {product.description && (
                    <p className="text-[11px] text-text-muted mt-0.5 line-clamp-1">
                      {product.description}
                    </p>
                  )}
                  <p className="text-xs text-text-muted mt-0.5">
                    {product.category}
                  </p>
                  <div className="mt-1.5">
                    <span className="text-sm font-bold text-primary">
                      {formatINR(product.price_per_unit)}
                        /{product.unit === "piece" ? "pc" : product.unit}
                    </span>
                  </div>
                </div>
              </div>
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

      {/* Image Viewer Modal */}
      {viewingImageProduct && (
        <ImageViewerModal
          imageUrl={viewingImageProduct.image_url}
          altText={viewingImageProduct.name}
          onClose={() => setViewingImageProduct(null)}
        />
      )}
    </div>
  );
}
