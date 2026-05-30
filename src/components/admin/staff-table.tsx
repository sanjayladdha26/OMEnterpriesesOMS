"use client";

import { useStaff, useDeleteStaff } from "@/lib/hooks";
import { useUIStore } from "@/stores/ui-store";
import { Pencil, Trash2 } from "lucide-react";
import { confirmToast } from "@/lib/toast-utils";
import { useAuthStore } from "@/stores/auth-store";
import toast from "react-hot-toast";
import type { Staff } from "@/types/database";

interface StaffTableProps {
  searchQuery: string;
}

export function StaffTable({ searchQuery }: StaffTableProps) {
  const { openDrawer } = useUIStore();
  const { data: queryStaff, isLoading } = useStaff();
  const deleteStaff = useDeleteStaff();
  const role = useAuthStore((state) => state.role);
  const isAdmin = role === "admin";

  let staffList = queryStaff ? [...queryStaff] : [];

  // Filter by search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    staffList = staffList.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.code && s.code.toLowerCase().includes(q))
    );
  }

  const handleDelete = (id: string, name: string) => {
    confirmToast(`Are you sure you want to delete staff member "${name}"?`, async () => {
      const toastId = toast.loading("Deleting staff member...");
      try {
        await deleteStaff.mutateAsync(id);
        toast.success("Staff member deleted successfully.", { id: toastId });
      } catch (error) {
        console.error("Error deleting staff:", error);
        toast.error("Failed to delete staff member.", { id: toastId });
      }
    });
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface text-text-muted">
              <th className="text-left px-4 py-3 font-medium">#</th>
              <th className="text-left px-4 py-3 font-medium">Staff Name</th>
              <th className="text-left px-4 py-3 font-medium">Login Code</th>
              <th className="text-center px-4 py-3 font-medium">Create Order</th>
              <th className="text-center px-4 py-3 font-medium">Status Perms</th>
              <th className="text-center px-4 py-3 font-medium">Admin</th>
              <th className="text-center px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((staff, idx) => (
              <tr
                key={staff.id}
                className={`border-t border-border hover:bg-primary-50/50 transition-colors ${
                  idx % 2 === 1 ? "bg-surface/50" : ""
                }`}
              >
                <td className="px-4 py-3 text-text-muted">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-text-primary">{staff.name}</td>
                <td className="px-4 py-3 text-text-muted font-mono bg-surface-hover rounded px-1.5 py-0.5 mx-2 my-2 w-fit">{staff.code}</td>
                <td className="px-4 py-3 text-center">
                  <div className={`inline-flex w-3 h-3 rounded-full ${staff.can_create_order ? "bg-green-500" : "bg-red-400"}`}></div>
                </td>
                <td className="px-4 py-3 text-center text-xs font-mono font-bold flex justify-center gap-1">
                  <span className={staff.can_accept_order ? "text-green-600" : "text-gray-300"}>A</span>
                  <span className={staff.can_dispatch_order ? "text-purple-600" : "text-gray-300"}>D</span>
                  <span className={staff.can_complete_order ? "text-blue-600" : "text-gray-300"}>C</span>
                  <span className={staff.can_reject_order ? "text-red-600" : "text-gray-300"}>R</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className={`inline-flex w-3 h-3 rounded-full ${staff.is_admin ? "bg-purple-500" : "bg-zinc-300"}`}></div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() =>
                            openDrawer("edit-staff", { staff: staff as unknown as Record<string, unknown> })
                          }
                          className="p-1.5 rounded-lg hover:bg-primary-light text-text-muted hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(staff.id, staff.name)}
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
            Loading staff...
          </div>
        ) : staffList.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">
            No staff members found
          </div>
        ) : null}
      </div>
    </div>
  );
}
