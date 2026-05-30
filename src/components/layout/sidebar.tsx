"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  Menu,
  X,
  FileText,
  LogOut,
  Users,
  Shield,
  ShoppingCart,
} from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const role = useAuthStore((state) => state.role);
  const staff = useAuthStore((state) => state.staff);
  const logout = useAuthStore((state) => state.logout);

  if (!role || role === "agent") return null;

  const navItems = [];
  if (role === "admin") {
    navItems.push(
      { href: "/admin/orders", label: "Orders", icon: FileText },
      { href: "/admin/inventory", label: "Inventory", icon: Package },
      { href: "/admin/agents", label: "Agents", icon: Users },
      { href: "/admin/staff", label: "Staff", icon: Shield },
      { href: "/admin/new-order", label: "New Order", icon: ShoppingCart }
    );
  } else if (role === "staff") {
    if (staff?.can_accept_order || staff?.can_dispatch_order || staff?.can_complete_order || staff?.can_reject_order || staff?.can_view_orders) {
      navItems.push({ href: "/admin/orders", label: "Orders", icon: FileText });
    }
    if (staff?.can_view_inventory) {
      navItems.push({ href: "/admin/inventory", label: "Inventory", icon: Package });
    }
    if (staff?.can_view_agents) {
      navItems.push({ href: "/admin/agents", label: "Agents", icon: Users });
    }
    if (staff?.can_view_staff) {
      navItems.push({ href: "/admin/staff", label: "Staff", icon: Shield });
    }
    if (staff?.can_create_order) {
      navItems.push({ href: "/admin/new-order", label: "New Order", icon: ShoppingCart });
    }
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface shadow-md border border-border lg:hidden no-print"
        onClick={toggleSidebar}
        aria-label="Toggle navigation"
      >
        {sidebarOpen ? (
          <X className="w-5 h-5 text-text-primary" />
        ) : (
          <Menu className="w-5 h-5 text-text-primary" />
        )}
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full bg-sidebar border-r border-border flex flex-col transition-transform duration-300 no-print",
          "w-[220px]",
          "lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-5 py-6 border-b border-border flex items-center justify-center min-h-[88px] bg-white">
          <img src="/image.jpg" alt="Logo" className="w-full max-w-[160px] h-auto object-contain" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-text-muted hover:bg-sidebar-hover hover:text-text-primary"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-border">
          <p className="px-3 mb-2 text-[10px] text-text-muted uppercase tracking-wider">
            Logged in as <span className="font-semibold capitalize">{role}</span>
          </p>
          <button
            onClick={() => { logout(); setSidebarOpen(false); window.location.href = "/"; }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red hover:bg-red-light transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Bottom navigation for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border lg:hidden no-print">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors",
                  isActive ? "text-primary" : "text-text-muted"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
