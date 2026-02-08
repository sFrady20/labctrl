import { useState, useEffect } from "react";
import clsx from "clsx";

export default function TitleBar() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    // Get initial state
    window.windowControls.isMaximized().then(setMaximized);

    // Listen for changes pushed from the main process
    const unsubscribe = window.windowControls.onMaximizedChange(setMaximized);
    return unsubscribe;
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-8 bg-black flex items-center justify-end select-none titlebar-drag"
      onDoubleClick={() => window.windowControls.maximize()}
    >
      {/* Minimize */}
      <button
        onClick={() => window.windowControls.minimize()}
        className="titlebar-nodrag w-11 h-full flex items-center justify-center text-neutral-500 hover:text-neutral-200 hover:bg-white/10 transition-colors"
      >
        <div className="i-bx-minus text-base" />
      </button>

      {/* Maximize / Restore */}
      <button
        onClick={() => window.windowControls.maximize()}
        className="titlebar-nodrag w-11 h-full flex items-center justify-center text-neutral-500 hover:text-neutral-200 hover:bg-white/10 transition-colors"
      >
        <div
          className={clsx(
            "text-xs",
            maximized ? "i-bx-exit-fullscreen" : "i-bx-fullscreen",
          )}
        />
      </button>

      {/* Close */}
      <button
        onClick={() => window.windowControls.close()}
        className="titlebar-nodrag w-11 h-full flex items-center justify-center text-neutral-500 hover:text-white hover:bg-red-600 transition-colors"
      >
        <div className="i-bx-x text-lg" />
      </button>
    </div>
  );
}
