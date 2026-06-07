"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { useUIStore } from "@/stores/ui-store";
import { useCreateStaff, useUpdateStaff, useProducts } from "@/lib/hooks";
import toast from "react-hot-toast";
import type { Staff } from "@/types/database";
import { Save, UserCheck, KeyRound } from "lucide-react";

export function StaffFormDrawer() {
  const { drawerContent, drawerData, closeDrawer } = useUIStore();
  const isOpen = drawerContent === "add-staff" || drawerContent === "edit-staff";
  const isEditing = drawerContent === "edit-staff";

  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    can_create_order: false,
    can_accept_order: false,
    can_dispatch_order: false,
    can_complete_order: false,
    can_reject_order: false,
    can_view_orders: false,
    can_view_inventory: false,
    can_view_agents: false,
    can_view_staff: false,
    is_admin: false,
    allowed_products: [] as string[],
  });

  const { data: products } = useProducts();

  useEffect(() => {
    if (isOpen && isEditing && drawerData?.staff) {
      const staff = drawerData.staff as unknown as Staff;
      setFormData({
        name: staff.name || "",
        code: staff.code || "",
        can_create_order: staff.can_create_order || false,
        can_accept_order: staff.can_accept_order || false,
        can_dispatch_order: staff.can_dispatch_order || false,
        can_complete_order: staff.can_complete_order || false,
        can_reject_order: staff.can_reject_order || false,
        can_view_orders: staff.can_view_orders || false,
        can_view_inventory: staff.can_view_inventory || false,
        can_view_agents: staff.can_view_agents || false,
        can_view_staff: staff.can_view_staff || false,
        is_admin: staff.is_admin || false,
        allowed_products: staff.allowed_products || [],
      });
    } else if (isOpen && !isEditing) {
      setFormData({
        name: "",
        code: "",
        can_create_order: false,
        can_accept_order: false,
        can_dispatch_order: false,
        can_complete_order: false,
        can_reject_order: false,
        can_view_orders: false,
        can_view_inventory: false,
        can_view_agents: false,
        can_view_staff: false,
        is_admin: false,
        allowed_products: [],
      });
    }
  }, [isOpen, isEditing, drawerData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error("Name and Code are required.");
      return;
    }

    if (
      !formData.is_admin &&
      !formData.can_view_orders &&
      !formData.can_view_inventory &&
      !formData.can_view_agents &&
      !formData.can_view_staff &&
      !formData.can_create_order
    ) {
      toast.error("Please select at least one view permission (or Create Orders).");
      return;
    }

    const toastId = toast.loading(
      isEditing ? "Updating staff..." : "Adding staff..."
    );

    try {
      if (isEditing && drawerData?.staff) {
        const staff = drawerData.staff as unknown as Staff;
        await updateStaff.mutateAsync({
          id: staff.id,
          ...formData,
        });
        toast.success("Staff updated successfully.", { id: toastId });
      } else {
        await createStaff.mutateAsync(formData);
        toast.success("Staff added successfully.", { id: toastId });
      }
      closeDrawer();
    } catch (error) {
      console.error("Error saving staff:", error);
      toast.error(
        `Failed to ${isEditing ? "update" : "add"} staff. Ensure the code is unique.`,
        { id: toastId }
      );
    }
  };

  return (
    <Drawer
      open={isOpen}
      onClose={closeDrawer}
      title={isEditing ? "Edit Staff" : "Add New Staff"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-4 bg-surface p-4 rounded-xl border border-border">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-text-muted" />
                Staff Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="e.g., John Doe"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-text-muted" />
                Login Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                required
                placeholder="e.g., john123"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono"
              />
              <p className="text-[11px] text-text-muted">Must be unique across all staff.</p>
            </div>
          </div>

          <div className="space-y-4 bg-surface p-4 rounded-xl border border-border">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Permissions</h3>
            

            <div className="space-y-2 mt-4 mb-4">
              <p className="text-sm font-semibold text-text-primary">Order Status Permissions</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-surface-hover cursor-pointer">
                  <input type="checkbox" checked={formData.can_accept_order} onChange={(e) => setFormData({ ...formData, can_accept_order: e.target.checked })} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                  <span className="text-sm font-medium text-text-primary">Accept</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-surface-hover cursor-pointer">
                  <input type="checkbox" checked={formData.can_dispatch_order} onChange={(e) => setFormData({ ...formData, can_dispatch_order: e.target.checked })} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                  <span className="text-sm font-medium text-text-primary">Dispatch</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-surface-hover cursor-pointer">
                  <input type="checkbox" checked={formData.can_complete_order} onChange={(e) => setFormData({ ...formData, can_complete_order: e.target.checked })} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                  <span className="text-sm font-medium text-text-primary">Complete</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-surface-hover cursor-pointer">
                  <input type="checkbox" checked={formData.can_reject_order} onChange={(e) => setFormData({ ...formData, can_reject_order: e.target.checked })} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                  <span className="text-sm font-medium text-text-primary">Reject</span>
                </label>
              </div>
            </div>

            <div className="space-y-2 mt-4 mb-4">
              <p className="text-sm font-semibold text-text-primary">View Permissions (Admin)</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-surface-hover cursor-pointer">
                  <input type="checkbox" checked={formData.can_view_orders} onChange={(e) => setFormData({ ...formData, can_view_orders: e.target.checked })} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                  <span className="text-sm font-medium text-text-primary">Orders</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-surface-hover cursor-pointer">
                  <input type="checkbox" checked={formData.can_view_inventory} onChange={(e) => setFormData({ ...formData, can_view_inventory: e.target.checked })} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                  <span className="text-sm font-medium text-text-primary">Inventory</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-surface-hover cursor-pointer">
                  <input type="checkbox" checked={formData.can_view_agents} onChange={(e) => setFormData({ ...formData, can_view_agents: e.target.checked })} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                  <span className="text-sm font-medium text-text-primary">Agents</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-surface-hover cursor-pointer">
                  <input type="checkbox" checked={formData.can_view_staff} onChange={(e) => setFormData({ ...formData, can_view_staff: e.target.checked })} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                  <span className="text-sm font-medium text-text-primary">Staff</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-surface-hover cursor-pointer">
                  <input type="checkbox" checked={formData.can_create_order} onChange={(e) => setFormData({ ...formData, can_create_order: e.target.checked })} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                  <span className="text-sm font-medium text-text-primary">New Order</span>
                </label>
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.is_admin}
                onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <div>
                <p className="text-sm font-medium text-primary">Full Admin Access</p>
                <p className="text-xs text-text-muted">Has all permissions and can manage other staff and agents.</p>
              </div>
            </label>

            {!formData.is_admin && (
              <div className="space-y-2 mt-4 mb-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-text-primary">Item-wise Access</p>
                  {products && products.length > 0 && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.allowed_products.length === products.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, allowed_products: products.map(p => p.id) });
                          } else {
                            setFormData({ ...formData, allowed_products: [] });
                          }
                        }}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-xs font-medium text-text-primary">Select All</span>
                    </label>
                  )}
                </div>
                <p className="text-xs text-text-muted mb-2">Select which products this staff member can view/work on. Leave empty for no access.</p>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                  {products?.map(product => (
                    <label key={product.id} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-surface-hover cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.allowed_products.includes(product.id)}
                        onChange={(e) => {
                          const newAllowed = e.target.checked 
                            ? [...formData.allowed_products, product.id]
                            : formData.allowed_products.filter(id => id !== product.id);
                          setFormData({ ...formData, allowed_products: newAllowed });
                        }}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-text-primary truncate" title={product.name}>{product.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-border bg-surface flex justify-end gap-3 mt-auto">
          <button
            type="button"
            onClick={closeDrawer}
            className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createStaff.isPending || updateStaff.isPending}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isEditing ? "Save Changes" : "Add Staff"}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
