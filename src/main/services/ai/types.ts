export interface AIModelConfig {
  id: string;
  name: string;
  model: string; // OpenRouter model ID
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

// Current top models as of January 2026 - all through OpenRouter
export const DEFAULT_MODEL_PRESETS: AIModelConfig[] = [
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini (Fast)",
    model: "openai/gpt-4.1-mini",
    temperature: 0.7,
  },
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    model: "openai/gpt-4.1",
    temperature: 0.7,
  },
  {
    id: "claude-sonnet-4",
    name: "Claude Sonnet 4",
    model: "anthropic/claude-sonnet-4",
    temperature: 0.7,
  },
  {
    id: "claude-haiku-3.5",
    name: "Claude 3.5 Haiku (Fast)",
    model: "anthropic/claude-3.5-haiku",
    temperature: 0.7,
  },
  {
    id: "gemini-2-flash",
    name: "Gemini 2.0 Flash",
    model: "google/gemini-2.0-flash-001",
    temperature: 0.7,
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek V3",
    model: "deepseek/deepseek-chat",
    temperature: 0.7,
  },
];
