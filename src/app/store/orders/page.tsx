"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useAgentOrders, useOrders, usePartyOrders } from "@/lib/hooks";
import Link from "next/link";
import { FileText, Loader2, Package, Check, Truck, XCircle } from "lucide-react";
import type { Order } from "@/types/database";

type OrderStatusType = "pending" | "accepted" | "dispatched" | "completed" | "rejected";

const STATUS_CONFIG: Record<OrderStatusType, { label: string; badgeClass: string }> = {
  pending: { label: "Pending", badgeClass: "bg-amber-light text-amber" },
  accepted: { label: "Accepted", badgeClass: "bg-blue/10 text-blue" },
  dispatched: { label: "Dispatched", badgeClass: "bg-purple/10 text-purple" },
  completed: { label: "Completed", badgeClass: "bg-green-light text-green" },
  rejected: { label: "Rejected", badgeClass: "bg-red-light text-red" },
};

const STEPS = ["pending", "accepted", "dispatched", "completed"] as const;

function OrderStatusStepper({ status }: { status: OrderStatusType }) {
  const isRejected = status === "rejected";

  // Find the index of the current status in the normal flow
  const currentIndex = isRejected
    ? STEPS.indexOf("pending") // rejected stops at pending
    : STEPS.indexOf(status as typeof STEPS[number]);

  return (
    <div className="flex items-center w-full mt-4 mb-2 px-2">
      {STEPS.map((step, index) => {
        const isCompleted = !isRejected && index <= currentIndex;
        const isCurrent = !isRejected && index === currentIndex;
        // If rejected, show the rejected indicator at the first step
        const isRejectedStep = isRejected && index === 0;
        const isFuture = !isCompleted && !isRejectedStep;

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  isRejectedStep
                    ? "bg-red text-white"
                    : isCompleted
                    ? "bg-green text-white"
                    : "bg-surface border-2 border-border text-text-muted"
                } ${isCurrent ? "ring-2 ring-green/30 ring-offset-2" : ""}`}
              >
                {isRejectedStep ? (
                  <XCircle className="w-4 h-4" />
                ) : isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : step === "dispatched" ? (
                  <Truck className="w-3.5 h-3.5" />
                ) : step === "completed" ? (
                  <Package className="w-3.5 h-3.5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1.5 font-medium whitespace-nowrap ${
                  isRejectedStep
                    ? "text-red"
                    : isCompleted
                    ? "text-green"
                    : "text-text-muted"
                }`}
              >
                {isRejectedStep ? "Rejected" : step.charAt(0).toUpperCase() + step.slice(1)}
              </span>
            </div>

            {/* Connector line (not after last step) */}
            {index < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1.5 rounded-full mt-[-16px] ${
                  !isRejected && index < currentIndex
                    ? "bg-green"
                    : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function StoreOrdersPage() {
  const { role, agent, party } = useAuthStore();
  
  // If admin, they see all orders. If agent, they see their orders. If party, they see their orders.
  const { data: agentOrders, isLoading: isAgentLoading } = useAgentOrders(agent?.id || "");
  const { data: allOrders, isLoading: isAllLoading } = useOrders();
  const { data: partyOrders, isLoading: isPartyLoading } = usePartyOrders(party?.id || "");
  
  const isLoading = role === "admin" ? isAllLoading : role === "party" ? isPartyLoading : isAgentLoading;
  const orders = role === "admin" ? allOrders : role === "party" ? partyOrders : agentOrders;

  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-background">
        <div className="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-text-muted" />
        </div>
        <h2 className="text-xl font-bold mb-2">Not Logged In</h2>
        <p className="text-sm text-text-muted mb-6 max-w-sm">
          Please log in to view orders.
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
            {role === "admin" ? "All Orders" : "My Orders"}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Track the status of your orders
          </p>
        </div>
        {(role === "agent" || role === "party") && (
          <Link
            href="/store"
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            New Order
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="text-center bg-surface border border-border rounded-xl p-12">
          <FileText className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="font-medium text-text-primary">No orders found</p>
          <p className="text-sm text-text-muted mt-1">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/store"
            className="inline-block mt-4 text-sm font-medium text-primary hover:underline"
          >
            Go to Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: Order) => {
            const status = (order.status || "pending") as OrderStatusType;
            const config = STATUS_CONFIG[status];

            return (
              <div key={order.id} className="bg-surface border border-border rounded-xl p-5 shadow-sm">
                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4 mb-2">
                  <div>
                    <h3 className="font-semibold text-lg text-text-primary">{order.order_number}</h3>
                    <p className="text-sm font-medium text-text-primary mt-1">
                      Party: <span className="font-bold">{order.party_name}</span>
                    </p>
                    <p className="text-sm text-text-muted mt-0.5">
                      {new Date(order.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full mt-1 ${config.badgeClass}`}
                    >
                      {config.label}
                    </span>
                  </div>
                </div>

                {/* Status stepper */}
                <OrderStatusStepper status={status} />

                {/* Rejected admin notes */}
                {status === "rejected" && order.admin_notes && (
                  <div className="mt-3 bg-red-light rounded-lg px-4 py-3">
                    <p className="text-xs font-semibold text-red mb-1">Reason for rejection</p>
                    <p className="text-sm text-red">{order.admin_notes}</p>
                  </div>
                )}

                {/* Items */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-text-muted mb-2">Items</h4>
                  <div className="space-y-2">
                    {order.items?.map((item) => (
                      <div key={item.product_id} className="flex justify-between text-sm">
                        <span className="text-text-primary flex flex-col">
                          <span>{item.quantity} × {item.product_name}</span>
                          {/* @ts-ignore */}
                          {item.products?.sku_name && (
                            <span className="text-xs text-text-muted">{item.products.sku_name}</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
