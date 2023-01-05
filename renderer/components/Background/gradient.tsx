import seedrandom from "seedrandom";

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

type Point = {
  x: number;
  y: number;
  h: number;
  s: number;
  l: number;
  scale: number;
};

type EasingOptions = {
  easing?: (x: number) => number;
  easingStops?: number;
};

type PointGenerationOptions = {
  seed?: string;
  pointCount?: number;
  scaleRange?: [number, number];
  hueRange?: [number, number];
  saturationRange?: [number, number];
  lightnessRange?: [number, number];
  pointsGenerator?: (options: PointGenerationOptions) => Point[];
};

type FradientOptions = EasingOptions &
  ({ points: Point[] } | PointGenerationOptions);

function defaultPointsGenerator(options?: PointGenerationOptions) {
  const {
    seed,
    pointCount = 8,
    hueRange = [0, 360],
    saturationRange = [0.5, 0.8],
    lightnessRange = [0.4, 0.6],
    scaleRange = [0.5, 0.7],
  } = options || {};

  const rng = seed ? seedrandom(seed) : Math.random;

  const points: Point[] = [];

  for (var i = 0; i < pointCount; ++i) {
    points.push({
      x: rng(),
      y: rng(),
      h:
        (hueRange[1] > hueRange[0]
          ? rng() * (hueRange[1] - hueRange[0]) + hueRange[0]
          : rng() * (hueRange[1] + 360 - hueRange[0]) + hueRange[1]) % 360,
      s: rng() * (saturationRange[1] - saturationRange[0]) + saturationRange[0],
      l: rng() * (lightnessRange[1] - lightnessRange[0]) + lightnessRange[0],
      scale: rng() * (scaleRange[1] - scaleRange[0]) + scaleRange[0],
    });
  }

  return points;
}

const fradient = (options?: FradientOptions) => {
  const { easing = easeInOutCubic, easingStops = 10 } = options || {};

  let points: Point[] = [];
  if ("points" in options) {
    points = [...points];
  } else {
    const { pointsGenerator = defaultPointsGenerator } = options || {};
    points = pointsGenerator(options);
  }
  const bg = points[0];

  const image = `${points.map(
    (pt) =>
      `radial-gradient(at ${pt.x * 100}% ${pt.y * 100}%, ${[
        ...Array(easingStops),
      ]
        .map((_, x) => x / (easingStops - 1))
        .map(
          (x) =>
            `hsla(${pt.h % 360}, ${pt.s * 100}%, ${pt.l * 100}%, ${easing(
              1 - x
            )}) ${x * pt.scale * 100}%`
        )
        .join(", ")})`
  )}, linear-gradient(hsla(${bg.h % 360}, ${bg.s * 100}%, ${
    bg.l * 100
  }%, 1), hsla(${bg.h % 360}, ${bg.s * 100}%, ${bg.l * 100}%, 1))`;

  return image;
};

export default fradient;
