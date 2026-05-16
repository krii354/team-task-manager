import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/lib/types";
import { tokenStorage } from "@/lib/storage";

interface AuthState {
  user: User | null;
  hydrated: boolean;
  setUser: (user: User | null) => void;
  setHydrated: (v: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,
      setUser: (user) => set({ user }),
      setHydrated: (v) => set({ hydrated: v }),
      clear: () => {
        tokenStorage.clear();
        set({ user: null });
      },
    }),
    {
      name: "ttm_auth_user",
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
