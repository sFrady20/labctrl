import { create } from "zustand";

type ClaudeUsageData = {
  fiveHour: { utilization: number; resetsAt: string | null };
  sevenDay: { utilization: number; resetsAt: string | null };
};

type ClaudeStore = {
  isConnected: boolean;
  usage: ClaudeUsageData | null;
  isLoading: boolean;
  lastFetched: number;
  failCount: number;
  fetchUsage: () => Promise<void>;
  checkConnection: () => Promise<void>;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
};

export const useClaude = create<ClaudeStore>((set, get) => ({
  isConnected: false,
  usage: null,
  isLoading: false,
  lastFetched: 0,
  failCount: 0,

  checkConnection: async () => {
    const status = await window.main.invoke("getClaudeAuthStatus");
    set({ isConnected: status.connected });
    if (status.connected) {
      get().fetchUsage();
    }
  },

  fetchUsage: async () => {
    set({ isLoading: true });
    try {
      const usage = await window.main.invoke("getClaudeUsage");
      if (usage) {
        set({ usage, isLoading: false, lastFetched: Date.now(), failCount: 0 });
      } else {
        // null means either not connected or session expired
        const { failCount } = get();
        const newFailCount = failCount + 1;
        // After 3 consecutive failures, mark as disconnected
        if (newFailCount >= 3) {
          set({
            isConnected: false,
            usage: null,
            isLoading: false,
            failCount: 0,
          });
        } else {
          set({ isLoading: false, failCount: newFailCount });
        }
      }
    } catch (error) {
      console.error("Failed to fetch Claude usage:", error);
      set({ isLoading: false });
    }
  },

  connect: async () => {
    const success = await window.main.invoke("initiateClaudeAuth");
    if (success) {
      set({ isConnected: true, failCount: 0 });
      get().fetchUsage();
    }
    return success;
  },

  disconnect: async () => {
    await window.main.invoke("disconnectClaude");
    set({ isConnected: false, usage: null, failCount: 0 });
  },
}));
