"use client";

import { StoreSidebar } from "./store-sidebar";

export function StoreAppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <StoreSidebar />
      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0 relative">
        {children}
      </main>
    </div>
  );
}
