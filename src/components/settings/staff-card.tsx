"use client";

import { Users, Plus } from "lucide-react";
import { useStaff } from "@/lib/hooks";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

const roleBadge: Record<string, string> = {
  owner: "bg-primary-50 text-primary",
  manager: "bg-blue/10 text-blue",
  billing: "bg-surface text-text-muted",
};

const roleLabel: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  billing: "Billing Staff",
};

export function StaffCard() {
  const { openDrawer } = useUIStore();
  const { data: staffData } = useStaff();
  const staff = staffData || [];

  return (
    <div className="bg-surface border border-border rounded-xl shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">Staff Accounts</h3>
        </div>
        <button
          onClick={() => openDrawer("add-staff")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Staff
        </button>
      </div>

      {/* Staff List */}
      <div className="divide-y divide-border">
        {staff.map((staff) => (
          <div key={staff.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-surface-hover/50 transition-colors">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
              {staff.name.charAt(0)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-text-primary truncate">
                  {staff.name}
                </p>
                <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", roleBadge[staff.role])}>
                  {roleLabel[staff.role]}
                </span>
              </div>
              <p className="text-xs text-text-muted truncate">{staff.email}</p>
            </div>

            {/* Status */}
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  staff.is_active ? "bg-green" : "bg-text-light"
                )}
              />
              <span className="text-xs text-text-muted">
                {staff.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
