import { AnimatedPalette, AnimationEasing, LightingKeyframe } from "./types";
import { setLightingTheme } from "./index";

let currentAnimation: AnimatedPalette | null = null;
let animationTimer: NodeJS.Timeout | null = null;
let startTime: number = 0;
let relativeBrightness: number = 0.5;

function easeValue(t: number, easing: AnimationEasing): number {
  switch (easing) {
    case "linear":
      return t;
    case "ease-in":
      return t * t;
    case "ease-out":
      return t * (2 - t);
    case "ease-in-out":
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    default:
      return t;
  }
}

function interpolateValue(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function interpolateInstructions(
  from: string[][],
  to: string[][],
  t: number
): string[][] {
  return from.map((fromInstr, i) => {
    const toInstr = to[i] || fromInstr;
    return [
      fromInstr[0], // lightId stays the same
      String(interpolateValue(parseFloat(fromInstr[1]), parseFloat(toInstr[1]), t)), // hue
      String(interpolateValue(parseFloat(fromInstr[2]), parseFloat(toInstr[2]), t)), // saturation
      String(interpolateValue(parseFloat(fromInstr[3]), parseFloat(toInstr[3]), t)), // brightness
      String(interpolateValue(parseFloat(fromInstr[4]), parseFloat(toInstr[4]), t)), // kelvin
      fromInstr[5] || "0", // duration
    ];
  });
}

function findKeyframes(
  keyframes: LightingKeyframe[],
  progress: number
): { from: LightingKeyframe; to: LightingKeyframe; localT: number } {
  // Sort keyframes by time
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  // Find surrounding keyframes
  let fromIdx = 0;
  let toIdx = 0;

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].time <= progress) {
      fromIdx = i;
    }
    if (sorted[i].time >= progress && toIdx === 0) {
      toIdx = i;
      break;
    }
  }

  // Handle edge cases
  if (toIdx === 0) toIdx = sorted.length - 1;
  if (fromIdx === toIdx) {
    // At exact keyframe or between last and first (wrap around)
    if (fromIdx === sorted.length - 1) {
      toIdx = 0;
    } else {
      toIdx = fromIdx + 1;
    }
  }

  const from = sorted[fromIdx];
  const to = sorted[toIdx];

  // Calculate local progress between these two keyframes
  let localT: number;
  if (to.time > from.time) {
    localT = (progress - from.time) / (to.time - from.time);
  } else {
    // Wrap around case
    const totalRange = 1 - from.time + to.time;
    if (progress >= from.time) {
      localT = (progress - from.time) / totalRange;
    } else {
      localT = (1 - from.time + progress) / totalRange;
    }
  }

  return { from, to, localT: Math.max(0, Math.min(1, localT)) };
}

function tick(): void {
  if (!currentAnimation) return;

  const elapsed = Date.now() - startTime;
  let progress = (elapsed % currentAnimation.duration) / currentAnimation.duration;

  // Apply easing
  progress = easeValue(progress, currentAnimation.easing);

  // Find keyframes and interpolate
  const { from, to, localT } = findKeyframes(currentAnimation.keyframes, progress);
  const interpolated = interpolateInstructions(
    from.instructions,
    to.instructions,
    localT
  );

  // Apply the interpolated theme
  setLightingTheme(
    {
      id: currentAnimation.id,
      name: currentAnimation.name,
      instructions: interpolated,
    },
    { relativeBrightness }
  );

  // Check if we should stop (non-looping animation)
  if (!currentAnimation.loop && elapsed >= currentAnimation.duration) {
    stopAnimation();
    return;
  }

  // Schedule next tick (target ~30fps for smooth transitions)
  animationTimer = setTimeout(tick, 33);
}

export function startAnimation(
  palette: AnimatedPalette,
  brightness: number = 0.5
): void {
  stopAnimation();

  if (!palette.keyframes || palette.keyframes.length < 2) {
    console.error("Animated palette needs at least 2 keyframes");
    return;
  }

  currentAnimation = palette;
  relativeBrightness = brightness;
  startTime = Date.now();

  console.log(`Starting animation: ${palette.name}`);
  tick();
}

export function stopAnimation(): void {
  if (animationTimer) {
    clearTimeout(animationTimer);
    animationTimer = null;
  }
  currentAnimation = null;
  console.log("Animation stopped");
}

export function isAnimationRunning(): boolean {
  return currentAnimation !== null;
}

export function getCurrentAnimation(): AnimatedPalette | null {
  return currentAnimation;
}

export function setAnimationBrightness(brightness: number): void {
  relativeBrightness = brightness;
}
