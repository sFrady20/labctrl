import { useEffect } from "react";
import { TimerBasedCronScheduler as scheduler } from "cron-schedule/schedulers/timer-based.js";
import { parseCronExpression } from "cron-schedule";

export default function useCronSchedule(cron: string, fn: () => void) {
  useEffect(() => {
    const interval = scheduler.setInterval(parseCronExpression(cron), fn);
    return () => {
      scheduler.clearTimeoutOrInterval(interval);
    };
  });
}
