import { LightingTheme } from "./types";

export function parseLightingTheme(inputString: string) {
  inputString = inputString.replaceAll("`", "").replaceAll("\r", "");

  const instructionRegex =
    /.+? *, *\d{1,3} *, *\d{1,3} *, *\d{1,3} *, *\d{1,5} *, *\d{1,5} */;

  const nameLines = inputString
    .split("\n")
    .filter((x) => /.+/gi.test(x) && !instructionRegex.test(x));

  const instructionLines = inputString
    .split("\n")
    .filter((x) => instructionRegex.test(x));

  const theme: LightingTheme = {
    id: Math.random().toString(32).substring(7),
    name: nameLines[0],
    instructions: instructionLines.map((x) => x.split(",")),
  };
  return theme;
}
