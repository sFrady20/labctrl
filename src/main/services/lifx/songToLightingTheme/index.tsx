import Vibrant from "node-vibrant";
import { prompt } from "@main/services/ai";
import coreContext from "../context-1.txt?raw";
import roomContext from "../context-2.txt?raw";
import formatContext from "../context-3.txt?raw";
import request from "./request.txt?raw";
import lights from "../lights";
import { LightingTheme, Song } from "../types";
import { parseLightingTheme } from "../parseLightingTheme";

export async function songToLightingTheme(song: Song) {
  try {
    const colors = (
      await Promise.all(
        song.images.map(async (x) => await Vibrant.from(x).getPalette())
      )
    )
      .flatMap((x) => [x.Vibrant?.hex, x.LightVibrant?.hex, x.DarkVibrant?.hex])
      .filter((x) => x !== undefined);

    console.log(`Prompting song to lighting theme for song "${song.title}"`);
    const response = await prompt({
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
            .replace("{{SONG_TITLE}}", song.title)
            .replace("{{ALBUM}}", song.album)
            .replace("{{ARTIST}}", song.artist)
            .replace("{{COLORS}}", colors.join(", "))
            .replace("{{LIGHT_IDS}}", lights.map((x) => x.lifxId).join(", ")),
        },
      ],
    });

    return {
      status: "success" as const,
      theme: {
        ...parseLightingTheme(response),
        spotifySongId: song.id,
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
