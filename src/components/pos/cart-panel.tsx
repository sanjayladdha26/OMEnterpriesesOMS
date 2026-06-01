"use client";

import { ShoppingCart, X, Plus, Minus, Trash2 } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { OrderSubmitBar } from "./order-submit-bar";
import { useAuthStore } from "@/stores/auth-store";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Order, Party, Agent } from "@/types/database";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ImageViewerModal } from "@/components/ui/image-viewer-modal";
import { useState } from "react";

interface CartPanelProps {
  orderNumber: string;
  onOrderSaved: (order: Order) => void;
  onClose?: () => void;
}

export function CartPanel({ orderNumber, onOrderSaved, onClose }: CartPanelProps) {
  const role = useAuthStore((s) => s.role);
  const authAgent = useAuthStore((s) => s.agent);
  const [viewImage, setViewImage] = useState<{ url: string; alt: string } | null>(null);
  
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    party_id,
    setParty,
    agent_id,
    setAgent,
  } = useCartStore();

  const currentAgentId = authAgent?.id || agent_id;

  const { data: allAgents = [] } = useQuery({
    queryKey: ["all-agents"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from("agents").select("*").order("name");
      return (data || []) as Agent[];
    },
    enabled: role === "staff" || role === "admin",
  });

  const { data: parties = [] } = useQuery({
    queryKey: ["parties", currentAgentId],
    queryFn: async () => {
      if (!currentAgentId) return [];
      const supabase = createClient();
      const { data } = await supabase.from("parties").select("*").eq("agent_id", currentAgentId).order("account_name");
      return (data || []) as Party[];
    },
    enabled: !!currentAgentId,
  });

  return (
    <div className="flex flex-col h-full bg-surface lg:border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 -ml-1 mr-1 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-base font-semibold text-text-primary">Your Cart</h2>
          {items.length > 0 && (
            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full font-medium">
              {items.length}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-red hover:text-red-dark font-medium flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Party & Agent Selection */}
      {role !== "party" && (
        <div className="px-4 py-3 border-b border-border bg-surface space-y-3">
          {(role === "staff" || role === "admin") && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-muted uppercase">Select Agent</label>
              <SearchableSelect
                value={agent_id}
                onChange={(val) => {
                  const selected = allAgents.find(a => a.id === val);
                  if (selected) {
                    setAgent(selected.id, selected.name);
                    setParty(null, null); // Reset party when agent changes
                  }
                }}
                options={allAgents.map(a => ({ value: a.id, label: a.name }))}
                placeholder="-- Choose an Agent --"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-muted uppercase">Select Party</label>
            <SearchableSelect
              value={party_id}
              onChange={(val) => {
                const selected = parties.find(p => p.id === val);
                if (selected) {
                  setParty(selected.id, selected.account_name);
                }
              }}
              disabled={(role === "staff" || role === "admin") && !agent_id}
              options={parties.map(p => ({
                value: p.id,
                label: `${p.account_name} (${p.city})`
              }))}
              placeholder="-- Choose a Party --"
            />
          </div>
        </div>
      )}

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-[150px] lg:min-h-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted py-12">
            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
              <ShoppingCart className="w-7 h-7 opacity-40" />
            </div>
            <p className="text-sm font-medium">No items yet</p>
            <p className="text-xs mt-1">Add products to your order</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-surface rounded-xl p-3 group"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-text-primary truncate">
                        {item.product_name}
                      </h4>
                      {item.note && (
                        <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                          Color: {item.note}
                        </p>
                      )}
                      {item.image_url && (
                        <button 
                          onClick={() => setViewImage({ url: item.image_url!, alt: item.product_name })}
                          className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-border hover:opacity-80 transition-opacity focus:outline-none"
                        >
                          <img src={item.image_url} alt="Reference" className="w-full h-full object-cover" />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 rounded-lg text-text-light hover:text-red hover:bg-red-light transition-colors opacity-0 group-hover:opacity-100 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-surface-hover rounded-lg p-1 border border-border">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            updateQuantity(item.id, isNaN(val) ? 0 : Math.max(0, val));
                          }}
                          step="any"
                          min="0"
                          className="w-20 text-center text-sm font-semibold bg-transparent focus:outline-none"
                        />
                      </div>
                      <span className="text-xs font-medium text-text-muted">mtrs</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary & Checkout - only show when items exist */}
      {items.length > 0 && (
        <div className="border-t border-border bg-surface flex flex-col">
          <div className="px-4 py-3">
            <OrderSubmitBar
              orderNumber={orderNumber}
              onOrderSaved={onOrderSaved}
            />
          </div>
        </div>
      )}

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
