"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { Lock, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Agent, Party } from "@/types/database";

export function LoginScreen() {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginAgent, loginStaff, loginParty } = useAuthStore();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setLoading(true);
    setError(false);

    try {
      // First try to find an agent
      const { data: agents, error: dbError } = await supabase
        .from("agents")
        .select("*")
        .eq("code", code)
        .limit(1);

      if (!dbError && agents && agents.length > 0) {
        loginAgent(agents[0] as Agent);
        window.location.href = "/store";
        return;
      }

      // If not an agent, try to find in staff
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("*")
        .eq("code", code)
        .limit(1);

      if (!staffError && staffData && staffData.length > 0) {
        const staffMember = staffData[0];
        loginStaff(staffMember);
        
        window.location.href = "/admin";
        return;
      }

      // Try to find in parties
      const { data: partyData, error: partyError } = await supabase
        .from("parties")
        .select("*")
        .eq("access_code", code)
        .limit(1);

      if (!partyError && partyData && partyData.length > 0) {
        loginParty(partyData[0] as Party);
        window.location.href = "/store";
        return;
      }

      // If neither, show error
      setError(true);
      setTimeout(() => setError(false), 3000);
    } catch (err) {
      console.error("Login error:", err);
      setError(true);
      setTimeout(() => setError(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 text-white selection:bg-[var(--color-pink)]/30 font-sans">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-800/40 via-zinc-950 to-zinc-950"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md p-8 sm:p-12">
        <div className="mb-10 text-center">
          <div className="mx-auto h-20 w-auto flex items-center justify-center mb-6">
            <img src="/image.jpg" alt="Logo" className="h-full w-auto object-contain" />
          </div>
          <p className="text-zinc-400 text-sm">Enter your access code to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 relative">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-[var(--color-pink)] transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Access Code"
                className={`w-full bg-zinc-900/50 border ${
                  error ? "border-red-500/50 focus:border-red-500" : "border-zinc-800 focus:border-[var(--color-pink)]/50"
                } rounded-xl py-4 pl-12 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-4 ${
                  error ? "focus:ring-red-500/10" : "focus:ring-[var(--color-pink)]/10"
                } transition-all backdrop-blur-xl`}
                autoFocus
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-red-400 text-xs pl-2 absolute -bottom-6 left-0">
                Invalid access code. Please try again.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-xl py-4 font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2 group shadow-[0_0_20px_-5px_rgba(74,144,226,0.4)] hover:shadow-[0_0_30px_-5px_rgba(74,144,226,0.6)] mt-2"
          >
            <span>{loading ? "Verifying..." : "Unlock Access"}</span>
            {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
        
        <div className="mt-12 text-center">
          <p className="text-xs text-zinc-600">
            OM Order System &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
