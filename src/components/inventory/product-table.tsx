"use client";

import { useProducts, useSupabase } from "@/lib/hooks";
import { formatINR } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { Pencil, Trash2, ImageIcon } from "lucide-react";
import { confirmToast } from "@/lib/toast-utils";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import toast from "react-hot-toast";

interface ProductTableProps {
  searchQuery: string;
}

export function ProductTable({ searchQuery }: ProductTableProps) {
  const { openDrawer } = useUIStore();
  const { data: queryProducts, isLoading } = useProducts();
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.role);
  const isAdmin = role === "admin";

  let products = queryProducts ? [...queryProducts] : [];

  // Filter by search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    products = products.filter(
      (p) => p.name.toLowerCase().includes(q)
    );
  }

  const handleDelete = (id: string, name: string) => {
    confirmToast(`Are you sure you want to delete "${name}"?`, async () => {
      const toastId = toast.loading("Deleting product...");
      try {
        const { error } = await supabase.from("products").delete().eq("id", id);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["products"] });
        toast.success("Product deleted successfully.", { id: toastId });
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error("Failed to delete product.", { id: toastId });
      }
    });
  };

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface text-text-muted">
              <th className="text-left px-4 py-3 font-medium">#</th>
              <th className="text-left px-4 py-3 font-medium w-12">Image</th>
              <th className="text-left px-4 py-3 font-medium">Product Name</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Description</th>
              <th className="text-left px-4 py-3 font-medium">SKU Name</th>
              <th className="text-right px-4 py-3 font-medium">Price</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-center px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, idx) => (
              <tr
                key={product.id}
                className={`border-t border-border hover:bg-primary-50/50 transition-colors ${
                  idx % 2 === 1 ? "bg-surface/50" : ""
                }`}
              >
                <td className="px-4 py-3 text-text-muted">{idx + 1}</td>
                <td className="px-4 py-2">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover border border-border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-text-muted/50" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-text-primary">{product.name}</td>
                <td className="px-4 py-3 text-text-muted text-xs max-w-[200px] truncate hidden md:table-cell">
                  {product.description || "—"}
                </td>
                <td className="px-4 py-3 text-text-muted">{product.sku_name || "-"}</td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatINR(product.price_per_unit)}
                  <span className="text-text-muted text-xs">/{product.unit === "metre" ? "m" : "pc"}</span>
                </td>
                <td className="px-4 py-3 text-text-muted capitalize">{product.category}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() =>
                            openDrawer("edit-product", { product: product as unknown as Record<string, unknown> })
                          }
                          className="p-1.5 rounded-lg hover:bg-primary-light text-text-muted hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="p-1.5 rounded-lg hover:bg-red-light text-text-muted hover:text-red transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-text-muted text-sm">
            <div className="w-6 h-6 mb-2 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">
            No products found
          </div>
        ) : null}
      </div>
    </div>
  );
}
