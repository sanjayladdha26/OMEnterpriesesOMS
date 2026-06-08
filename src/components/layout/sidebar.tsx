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
  ShoppingBag,
} from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { cn } from "@/lib/utils";
import { PushSubscriber } from "@/components/notifications/push-subscriber";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  mobileOnly?: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const role = useAuthStore((state) => state.role);
  const staff = useAuthStore((state) => state.staff);
  const logout = useAuthStore((state) => state.logout);
  const cartItems = useCartStore((state) => state.items);

  if (!role || role === "agent") return null;

  const navItems: NavItem[] = [];
  if (role === "admin") {
    navItems.push(
      { href: "/admin/orders", label: "Orders", icon: FileText },
      { href: "/admin/inventory", label: "Inventory", icon: Package },
      { href: "/admin/agents", label: "Agents", icon: Users },
      { href: "/admin/staff", label: "Staff", icon: Shield },
      { href: "/admin/new-order", label: "New Order", icon: ShoppingBag }
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
      navItems.push({ href: "/admin/new-order", label: "New Order", icon: ShoppingBag });
    }
  }

  // Add mobile-only Cart link to mobile bottom nav for users who can create orders
  const canCreateOrder = role === "admin" || (role === "staff" && staff?.can_create_order);
  if (canCreateOrder) {
    navItems.push({
      href: "/admin/new-order/cart",
      label: "Cart",
      icon: ShoppingCart,
      mobileOnly: true,
    });
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
          {navItems.filter((item) => !item.mobileOnly).map((item) => {
            const isActive =
              item.href === "/admin/new-order"
                ? pathname === "/admin/new-order"
                : pathname === item.href || pathname.startsWith(item.href + "/");
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
        <div className="px-3 py-4 border-t border-border flex flex-col gap-2">
          <p className="px-3 text-[10px] text-text-muted uppercase tracking-wider">
            Logged in as <span className="font-semibold capitalize">{role}</span>
          </p>
          <PushSubscriber />
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
              item.href === "/admin/new-order"
                ? pathname === "/admin/new-order"
                : pathname === item.href || pathname.startsWith(item.href + "/");
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
                <span className="relative">
                  <Icon className="w-5 h-5" />
                  {item.href === "/admin/new-order/cart" && cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-2 bg-primary text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                      {cartItems.length}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
