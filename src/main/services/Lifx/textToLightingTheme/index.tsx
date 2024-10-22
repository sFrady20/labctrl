import { prompt } from "@main/services/ChatGPT";
import coreContext from "../context-1.txt?raw";
import roomContext from "../context-2.txt?raw";
import formatContext from "../context-3.txt?raw";
import request from "./request.txt?raw";
import lights from "../lights";
import { parseLightingTheme } from "../parseLightingTheme";

export async function textToLightingTheme(topic) {
  try {
    console.log(`Prompting text to lighting theme for topic "${topic}"`);
    const response = await prompt({
      model: "gpt-4o-mini",
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
        {
          role: "system",
          content: formatContext,
        },
        {
          role: "user",
          content: request
            .replace("{{TOPIC}}", topic)
            .replace("{{LIGHT_IDS}}", lights.map((x) => x.lifxId).join(", ")),
        },
      ],
    });

    const theme = parseLightingTheme(response);

    return {
      status: "success" as const,
      theme,
    };
  } catch (err: any) {
    console.error(err);
    return {
      status: "error" as const,
      message: err.message,
    };
  }
}
