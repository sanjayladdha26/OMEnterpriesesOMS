// ============================================================
// Zustand UI Store — manages sidebar, drawers, modals
// ============================================================

import { create } from "zustand";

export type DrawerContent =
  | "add-product"
  | "edit-product"
  | "manage-categories"
  | "add-customer"
  | "edit-customer"
  | "add-payment"
  | "add-staff"
  | "edit-staff"
  | "add-agent"
  | "edit-agent"
  | null;

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Drawer
  drawerOpen: boolean;
  drawerContent: DrawerContent;
  drawerData: Record<string, unknown> | null;
  openDrawer: (content: DrawerContent, data?: Record<string, unknown>) => void;
  closeDrawer: () => void;

  // Modal
  modalOpen: boolean;
  modalData: Record<string, unknown> | null;
  openModal: (data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Selected customer for khata
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Sidebar
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Drawer
  drawerOpen: false,
  drawerContent: null,
  drawerData: null,
  openDrawer: (content, data = undefined) =>
    set({ drawerOpen: true, drawerContent: content, drawerData: data ?? null }),
  closeDrawer: () =>
    set({ drawerOpen: false, drawerContent: null, drawerData: null }),

  // Modal
  modalOpen: false,
  modalData: null,
  openModal: (data = undefined) =>
    set({ modalOpen: true, modalData: data ?? null }),
  closeModal: () => set({ modalOpen: false, modalData: null }),

  // Selected customer
  selectedCustomerId: null,
  setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),
}));
