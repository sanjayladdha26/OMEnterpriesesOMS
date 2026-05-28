"use client";

import { useState, useMemo } from "react";
import {
  FileText,
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  Eye,
  Check,
  Truck,
  CheckCircle2,
  XCircle,
  Trash2,
  Package,
} from "lucide-react";
import {
  useOrders,
  useUpdateOrderStatus,
  useDeleteOrder,
  useOrderDetails,
} from "@/lib/hooks";
import { formatDate, formatINR, cn } from "@/lib/utils";
import type { OrderStatus, Order } from "@/types/database";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/auth-store";
import { Drawer } from "@/components/ui/drawer";

/* ── Status badge config ─────────────────────────────────── */

const statusBadge: Record<OrderStatus, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-amber-light text-amber" },
  accepted: { label: "Accepted", cls: "bg-blue/10 text-blue" },
  dispatched: { label: "Dispatched", cls: "bg-purple/10 text-purple" },
  completed: { label: "Completed", cls: "bg-green-light text-green" },
  rejected: { label: "Rejected", cls: "bg-red-light text-red" },
};

const statusTabs: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "dispatched", label: "Dispatched" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

type DateRange = "all" | "today" | "week" | "month" | "custom";

const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "custom", label: "Custom Range" },
];

/* ── Helpers ─────────────────────────────────────────────── */

function getDateRangeFilter(
  range: DateRange,
  customFrom: string,
  customTo: string
): { from: Date | null; to: Date | null } {
  const now = new Date();
  switch (range) {
    case "today": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { from: start, to: end };
    }
    case "week": {
      const day = now.getDay();
      const start = new Date(now);
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      return { from: start, to: now };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: start, to: now };
    }
    case "custom": {
      return {
        from: customFrom ? new Date(customFrom) : null,
        to: customTo ? new Date(customTo + "T23:59:59") : null,
      };
    }
    default:
      return { from: null, to: null };
  }
}

/* ── Skeleton row ────────────────────────────────────────── */

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-4 py-3">
            <div className="h-4 bg-border rounded w-24" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 bg-border rounded w-20" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 bg-border rounded w-28" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 bg-border rounded w-24" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 bg-border rounded w-10" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 bg-border rounded w-16" />
          </td>
          <td className="px-4 py-3">
            <div className="h-5 bg-border rounded-full w-20" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 bg-border rounded w-20" />
          </td>
        </tr>
      ))}
    </>
  );
}

function SkeletonCards() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-surface border border-border rounded-xl p-4 animate-pulse space-y-3"
        >
          <div className="flex justify-between">
            <div className="h-4 bg-border rounded w-28" />
            <div className="h-5 bg-border rounded-full w-20" />
          </div>
          <div className="h-4 bg-border rounded w-36" />
          <div className="h-4 bg-border rounded w-24" />
          <div className="flex justify-between">
            <div className="h-4 bg-border rounded w-16" />
            <div className="h-4 bg-border rounded w-20" />
          </div>
        </div>
      ))}
    </>
  );
}

/* ── Status Badge Component ──────────────────────────────── */

function StatusBadge({ status }: { status: OrderStatus }) {
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

/* ── Order Detail Drawer ─────────────────────────────────── */

function OrderDetailDrawer({
  orderId,
  open,
  onClose,
}: {
  orderId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data: order, isLoading } = useOrderDetails(orderId);
  const updateStatus = useUpdateOrderStatus();

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

          {/* Customer info */}
          <div className="bg-surface-hover rounded-xl p-4 space-y-1">
            <p className="text-sm font-medium text-text-primary">
              {order.customer_name}
            </p>
            {order.customer_phone && (
              <p className="text-sm text-text-muted">{order.customer_phone}</p>
            )}
            {order.customers?.school_name && (
              <p className="text-sm text-text-muted">🏫 {order.customers.school_name}</p>
            )}
            {order.customers?.address && (
              <p className="text-sm text-text-muted">📍 {order.customers.address}</p>
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
                    <th className="text-right px-3 py-2 text-text-muted font-medium">
                      Price
                    </th>
                    <th className="text-right px-3 py-2 text-text-muted font-medium">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-3 py-2 text-text-primary">
                        <div>{item.product_name}</div>
                        <div className="text-xs text-text-muted">{item.unit}</div>
                      </td>
                      <td className="px-3 py-2 text-right text-text-primary">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-2 text-right text-text-muted">
                        {formatINR(item.unit_price)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-text-primary">
                        {formatINR(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-semibold text-text-primary">Total</span>
            <span className="text-lg font-bold text-text-primary">
              {formatINR(order.total)}
            </span>
          </div>

          {/* Admin notes */}
          {order.admin_notes && (
            <div className="bg-amber-light rounded-xl p-4">
              <p className="text-xs font-medium text-amber mb-1">Admin Notes</p>
              <p className="text-sm text-text-primary">{order.admin_notes}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            {order.status === "pending" && (
              <>
                <button
                  onClick={() => handleStatusChange("accepted")}
                  disabled={updateStatus.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-blue text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Accept
                </button>
                <button
                  onClick={handleReject}
                  disabled={updateStatus.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-red text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </>
            )}
            {order.status === "accepted" && (
              <>
                <button
                  onClick={() => handleStatusChange("dispatched")}
                  disabled={updateStatus.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-purple text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Truck className="w-4 h-4" />
                  Dispatch
                </button>
                <button
                  onClick={handleReject}
                  disabled={updateStatus.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-red text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </>
            )}
            {order.status === "dispatched" && (
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
        </div>
      )}
    </Drawer>
  );
}

/* ── Main Page ───────────────────────────────────────────── */

export default function AdminOrdersPage() {
  const role = useAuthStore((state) => state.role);
  const isAdmin = role === "admin";

  const { data: orders, isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();

  // Filters
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Drawer
  const [drawerOrderId, setDrawerOrderId] = useState<string | null>(null);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    let result = [...orders];

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q)
      );
    }

    // Date range filter
    const { from, to } = getDateRangeFilter(dateRange, customFrom, customTo);
    if (from) {
      result = result.filter((o) => new Date(o.created_at) >= from);
    }
    if (to) {
      result = result.filter((o) => new Date(o.created_at) <= to);
    }

    return result;
  }, [orders, statusFilter, searchQuery, dateRange, customFrom, customTo]);

  // Action handlers
  const handleStatusChange = async (
    orderId: string,
    status: OrderStatus,
    adminNotes?: string
  ) => {
    try {
      await updateStatus.mutateAsync({ orderId, status, adminNotes });
      toast.success(`Order ${status}`);
    } catch {
      toast.error("Failed to update order status");
    }
  };

  const handleReject = (orderId: string) => {
    const notes = window.prompt("Reason for rejection (optional):");
    if (notes === null) return; // cancelled
    handleStatusChange(orderId, "rejected", notes || undefined);
  };

  const handleDelete = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      await deleteOrder.mutateAsync(orderId);
      toast.success("Order deleted");
    } catch {
      toast.error("Failed to delete order");
    }
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Order Management</h1>
        <p className="text-xs text-text-muted mt-0.5">
          Manage and track customer orders
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
              statusFilter === tab.value
                ? "bg-primary text-white"
                : "text-text-muted hover:bg-surface-hover"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order # or customer..."
            className="w-full pl-10 pr-9 py-2.5 border border-border rounded-xl bg-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-medium transition-colors",
            showFilters
              ? "bg-primary text-white border-primary"
              : "bg-surface text-text-muted hover:bg-surface-hover"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Date range filter panel */}
      {showFilters && (
        <div className="bg-surface border border-border rounded-xl p-4 mb-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
            <SlidersHorizontal className="w-4 h-4" />
            Date Range
          </div>
          <div className="flex flex-wrap gap-2">
            {dateRangeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  dateRange === opt.value
                    ? "bg-primary text-white"
                    : "bg-surface-hover text-text-muted hover:text-text-primary"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {dateRange === "custom" && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="flex-1">
                <label className="text-xs text-text-muted mb-1 block">From</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-text-muted mb-1 block">To</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results count */}
      {!isLoading && (
        <p className="text-xs text-text-muted mb-3">
          {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}{" "}
          found
        </p>
      )}

      {/* ── Desktop Table ────────────────────────────────── */}
      <div className="hidden lg:block bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-hover border-b border-border">
                <th className="text-left px-4 py-3 text-text-muted font-medium">
                  Order #
                </th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">
                  Customer
                </th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">
                  Phone
                </th>
                <th className="text-center px-4 py-3 text-text-muted font-medium">
                  Items
                </th>
                <th className="text-right px-4 py-3 text-text-muted font-medium">
                  Total
                </th>
                <th className="text-center px-4 py-3 text-text-muted font-medium">
                  Status
                </th>
                <th className="text-center px-4 py-3 text-text-muted font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows />
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-surface-hover flex items-center justify-center">
                        <FileText className="w-6 h-6 text-text-muted" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          No orders found
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {searchQuery || statusFilter !== "all"
                            ? "Try adjusting your filters"
                            : "Orders will appear here when customers place them"}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-4 py-3 text-text-primary">
                      {order.customer_name}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {order.customer_phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-text-muted">
                      {order.items?.length ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-text-primary">
                      {formatINR(order.total)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {/* View */}
                        <button
                          onClick={() => setDrawerOrderId(order.id)}
                          className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Accept */}
                        {order.status === "pending" && (
                          <button
                            onClick={() =>
                              handleStatusChange(order.id, "accepted")
                            }
                            className="p-1.5 rounded-lg hover:bg-blue/10 text-blue transition-colors"
                            title="Accept"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}

                        {/* Dispatch */}
                        {order.status === "accepted" && (
                          <button
                            onClick={() =>
                              handleStatusChange(order.id, "dispatched")
                            }
                            className="p-1.5 rounded-lg hover:bg-purple/10 text-purple transition-colors"
                            title="Dispatch"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}

                        {/* Complete */}
                        {order.status === "dispatched" && (
                          <button
                            onClick={() =>
                              handleStatusChange(order.id, "completed")
                            }
                            className="p-1.5 rounded-lg hover:bg-green-light text-green transition-colors"
                            title="Complete"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Reject */}
                        {(order.status === "pending" ||
                          order.status === "accepted") && (
                          <button
                            onClick={() => handleReject(order.id)}
                            className="p-1.5 rounded-lg hover:bg-red-light text-red transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete (admin only) */}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="p-1.5 rounded-lg hover:bg-red-light text-red transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile Cards ─────────────────────────────────── */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          <SkeletonCards />
        ) : filteredOrders.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-8 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-hover flex items-center justify-center">
              <FileText className="w-6 h-6 text-text-muted" />
            </div>
            <p className="text-sm font-medium text-text-primary">
              No orders found
            </p>
            <p className="text-xs text-text-muted text-center">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Orders will appear here when customers place them"}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-surface border border-border rounded-xl p-4 space-y-3"
            >
              {/* Top row: order number + status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text-primary">
                  {order.order_number}
                </span>
                <StatusBadge status={order.status} />
              </div>

              {/* Customer & date */}
              <div className="space-y-1">
                <p className="text-sm text-text-primary">
                  {order.customer_name}
                </p>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span>{formatDate(order.created_at)}</span>
                  {order.customer_phone && <span>{order.customer_phone}</span>}
                </div>
              </div>

              {/* Items & total */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs text-text-muted">
                  {order.items?.length ?? 0} item
                  {(order.items?.length ?? 0) !== 1 ? "s" : ""}
                </span>
                <span className="text-sm font-bold text-text-primary">
                  {formatINR(order.total)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 pt-2 border-t border-border">
                <button
                  onClick={() => setDrawerOrderId(order.id)}
                  className="p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
                  title="View details"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {order.status === "pending" && (
                  <button
                    onClick={() => handleStatusChange(order.id, "accepted")}
                    className="p-2 rounded-lg hover:bg-blue/10 text-blue transition-colors"
                    title="Accept"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}

                {order.status === "accepted" && (
                  <button
                    onClick={() => handleStatusChange(order.id, "dispatched")}
                    className="p-2 rounded-lg hover:bg-purple/10 text-purple transition-colors"
                    title="Dispatch"
                  >
                    <Truck className="w-4 h-4" />
                  </button>
                )}

                {order.status === "dispatched" && (
                  <button
                    onClick={() => handleStatusChange(order.id, "completed")}
                    className="p-2 rounded-lg hover:bg-green-light text-green transition-colors"
                    title="Complete"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}

                {(order.status === "pending" ||
                  order.status === "accepted") && (
                  <button
                    onClick={() => handleReject(order.id)}
                    className="p-2 rounded-lg hover:bg-red-light text-red transition-colors"
                    title="Reject"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}

                {isAdmin && (
                  <button
                    onClick={() => handleDelete(order.id)}
                    className="p-2 rounded-lg hover:bg-red-light text-red transition-colors ml-auto"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order detail drawer */}
      <OrderDetailDrawer
        orderId={drawerOrderId}
        open={!!drawerOrderId}
        onClose={() => setDrawerOrderId(null)}
      />
    </div>
  );
}
