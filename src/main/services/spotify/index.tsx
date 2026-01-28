import {
  SPOTIFY_REFRESH_TOKEN,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
} from "@main/config";
import axios from "axios";
import {
  getValidAccessToken,
  isSpotifyConnected,
  initiateSpotifyAuth,
  disconnectSpotify,
  getSpotifyAuthStatus,
  registerProtocol,
} from "./auth";

// Re-export auth functions
export {
  initiateSpotifyAuth,
  disconnectSpotify,
  isSpotifyConnected,
  getSpotifyAuthStatus,
  registerProtocol,
};

const spotify = axios.create({
  baseURL: "https://api.spotify.com/v1",
});

// Legacy refresh token support (for backward compatibility)
const refreshTokenLegacy = async () => {
  if (!SPOTIFY_REFRESH_TOKEN) return;

  try {
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
    console.log("Spotify token refreshed (legacy)");
  } catch (err: any) {
    console.error("Failed to refresh legacy token:", err.message);
  }
};

// Try OAuth first, fall back to legacy
async function ensureAuthenticated(): Promise<boolean> {
  // First try OAuth tokens
  if (isSpotifyConnected()) {
    const token = await getValidAccessToken();
    if (token) {
      spotify.defaults.headers.common.Authorization = `Bearer ${token}`;
      return true;
    }
  }

  // Fall back to legacy refresh token if available
  if (SPOTIFY_REFRESH_TOKEN) {
    await refreshTokenLegacy();
    return !!spotify.defaults.headers.common.Authorization;
  }

  return false;
}

// Initial auth setup
ensureAuthenticated();

// Refresh token periodically (for legacy mode)
if (SPOTIFY_REFRESH_TOKEN) {
  setInterval(refreshTokenLegacy, 30 * 60 * 1000);
}

export async function getCurrentSpotifySong() {
  try {
    const authenticated = await ensureAuthenticated();
    if (!authenticated) return null;

    const state = (await spotify.get("/me/player")).data;
    const songData = state?.item;
    if (!songData) return null;

    return {
      id: songData.id,
      title: songData.name,
      album: songData.album.name,
      artist: songData.artists[0].name,
      images: [songData.album.images[0].url],
      isPlaying: state.is_playing ?? false,
    };
  } catch (err: any) {
    console.error(err.message);
    return null;
  }
}

export async function toggleSongPlayingOnSpotify(to?: boolean) {
  const authenticated = await ensureAuthenticated();
  if (!authenticated) return;

  const next = to;
  if (next) await spotify.put("/me/player/play");
  else await spotify.put("/me/player/pause");
}

export async function skipToNextSongOnSpotify() {
  const authenticated = await ensureAuthenticated();
  if (!authenticated) return;

  await spotify.post("/me/player/next");
}
