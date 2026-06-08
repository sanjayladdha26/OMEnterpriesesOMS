"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CartPanel } from "@/components/pos/cart-panel";
import { useNextOrderNumber } from "@/lib/hooks";
import type { Order } from "@/types/database";

export default function AdminCartPage() {
  const router = useRouter();
  const { data: orderNumber, isLoading: orderLoading } = useNextOrderNumber();

  // Desktop redirect
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        router.replace("/admin/new-order");
      }
    };
    // Run initial check
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [router]);

  const handleOrderSaved = useCallback((order: Order) => {
    setTimeout(() => {
      router.push("/admin/orders");
    }, 1500);
  }, [router]);

  const handleClose = useCallback(() => {
    router.push("/admin/new-order");
  }, [router]);

  const displayOrderNumber = orderLoading ? "..." : orderNumber || "ORD-0001";

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] lg:h-screen w-full bg-background flex flex-col">
      <CartPanel
        orderNumber={displayOrderNumber}
        onOrderSaved={handleOrderSaved}
        onClose={handleClose}
      />
    </div>
  );
}
