"use client";

import { useState, useEffect, useRef } from "react";
import { Drawer } from "@/components/ui/drawer";
import { useUIStore } from "@/stores/ui-store";
import { useCategories, useSupabase } from "@/lib/hooks";
import type { Product } from "@/types/database";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

export function ProductFormDrawer() {
  const { drawerOpen, drawerContent, drawerData, closeDrawer } = useUIStore();
  const isOpen = drawerOpen && (drawerContent === "add-product" || drawerContent === "edit-product");
  const isEdit = drawerContent === "edit-product";
  const product = drawerData?.product as unknown as Product | undefined;

  const { data: categories } = useCategories();
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [skuName, setSkuName] = useState("");
  const [category, setCategory] = useState("general");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("piece");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit && product) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(product.name);
      setSkuName(product.sku_name || "");
      setCategory(product.category);
      setPrice(String(product.price_per_unit));
      setUnit(product.unit);
      setDescription(product.description || "");
      setImageUrl(product.image_url || "");
      setImagePreview(product.image_url || null);
      setImageFile(null);
    } else if (!isEdit) {
      setName("");
      setSkuName("");
      setCategory(categories?.[0]?.name || "general");
      setPrice("");
      setUnit("piece");
      setDescription("");
      setImageUrl("");
      setImagePreview(null);
      setImageFile(null);
    }
  }, [isEdit, product, categories]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB.");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleSave = async () => {
    if (!name || !price) return;
    setIsSubmitting(true);
    const toastId = toast.loading(isEdit ? "Updating product..." : "Saving product...");
    try {
      let finalImageUrl = imageUrl;

      // Upload new image if one was selected
      if (imageFile) {
        setIsUploading(true);
        finalImageUrl = await uploadImage(imageFile);
        setIsUploading(false);
      }

      const payload = {
        name: name.trim(),
        sku_name: skuName.trim() || null,
        category,
        price_per_unit: Number(price),
        unit,
        description: description.trim() || null,
        image_url: finalImageUrl || null,
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
      setIsUploading(false);
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
        {/* Image Upload */}
        <div>
          <label className={labelClass}>Product Image</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          {imagePreview ? (
            <div className="relative w-full h-40 rounded-xl border border-border overflow-hidden bg-surface group">
              <img
                src={imagePreview}
                alt="Product preview"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-white/90 rounded-lg text-text-primary hover:bg-white transition-colors"
                  title="Change image"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={removeImage}
                  className="p-2 bg-white/90 rounded-lg text-red hover:bg-white transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-primary bg-surface/50 hover:bg-primary-light/30 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ImageIcon className="w-8 h-8 text-text-muted" />
              <span className="text-xs text-text-muted">Click to upload image</span>
              <span className="text-[10px] text-text-muted/60">PNG, JPG up to 5MB</span>
            </button>
          )}
        </div>

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
          <label className={labelClass}>Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short product description"
            maxLength={200}
            className={inputClass}
          />
          <p className="text-[10px] text-text-muted mt-1 text-right">{description.length}/200</p>
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

        <button
          onClick={handleSave}
          disabled={!name || !price || isSubmitting}
          className="w-full mt-4 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {(isSubmitting || isUploading) && <Loader2 className="w-4 h-4 animate-spin" />}
          {isUploading ? "Uploading image..." : isEdit ? "Save Changes" : "Add Product"}
        </button>
      </div>
    </Drawer>
  );
}
