"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { Lock, ArrowRight, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Agent, Party } from "@/types/database";

const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 60 * 1000; // 1 minute

export function LoginScreen() {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Rate limiting state
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  const { loginAgent, loginStaff, loginParty } = useAuthStore();
  const supabase = createClient();

  // Initialize rate limiting from localStorage
  useEffect(() => {
    const storedLockout = localStorage.getItem("auth_lockout_until");
    const storedAttempts = localStorage.getItem("auth_attempts");

    if (storedLockout) {
      const lockoutTime = parseInt(storedLockout, 10);
      if (lockoutTime > Date.now()) {
        setLockoutUntil(lockoutTime);
      } else {
        localStorage.removeItem("auth_lockout_until");
        localStorage.removeItem("auth_attempts");
      }
    } else if (storedAttempts) {
      setAttempts(parseInt(storedAttempts, 10));
    }
  }, []);

  // Handle countdown timer
  useEffect(() => {
    if (!lockoutUntil) return;

    const updateCountdown = () => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setAttempts(0);
        setCountdown(0);
        localStorage.removeItem("auth_lockout_until");
        localStorage.removeItem("auth_attempts");
      } else {
        setCountdown(remaining);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const handleFailedAttempt = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    localStorage.setItem("auth_attempts", newAttempts.toString());

    if (newAttempts >= MAX_ATTEMPTS) {
      const lockoutTime = Date.now() + LOCKOUT_TIME;
      setLockoutUntil(lockoutTime);
      localStorage.setItem("auth_lockout_until", lockoutTime.toString());
    }
  };

  const handleSuccess = () => {
    setAttempts(0);
    localStorage.removeItem("auth_attempts");
    localStorage.removeItem("auth_lockout_until");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || lockoutUntil) return;

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
        handleSuccess();
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
        handleSuccess();
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
        handleSuccess();
        loginParty(partyData[0] as Party);
        window.location.href = "/store";
        return;
      }

      // If neither, show error and record failed attempt
      handleFailedAttempt();
      setError(true);
      setTimeout(() => setError(false), 3000);
    } catch (err) {
      console.error("Login error:", err);
      handleFailedAttempt();
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
                } transition-all backdrop-blur-xl disabled:opacity-50`}
                autoFocus
                disabled={loading || !!lockoutUntil}
              />
            </div>
            {error && !lockoutUntil && (
              <p className="text-red-400 text-xs pl-2 absolute -bottom-6 left-0">
                Invalid access code. Please try again.
              </p>
            )}
            {!!lockoutUntil && (
              <p className="text-red-400 text-xs pl-2 absolute -bottom-6 left-0 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Too many attempts. Try again in {countdown}s.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !!lockoutUntil}
            className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:hover:bg-primary text-white rounded-xl py-4 font-medium transition-all active:scale-[0.98] disabled:active:scale-100 flex items-center justify-center gap-2 group shadow-[0_0_20px_-5px_rgba(74,144,226,0.4)] hover:shadow-[0_0_30px_-5px_rgba(74,144,226,0.6)] disabled:shadow-none mt-2"
          >
            <span>{!!lockoutUntil ? "Locked Out" : loading ? "Verifying..." : "Unlock Access"}</span>
            {!loading && !lockoutUntil && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
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
