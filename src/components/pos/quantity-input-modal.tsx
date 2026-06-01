"use client";

import { useState, useEffect, useRef } from "react";
import { X, Upload, ImageIcon, Loader2 } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import type { Product } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

interface QuantityInputModalProps {
  product: Product;
  onClose: () => void;
}

export function QuantityInputModal({ product, onClose }: QuantityInputModalProps) {
  const [mtrs, setMtrs] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addItem = useCartStore((s) => s.addItem);
  const supabase = createClient();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && !isUploading) handleAdd();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, mtrs, note, file, isUploading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleAdd = async () => {
    const qty = parseFloat(mtrs);
    if (isNaN(qty) || qty <= 0) return;
    
    setIsUploading(true);
    let imageUrl: string | undefined = undefined;

    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        alert("Failed to upload image. Please try again.");
        setIsUploading(false);
        return;
      }

      if (data) {
         const { data: publicUrlData } = supabase.storage
           .from('product-images')
           .getPublicUrl(fileName);
           
         imageUrl = publicUrlData.publicUrl;
      }
    }

    addItem({
      product_id: product.id,
      product_name: product.name,
      quantity: qty,
      note: note.trim() || undefined,
      image_url: imageUrl,
    });
    
    setIsUploading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 overlay-enter" onClick={!isUploading ? onClose : undefined} />

      {/* Modal */}
      <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-sm p-6 modal-enter">
        {/* Close */}
        <button
          onClick={onClose}
          disabled={isUploading}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface-hover transition-colors text-text-muted disabled:opacity-50"
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
            disabled={isUploading}
            className="w-full h-12 text-lg border border-border rounded-xl px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface transition-colors disabled:opacity-50"
            autoFocus
          />
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-text-primary block mb-2">
            Color (Optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Color name and number"
            disabled={isUploading}
            className="w-full h-12 text-sm border border-border rounded-xl px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface transition-colors disabled:opacity-50"
          />
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-text-primary block mb-2">
            Reference Image (Optional)
          </label>
          
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            disabled={isUploading}
          />
          
          {previewUrl ? (
            <div className="relative w-full h-24 border border-border rounded-xl overflow-hidden group">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              {!isUploading && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-white rounded-lg text-text-primary hover:bg-gray-100 transition-colors">
                    <Upload className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setFile(null); setPreviewUrl(null); }} className="p-2 bg-white rounded-lg text-red-500 hover:bg-gray-100 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full h-24 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-text-muted hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ImageIcon className="w-6 h-6" />
              <span className="text-sm">Click to upload image</span>
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-muted hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!mtrs || parseFloat(mtrs) <= 0 || isNaN(parseFloat(mtrs)) || isUploading}
            className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <span>Add to Order</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
