"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { LoginScreen } from "./login-screen";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const role = useAuthStore((state) => state.role);
  const staff = useAuthStore((state) => state.staff);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Avoid hydration errors by only rendering after mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const pathname = usePathname();

  useEffect(() => {
    if (!mounted) return;
    
    if (role === "agent" && pathname.startsWith("/admin")) {
      router.replace("/store");
    } else if (role === "party" && pathname.startsWith("/admin")) {
      router.replace("/store");
    } else if (role === "admin" && pathname.startsWith("/store")) {
      router.replace("/admin/orders");
    } else if (role === "staff") {
      const hasAdminAccess = staff?.can_update_status || staff?.can_view_orders || staff?.can_view_inventory || staff?.can_view_agents || staff?.can_view_staff || staff?.can_create_order;
      const canAccessOrders = staff?.can_update_status || staff?.can_view_orders;
      
      if (pathname.startsWith("/admin")) {
        if (!hasAdminAccess) {
          router.replace("/");
        } else {
          // Page specific redirects
          if (pathname.startsWith("/admin/orders") && !canAccessOrders) {
            router.replace(staff?.can_create_order ? "/admin/new-order" : staff?.can_view_inventory ? "/admin/inventory" : staff?.can_view_agents ? "/admin/agents" : "/admin/staff");
          } else if (pathname.startsWith("/admin/new-order") && !staff?.can_create_order) {
            router.replace(canAccessOrders ? "/admin/orders" : staff?.can_view_inventory ? "/admin/inventory" : staff?.can_view_agents ? "/admin/agents" : "/admin/staff");
          } else if (pathname.startsWith("/admin/inventory") && !staff?.can_view_inventory) {
            router.replace(canAccessOrders ? "/admin/orders" : staff?.can_create_order ? "/admin/new-order" : staff?.can_view_agents ? "/admin/agents" : "/admin/staff");
          } else if (pathname.startsWith("/admin/agents") && !staff?.can_view_agents) {
            router.replace(canAccessOrders ? "/admin/orders" : staff?.can_create_order ? "/admin/new-order" : staff?.can_view_inventory ? "/admin/inventory" : "/admin/staff");
          } else if (pathname.startsWith("/admin/staff") && !staff?.can_view_staff) {
            router.replace(canAccessOrders ? "/admin/orders" : staff?.can_create_order ? "/admin/new-order" : staff?.can_view_inventory ? "/admin/inventory" : "/admin/agents");
          } else if (pathname === "/admin") {
            router.replace(canAccessOrders ? "/admin/orders" : staff?.can_create_order ? "/admin/new-order" : staff?.can_view_inventory ? "/admin/inventory" : staff?.can_view_agents ? "/admin/agents" : "/admin/staff");
          }
        }
      } else if (pathname.startsWith("/store")) {
        router.replace(canAccessOrders ? "/admin/orders" : staff?.can_create_order ? "/admin/new-order" : "/admin");
      }
    }
  }, [mounted, role, staff, pathname, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!role) {
    return <LoginScreen />;
  }

  if (role === "agent" && pathname.startsWith("/admin")) {
    return (
      <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (role === "party" && pathname.startsWith("/admin")) {
    return (
      <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (role === "admin" && pathname.startsWith("/store")) {
    return (
      <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (role === "staff") {
    const hasAdminAccess = staff?.can_update_status || staff?.can_view_orders || staff?.can_view_inventory || staff?.can_view_agents || staff?.can_view_staff || staff?.can_create_order;
    const canAccessOrders = staff?.can_update_status || staff?.can_view_orders;
    const canAccessCurrentAdminPage = 
      (pathname.startsWith("/admin/orders") && canAccessOrders) ||
      (pathname.startsWith("/admin/new-order") && staff?.can_create_order) ||
      (pathname.startsWith("/admin/inventory") && staff?.can_view_inventory) ||
      (pathname.startsWith("/admin/agents") && staff?.can_view_agents) ||
      (pathname.startsWith("/admin/staff") && staff?.can_view_staff) ||
      (pathname === "/admin"); // Root admin redirects in useEffect

    if (pathname.startsWith("/admin") && (!hasAdminAccess || !canAccessCurrentAdminPage)) {
      return (
        <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      );
    }
    if (pathname.startsWith("/store")) {
      return (
        <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
