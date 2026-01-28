export type AIProvider = "openai" | "openrouter";

export interface AIModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  model: string;
  temperature?: number;
}

export interface AIPromptMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIPromptRequest {
  messages: AIPromptMessage[];
  model?: string;
  temperature?: number;
}

export const DEFAULT_MODEL_PRESETS: AIModelConfig[] = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini (Fast)",
    provider: "openai",
    model: "gpt-4o-mini",
    temperature: 0.7,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o (Quality)",
    provider: "openai",
    model: "gpt-4o",
    temperature: 0.7,
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "openai",
    model: "gpt-4.1-mini",
    temperature: 0.7,
  },
  {
    id: "claude-sonnet",
    name: "Claude 4 Sonnet",
    provider: "openrouter",
    model: "anthropic/claude-sonnet-4",
    temperature: 0.7,
  },
  {
    id: "claude-haiku",
    name: "Claude 3.5 Haiku",
    provider: "openrouter",
    model: "anthropic/claude-3.5-haiku",
    temperature: 0.7,
  },
  {
    id: "gemini-flash",
    name: "Gemini 2.0 Flash",
    provider: "openrouter",
    model: "google/gemini-2.0-flash-001",
    temperature: 0.7,
  },
];
