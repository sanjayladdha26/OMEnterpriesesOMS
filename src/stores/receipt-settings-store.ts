import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ReceiptSettingsState {
  headerText: string;
  footerText: string;
  showHsn: boolean;
  printWidth: string; // e.g. "300px" or "80mm"
  
  // Actions
  setHeaderText: (text: string) => void;
  setFooterText: (text: string) => void;
  setShowHsn: (show: boolean) => void;
  setPrintWidth: (width: string) => void;
}

export const useReceiptSettingsStore = create<ReceiptSettingsState>()(
  persist(
    (set) => ({
      headerText: "Estimated Invoice",
      footerText: "Thank you for shopping",
      showHsn: true,
      printWidth: "300px",

      setHeaderText: (text) => set({ headerText: text }),
      setFooterText: (text) => set({ footerText: text }),
      setShowHsn: (show) => set({ showHsn: show }),
      setPrintWidth: (width) => set({ printWidth: width }),
    }),
    {
      name: "receipt-settings-storage", // key in local storage
    }
  )
);
