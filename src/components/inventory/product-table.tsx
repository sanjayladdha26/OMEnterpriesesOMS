import { useState } from "react";
import { useProducts, useSupabase } from "@/lib/hooks";
import { useUIStore } from "@/stores/ui-store";
import { Pencil, Trash2, Package } from "lucide-react";
import { confirmToast } from "@/lib/toast-utils";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { ImageViewerModal } from "@/components/ui/image-viewer-modal";
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
  const [viewImage, setViewImage] = useState<{ url: string; alt: string } | null>(null);

  let products = queryProducts ? [...queryProducts] : [];

  // Filter by search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    products = products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.sku_name && p.sku_name.toLowerCase().includes(q))
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
              <th className="text-left px-4 py-3 font-medium w-12">#</th>
              <th className="text-left px-4 py-3 font-medium w-16">Image</th>
              <th className="text-left px-4 py-3 font-medium">Product Name</th>
              <th className="text-left px-4 py-3 font-medium">Item Code</th>
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
                    <button
                      onClick={() => setViewImage({ url: product.image_url!, alt: product.name })}
                      className="w-10 h-10 rounded-lg overflow-hidden border border-border flex items-center justify-center hover:scale-105 transition-transform duration-200 cursor-pointer focus:outline-none"
                    >
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    </button>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-surface-hover border border-border/60 flex items-center justify-center text-text-light">
                      <Package className="w-4 h-4 animate-pulse-soft" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-text-primary">{product.name}</td>
                <td className="px-4 py-3 text-text-muted">{product.sku_name || "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() =>
                            openDrawer("edit-product", { product: product as unknown as Record<string, unknown> })
                          }
                          className="p-1.5 rounded-lg hover:bg-primary-light text-text-muted hover:text-primary transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="p-1.5 rounded-lg hover:bg-red-light text-text-muted hover:text-red transition-colors cursor-pointer"
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

      {/* Image Viewer Modal */}
      {viewImage && (
        <ImageViewerModal
          imageUrl={viewImage.url}
          altText={viewImage.alt}
          onClose={() => setViewImage(null)}
        />
      )}
    </div>
  );
}
