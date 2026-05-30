import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Agent, Staff, Party } from "@/types/database";

export type Role = "admin" | "agent" | "staff" | "party" | null;

interface AuthState {
  role: Role;
  agent: Agent | null;
  staff: Staff | null;
  party: Party | null;
  loginAdmin: () => void;
  loginAgent: (agent: Agent) => void;
  loginStaff: (staff: Staff) => void;
  loginParty: (party: Party) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role: null,
      agent: null,
      staff: null,
      party: null,
      loginAdmin: () => set({ role: "admin", agent: null, staff: null, party: null }),
      loginAgent: (agent: Agent) => set({ role: "agent", agent, staff: null, party: null }),
      loginStaff: (staff: Staff) => set({ 
        role: staff.is_admin ? "admin" : "staff", 
        agent: null, 
        staff,
        party: null
      }),
      loginParty: (party: Party) => set({ role: "party", agent: null, staff: null, party }),
      logout: () => set({ role: null, agent: null, staff: null, party: null }),
    }),
    {
      name: "auth-storage",
    }
  )
);
