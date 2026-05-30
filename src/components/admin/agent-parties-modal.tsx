import { useEffect } from "react";
import { X, Building2, MapPin, Phone } from "lucide-react";
import { useAgentParties } from "@/lib/hooks";

interface AgentPartiesModalProps {
  agentId: string;
  agentName: string;
  onClose: () => void;
}

export function AgentPartiesModal({ agentId, agentName, onClose }: AgentPartiesModalProps) {
  const { data: parties, isLoading } = useAgentParties(agentId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm overlay-enter" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[85vh] bg-surface rounded-2xl shadow-xl flex flex-col modal-enter overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-surface sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              Parties for {agentName}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Viewing all associated parties
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-text-muted text-sm">
              <div className="w-8 h-8 mb-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Loading parties...
            </div>
          ) : parties && parties.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface text-text-muted whitespace-nowrap">
                    <th className="text-left px-4 py-3 font-medium">Party Name</th>
                    <th className="text-left px-4 py-3 font-medium">Contact</th>
                    <th className="text-left px-4 py-3 font-medium">City</th>
                    <th className="text-left px-4 py-3 font-medium">State</th>
                    <th className="text-left px-4 py-3 font-medium">GSTIN</th>
                    <th className="text-left px-4 py-3 font-medium">Transport</th>
                  </tr>
                </thead>
                <tbody>
                  {parties.map((party, idx) => (
                    <tr
                      key={party.id}
                      className={`border-t border-border hover:bg-primary-50/50 transition-colors ${
                        idx % 2 === 1 ? "bg-surface/50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-text-primary whitespace-nowrap">{party.account_name}</td>
                      <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                        {party.phone1 || "-"}
                        {party.phone2 ? `, ${party.phone2}` : ""}
                      </td>
                      <td className="px-4 py-3 text-text-muted whitespace-nowrap">{party.city || "-"}</td>
                      <td className="px-4 py-3 text-text-muted whitespace-nowrap">{party.state || "-"}</td>
                      <td className="px-4 py-3 text-text-muted whitespace-nowrap">{party.gstin || "-"}</td>
                      <td className="px-4 py-3 text-text-muted whitespace-nowrap">{party.transport || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-12 h-12 bg-surface-hover rounded-xl flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 text-text-muted" />
              </div>
              <h3 className="text-sm font-bold text-text-primary mb-1">No Parties Found</h3>
              <p className="text-xs text-text-muted">
                This agent has not been assigned any parties yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
