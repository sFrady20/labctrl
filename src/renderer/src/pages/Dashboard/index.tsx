import { useEffect } from "react";
import { MusicMode } from "@renderer/components/lighting/MusicMode";
import { useClaude } from "@renderer/stores";
import { ClaudeUsageCard } from "./ClaudeUsageCard";

export default function DashboardPage() {
  const claude = useClaude();

  useEffect(() => {
    claude.checkConnection();
  }, []);

  // Auto-refresh Claude usage every 5 minutes
  useEffect(() => {
    if (!claude.isConnected) return;
    const interval = setInterval(
      () => {
        claude.fetchUsage();
      },
      5 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, [claude.isConnected]);

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4">
      {/* Claude Usage */}
      <ClaudeUsageCard />

      {/* Music Mode */}
      <MusicMode />
    </div>
  );
}
