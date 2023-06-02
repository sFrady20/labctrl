import { SPOTIFY_TOKEN } from "@main/config";
import axios from "axios";

const spotify = axios.create({
  baseURL: "https://api.spotify.com/v1",
  headers: {
    common: {
      Authorization: `Bearer ${SPOTIFY_TOKEN}`,
    },
  },
});

export async function getCurrentSpotifySong() {
  try {
    const songData = (await spotify.get("/me/player")).data.item;
    if (!songData) return null;
    return {
      id: songData.id,
      title: songData.name,
      album: songData.album.name,
      artist: songData.artists[0],
      images: [songData.album.images[0].url],
    };
  } catch (err: any) {
    console.error(err.message);
    return null;
  }
}
