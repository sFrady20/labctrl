import { OpenExternalOptions, app, shell } from "electron";
import Main, { type InferMainAPI } from "./main";
import * as lifx from "./services/lifx";
import * as ai from "./services/ai";
import * as spotify from "./services/spotify";
import * as scenes from "./services/scenes";

// Register Spotify protocol handler
spotify.registerProtocol();

const main = new Main(
  {
    ...lifx,
    // Spotify functions
    getCurrentSpotifySong: spotify.getCurrentSpotifySong,
    toggleSongPlayingOnSpotify: spotify.toggleSongPlayingOnSpotify,
    skipToNextSongOnSpotify: spotify.skipToNextSongOnSpotify,
    initiateSpotifyAuth: spotify.initiateSpotifyAuth,
    disconnectSpotify: spotify.disconnectSpotify,
    isSpotifyConnected: spotify.isSpotifyConnected,
    getSpotifyAuthStatus: spotify.getSpotifyAuthStatus,
    // AI settings functions
    getActiveModelId: ai.getActiveModelId,
    setActiveModelId: ai.setActiveModelId,
    getActiveModel: ai.getActiveModel,
    getAllModels: ai.getAllModels,
    addCustomModel: ai.addCustomModel,
    removeCustomModel: ai.removeCustomModel,
    // Scene functions
    getAllScenes: scenes.getAllScenes,
    getScene: scenes.getScene,
    addScene: scenes.addScene,
    updateScene: scenes.updateScene,
    removeScene: scenes.removeScene,
    getAllSchedules: scenes.getAllSchedules,
    addSchedule: scenes.addSchedule,
    updateSchedule: scenes.updateSchedule,
    removeSchedule: scenes.removeSchedule,
    toggleSchedule: scenes.toggleSchedule,
    // Utility functions
    openExternal(url: string, options?: OpenExternalOptions) {
      shell.openExternal(url, options);
    },
    quit() {
      app.quit();
    },
  },
  { browser: { width: 420, height: 720 } }
);

export type MainAPI = InferMainAPI<typeof main>;
export default main;
