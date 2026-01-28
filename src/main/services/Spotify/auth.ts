import { BrowserWindow, app, protocol } from "electron";
import Store from "electron-store";
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from "@main/config";

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const REDIRECT_URI = "labctrl://spotify-callback";
const SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
].join(" ");

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const tokenStore = new Store<{ spotify: TokenData | null }>({
  name: "spotify-auth",
  defaults: { spotify: null },
});

let authWindow: BrowserWindow | null = null;
let authResolve: ((value: boolean) => void) | null = null;

export function registerProtocol(): void {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient("labctrl", process.execPath, [
        process.argv[1],
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient("labctrl");
  }

  // Handle protocol on Windows/Linux
  app.on("second-instance", (_event, commandLine) => {
    const url = commandLine.find((arg) => arg.startsWith("labctrl://"));
    if (url) {
      handleCallback(url);
    }
  });

  // Handle protocol on macOS
  app.on("open-url", (event, url) => {
    event.preventDefault();
    handleCallback(url);
  });
}

async function handleCallback(url: string): Promise<void> {
  const urlObj = new URL(url);
  const code = urlObj.searchParams.get("code");
  const error = urlObj.searchParams.get("error");

  if (authWindow) {
    authWindow.close();
    authWindow = null;
  }

  if (error || !code) {
    console.error("Spotify auth failed:", error);
    authResolve?.(false);
    return;
  }

  try {
    await exchangeCodeForTokens(code);
    authResolve?.(true);
  } catch (err) {
    console.error("Token exchange failed:", err);
    authResolve?.(false);
  }
}

async function exchangeCodeForTokens(code: string): Promise<void> {
  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString(
          "base64"
        ),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  const data = await response.json();
  tokenStore.set("spotify", {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  });
}

export async function refreshAccessToken(): Promise<string | null> {
  const tokens = tokenStore.get("spotify");
  if (!tokens?.refreshToken) return null;

  try {
    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString(
            "base64"
          ),
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokens.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();
    tokenStore.set("spotify", {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || tokens.refreshToken,
      expiresAt: Date.now() + data.expires_in * 1000,
    });

    return data.access_token;
  } catch (err) {
    console.error("Failed to refresh token:", err);
    return null;
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = tokenStore.get("spotify");
  if (!tokens) return null;

  // Refresh if within 1 minute of expiry
  if (Date.now() > tokens.expiresAt - 60000) {
    return refreshAccessToken();
  }

  return tokens.accessToken;
}

export function initiateSpotifyAuth(): Promise<boolean> {
  return new Promise((resolve) => {
    authResolve = resolve;

    const state = Math.random().toString(36).substring(7);
    const authUrl = new URL(SPOTIFY_AUTH_URL);
    authUrl.searchParams.set("client_id", SPOTIFY_CLIENT_ID);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("scope", SCOPES);
    authUrl.searchParams.set("state", state);

    authWindow = new BrowserWindow({
      width: 500,
      height: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    authWindow.loadURL(authUrl.toString());

    authWindow.on("closed", () => {
      authWindow = null;
      if (authResolve) {
        authResolve(false);
        authResolve = null;
      }
    });
  });
}

export function disconnectSpotify(): void {
  tokenStore.set("spotify", null);
}

export function isSpotifyConnected(): boolean {
  const tokens = tokenStore.get("spotify");
  return tokens !== null && tokens.refreshToken !== undefined;
}

export function getSpotifyAuthStatus(): {
  connected: boolean;
  expiresAt: number | null;
} {
  const tokens = tokenStore.get("spotify");
  return {
    connected: tokens !== null,
    expiresAt: tokens?.expiresAt || null,
  };
}
