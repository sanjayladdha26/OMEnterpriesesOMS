"use client";

import { useState, useEffect } from "react";
import { Drawer } from "@/components/ui/drawer";
import { useUIStore } from "@/stores/ui-store";
import { useCategories, useSupabase } from "@/lib/hooks";
import type { Product } from "@/types/database";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export function ProductFormDrawer() {
  const { drawerOpen, drawerContent, drawerData, closeDrawer } = useUIStore();
  const isOpen = drawerOpen && (drawerContent === "add-product" || drawerContent === "edit-product");
  const isEdit = drawerContent === "edit-product";
  const product = drawerData?.product as unknown as Product | undefined;

  const { data: categories } = useCategories();
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [skuName, setSkuName] = useState("");
  const [category, setCategory] = useState("general");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("piece");
  const [hsn, setHsn] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit && product) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(product.name);
      setSkuName(product.sku_name || "");
      setCategory(product.category);
      setPrice(String(product.price_per_unit));
      setUnit(product.unit);
      setHsn(product.hsn_code || "");
    } else if (!isEdit) {
      setName("");
      setSkuName("");
      setCategory(categories?.[0]?.name || "general");
      setPrice("");
      setUnit("piece");
      setHsn("");
    }
  }, [isEdit, product, categories]);

  const handleSave = async () => {
    if (!name || !price) return;
    setIsSubmitting(true);
    const toastId = toast.loading(isEdit ? "Updating product..." : "Saving product...");
    try {
      const payload = {
        name: name.trim(),
        sku_name: skuName.trim() || null,
        category,
        price_per_unit: Number(price),
        unit,
        hsn_code: hsn.trim() || null,
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
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product.", { id: toastId });
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
          <label className={labelClass}>SKU Name (Not Printed)</label>
          <input
            type="text"
            value={skuName}
            onChange={(e) => setSkuName(e.target.value)}
            placeholder="e.g. SKU-1234"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            {categories?.length ? (
              categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))
            ) : (
              <option value="general">General</option>
            )}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>
              Price per Unit <span className="text-red">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">₹</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="450"
                className={inputClass + " pl-7"}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className={inputClass}
            >
              <option value="piece">Piece (pc)</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>HSN Code</label>
          <input
            type="text"
            value={hsn}
            onChange={(e) => setHsn(e.target.value)}
            placeholder="e.g. 9503"
            className={inputClass}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!name || !price || isSubmitting}
          className="w-full mt-4 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "Save Changes" : "Add Product"}
        </button>
      </div>
    </Drawer>
  );
}
