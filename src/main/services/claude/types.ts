export type ClaudeUsageData = {
  fiveHour: {
    utilization: number;
    resetsAt: string | null;
  };
  sevenDay: {
    utilization: number;
    resetsAt: string | null;
  };
};
