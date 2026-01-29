import { is } from "@electron-toolkit/utils";
import { OPENROUTER_API_KEY } from "@main/config";
import axios from "axios";
import fs from "fs";
import path from "path";
import { getActiveModel } from "./settings";
import type { AIPromptRequest, AIModelConfig } from "./types";

export * from "./types";
export * from "./settings";

// All models go through OpenRouter
const client = axios.create({
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://labctrl.app",
    "X-Title": "LabCtrl",
  },
});

export async function prompt(request: AIPromptRequest): Promise<string> {
  const activeModel = getActiveModel();
  const model = request.model || activeModel.model;
  const temperature = request.temperature ?? activeModel.temperature ?? 0.7;

  const payload = {
    model,
    messages: request.messages,
    temperature,
  };

  const result = await client.post("/chat/completions", payload);
  const response = result.data.choices[0].message.content;

  // Log prompts for debugging
  if (is.dev) {
    const logPath = path.join(__dirname, "./ai.log");
    fs.appendFileSync(
      logPath,
      `${JSON.stringify({
        timestamp: new Date().toISOString(),
        model: activeModel.id,
        prompt: request,
        response,
      })}\n`
    );
  }

  return response;
}

export async function promptWithModel(
  request: AIPromptRequest,
  modelConfig: AIModelConfig
): Promise<string> {
  const payload = {
    model: modelConfig.model,
    messages: request.messages,
    temperature: request.temperature ?? modelConfig.temperature ?? 0.7,
  };

  const result = await client.post("/chat/completions", payload);
  return result.data.choices[0].message.content;
}
