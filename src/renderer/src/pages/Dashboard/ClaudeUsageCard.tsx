import { useClaude } from "@renderer/stores";
import clsx from "clsx";

function UsageBar({
  label,
  percentage,
  resetsAt,
}: {
  label: string;
  percentage: number;
  resetsAt: string | null;
}) {
  const getTimeRemaining = () => {
    if (!resetsAt) return null;
    const diff = new Date(resetsAt).getTime() - Date.now();
    if (diff <= 0) return "Resetting...";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const level =
    percentage >= 90 ? "danger" : percentage >= 75 ? "warning" : "normal";
  const barColor =
    level === "danger"
      ? "bg-red-500"
      : level === "warning"
        ? "bg-orange-500"
        : "bg-purple-500";

  const timeRemaining = getTimeRemaining();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-500">{label}</span>
        <div className="flex items-center space-x-2">
          {timeRemaining && (
            <span className="text-[10px] text-neutral-600">
              {timeRemaining}
            </span>
          )}
          <span
            className={clsx(
              "text-xs font-semibold",
              level === "danger"
                ? "text-red-500"
                : level === "warning"
                  ? "text-orange-500"
                  : "text-neutral-400",
            )}
          >
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div
          className={clsx(
            "h-full rounded-full transition-all duration-500",
            barColor,
          )}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  );
}

export function ClaudeUsageCard() {
  const claude = useClaude();

  if (!claude.isConnected) {
    return (
      <div className="bg-[#0a0a0a] rounded-xl p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-full bg-[#d4a574] flex items-center justify-center">
            <span className="text-[10px] font-bold text-black">C</span>
          </div>
          <span className="text-sm font-medium">Claude Usage</span>
        </div>
        <div className="text-xs text-neutral-500">
          Connect in Settings to track your Claude Pro usage
        </div>
      </div>
    );
  }

  if (claude.isLoading && !claude.usage) {
    return (
      <div className="bg-[#0a0a0a] rounded-xl p-4">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-full bg-[#d4a574] flex items-center justify-center">
            <span className="text-[10px] font-bold text-black">C</span>
          </div>
          <span className="text-sm font-medium">Claude Usage</span>
          <div className="i-svg-spinners-3-dots-fade text-neutral-500 text-xs" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-full bg-[#d4a574] flex items-center justify-center">
            <span className="text-[10px] font-bold text-black">C</span>
          </div>
          <span className="text-sm font-medium">Claude Usage</span>
        </div>
        <button
          className="p-1.5 rounded-lg hover:bg-[#1a1a1a] transition-colors text-neutral-500 hover:text-neutral-300"
          onClick={() => claude.fetchUsage()}
          disabled={claude.isLoading}
        >
          <div
            className={clsx(
              "i-bx-refresh text-sm",
              claude.isLoading && "animate-spin",
            )}
          />
        </button>
      </div>

      {claude.usage && (
        <div className="space-y-3">
          <UsageBar
            label="Session (5hr)"
            percentage={claude.usage.fiveHour.utilization}
            resetsAt={claude.usage.fiveHour.resetsAt}
          />
          <UsageBar
            label="Weekly (7day)"
            percentage={claude.usage.sevenDay.utilization}
            resetsAt={claude.usage.sevenDay.resetsAt}
          />
        </div>
      )}
    </div>
  );
}
