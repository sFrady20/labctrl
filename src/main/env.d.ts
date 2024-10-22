/// <reference types="vite/client" />

declare type Prompt = {
  model:
    | "gpt-3.5-turbo"
    | "gpt-4"
    | "gpt-4-0613"
    | "gpt-4-1106-preview"
    | "gpt-4o-mini";
  messages: {
    role: "user" | "system";
    content: string;
  }[];
};
