import { useEffect } from "react";
import { useLighting, useMusicMode } from "@renderer/stores";

export function useKeyboardShortcuts() {
  const lighting = useLighting();
  const musicMode = useMusicMode();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Check for modifier keys
      const isMod = e.ctrlKey || e.metaKey;

      switch (e.key.toLowerCase()) {
        // Space - toggle music mode
        case " ":
          if (!isMod) {
            e.preventDefault();
            if (musicMode.isActive) {
              musicMode.deactivate();
            } else {
              musicMode.activate();
            }
          }
          break;

        // Arrow Up - increase brightness
        case "arrowup":
          if (!isMod) {
            e.preventDefault();
            const newBrightness = Math.min(1, lighting.relativeBrightness + 0.1);
            lighting.setRelativeBrightness(newBrightness);
          }
          break;

        // Arrow Down - decrease brightness
        case "arrowdown":
          if (!isMod) {
            e.preventDefault();
            const newBrightness = Math.max(0, lighting.relativeBrightness - 0.1);
            lighting.setRelativeBrightness(newBrightness);
          }
          break;

        // 1-9 - quick brightness presets
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          if (!isMod) {
            const level = parseInt(e.key) / 10;
            lighting.setRelativeBrightness(level);
          }
          break;

        // 0 - turn lights off
        case "0":
          if (!isMod) {
            window.main.invoke("turnLightsOff");
          }
          break;

        // Escape - stop animation
        case "escape":
          if (lighting.isAnimating) {
            lighting.stopAnimation();
          }
          break;

        // n - skip to next song (when music mode active)
        case "n":
          if (!isMod && musicMode.isActive) {
            window.main.invoke("skipToNextSongOnSpotify");
          }
          break;

        // p - toggle play/pause (when music mode active)
        case "p":
          if (!isMod && musicMode.isActive) {
            window.main.invoke(
              "toggleSongPlayingOnSpotify",
              !musicMode.playing?.isPlaying
            );
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lighting, musicMode]);
}
