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
        <div className="receipt-print-only w-full text-black font-sans text-[10px] leading-tight">
          {/* Corporate Header */}
          <div className="flex justify-between items-end border-b-2 border-primary pb-2 mb-3">
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-primary">OM ENTERPRISES</h1>
              <p className="text-[9px] text-text-muted mt-0.5 font-semibold">Order Management System | Premium Textiles & Fabrics</p>
            </div>
            <div className="text-right">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Order Confirmation</h2>
              <p className="text-[10px] font-semibold text-primary">Order #: {order.order_number} | Date: {formatDate(order.created_at)}</p>
            </div>
          </div>

          {/* Unified Metadata Box (3 Columns) */}
          <div className="border border-gray-300 rounded-xl p-3 bg-gray-50/50 grid grid-cols-3 gap-4 mb-4">
            {/* Col 1: Customer */}
            <div className="space-y-1">
              <h3 className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Customer</h3>
              <p className="font-bold text-gray-800 leading-snug">{order.party?.account_name || order.party_name}</p>
              {order.party?.phone1 && (
                <p className="text-gray-600"><span className="font-semibold">Ph:</span> {order.party.phone1}</p>
              )}
              {order.party?.gstin && (
                <p className="text-gray-600"><span className="font-semibold">GSTIN:</span> {order.party.gstin}</p>
              )}
            </div>

            {/* Col 2: Address */}
            <div className="space-y-1 col-span-1 border-l border-gray-200 pl-3">
              <h3 className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Billing Address</h3>
              <p className="text-gray-700 leading-normal">
                {order.party ? (
                  [order.party.address, order.party.city, order.party.state, order.party.pin_code]
                    .filter(Boolean)
                    .join(", ")
                ) : "—"}
              </p>
            </div>

            {/* Col 3: Agent Info */}
            <div className="space-y-1 border-l border-gray-200 pl-3 flex flex-col justify-center">
              {order.agent_name && (
                <p className="text-gray-800 font-semibold">Agent: {order.agent_name}</p>
              )}
            </div>
          </div>

          {/* Items Table with clean corporate styling and proper borders */}
          <div className="mb-4">
            <table className="w-full border-collapse border border-gray-300 text-[10px]">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="border-r border-gray-300 px-2.5 py-1.5 text-left font-bold text-gray-700 w-10">S.No.</th>
                  <th className="border-r border-gray-300 px-2.5 py-1.5 text-left font-bold text-gray-700">Product / Fabric Name</th>
                  <th className="border-r border-gray-300 px-2.5 py-1.5 text-left font-bold text-gray-700">Specifications / Notes</th>
                  <th className="px-2.5 py-1.5 text-right font-bold text-gray-700 w-24">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-300 last:border-b-2 last:border-b-gray-800">
                    <td className="border-r border-gray-300 px-2.5 py-1.5 text-center text-gray-800">{index + 1}</td>
                    <td className="border-r border-gray-300 px-2.5 py-1.5 font-medium text-gray-800">
                      {item.product_name}
                      {(item as any).products?.sku_name && (
                        <span className="text-[8px] text-text-muted block font-normal">{(item as any).products.sku_name}</span>
                      )}
                    </td>
                    <td className="border-r border-gray-300 px-2.5 py-1.5 text-gray-600 italic">
                      {item.note ? `Color: ${item.note}` : "—"}
                    </td>
                    <td className="px-2.5 py-1.5 text-right font-semibold text-gray-800">
                      {item.quantity} mtrs
                    </td>
                  </tr>
                ))}
                {/* Summary Rows */}
                <tr className="bg-gray-50/50">
                  <td colSpan={3} className="border-r border-gray-300 px-2.5 py-1 text-right font-bold text-gray-600 uppercase text-[8px] tracking-wider">
                    Total Unique Items
                  </td>
                  <td className="px-2.5 py-1 text-right font-bold text-gray-800">
                    {visibleItems.length} {visibleItems.length === 1 ? "Product" : "Products"}
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td colSpan={3} className="border-r border-gray-300 px-2.5 py-1 text-right font-bold text-primary uppercase text-[8px] tracking-wider">
                    Total Fabric Quantity
                  </td>
                  <td className="px-2.5 py-1 text-right font-extrabold text-primary">
                    {visibleItems.reduce((sum, item) => sum + (item.quantity || 0), 0).toFixed(2).replace(/\.?0+$/, "")} mtrs
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Sign-off section / Signatures */}
          <div className="grid grid-cols-3 gap-6 mt-6 pt-4">
            <div className="text-center">
              <div className="border-t border-gray-400 pt-1 text-[9px] text-gray-500 font-medium">
                Prepared By
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 pt-1 text-[9px] text-gray-500 font-medium">
                Authorized Signatory
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 pt-1 text-[9px] text-gray-500 font-medium">
                Customer's Acknowledgment
              </div>
            </div>
          </div>

          {/* Footer branding */}
          <div className="mt-6 pt-2 border-t border-gray-200 flex justify-between items-center text-[8px] text-gray-400">
            <div>
              <span className="italic">Computer generated order confirmation</span>
            </div>
            <div className="font-medium">
              powered by <span className="font-bold text-gray-500">MudraOMS</span>
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
