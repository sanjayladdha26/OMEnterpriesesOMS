import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "admin" | "employee" | null;

interface AuthState {
  role: Role;
  login: (code: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role: null,
      login: (code: string) => {
        if (code === "chirag") {
          set({ role: "admin" });
          return true;
        }
        if (code === "m24m") {
          set({ role: "employee" });
          return true;
        }
        return false;
      },
      logout: () => set({ role: null }),
    }),
    {
      name: "auth-storage", // name of the item in the storage (must be unique)
    }
  )
);
