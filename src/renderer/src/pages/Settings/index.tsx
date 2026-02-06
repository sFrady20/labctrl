import { useEffect, useState } from "react";
import { useSettings, useClaude } from "@renderer/stores";
import clsx from "clsx";

export default function SettingsPage() {
  const settings = useSettings();
  const claude = useClaude();
  const [spotifyStatus, setSpotifyStatus] = useState<{
    connected: boolean;
    expiresAt: number | null;
  }>({ connected: false, expiresAt: null });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnectingClaude, setIsConnectingClaude] = useState(false);

  useEffect(() => {
    settings.loadSettings();
    loadSpotifyStatus();
    claude.checkConnection();
  }, []);

  const loadSpotifyStatus = async () => {
    const status = await window.main.invoke("getSpotifyAuthStatus");
    setSpotifyStatus(status);
  };

  const handleConnectSpotify = async () => {
    setIsConnecting(true);
    try {
      const success = await window.main.invoke("initiateSpotifyAuth");
      if (success) await loadSpotifyStatus();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectSpotify = async () => {
    await window.main.invoke("disconnectSpotify");
    await loadSpotifyStatus();
  };

  const handleConnectClaude = async () => {
    setIsConnectingClaude(true);
    try {
      await claude.connect();
    } finally {
      setIsConnectingClaude(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 w-full p-4">
      {/* Claude.ai Connection */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Claude.ai
        </div>
        <div className="bg-[#0a0a0a] rounded-xl overflow-hidden">
          {claude.isConnected ? (
            <div className="p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#d4a574] flex items-center justify-center">
                  <span className="text-sm font-bold text-black">C</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-green-500">
                    Connected
                  </div>
                  <div className="text-xs text-neutral-600">
                    Pro plan usage tracking active
                  </div>
                </div>
              </div>
              <button
                className="w-full h-10 bg-red-500/10 text-red-500 rounded-lg font-medium hover:bg-red-500/20 transition-colors"
                onClick={() => claude.disconnect()}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center">
                  <span className="text-sm font-bold text-neutral-500">C</span>
                </div>
                <div>
                  <div className="text-sm font-medium">Not connected</div>
                  <div className="text-xs text-neutral-600">
                    Connect to track Claude Pro usage
                  </div>
                </div>
              </div>
              <button
                className="w-full h-10 bg-[#d4a574] text-black rounded-lg font-medium hover:bg-[#c49564] disabled:opacity-60 flex items-center justify-center transition-colors"
                onClick={handleConnectClaude}
                disabled={isConnectingClaude}
              >
                {isConnectingClaude ? (
                  <div className="i-svg-spinners-3-dots-fade" />
                ) : (
                  "Connect Claude"
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Spotify Connection */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Spotify
        </div>
        <div className="bg-[#0a0a0a] rounded-xl overflow-hidden">
          {spotifyStatus.connected ? (
            <div className="p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="i-bx-bxl-spotify text-[#1db954] text-2xl" />
                <div>
                  <div className="text-sm font-medium text-green-500">
                    Connected
                  </div>
                  <div className="text-xs text-neutral-600">
                    Token expires{" "}
                    {spotifyStatus.expiresAt
                      ? new Date(spotifyStatus.expiresAt).toLocaleTimeString()
                      : "soon"}
                  </div>
                </div>
              </div>
              <button
                className="w-full h-10 bg-red-500/10 text-red-500 rounded-lg font-medium hover:bg-red-500/20 transition-colors"
                onClick={handleDisconnectSpotify}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="i-bx-bxl-spotify text-neutral-600 text-2xl" />
                <div>
                  <div className="text-sm font-medium">Not connected</div>
                  <div className="text-xs text-neutral-600">
                    Connect to enable music mode
                  </div>
                </div>
              </div>
              <button
                className="w-full h-10 bg-[#1db954] text-white rounded-lg font-medium hover:bg-[#1ed760] disabled:opacity-60 flex items-center justify-center transition-colors"
                onClick={handleConnectSpotify}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <div className="i-svg-spinners-3-dots-fade" />
                ) : (
                  "Connect Spotify"
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Model Selection */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          AI Model
        </div>
        <div className="bg-[#0a0a0a] rounded-xl overflow-hidden">
          {settings.isLoading ? (
            <div className="h-11 flex items-center justify-center">
              <div className="i-svg-spinners-3-dots-fade text-neutral-500" />
            </div>
          ) : (
            settings.availableModels.map((model, i) => (
              <div
                key={model.id}
                className={clsx(
                  "h-11 flex items-center justify-between px-4 cursor-pointer transition-colors",
                  settings.activeModelId === model.id
                    ? "bg-[#111]"
                    : "hover:bg-[#111]",
                  i > 0 && "border-t border-[#1a1a1a]",
                )}
                onClick={() => settings.setActiveModel(model.id)}
              >
                <span className="text-sm font-medium">{model.name}</span>
                {settings.activeModelId === model.id && (
                  <div className="i-bx-check text-green-500" />
                )}
              </div>
            ))
          )}
        </div>
        <div className="text-xs text-neutral-600 px-1">
          All models via OpenRouter
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Keyboard Shortcuts
        </div>
        <div className="bg-[#0a0a0a] rounded-xl overflow-hidden p-4">
          <div className="grid grid-cols-1 gap-y-2 text-sm">
            {[
              ["Toggle music mode", "Space"],
              ["Stop animation", "Esc"],
              ["Brightness up", "\u2191"],
              ["Brightness down", "\u2193"],
              ["Brightness preset", "1-9"],
              ["Lights off", "0"],
              ["Next song", "N"],
              ["Play/pause", "P"],
            ].map(([label, key]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-neutral-500">{label}</span>
                <kbd className="px-2 py-0.5 bg-[#111] rounded text-xs text-neutral-400 border border-[#1a1a1a]">
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Diagnostics */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Diagnostics
        </div>
        <div className="bg-[#0a0a0a] rounded-xl overflow-hidden">
          <div
            className="h-11 flex items-center space-x-3 hover:bg-[#111] px-4 cursor-pointer transition-colors"
            onClick={async () =>
              console.log(await window.main.invoke("getAllLights"))
            }
          >
            <div className="i-bx-bulb text-neutral-500" />
            <div className="text-sm font-medium">Output light details</div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="space-y-2 pb-4">
        <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          About
        </div>
        <div className="bg-[#0a0a0a] rounded-xl overflow-hidden">
          <div
            className="h-11 flex items-center space-x-3 hover:bg-[#111] px-4 cursor-pointer transition-colors"
            onClick={() =>
              window.main.invoke(
                "openExternal",
                "https://github.com/fradiation/labctrl",
              )
            }
          >
            <div className="i-bx-bxl-github text-neutral-500" />
            <div className="text-sm font-medium">View on GitHub</div>
          </div>
        </div>
      </div>
    </div>
  );
}
