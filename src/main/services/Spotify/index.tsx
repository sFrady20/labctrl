import {
  SPOTIFY_REFRESH_TOKEN,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
} from "@main/config";
import axios from "axios";

const spotify = axios.create({
  baseURL: "https://api.spotify.com/v1",
});

const refreshToken = async () => {
  const token = (
    await axios.post(
      "https://accounts.spotify.com/api/token",
      { grant_type: "refresh_token", refresh_token: SPOTIFY_REFRESH_TOKEN },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(
              SPOTIFY_CLIENT_ID + ":" + SPOTIFY_CLIENT_SECRET
            ).toString("base64"),
        },
      }
    )
  ).data?.access_token;
  spotify.defaults.headers.common.Authorization = `Bearer ${token}`;
  console.log("Spotify token refreshed");
};
setInterval(refreshToken, 30 * 60 * 1000 /* 30 mins */);
refreshToken();

export async function getCurrentSpotifySong() {
  try {
    const state = (await spotify.get("/me/player")).data;
    if (!state.is_playing) return null;
    const songData = state.item;
    if (!songData) return null;
    return {
      id: songData.id,
      title: songData.name,
      album: songData.album.name,
      artist: songData.artists[0].name,
      images: [songData.album.images[0].url],
    };
  } catch (err: any) {
    console.error(err.message);
    return null;
  }
}

export async function toggleSongPlayingOnSpotify(to?: boolean) {
  const next = to;
  if (next) await spotify.put("/me/player/play");
  else await spotify.put("/me/player/pause");
}

export async function skipToNextSongOnSpotify() {
  await spotify.post("/me/player/next");
}
