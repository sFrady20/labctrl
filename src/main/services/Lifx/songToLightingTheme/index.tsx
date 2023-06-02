import Vibrant from "node-vibrant";
import { prompt } from "@main/services/ChatGPT";
import coreContext from "./context-1.txt?raw";
import roomContext from "./context-2.txt?raw";
import request from "./request.txt?raw";
import lights from "../lights";
import { LightingTheme, Song } from "../types";

export async function songToLightingTheme(song: Song) {
  try {
    const colors = (
      await Promise.all(
        song.images.map(async (x) => await Vibrant.from(x).getPalette())
      )
    )
      .flatMap((x) => [
        x.Vibrant?.hex,
        x.Muted?.hex,
        x.LightVibrant?.hex,
        x.LightMuted?.hex,
        x.DarkVibrant?.hex,
        x.LightVibrant?.hex,
      ])
      .filter((x) => x !== undefined);

    console.log(`Prompting song to lighting theme for song "${song.title}"`);
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
        {
          role: "user",
          content: request
            .replace("{{SONG_TITLE}}", song.title)
            .replace("{{ALBUM}}", song.album)
            .replace("{{ARTIST}}", song.artist)
            .replace("{{COLORS}}", colors.join(", ")),
        },
      ],
    });

    const lines = response.split("\n");
    const name = lines[0];
    const instructions = lines.slice(1).map((x) => x.split(","));

    return {
      status: "success" as const,
      theme: {
        id: Math.random().toString(32).substring(7),
        name,
        instructions,
        spotifySongId: song.id,
      } satisfies LightingTheme,
    };
  } catch (err: any) {
    console.error(err);
    return {
      status: "error" as const,
      message: err.message,
    };
  }
}
