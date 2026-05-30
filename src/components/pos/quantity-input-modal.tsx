"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import type { Product } from "@/types/database";

interface QuantityInputModalProps {
  product: Product;
  onClose: () => void;
}

export function QuantityInputModal({ product, onClose }: QuantityInputModalProps) {
  const [mtrs, setMtrs] = useState("");
  const [note, setNote] = useState("");
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") handleAdd();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, mtrs, note]); // Added mtrs and note to dependency array

  const handleAdd = () => {
    const qty = parseFloat(mtrs);
    if (isNaN(qty) || qty <= 0) return;
    
    addItem({
      product_id: product.id,
      product_name: product.name,
      quantity: qty,
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 overlay-enter" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-sm p-6 modal-enter">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface-hover transition-colors text-text-muted"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Product Info */}
        <div className="flex gap-4 items-start pr-8">
          <div>
            <h3 className="text-lg font-semibold text-text-primary line-clamp-2">{product.name}</h3>
            {product.sku_name && (
              <p className="text-sm text-text-muted mt-1">
                {product.sku_name}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <label className="text-sm font-medium text-text-primary block mb-2">
            Quantity (Mtrs)
          </label>
          <input
            type="number"
            value={mtrs}
            onChange={(e) => setMtrs(e.target.value)}
            placeholder="e.g. 10.5"
            step="any"
            min="0.1"
            className="w-full h-12 text-lg border border-border rounded-xl px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface transition-colors"
            autoFocus
          />
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-text-primary block mb-2">
            Note
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Color name and number"
            className="w-full h-12 text-sm border border-border rounded-xl px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-muted hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!mtrs || parseFloat(mtrs) <= 0 || isNaN(parseFloat(mtrs)) || !note.trim()}
            className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
}
