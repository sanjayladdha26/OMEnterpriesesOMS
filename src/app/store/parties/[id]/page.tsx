"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useParty, useUpdateParty } from "@/lib/hooks";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EditPartyPage() {
  const router = useRouter();
  const params = useParams();
  const partyId = params?.id as string;
  const { role } = useAuthStore();
  const { data: party, isLoading: isPartyLoading } = useParty(partyId);
  const updateParty = useUpdateParty();

  const [formData, setFormData] = useState({
    account_name: "",
    access_code: "",
    address: "",
    city: "",
    pin_code: "",
    state: "",
    gstin: "",
    phone1: "",
    phone2: "",
    transport: "",
    delivery_city: "",
  });

  useEffect(() => {
    if (party) {
      setFormData({
        account_name: party.account_name || "",
        access_code: party.access_code || "PTY-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        address: party.address || "",
        city: party.city || "",
        pin_code: party.pin_code || "",
        state: party.state || "",
        gstin: party.gstin || "",
        phone1: party.phone1 || "",
        phone2: party.phone2 || "",
        transport: party.transport || "",
        delivery_city: party.delivery_city || "",
      });
    }
  }, [party]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_name.trim()) return;

    try {
      await updateParty.mutateAsync({
        id: partyId,
        ...formData,
      });
      router.push("/store/parties");
    } catch (error) {
      console.error("Failed to update party", error);
      alert("Failed to update party. Please try again.");
    }
  };

  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-background">
        <h2 className="text-xl font-bold mb-2">Not Logged In</h2>
        <p className="text-sm text-text-muted mb-6">Please log in to edit a party.</p>
        <Link
          href="/login"
          className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  if (isPartyLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!party) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-background">
        <h2 className="text-xl font-bold mb-2">Party Not Found</h2>
        <p className="text-sm text-text-muted mb-6">The party you are trying to edit does not exist.</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-lg hover:bg-surface text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Edit Party</h1>
          <p className="text-sm text-text-muted mt-1">Update customer or delivery details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-5 md:p-6 shadow-sm space-y-5">
        
        {/* Account Name */}
        <div>
          <label htmlFor="account_name" className="block text-sm font-medium text-text-primary mb-1">
            Account Name <span className="text-red">*</span>
          </label>
          <input
            id="account_name"
            name="account_name"
            type="text"
            required
            value={formData.account_name}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="e.g. Acme Corporation"
          />
        </div>

        {/* Access Code */}
        <div>
          <label htmlFor="access_code" className="block text-sm font-medium text-text-primary mb-1">
            Access Code <span className="text-red">*</span>
          </label>
          <input
            id="access_code"
            name="access_code"
            type="text"
            required
            value={formData.access_code}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="e.g. PTY-123456"
          />
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone1" className="block text-sm font-medium text-text-primary mb-1">Phone 1</label>
            <input
              id="phone1"
              name="phone1"
              type="tel"
              value={formData.phone1}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label htmlFor="phone2" className="block text-sm font-medium text-text-primary mb-1">Phone 2</label>
            <input
              id="phone2"
              name="phone2"
              type="tel"
              value={formData.phone2}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* GSTIN */}
        <div>
          <label htmlFor="gstin" className="block text-sm font-medium text-text-primary mb-1">GSTIN</label>
          <input
            id="gstin"
            name="gstin"
            type="text"
            value={formData.gstin}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-text-primary mb-1">Address</label>
          <textarea
            id="address"
            name="address"
            rows={2}
            value={formData.address}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-text-primary mb-1">City</label>
            <input
              id="city"
              name="city"
              type="text"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-text-primary mb-1">State</label>
            <input
              id="state"
              name="state"
              type="text"
              value={formData.state}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label htmlFor="pin_code" className="block text-sm font-medium text-text-primary mb-1">PIN Code</label>
            <input
              id="pin_code"
              name="pin_code"
              type="text"
              value={formData.pin_code}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Transport details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="transport" className="block text-sm font-medium text-text-primary mb-1">Transport</label>
            <input
              id="transport"
              name="transport"
              type="text"
              value={formData.transport}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label htmlFor="delivery_city" className="block text-sm font-medium text-text-primary mb-1">Delivery City</label>
            <input
              id="delivery_city"
              name="delivery_city"
              type="text"
              value={formData.delivery_city}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-background border border-border text-text-primary rounded-lg text-sm font-medium hover:bg-surface transition-colors"
            disabled={updateParty.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={updateParty.isPending || !formData.account_name.trim()}
          >
            {updateParty.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>

      </form>
    </div>
  );
}
