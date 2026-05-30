"use client";

import { useAgents, useSupabase } from "@/lib/hooks";
import { useUIStore } from "@/stores/ui-store";
import { Pencil, Trash2 } from "lucide-react";
import { confirmToast } from "@/lib/toast-utils";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import toast from "react-hot-toast";
import { useState } from "react";
import { AgentPartiesModal } from "./agent-parties-modal";

interface AgentTableProps {
  searchQuery: string;
}

export function AgentTable({ searchQuery }: AgentTableProps) {
  const { openDrawer } = useUIStore();
  const { data: queryAgents, isLoading } = useAgents();
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.role);
  const isAdmin = role === "admin";

  const [selectedAgentForParties, setSelectedAgentForParties] = useState<{ id: string; name: string } | null>(null);

  let agents = queryAgents ? [...queryAgents] : [];

  // Filter by search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    agents = agents.filter(
      (a) => a.name.toLowerCase().includes(q) || (a.code && a.code.toLowerCase().includes(q))
    );
  }

  const handleDelete = (id: string, name: string) => {
    confirmToast(`Are you sure you want to delete agent "${name}"?`, async () => {
      const toastId = toast.loading("Deleting agent...");
      try {
        const { error } = await supabase.from("agents").delete().eq("id", id);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["agents"] });
        toast.success("Agent deleted successfully.", { id: toastId });
      } catch (error) {
        console.error("Error deleting agent:", error);
        toast.error("Failed to delete agent.", { id: toastId });
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
              <th className="text-left px-4 py-3 font-medium">Agent Name</th>
              <th className="text-left px-4 py-3 font-medium">Agent Code</th>
              <th className="text-left px-4 py-3 font-medium">Phone</th>
              <th className="text-center px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent, idx) => (
              <tr
                key={agent.id}
                className={`border-t border-border hover:bg-primary-50/50 transition-colors ${
                  idx % 2 === 1 ? "bg-surface/50" : ""
                }`}
              >
                <td className="px-4 py-3 text-text-muted">{idx + 1}</td>
                <td 
                  className="px-4 py-3 font-medium text-primary cursor-pointer hover:underline"
                  onClick={() => setSelectedAgentForParties({ id: agent.id, name: agent.name })}
                >
                  {agent.name}
                </td>
                <td className="px-4 py-3 font-medium text-text-primary">{agent.code}</td>
                <td className="px-4 py-3 text-text-muted">{agent.phone || "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() =>
                            openDrawer("edit-agent", { agent: agent as unknown as Record<string, unknown> })
                          }
                          className="p-1.5 rounded-lg hover:bg-primary-light text-text-muted hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(agent.id, agent.name)}
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
            Loading agents...
          </div>
        ) : agents.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">
            No agents found
          </div>
        ) : null}
      </div>

      {/* Agent Parties Modal */}
      {selectedAgentForParties && (
        <AgentPartiesModal
          agentId={selectedAgentForParties.id}
          agentName={selectedAgentForParties.name}
          onClose={() => setSelectedAgentForParties(null)}
        />
      )}
    </div>
  );
}
