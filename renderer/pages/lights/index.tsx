import React, { Fragment, ReactNode, useRef, useState } from "react";
import {
  Box,
  Chip,
  Card,
  CardContent,
  Stack,
  Button,
  ButtonProps,
  Grid,
  TextField,
  Typography,
  Slider,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  Checkbox,
  AccordionDetails,
  Popover,
  ButtonBase,
} from "@mui/material";
import Color from "color";
import { lifx } from "services/remote";
import MovieIcon from "@mui/icons-material/MovieOutlined";
import CasinoIcon from "@mui/icons-material/CasinoOutlined";
import LightModeIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeIcon from "@mui/icons-material/DarkModeOutlined";
import WorkIcon from "@mui/icons-material/WorkOutlineOutlined";
import { useRouter } from "next/router";
import { ChromePicker, ColorResult } from "react-color";
import { useSnapshot } from "valtio";
import app from "services/app";
import { map } from "lodash";

const LightPanelButton = (
  props: { icon?: ReactNode; title?: string; onEdit?: () => void } & ButtonProps
) => {
  const { icon, title, sx, variant, onEdit, ...rest } = props;

  return (
    <Button
      variant={"contained"}
      color={"secondary"}
      {...rest}
      sx={{
        p: 2,
        overflow: "hidden",
        width: "50%",
        height: 56,
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        justifyContent: "space-between",
        ...sx,
      }}
    >
      <Stack direction={"row"} justifyContent={"space-between"}>
        <Box>{icon}</Box>
        {onEdit && (
          <Chip
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit?.();
            }}
            label={"Edit"}
          />
        )}
      </Stack>
      <Typography textAlign={"left"}>{title}</Typography>
    </Button>
  );
};

const ColorButton = (props: {
  color: string;
  onChange: (color: ColorResult) => void;
}) => {
  const { color, onChange } = props;

  const el = useRef<HTMLButtonElement>(null);
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <ButtonBase
        ref={el}
        onClick={() => setOpen((x) => !x)}
        sx={{
          width: 100,
          height: 32,
          background: color,
          borderRadius: 1,
        }}
      />
      <Popover
        anchorEl={el.current}
        open={isOpen}
        onClose={() => setOpen(false)}
      >
        <ChromePicker disableAlpha color={color} onChange={onChange} />
      </Popover>
    </>
  );
};

const AddThemeButton = () => {
  const [input, setInput] = useState("");

  return (
    <Stack direction={"row"} alignItems={"center"}>
      <TextField
        variant="filled"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
        }}
        fullWidth
        InputProps={{
          endAdornment: (
            <Button
              variant={"contained"}
              onClick={() => {
                app.state.lights.themes[input] = [
                  { filter: "", color: [Math.random() * 360, 100, 60] },
                ];
                setInput("");
              }}
            >
              Add
            </Button>
          ),
        }}
      />
    </Stack>
  );
};

const LightsPage = (props: {}) => {
  const router = useRouter();
  const snap = useSnapshot(app.state);

  return (
    <Box paddingX={2} flex={1}>
      <Stack direction={"row"} spacing={1}>
        <LightPanelButton
          onClick={async () => {
            lifx.turnOn();
          }}
          icon={<LightModeIcon />}
          title={"On"}
        />
        <LightPanelButton
          onClick={async () => {
            lifx.turnOff();
          }}
          icon={<DarkModeIcon />}
          title={"Off"}
        />
      </Stack>
      <Box sx={{ paddingY: 2, flex: 1 }}>
        {map(snap.lights.themes, (theme, name) => (
          <Accordion key={name}>
            <AccordionSummary>
              <Stack direction={"row"} alignItems={"center"}>
                <Checkbox
                  checked={snap.lights.currentTheme === name}
                  onChange={(e, checked) => {
                    if (checked) app.state.lights.currentTheme = name;
                  }}
                />
                <Typography>{name}</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              {map(theme, (x, i) => (
                <Fragment key={i}>
                  <Stack direction={"row"} alignItems={"center"} spacing={2}>
                    <TextField
                      variant="standard"
                      value={x.filter}
                      fullWidth
                      onChange={(e) => {
                        app.state.lights.themes[name][i].filter =
                          e.target.value;
                      }}
                    />
                    <ColorButton
                      color={Color.hsl(x.color[0], x.color[1], x.color[2])
                        .hsl()
                        .string()}
                      onChange={(col) => {
                        app.state.lights.themes[name][i].color[0] = col.hsl.h;
                        app.state.lights.themes[name][i].color[1] =
                          col.hsl.s * 100;
                        app.state.lights.themes[name][i].color[2] =
                          col.hsl.l * 100;
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={() => {
                        app.state.lights.themes[name].splice(i, 1);
                      }}
                    >
                      -
                    </Button>
                  </Stack>
                </Fragment>
              ))}
              <Button
                variant="contained"
                onClick={() => {
                  app.state.lights.themes[name].push({
                    filter: "",
                    color: [Math.random() * 360, 100, 50],
                  });
                }}
              >
                Add Setting
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  delete app.state.lights.themes[name];
                }}
              >
                Remove
              </Button>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      <Box
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingX: 4,
          paddingY: 2,
        }}
      >
        <AddThemeButton />
      </Box>
    </Box>
  );
};

export default LightsPage;
