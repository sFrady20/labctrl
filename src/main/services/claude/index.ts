import { claudeFetch, getOrganizationId } from "./auth";
import type { ClaudeUsageData } from "./types";

export {
  initiateClaudeAuth,
  disconnectClaude,
  getClaudeAuthStatus,
} from "./auth";

export const getClaudeUsage = async (): Promise<ClaudeUsageData | null> => {
  const organizationId = getOrganizationId();

  if (!organizationId) {
    return null;
  }

  try {
    const data = await claudeFetch(
      `https://claude.ai/api/organizations/${organizationId}/usage`,
    );

    return {
      fiveHour: {
        utilization: data.five_hour?.utilization || 0,
        resetsAt: data.five_hour?.resets_at || null,
      },
      sevenDay: {
        utilization: data.seven_day?.utilization || 0,
        resetsAt: data.seven_day?.resets_at || null,
      },
    };
  } catch (error: any) {
    if (error.status === 401 || error.status === 403) {
      console.log("Claude session expired");
    }
    console.error("Failed to fetch Claude usage:", error.message);
    return null;
  }
};
