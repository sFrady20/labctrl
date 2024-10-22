import { prompt } from "@main/services/ChatGPT";
import { LightingTheme } from "../types";
import coreContext from "../context-1.txt?raw";
import roomContext from "../context-2.txt?raw";
import formatContext from "../context-3.txt?raw";
import request from "./request.txt?raw";
import lights from "../lights";
import { parseLightingTheme } from "../parseLightingTheme";

export async function alterLightingTheme(
  theme: LightingTheme,
  alteration: string
) {
  try {
    console.log(
      `Prompting alteration to theme "${theme.name}" - "${alteration}"`
    );

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
            .replace("{{CURRENT_THEME}}", JSON.stringify(theme))
            .replace("{{ALTERATION}}", alteration)
            .replace("{{LIGHT_IDS}}", lights.map((x) => x.lifxId).join(", ")),
        },
      ],
    });

    return {
      status: "success" as const,
      theme: {
        ...theme,
        ...parseLightingTheme(response),
      } as LightingTheme,
    };
  } catch (err: any) {
    console.error(err);
    return {
      status: "error" as const,
      message: err.message,
    };
  }
}
