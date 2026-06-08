"use client";

import { useState, useEffect, useRef } from "react";
import { Drawer } from "@/components/ui/drawer";
import { useUIStore } from "@/stores/ui-store";
import { useSupabase } from "@/lib/hooks";
import type { Product } from "@/types/database";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, ImageIcon, X } from "lucide-react";
import toast from "react-hot-toast";

export function ProductFormDrawer() {
  const { drawerOpen, drawerContent, drawerData, closeDrawer } = useUIStore();
  const isOpen = drawerOpen && (drawerContent === "add-product" || drawerContent === "edit-product");
  const isEdit = drawerContent === "edit-product";
  const product = drawerData?.product as unknown as Product | undefined;

  const supabase = useSupabase();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Image upload states
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [imageDeleted, setImageDeleted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (isEdit && product) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setName(product.name);
        setItemCode(product.sku_name || "");
        setPreviewUrl(product.image_url || "");
        setFile(null);
        setImageDeleted(false);
      } else if (!isEdit) {
        setName("");
        setItemCode("");
        setPreviewUrl("");
        setFile(null);
        setImageDeleted(false);
      }
    }
  }, [isOpen, isEdit, product]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setImageDeleted(false);
    }
  };

  const handleRemoveImage = () => {
    setFile(null);
    setPreviewUrl("");
    setImageDeleted(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!name) return;
    setIsSubmitting(true);
    const toastId = toast.loading(isEdit ? "Updating product..." : "Saving product...");
    try {
      let finalImageUrl = product?.image_url || null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `products/${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (uploadError) {
          throw new Error("Failed to upload product image: " + uploadError.message);
        }

        if (data) {
          const { data: publicUrlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);
          
          finalImageUrl = publicUrlData.publicUrl;
        }
      } else if (imageDeleted) {
        finalImageUrl = null;
      }

      const payload = {
        name: name.trim(),
        sku_name: itemCode.trim() || null,
        price_per_unit: 0,
        unit: "piece",
        image_url: finalImageUrl,
      };

      if (isEdit && product?.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert([payload]);
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["products"] });
      closeDrawer();
      toast.success(isEdit ? "Product updated successfully." : "Product saved successfully.", { id: toastId });
    } catch (error: any) {
      console.error("Error saving product:", error?.message || error, error);
      toast.error(error?.message || "Failed to save product.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
  const labelClass = "text-sm font-medium text-text-primary block mb-1.5";

  return (
    <Drawer
      open={isOpen}
      onClose={closeDrawer}
      title={isEdit ? "Edit Product" : "Add New Product"}
    >
      <div className="space-y-4">
        <div>
          <label className={labelClass}>
            Product Name <span className="text-red">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Wooden Block Puzzle"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Item Code / SKU</label>
          <input
            type="text"
            value={itemCode}
            onChange={(e) => setItemCode(e.target.value)}
            placeholder="e.g. ITEM-1234"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Product Image</label>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isSubmitting}
          />
          
          {previewUrl ? (
            <div className="relative w-full h-40 border border-border rounded-xl overflow-hidden group">
              <img src={previewUrl} alt="Product preview" className="w-full h-full object-cover" />
              {!isSubmitting && (
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 bg-white rounded-xl text-text-primary hover:bg-gray-100 transition-colors shadow-sm cursor-pointer"
                    title="Change image"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-2.5 bg-white rounded-xl text-red hover:bg-gray-100 transition-colors shadow-sm cursor-pointer"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
              className="w-full h-40 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2.5 text-text-muted hover:border-primary hover:text-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center group-hover:bg-primary-light transition-colors">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div className="text-center">
                <span className="text-sm font-semibold block">Click to upload image</span>
                <span className="text-[11px] mt-0.5 block text-text-light">PNG, JPG, or WEBP up to 5MB</span>
              </div>
            </button>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={!name || isSubmitting}
          className="w-full mt-4 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "Save Changes" : "Add Product"}
        </button>
      </div>
    </Drawer>
  );
}
