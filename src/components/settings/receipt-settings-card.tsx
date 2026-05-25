"use client";

import { ReceiptText, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { useReceiptSettingsStore } from "@/stores/receipt-settings-store";

export function ReceiptSettingsCard() {
  const store = useReceiptSettingsStore();
  const [editing, setEditing] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  const [localState, setLocalState] = useState({
    headerText: store.headerText,
    footerText: store.footerText,
    showHsn: store.showHsn,
    printWidth: store.printWidth,
  });

  // Sync when entering edit mode or when store updates
  useEffect(() => {
    if (!editing) {
      setLocalState({
        headerText: store.headerText,
        footerText: store.footerText,
        showHsn: store.showHsn,
        printWidth: store.printWidth,
      });
    }
  }, [store.headerText, store.footerText, store.showHsn, store.printWidth, editing]);

  const handleSave = () => {
    store.setHeaderText(localState.headerText);
    store.setFooterText(localState.footerText);
    store.setShowHsn(localState.showHsn);
    store.setPrintWidth(localState.printWidth);
    setEditing(false);
  };

  const inputClass =
    "w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

  if (!isClient) return null; // Avoid hydration errors

  return (
    <div className="bg-surface border border-border rounded-xl shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
            <ReceiptText className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">Receipt Layout Settings</h3>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary-50 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-hover rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Header Text */}
        <div className="sm:col-span-2">
          <label className="text-xs text-text-muted block mb-1">Receipt Header Text</label>
          {editing ? (
            <input
              type="text"
              value={localState.headerText}
              onChange={(e) => setLocalState({ ...localState, headerText: e.target.value })}
              className={inputClass}
              placeholder="e.g. Estimated Invoice"
            />
          ) : (
            <p className="text-sm font-medium text-text-primary">{store.headerText}</p>
          )}
        </div>

        {/* Footer Text */}
        <div className="sm:col-span-2">
          <label className="text-xs text-text-muted block mb-1">Receipt Footer Text</label>
          {editing ? (
            <input
              type="text"
              value={localState.footerText}
              onChange={(e) => setLocalState({ ...localState, footerText: e.target.value })}
              className={inputClass}
              placeholder="e.g. Thank you for shopping"
            />
          ) : (
            <p className="text-sm font-medium text-text-primary">{store.footerText}</p>
          )}
        </div>

        {/* Print Width */}
        <div>
          <label className="text-xs text-text-muted block mb-1">Print Width</label>
          {editing ? (
            <select
              value={localState.printWidth}
              onChange={(e) => setLocalState({ ...localState, printWidth: e.target.value })}
              className={inputClass}
            >
              <option value="300px">80mm Roll (~300px)</option>
              <option value="220px">58mm Roll (~220px)</option>
            </select>
          ) : (
            <p className="text-sm font-medium text-text-primary">
              {store.printWidth === "300px" ? "80mm Roll" : "58mm Roll"}
            </p>
          )}
        </div>

        {/* Show HSN */}
        <div>
          <label className="text-xs text-text-muted block mb-1">Show HSN Code</label>
          {editing ? (
            <label className="flex items-center gap-2 mt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={localState.showHsn}
                onChange={(e) => setLocalState({ ...localState, showHsn: e.target.checked })}
                className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
              />
              <span className="text-sm font-medium text-text-primary">Enable</span>
            </label>
          ) : (
            <p className="text-sm font-medium text-text-primary">{store.showHsn ? "Yes" : "No"}</p>
          )}
        </div>
      </div>
    </div>
  );
}
