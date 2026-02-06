import { BrowserWindow, net, session } from "electron";
import Store from "electron-store";

const store = new Store({ name: "claude-auth" });

/**
 * Fetch wrapper that uses Electron's net module so all cookies
 * from the default session are sent automatically (just like a browser tab).
 */
export const claudeFetch = async (url: string): Promise<any> => {
  const response = await net.fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!response.ok) {
    const err: any = new Error(`Claude API ${response.status}`);
    err.status = response.status;
    throw err;
  }

  return response.json();
};

export const initiateClaudeAuth = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    const loginWindow = new BrowserWindow({
      width: 800,
      height: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    loginWindow.loadURL("https://claude.ai");

    let hasLoggedIn = false;
    let checkInterval: NodeJS.Timeout | null = null;

    const checkLoginStatus = async () => {
      if (hasLoggedIn || loginWindow.isDestroyed()) return;

      try {
        // Check if the sessionKey cookie exists (signals user has logged in)
        const cookies = await session.defaultSession.cookies.get({
          url: "https://claude.ai",
          name: "sessionKey",
        });

        if (cookies.length > 0) {
          try {
            // Use net.fetch so the full cookie jar is sent automatically
            const orgs = await claudeFetch(
              "https://claude.ai/api/organizations",
            );

            if (Array.isArray(orgs) && orgs.length > 0) {
              const orgId = orgs[0].uuid || orgs[0].id;

              if (orgId) {
                hasLoggedIn = true;
                if (checkInterval) clearInterval(checkInterval);

                // Only store the org ID — cookies are managed by Chromium's cookie jar
                store.set("organizationId", orgId);

                if (!loginWindow.isDestroyed()) loginWindow.close();
                resolve(true);
              }
            }
          } catch {
            // API not ready yet, will retry
          }
        }
      } catch (error) {
        console.error("Claude auth check error:", error);
      }
    };

    loginWindow.webContents.on("did-finish-load", checkLoginStatus);
    loginWindow.webContents.on("did-navigate", checkLoginStatus);
    checkInterval = setInterval(checkLoginStatus, 2000);

    loginWindow.on("closed", () => {
      if (checkInterval) clearInterval(checkInterval);
      if (!hasLoggedIn) resolve(false);
    });
  });
};

export const disconnectClaude = async (): Promise<void> => {
  store.delete("organizationId");
  try {
    await session.defaultSession.cookies.remove(
      "https://claude.ai",
      "sessionKey",
    );
  } catch {
    // ignore
  }
};

export const getClaudeAuthStatus = async (): Promise<{
  connected: boolean;
  organizationId: string | null;
}> => {
  const organizationId = store.get("organizationId") as string | undefined;

  if (!organizationId) {
    return { connected: false, organizationId: null };
  }

  // Verify session cookie still exists
  try {
    const cookies = await session.defaultSession.cookies.get({
      url: "https://claude.ai",
      name: "sessionKey",
    });
    return {
      connected: cookies.length > 0,
      organizationId: cookies.length > 0 ? organizationId : null,
    };
  } catch {
    return { connected: false, organizationId: null };
  }
};

export const getOrganizationId = (): string | null => {
  return (store.get("organizationId") as string) || null;
};
