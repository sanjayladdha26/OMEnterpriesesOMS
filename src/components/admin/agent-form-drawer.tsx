"use client";

import { useState, useEffect } from "react";
import { Drawer } from "@/components/ui/drawer";
import { useUIStore } from "@/stores/ui-store";
import { useSupabase } from "@/lib/hooks";
import type { Agent } from "@/types/database";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export function AgentFormDrawer() {
  const { drawerOpen, drawerContent, drawerData, closeDrawer } = useUIStore();
  const isOpen = drawerOpen && (drawerContent === "add-agent" || drawerContent === "edit-agent");
  const isEdit = drawerContent === "edit-agent";
  const agent = drawerData?.agent as unknown as Agent | undefined;

  const supabase = useSupabase();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit && agent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(agent.name);
      setCode(agent.code);
      setPhone(agent.phone || "");
    } else if (!isEdit) {
      setName("");
      setCode("");
      setPhone("");
    }
  }, [isEdit, agent]);

  const handleSave = async () => {
    if (!name || !code) return;
    setIsSubmitting(true);
    const toastId = toast.loading(isEdit ? "Updating agent..." : "Saving agent...");
    try {
      const payload = {
        name: name.trim(),
        code: code.trim(),
        phone: phone.trim() || null,
      };

      if (isEdit && agent?.id) {
        const { error } = await supabase.from("agents").update(payload).eq("id", agent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("agents").insert([payload]);
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["agents"] });
      closeDrawer();
      toast.success(isEdit ? "Agent updated successfully." : "Agent saved successfully.", { id: toastId });
    } catch (error) {
      console.error("Error saving agent:", error);
      toast.error("Failed to save agent.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
  const labelClass = "text-sm font-medium text-text-primary block mb-1.5";

  return (
    <Drawer
      open={isOpen}
      onClose={closeDrawer}
      title={isEdit ? "Edit Agent" : "Add New Agent"}
    >
      <div className="space-y-4">
        <div>
          <label className={labelClass}>
            Agent Name <span className="text-red">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. John Doe"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Agent Code <span className="text-red">*</span>
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. AG-001"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 9876543210"
            className={inputClass}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!name || !code || isSubmitting}
          className="w-full mt-4 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "Save Changes" : "Add Agent"}
        </button>
      </div>
    </Drawer>
  );
}
