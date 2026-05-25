import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CustomerProfileState {
  customerId: string;
  name: string;
  phone: string;
  setProfile: (customerId: string, name: string, phone: string) => void;
  clearProfile: () => void;
}

export const useCustomerProfileStore = create<CustomerProfileState>()(
  persist(
    (set) => ({
      customerId: "",
      name: "",
      phone: "",
      setProfile: (customerId, name, phone) => set({ customerId, name, phone }),
      clearProfile: () => set({ customerId: "", name: "", phone: "" }),
    }),
    {
      name: "customer-profile-storage",
    }
  )
);
