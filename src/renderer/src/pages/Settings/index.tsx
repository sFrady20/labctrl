import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useSettings } from "@renderer/stores";
import clsx from "clsx";

export default function SettingsPage() {
  const navigate = useNavigate();
  const settings = useSettings();
  const [spotifyStatus, setSpotifyStatus] = useState<{
    connected: boolean;
    expiresAt: number | null;
  }>({ connected: false, expiresAt: null });
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    settings.loadSettings();
    loadSpotifyStatus();
  }, []);

  const loadSpotifyStatus = async () => {
    const status = await window.main.invoke("getSpotifyAuthStatus");
    setSpotifyStatus(status);
  };

  const handleConnectSpotify = async () => {
    setIsConnecting(true);
    try {
      const success = await window.main.invoke("initiateSpotifyAuth");
      if (success) {
        await loadSpotifyStatus();
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectSpotify = async () => {
    await window.main.invoke("disconnectSpotify");
    await loadSpotifyStatus();
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 w-full p-4">
      <div
        className="w-11 h-11 flex items-center justify-center rounded-lg cursor-pointer hover:bg-gray-900"
        onClick={() => navigate(-1)}
      >
        <div className="i-bx-arrow-back" />
      </div>

      {/* Spotify Connection */}
      <div className="space-y-3">
        <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Spotify
        </div>
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          {spotifyStatus.connected ? (
            <div className="p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="i-bx-bxl-spotify text-[#1db954] text-2xl" />
                <div>
                  <div className="text-sm font-medium text-green-500">
                    Connected
                  </div>
                  <div className="text-xs text-gray-500">
                    Token expires{" "}
                    {spotifyStatus.expiresAt
                      ? new Date(spotifyStatus.expiresAt).toLocaleTimeString()
                      : "soon"}
                  </div>
                </div>
              </div>
              <button
                className="w-full h-10 bg-red-500/20 text-red-500 rounded-lg font-medium hover:bg-red-500/30"
                onClick={handleDisconnectSpotify}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="i-bx-bxl-spotify text-gray-500 text-2xl" />
                <div>
                  <div className="text-sm font-medium">Not connected</div>
                  <div className="text-xs text-gray-500">
                    Connect to enable music mode
                  </div>
                </div>
              </div>
              <button
                className="w-full h-10 bg-[#1db954] text-white rounded-lg font-medium hover:bg-[#1ed760] disabled:opacity-60 flex items-center justify-center"
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
      <div className="space-y-3">
        <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          AI Model
        </div>
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          {settings.isLoading ? (
            <div className="h-11 flex items-center justify-center">
              <div className="i-svg-spinners-3-dots-fade" />
            </div>
          ) : (
            settings.availableModels.map((model) => (
              <div
                key={model.id}
                className={clsx(
                  "h-11 flex items-center justify-between px-4 cursor-pointer hover:bg-gray-800",
                  settings.activeModelId === model.id && "bg-gray-800"
                )}
                onClick={() => settings.setActiveModel(model.id)}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={clsx(
                      "w-2 h-2 rounded-full",
                      model.provider === "openai"
                        ? "bg-green-500"
                        : "bg-blue-500"
                    )}
                  />
                  <span className="text-sm font-medium">{model.name}</span>
                </div>
                {settings.activeModelId === model.id && (
                  <div className="i-bx-check text-green-500" />
                )}
              </div>
            ))
          )}
        </div>
        <div className="text-xs text-gray-500">
          <span className="inline-flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>OpenAI</span>
          </span>
          <span className="mx-2">|</span>
          <span className="inline-flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>OpenRouter</span>
          </span>
        </div>
      </div>

      {/* Device Control (Coming Soon) */}
      <div className="space-y-3">
        <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Device Control
        </div>
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="p-4 space-y-2">
            <div className="flex items-center space-x-3">
              <div className="i-bx-devices text-gray-500 text-xl" />
              <div>
                <div className="text-sm font-medium text-gray-400">
                  Coming Soon
                </div>
                <div className="text-xs text-gray-500">
                  Broadlink IR/RF device control
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostics */}
      <div className="space-y-3">
        <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Diagnostics
        </div>
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div
            className="h-11 flex items-center space-x-3 hover:bg-gray-800 px-4 cursor-pointer"
            onClick={async () =>
              console.log(await window.main.invoke("getAllLights"))
            }
          >
            <div className="i-bx-bulb text-gray-400" />
            <div className="text-sm font-medium">Output light details</div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="space-y-3">
        <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          About
        </div>
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div
            className="h-11 flex items-center space-x-3 hover:bg-gray-800 px-4 cursor-pointer"
            onClick={() =>
              window.main.invoke(
                "openExternal",
                "https://github.com/fradiation/labctrl"
              )
            }
          >
            <div className="i-bx-bxl-github text-gray-400" />
            <div className="text-sm font-medium">View on GitHub</div>
          </div>
        </div>
      </div>
    </div>
  );
}
