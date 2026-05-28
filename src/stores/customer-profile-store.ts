import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CustomerProfileState {
  customerId: string;
  name: string;
  phone: string;
  schoolName: string;
  address: string;
  setProfile: (customerId: string, name: string, phone: string, schoolName: string, address: string) => void;
  clearProfile: () => void;
}

export const useCustomerProfileStore = create<CustomerProfileState>()(
  persist(
    (set) => ({
      customerId: "",
      name: "",
      phone: "",
      schoolName: "",
      address: "",
      setProfile: (customerId, name, phone, schoolName, address) => set({ customerId, name, phone, schoolName, address }),
      clearProfile: () => set({ customerId: "", name: "", phone: "", schoolName: "", address: "" }),
    }),
    {
      name: "customer-profile-storage",
    }
  )
);
