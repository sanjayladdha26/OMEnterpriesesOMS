"use client";

import { Hash, RotateCcw, Loader2, AlertTriangle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings, useSupabase } from "@/lib/hooks";
import toast from "react-hot-toast";

// ── Popup component ─────────────────────────────────────────

function LowerNumberWarningModal({
  latestNum,
  enteredNum,
  year,
  onClose,
}: {
  latestNum: number;
  enteredNum: number;
  year: number;
  onClose: () => void;
}) {
  const fmt = (n: number) => `INV-${year}-${String(n).padStart(3, "0")}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-xl border border-border w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(234,179,8,0.12)" }}
            >
              <AlertTriangle className="w-5 h-5" style={{ color: "#ca8a04" }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Can't Go That Low</h3>
              <p className="text-xs text-text-muted mt-0.5">Invoice number conflict</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-hover transition-colors text-text-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 space-y-4">
          <p className="text-sm text-text-primary leading-relaxed">
            Your last issued invoice was{" "}
            <span className="font-mono font-semibold text-primary">{fmt(latestNum)}</span>.
            Setting the starting number to{" "}
            <span className="font-mono font-semibold" style={{ color: "#dc2626" }}>
              {fmt(enteredNum)}
            </span>{" "}
            would create duplicate invoice numbers.
          </p>

          {/* Visual rule */}
          <div
            className="rounded-xl p-4 space-y-2"
            style={{ backgroundColor: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.25)" }}
          >
            <p className="text-xs font-medium" style={{ color: "#92400e" }}>
              Rule enforced by the system
            </p>
            <p className="text-xs text-text-muted leading-relaxed">
              The next invoice number is always{" "}
              <strong>max(your starting number, last invoice + 1)</strong>. To
              get invoice <span className="font-mono">{fmt(enteredNum)}</span>, you
              would need to delete all invoices from{" "}
              <span className="font-mono">{fmt(enteredNum)}</span> onwards first.
            </p>
          </div>

          {/* Suggestion */}
          <div className="rounded-xl border border-border px-4 py-3 flex items-center gap-3">
            <div>
              <p className="text-xs text-text-muted">Earliest allowed starting number</p>
              <p className="text-sm font-semibold font-mono text-primary mt-0.5">
                {fmt(latestNum + 1)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-dark transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main card ───────────────────────────────────────────────

export function InvoiceNumberCard() {
  const { data: settings, isLoading } = useSettings();
  const { mutate: updateSettings, isPending } = useUpdateSettings();
  const supabase = useSupabase();

  const [isClient, setIsClient] = useState(false);
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState<number>(1);
  const [latestBillNum, setLatestBillNum] = useState<number>(0);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch latest bill number once when entering edit mode
  useEffect(() => {
    if (!editing) return;
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    supabase
      .from("bills")
      .select("bill_number")
      .like("bill_number", `${prefix}%`)
      .order("bill_number", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const n = parseInt(data[0].bill_number.replace(prefix, ""), 10);
          if (!isNaN(n)) setLatestBillNum(n);
        }
      });
  }, [editing, supabase]);

  useEffect(() => {
    if (settings?.invoice_start_number !== undefined && !editing) {
      setLocalValue(settings.invoice_start_number);
    }
  }, [settings?.invoice_start_number, editing]);

  const currentStart = settings?.invoice_start_number ?? 1;
  const year = new Date().getFullYear();
  // Effective next number respects the same rule as the hook
  const effectiveNext = latestBillNum > 0
    ? Math.max(localValue, latestBillNum + 1)
    : localValue;
  const previewNumber = `INV-${year}-${String(effectiveNext).padStart(3, "0")}`;

  const handleSave = () => {
    if (localValue < 1) {
      toast.error("Starting number must be at least 1");
      return;
    }
    // Show popup if user entered a number that would be overridden
    if (latestBillNum > 0 && localValue <= latestBillNum) {
      setShowWarning(true);
      return;
    }
    updateSettings(
      { id: settings?.id, invoice_start_number: localValue },
      {
        onSuccess: () => {
          toast.success("Invoice counter updated");
          setEditing(false);
        },
        onError: (err) => {
          console.error("Failed to save invoice start number:", err);
          toast.error(err instanceof Error ? err.message : "Failed to update");
        },
      }
    );
  };

  const handleCancel = () => {
    setLocalValue(currentStart);
    setEditing(false);
  };

  if (!isClient || isLoading) return null;

  return (
    <>
      {showWarning && (
        <LowerNumberWarningModal
          latestNum={latestBillNum}
          enteredNum={localValue}
          year={year}
          onClose={() => setShowWarning(false)}
        />
      )}

      <div className="bg-surface border border-border rounded-xl shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <Hash className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Invoice Number</h3>
              <p className="text-xs text-text-muted mt-0.5">Set the starting invoice number</p>
            </div>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary-50 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-hover rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-60"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-text-muted block mb-1">
              Starting Invoice Number
            </label>
            {editing ? (
              <input
                id="invoice-start-number"
                type="number"
                min={1}
                value={localValue}
                onChange={(e) => setLocalValue(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                placeholder="e.g. 1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
              />
            ) : (
              <p className="text-sm font-medium text-text-primary">{currentStart}</p>
            )}
          </div>

          {/* Preview */}
          <div className="rounded-lg bg-surface-hover border border-border px-4 py-3">
            <p className="text-xs text-text-muted mb-1">Next invoice will be</p>
            <p className="text-sm font-semibold text-text-primary font-mono">{previewNumber}</p>
            {editing && latestBillNum > 0 && localValue <= latestBillNum && (
              <p className="text-xs mt-1.5" style={{ color: "#ca8a04" }}>
                ⚠️ Overridden — last issued was #{latestBillNum}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
