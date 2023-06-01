import { prompt } from "@main/services/ChatGPT";
import lifx from "../client";
import coreContext from "./context-1.txt?raw";
import roomContext from "./context-2.txt?raw";
import request from "./request.txt?raw";
import lights from "../lights";
import { setLightingTheme } from "..";

export async function textToLights(topic) {
  try {
    const response = await prompt({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: coreContext,
        },
        {
          role: "system",
          content: roomContext.replace(
            "{{LIGHTS}}",
            lights.map((x) => `${x.lifxId},${x.id},${x.description}`).join("\n")
          ),
        },
        { role: "user", content: request.replace("{{TOPIC}}", topic) },
      ],
    });

    const lines = response.split("\n");
    const name = lines[0];
    const instructions = lines.slice(1).map((x) => x.split(","));
    await setLightingTheme({ name, instructions });

    return {
      status: "success" as const,
      name,
      instructions,
    };
  } catch (err: any) {
    console.error(err);
    return {
      status: "error" as const,
      message: err.message,
    };
  }
}
