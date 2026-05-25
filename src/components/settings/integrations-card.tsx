"use client";

import { useState, useRef, useEffect } from "react";
import { Plug, Printer, MessageCircle, Bell } from "lucide-react";
import { useSettings, useUpdateSettings } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface ToggleProps {
  enabled: boolean;
  onToggle: (newVal: boolean) => void;
  disabled?: boolean;
}

function Toggle({ enabled, onToggle, disabled }: ToggleProps) {
  return (
    <button
      onClick={() => {
        if (!disabled) onToggle(!enabled);
      }}
      disabled={disabled}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors duration-300",
        enabled ? "bg-primary" : "bg-gray-300",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div
        className={cn(
          "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300",
          enabled ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

export function IntegrationsCard() {
  const { data: dbSettings } = useSettings();
  const { mutate: updateSettings, isPending } = useUpdateSettings();

  const [printerEnabled, setPrinterEnabled] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  
  const initialized = useRef(false);

  useEffect(() => {
    if (dbSettings && !initialized.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrinterEnabled(dbSettings.printer_enabled);
      setWhatsappEnabled(dbSettings.whatsapp_enabled);
      setWhatsappNumber(dbSettings.whatsapp_number);
      setLowStockThreshold(dbSettings.low_stock_threshold);
      initialized.current = true;
    }
  }, [dbSettings]);

  const handleUpdate = (updates: any) => {
    updateSettings(
      { id: dbSettings?.id, ...updates },
      {
        onSuccess: () => {
          toast.success("Settings updated");
        },
        onError: () => {
          toast.error("Failed to update settings");
          // Revert local state on error
          if (dbSettings) {
            setPrinterEnabled(dbSettings.printer_enabled);
            setWhatsappEnabled(dbSettings.whatsapp_enabled);
            setWhatsappNumber(dbSettings.whatsapp_number);
            setLowStockThreshold(dbSettings.low_stock_threshold);
          }
        }
      }
    );
  };

  return (
    <div className="bg-surface border border-border rounded-xl shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
          <Plug className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-text-primary">Integrations</h3>
      </div>

      <div className="divide-y divide-border">
        {/* Thermal Printer */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Printer className="w-5 h-5 text-text-muted" />
              <div>
                <p className="text-sm font-medium text-text-primary">Thermal Printer</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {printerEnabled ? (
                    <span className="text-green flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green inline-block" />
                      Connected
                    </span>
                  ) : (
                    <span className="text-text-light">Disconnected</span>
                  )}
                </p>
              </div>
            </div>
            <Toggle 
              enabled={printerEnabled} 
              disabled={isPending}
              onToggle={(val) => {
                setPrinterEnabled(val);
                handleUpdate({ printer_enabled: val });
              }} 
            />
          </div>
        </div>

        {/* WhatsApp */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-text-muted" />
              <div>
                <p className="text-sm font-medium text-text-primary">WhatsApp Billing</p>
                <p className="text-xs text-text-muted mt-0.5">Send bills via WhatsApp</p>
              </div>
            </div>
            <Toggle 
              enabled={whatsappEnabled} 
              disabled={isPending}
              onToggle={(val) => {
                setWhatsappEnabled(val);
                handleUpdate({ whatsapp_enabled: val });
              }} 
            />
          </div>
          {whatsappEnabled && (
            <div className="ml-8 mt-2">
              <label className="text-xs text-text-muted block mb-1">WhatsApp Number</label>
              <input
                type="tel"
                value={whatsappNumber}
                disabled={isPending}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                onBlur={() => {
                  if (whatsappNumber !== dbSettings?.whatsapp_number) {
                    handleUpdate({ whatsapp_number: whatsappNumber });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && whatsappNumber !== dbSettings?.whatsapp_number) {
                    handleUpdate({ whatsapp_number: whatsappNumber });
                  }
                }}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-5 h-5 text-text-muted" />
            <div>
              <p className="text-sm font-medium text-text-primary">Low Stock Alerts</p>
              <p className="text-xs text-text-muted mt-0.5">
                Alert when stock falls below threshold
              </p>
            </div>
          </div>
          <div className="ml-8 mt-2">
            <label className="text-xs text-text-muted block mb-1">
              Threshold (units)
            </label>
            <input
              type="number"
              value={lowStockThreshold}
              disabled={isPending}
              onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
              onBlur={() => {
                if (lowStockThreshold !== dbSettings?.low_stock_threshold) {
                  handleUpdate({ low_stock_threshold: lowStockThreshold });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && lowStockThreshold !== dbSettings?.low_stock_threshold) {
                  handleUpdate({ low_stock_threshold: lowStockThreshold });
                }
              }}
              className="w-32 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
            <p className="text-xs text-text-muted mt-1">
              Currently set to <span className="font-medium text-text-primary">{lowStockThreshold}</span> units
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
