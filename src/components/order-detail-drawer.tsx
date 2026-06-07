"use client";

import { useState, useMemo } from "react";
import { Check, Truck, CheckCircle2, XCircle, Printer } from "lucide-react";
import { useOrderDetails, useUpdateOrderStatus, useUpdateOrderNote } from "@/lib/hooks";
import { formatDate, cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/database";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/auth-store";
import { Drawer } from "@/components/ui/drawer";
import { ImageViewerModal } from "@/components/ui/image-viewer-modal";
import { OrderMessagesChat } from "@/components/order-messages";

export const statusBadge: Record<OrderStatus, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-amber-light text-amber" },
  accepted: { label: "Accepted", cls: "bg-blue/10 text-blue" },
  dispatched: { label: "Dispatched", cls: "bg-purple/10 text-purple" },
  completed: { label: "Completed", cls: "bg-green-light text-green" },
  rejected: { label: "Rejected", cls: "bg-red-light text-red" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const badge = statusBadge[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        badge.cls
      )}
    >
      {badge.label}
    </span>
  );
}

export function OrderDetailDrawer({
  orderId,
  open,
  onClose,
}: {
  orderId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data: order, isLoading } = useOrderDetails(orderId);
  const [viewImage, setViewImage] = useState<{ url: string; alt: string } | null>(null);
  const updateStatus = useUpdateOrderStatus();
  const role = useAuthStore((state) => state.role);
  const staff = useAuthStore((state) => state.staff);
  const isAdmin = role === "admin";

  const canAccept = isAdmin || (role === "staff" && staff?.can_accept_order);
  const canDispatch = isAdmin || (role === "staff" && staff?.can_dispatch_order);
  const canComplete = isAdmin || (role === "staff" && staff?.can_complete_order);
  const canReject = isAdmin || (role === "staff" && staff?.can_reject_order);

  const handleStatusChange = async (status: OrderStatus, adminNotes?: string) => {
    if (!order) return;
    try {
      await updateStatus.mutateAsync({
        orderId: order.id,
        status,
        adminNotes,
      });
      toast.success(`Order ${status}`);
    } catch {
      toast.error("Failed to update order status");
    }
  };

  const handleReject = () => {
    const notes = window.prompt("Reason for rejection (optional):");
    if (notes === null) return; // cancelled
    handleStatusChange("rejected", notes || undefined);
  };

  const visibleItems = useMemo(() => {
    if (!order?.items) return [];
    if (role === "staff" && !isAdmin) {
      if (order.items.length > 1) {
        return order.items; // multi-item orders are visible to all staff
      }
      
      const allowed = staff?.allowed_products || [];
      if (allowed.length === 0) return [];
      return order.items.filter(item => allowed.includes(item.product_id));
    }
    return order.items;
  }, [order?.items, role, isAdmin, staff]);

  return (
    <Drawer open={open} onClose={onClose} title="Order Details" width="max-w-lg">
      {isLoading || !order ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-5 bg-border rounded w-32" />
          <div className="h-4 bg-border rounded w-48" />
          <div className="h-4 bg-border rounded w-36" />
          <div className="h-32 bg-border rounded" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="no-print space-y-6">
          {/* Order info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-text-primary">
                {order.order_number}
              </h3>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm text-text-muted">
              {formatDate(order.created_at)}
            </p>
          </div>

          {/* Party info */}
          <div className="bg-surface-hover rounded-xl p-4 space-y-2">
            <div className="flex flex-col">
              <p className="text-base font-semibold text-text-primary">
                {order.party?.account_name || order.party_name}
              </p>
              {order.agent_name && (
                <p className="text-sm text-text-muted">Agent: {order.agent_name}</p>
              )}
            </div>
            {order.party && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pt-2 border-t border-border mt-2">
                {order.party.phone1 && (
                  <div className="flex flex-col">
                    <span className="text-xs text-text-muted">Phone 1</span>
                    <span className="text-text-primary">{order.party.phone1}</span>
                  </div>
                )}
                {order.party.phone2 && (
                  <div className="flex flex-col">
                    <span className="text-xs text-text-muted">Phone 2</span>
                    <span className="text-text-primary">{order.party.phone2}</span>
                  </div>
                )}
                {order.party.gstin && (
                  <div className="flex flex-col col-span-2">
                    <span className="text-xs text-text-muted">GSTIN</span>
                    <span className="text-text-primary">{order.party.gstin}</span>
                  </div>
                )}
                {(order.party.address || order.party.city || order.party.state || order.party.pin_code) && (
                  <div className="flex flex-col col-span-2">
                    <span className="text-xs text-text-muted">Address</span>
                    <span className="text-text-primary">
                      {[order.party.address, order.party.city, order.party.state, order.party.pin_code]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
                {order.party.transport && (
                  <div className="flex flex-col">
                    <span className="text-xs text-text-muted">Transport</span>
                    <span className="text-text-primary">{order.party.transport}</span>
                  </div>
                )}
                {order.party.delivery_city && (
                  <div className="flex flex-col">
                    <span className="text-xs text-text-muted">Delivery City</span>
                    <span className="text-text-primary">{order.party.delivery_city}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Items table */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3">
              Items
            </h4>
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-hover border-b border-border">
                    <th className="text-left px-3 py-2 text-text-muted font-medium">
                      Item
                    </th>
                    <th className="text-right px-3 py-2 text-text-muted font-medium">
                      Qty
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-3 py-2 text-text-primary">
                        <div>{item.product_name}</div>
                        {(item as any).products?.sku_name && (
                          <div className="text-xs text-text-muted mt-0.5">{(item as any).products.sku_name}</div>
                        )}
                        {item.note && (
                          <div className="text-xs text-text-muted mt-0.5 italic">Color: {item.note}</div>
                        )}
                        {item.image_url && (
                          <div className="mt-2 no-print">
                            <button
                              onClick={() => setViewImage({ url: item.image_url!, alt: "Attached image" })}
                              className="inline-block hover:opacity-80 transition-opacity focus:outline-none"
                            >
                              <img src={item.image_url} alt="Attached image" className="w-16 h-16 object-cover border border-border rounded-md" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-text-primary">
                        {item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>



          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border no-print">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-text-primary rounded-xl text-sm font-semibold hover:bg-surface-hover transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            {order.status === "pending" && (
              <>
                {canAccept && (
                  <button
                    onClick={() => handleStatusChange("accepted")}
                    disabled={updateStatus.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-blue text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    Accept
                  </button>
                )}
                {canReject && (
                  <button
                    onClick={handleReject}
                    disabled={updateStatus.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-red text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                )}
              </>
            )}
            {order.status === "accepted" && (
              <>
                {canDispatch && (
                  <button
                    onClick={() => handleStatusChange("dispatched")}
                    disabled={updateStatus.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-purple text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Truck className="w-4 h-4" />
                    Dispatch
                  </button>
                )}
                {canReject && (
                  <button
                    onClick={handleReject}
                    disabled={updateStatus.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-red text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                )}
              </>
            )}
            {order.status === "dispatched" && canComplete && (
              <button
                onClick={() => handleStatusChange("completed")}
                disabled={updateStatus.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-green text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Complete
              </button>
            )}
          </div>

          {/* Chat / Messages */}
          <div className="mt-8 pt-6 border-t border-border no-print">
            <OrderMessagesChat orderId={orderId} />
          </div>
        </div>

        {/* Receipt Print Only */}
        <div className="receipt-print-only font-mono text-[10px] leading-tight text-black">
            <div className="text-center font-bold text-sm mb-2 pb-2 border-b border-black border-dashed">
              OM ENTERPRISES
            </div>
            
            <div className="mb-3 space-y-1">
              <div className="flex justify-between">
                <span>Order No:</span>
                <span className="font-bold">{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formatDate(order.created_at)}</span>
              </div>
            </div>

            <div className="mb-3 space-y-1 border-t border-b border-black border-dashed py-2">
              <div className="font-bold">Customer Details:</div>
              <div className="font-semibold">{order.party?.account_name || order.party_name}</div>
              
              {order.party && (order.party.address || order.party.city || order.party.state || order.party.pin_code) && (
                <div>
                  {[order.party.address, order.party.city, order.party.state, order.party.pin_code]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              )}

              {order.party?.phone1 && <div>Ph: {order.party.phone1}</div>}

              {order.party && (order.party.delivery_city || order.party.transport) && (
                <div className="mt-1 pt-1 border-t border-black border-dashed">
                  <div className="font-bold">Shipping:</div>
                  {order.party.delivery_city && <div>City: {order.party.delivery_city}</div>}
                  {order.party.transport && <div>Transport: {order.party.transport}</div>}
                </div>
              )}

              {order.agent_name && (
                <div className="mt-1 pt-1 border-t border-black border-dashed">
                  Agent: {order.agent_name}
                </div>
              )}
            </div>

            <div className="mb-2">
              <div className="flex justify-between font-bold border-b border-black mb-1 pb-1">
                <span>Item</span>
                <span>Qty</span>
              </div>
              {visibleItems.map((item) => (
                <div key={item.id} className="mb-1">
                  <div className="flex justify-between">
                    <span className="pr-2 whitespace-pre-wrap">{item.product_name}</span>
                    <span className="whitespace-nowrap">{item.quantity}</span>
                  </div>
                  {item.note && (
                     <div className="text-[9px] italic mt-0.5">- Color: {item.note}</div>
                  )}
                  {item.image_url && (
                    <div className="text-[9px] italic mt-0.5">- [Image Attached]</div>
                  )}
                </div>
              ))}
              <div className="flex justify-between font-bold border-t border-black mt-2 pt-1">
                <span>Total Items</span>
                <span>{visibleItems.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}</span>
              </div>
            </div>



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
    </Drawer>
  );
}
