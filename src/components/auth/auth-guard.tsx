"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { LoginScreen } from "./login-screen";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const role = useAuthStore((state) => state.role);
  const [mounted, setMounted] = useState(false);

  // Avoid hydration errors by only rendering after mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const pathname = usePathname();

  if (!mounted) {
    return (
      <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!role) {
    if (pathname === "/pos" || pathname === "/") {
      return <>{children}</>;
    }
    return <LoginScreen />;
  }

  return <>{children}</>;
}
