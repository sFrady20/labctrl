import { create } from "zustand";

interface AIModelConfig {
  id: string;
  name: string;
  provider: "openai" | "openrouter";
  model: string;
  temperature?: number;
}

interface SettingsState {
  activeModelId: string;
  availableModels: AIModelConfig[];
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  setActiveModel: (modelId: string) => Promise<void>;
}

export const useSettings = create<SettingsState>((set, get) => ({
  activeModelId: "gpt-4o-mini",
  availableModels: [],
  isLoading: true,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const [activeModelId, allModels] = await Promise.all([
        window.main.invoke("getActiveModelId"),
        window.main.invoke("getAllModels"),
      ]);
      set({
        activeModelId,
        availableModels: allModels,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to load settings:", error);
      set({ isLoading: false });
    }
  },

  setActiveModel: async (modelId: string) => {
    await window.main.invoke("setActiveModelId", modelId);
    set({ activeModelId: modelId });
  },
}));
