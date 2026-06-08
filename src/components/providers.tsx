"use client";

// ============================================================
// QueryClient Provider for TanStack Query
// ============================================================

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ThemeProvider } from "next-themes";
import toast, { Toaster } from "react-hot-toast";

function PwaUpdater() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // An update is available
                toast(
                  (t) => (
                    <div className="flex flex-col gap-2">
                      <p className="font-semibold text-sm">App Update Available</p>
                      <p className="text-xs text-gray-500 mb-2">A new version of OM Vastra is ready.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            toast.dismiss(t.id);
                            window.location.reload();
                          }}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                          Reload App
                        </button>
                        <button
                          onClick={() => toast.dismiss(t.id)}
                          className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ),
                  { duration: Infinity, position: "bottom-center" }
                );
              }
            });
          }
        });
      });
    }
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange forcedTheme="light">
      <QueryClientProvider client={queryClient}>
        <PwaUpdater />
        {children}
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
