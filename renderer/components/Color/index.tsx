import React from "react";
import { useState, useEffect } from "react";
import { Button, Popover, TextField } from "@mui/material";
import { ChromePicker } from "react-color";
import Store from "electron-store";
import Color from "color";

const store = new Store({ name: "colors" });

interface Props {
  colors: { [label: string]: Color };
}

const ColorManager: React.FunctionComponent<Props> = (props) => {
  const [colors, setColors] = useState<{ [label: string]: Color }>(
    store.get("colors") || {}
  );
  const [colorPickerAnchor, setColorPickerAnchor] =
    useState<HTMLElement | null>(null);
  const [selectedColorLabel, setSelectedColorLabel] = useState<string | null>(
    null
  );

  useEffect(() => {
    store.set("colors", colors);
  }, [colors]);

  const handleColorChange = (color: Color) => {
    setColors({ ...colors, [selectedColorLabel!]: color });
  };

  const handleColorPickerOpen = (
    event: React.MouseEvent<HTMLElement>,
    label: string
  ) => {
    setSelectedColorLabel(label);
    setColorPickerAnchor(event.currentTarget);
  };

  const handleColorPickerClose = () => {
    setSelectedColorLabel(null);
    setColorPickerAnchor(null);
  };

  const handleAddColor = () => {
    // Generate a unique label for the new color
    const newLabel = `Color ${Object.keys(colors).length + 1}`;
    setColors({ ...colors, [newLabel]: Color.rgb(255, 255, 255) });
  };

  const handleRemoveColor = (label: string) => {
    // Create a new object with the color removed
    const newColors = { ...colors };
    delete newColors[label];
    setColors(newColors);
  };

  const handleEditLabel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = event.target.value;
    // Create a new object with the label changed
    const newColors = { ...colors };
    const color = newColors[selectedColorLabel!];
    delete newColors[selectedColorLabel!];
    newColors[newLabel] = color;
    setColors(newColors);
  };

  return (
    <>
      <Button variant="contained" onClick={handleAddColor}>
        Add Color
      </Button>
      {Object.keys(colors).map((label) => (
        <div key={label}>
          <TextField label="Label" value={label} onChange={handleEditLabel} />
          <Button
            variant="contained"
            style={{ backgroundColor: colors[label]?.hex }}
            onClick={(event) => handleColorPickerOpen(event, label)}
          >
            {label}
          </Button>
          <Button variant="contained" onClick={() => handleRemoveColor(label)}>
            Remove
          </Button>
        </div>
      ))}
      <Popover
        open={Boolean(colorPickerAnchor)}
        anchorEl={colorPickerAnchor}
        onClose={handleColorPickerClose}
      >
        {selectedColorLabel && (
          <ChromePicker
            color={colors[selectedColorLabel]}
            onChange={handleColorChange}
          />
        )}
      </Popover>
    </>
  );
};

export default ColorManager;
