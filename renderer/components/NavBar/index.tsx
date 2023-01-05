import React from "react";
import { IconButton, Stack, Tabs, Tab, Card } from "@mui/material";
import { app } from "services/remote";
import CloseIcon from "@mui/icons-material/CloseOutlined";
import HomeIcon from "@mui/icons-material/Home";
import TaskIcon from "@mui/icons-material/Task";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import { useRouter } from "next/router";

const routes = ["/home", "/lights", "/tasks"];

const NavBar = (props: { lights: any[] }) => {
  const router = useRouter();

  return (
    <Stack
      direction="row"
      alignItems={"center"}
      justifyContent={"space-between"}
      spacing={2}
      position={"sticky"}
      top={0}
      p={2}
      sx={{
        WebkitUserSelect: "none",
        WebkitAppRegion: "drag",

        ["& > *"]: {
          WebkitAppRegion: "no-drag",
        },
      }}
    >
      <Stack direction="row" spacing={2} flexShrink={1}>
        <Card>
          <Tabs value={routes.indexOf(router.route)} visibleScrollbar>
            <Tab icon={<HomeIcon />} onClick={() => router.push(routes[0])} />
            <Tab
              icon={<LightbulbIcon />}
              onClick={() => router.push(routes[1])}
            />
            <Tab icon={<TaskIcon />} onClick={() => router.push(routes[2])} />
          </Tabs>
        </Card>
      </Stack>

      <Stack direction="row">
        <IconButton
          onClick={async () => {
            app.quit();
          }}
        >
          <CloseIcon />
        </IconButton>
      </Stack>
    </Stack>
  );
};

export default NavBar;
