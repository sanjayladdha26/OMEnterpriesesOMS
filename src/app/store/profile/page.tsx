"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCustomerProfileStore } from "@/stores/customer-profile-store";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { customerId: initialCustomerId, name: initialName, phone: initialPhone, setProfile } = useCustomerProfileStore();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Need to use effect because zustand persist hydratation might delay
  useEffect(() => {
    setName(initialName);
    setPhone(initialPhone);
  }, [initialName, initialPhone]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    
    setSaving(true);
    setError("");
    const supabase = createClient();
    
    try {
      let custId = "";
      
      // 1. Search for existing customer
      const { data: existing, error: searchError } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", phone)
        .limit(1)
        .maybeSingle();
        
      if (searchError) throw searchError;
      
      if (existing) {
        custId = existing.id;
        // Optionally update name if it changed
        await supabase.from("customers").update({ name }).eq("id", custId);
      } else {
        // 2. Create new customer
        const { data: newCust, error: insertError } = await supabase
          .from("customers")
          .insert({ name, phone, address: "" })
          .select("id")
          .single();
          
        if (insertError) throw insertError;
        custId = newCust.id;
      }
      
      // 3. Save to local store
      setProfile(custId, name, phone);
      router.push("/store");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to process profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-4 md:p-6 lg:p-8">
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
        <h1 className="text-xl font-bold mb-2">Your Profile</h1>
        <p className="text-sm text-text-muted mb-6">
          Please provide your details so we can link your orders.
        </p>
        
        {error && (
          <div className="bg-red-light text-red-dark text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary disabled:opacity-50"
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={saving}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary disabled:opacity-50"
              placeholder="e.g. 9876543210"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center disabled:opacity-70"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              "Save & Continue to Store"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
