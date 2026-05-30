"use client";

import { useState, useEffect } from "react";
import { Drawer } from "@/components/ui/drawer";
import { useUIStore } from "@/stores/ui-store";
import { useSupabase } from "@/lib/hooks";
import type { Product } from "@/types/database";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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

  useEffect(() => {
    if (isEdit && product) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(product.name);
      setItemCode(product.sku_name || "");
    } else if (!isEdit) {
      setName("");
      setItemCode("");
    }
  }, [isEdit, product]);

  const handleSave = async () => {
    if (!name) return;
    setIsSubmitting(true);
    const toastId = toast.loading(isEdit ? "Updating product..." : "Saving product...");
    try {
      const payload = {
        name: name.trim(),
        sku_name: itemCode.trim() || null,
        price_per_unit: 0,
        unit: "piece",
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

        <button
          onClick={handleSave}
          disabled={!name || isSubmitting}
          className="w-full mt-4 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "Save Changes" : "Add Product"}
        </button>
      </div>
    </Drawer>
  );
}
