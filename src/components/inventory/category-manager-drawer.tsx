"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { useUIStore } from "@/stores/ui-store";
import { useCategories, useSupabase } from "@/lib/hooks";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { confirmToast } from "@/lib/toast-utils";
import toast from "react-hot-toast";

export function CategoryManagerDrawer() {
  const { drawerOpen, drawerContent, closeDrawer } = useUIStore();
  const isOpen = drawerOpen && drawerContent === "manage-categories";
  
  const { data: categories, isLoading } = useCategories();
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Adding category...");
    try {
      const { error } = await supabase.from("categories").insert([{ 
        name: newCategoryName.trim()
      }]);
      if (error) throw error;
      setNewCategoryName("");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category added successfully.", { id: toastId });
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editName.trim()) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Updating category...");
    try {
      const { error } = await supabase.from("categories").update({ 
        name: editName.trim()
      }).eq("id", id);
      if (error) throw error;
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated successfully.", { id: toastId });
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = (id: string) => {
    confirmToast("Are you sure you want to delete this category?", async () => {
      setIsSubmitting(true);
      const toastId = toast.loading("Deleting category...");
      try {
        const { error } = await supabase.from("categories").delete().eq("id", id);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        toast.success("Category deleted successfully.", { id: toastId });
      } catch (error) {
        console.error("Error deleting category:", error);
        toast.error("Failed to delete category.", { id: toastId });
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  return (
    <Drawer open={isOpen} onClose={closeDrawer} title="Manage Categories">
      <div className="space-y-6">
        {/* Add New Category */}
        <div>
          <label className="text-sm font-medium text-text-primary block mb-1.5">Add New Category</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Sarees"
              className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            />
            <button
              onClick={handleAddCategory}
              disabled={isSubmitting || !newCategoryName.trim()}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Existing Categories */}
        <div>
          <label className="text-sm font-medium text-text-primary block mb-3">Existing Categories</label>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
            </div>
          ) : categories?.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">No categories found.</p>
          ) : (
            <div className="space-y-2">
              {categories?.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border">
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-primary"
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && handleUpdateCategory(cat.id)}
                      />
                      <button
                        onClick={() => handleUpdateCategory(cat.id)}
                        disabled={isSubmitting}
                        className="text-xs bg-primary text-white px-2 py-1 rounded font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs bg-gray-200 text-text-primary px-2 py-1 rounded font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingId(cat.id);
                            setEditName(cat.name);
                          }}
                          className="p-1.5 rounded hover:bg-surface-hover text-text-muted hover:text-primary transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 rounded hover:bg-surface-hover text-text-muted hover:text-red transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
