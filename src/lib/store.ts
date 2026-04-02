import { create } from "zustand"

type AppMode = "demo" | "authenticated" | "transitioning"

interface AppStore {
  mode: AppMode
  setMode: (mode: AppMode) => void
  user: { name: string; image: string | null } | null
  setUser: (user: AppStore["user"]) => void
}

export const useAppStore = create<AppStore>((set) => ({
  mode: "demo",
  setMode: (mode) => set({ mode }),
  user: null,
  setUser: (user) => set({ user }),
}))
