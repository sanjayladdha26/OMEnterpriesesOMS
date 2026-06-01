"use client";

import { useState } from "react";
import { Users, Plus, Search } from "lucide-react";
import { useAgents } from "@/lib/hooks";
import { useUIStore } from "@/stores/ui-store";
import { AgentTable } from "@/components/admin/agent-table";
import { AgentFormDrawer } from "@/components/admin/agent-form-drawer";
import { useAuthStore } from "@/stores/auth-store";

export default function AgentsPage() {
  const { openDrawer } = useUIStore();
  const [searchQuery, setSearchQuery] = useState("");
  const role = useAuthStore((state) => state.role);
  const isAdmin = role === "admin";

  const { data: agents } = useAgents();
  const totalAgents = agents?.length || 0;

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <img src="/image.jpg" alt="Logo" className="w-10 h-10 object-contain lg:hidden" />
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Agent Management
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Manage your sales agents
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => openDrawer("add-agent")}
              className="flex items-center justify-center gap-2 px-4 py-2.5 w-full sm:w-auto bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add New Agent
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3 inline-flex">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Total Agents</p>
            <p className="text-lg font-bold text-text-primary">{totalAgents}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search agents by name or code..."
          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
      </div>

      {/* Table */}
      <AgentTable searchQuery={searchQuery} />

      {/* Drawer */}
      <AgentFormDrawer />
    </div>
  );
}
