/// <reference types="vite/client" />

declare type Prompt = {
  model: "gpt-3.5-turbo";
  messages: {
    role: "user" | "system";
    content: string;
  }[];
};
