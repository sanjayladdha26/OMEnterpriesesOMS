"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useAgentParties, useParties, useDeleteParty } from "@/lib/hooks";
import Link from "next/link";
import { User, Loader2, MapPin, Phone, Edit, Trash2 } from "lucide-react";

export default function StorePartiesPage() {
  const { role, agent, party } = useAuthStore();
  
  const { data: agentParties, isLoading: isAgentLoading } = useAgentParties(agent?.id || "");
  const { data: allParties, isLoading: isAllLoading } = useParties();
  const deleteParty = useDeleteParty();
  
  let isLoading = false;
  let parties: any[] | undefined = undefined;

  if (role === "admin" || role === "staff") {
    isLoading = isAllLoading;
    parties = allParties;
  } else if (role === "agent") {
    isLoading = isAgentLoading;
    parties = agentParties;
  } else if (role === "party") {
    isLoading = false;
    parties = party ? [party] : [];
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this party?")) {
      try {
        await deleteParty.mutateAsync(id);
      } catch (error) {
        console.error("Failed to delete party:", error);
        alert("Failed to delete party.");
      }
    }
  };

  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-background">
        <div className="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-text-muted" />
        </div>
        <h2 className="text-xl font-bold mb-2">Not Logged In</h2>
        <p className="text-sm text-text-muted mb-6 max-w-sm">
          Please log in to view parties.
        </p>
        <Link
          href="/login"
          className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {role === "admin" ? "All Parties" : role === "party" ? "Profile" : "My Parties"}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {role === "party" ? "View and manage your account details" : "Manage your customers and delivery locations"}
          </p>
        </div>
        {role === "agent" && (
          <Link
            href="/store/parties/new"
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            New Party
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !parties || parties.length === 0 ? (
        <div className="text-center bg-surface border border-border rounded-xl p-12">
          <User className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="font-medium text-text-primary">No parties found</p>
          <p className="text-sm text-text-muted mt-1">You don&apos;t have any parties assigned yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {parties.map((party) => (
            <div key={party.id} className="bg-surface border border-border rounded-xl p-5 shadow-sm hover:border-primary/30 transition-colors">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg text-text-primary">{party.account_name}</h3>
                  
                  {party.gstin && (
                    <p className="text-sm text-text-muted mt-1">
                      GSTIN: <span className="font-medium text-text-primary">{party.gstin}</span>
                    </p>
                  )}
                  
                  <div className="mt-3 flex flex-col gap-2">
                    {(party.address || party.city || party.state) && (
                      <div className="flex items-start gap-2 text-sm text-text-muted">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                          {[party.address, party.city, party.state, party.pin_code].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                    
                    {(party.phone1 || party.phone2) && (
                      <div className="flex items-start gap-2 text-sm text-text-muted">
                        <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                          {[party.phone1, party.phone2].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-3">
                  {party.transport && (
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-blue/10 text-blue">
                        {party.transport}
                      </span>
                    </div>
                  )}
                  
                  {role === "agent" && (
                    <div className="flex items-center gap-2 mt-auto">
                      <Link
                        href={`/store/parties/${party.id}`}
                        className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Edit Party"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(party.id)}
                        className="p-2 text-text-muted hover:text-red hover:bg-red/10 rounded-lg transition-colors"
                        title="Delete Party"
                        disabled={deleteParty.isPending}
                      >
                        {deleteParty.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
