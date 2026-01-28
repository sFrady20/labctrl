export function findBezierCurveY(x: number, y: number): number | null {
  const controlPoint1 = {
    x: 0.5,
    y: y,
  };

  const controlPoint2 = {
    x: 1,
    y: 1,
  };

  const t = x; // Parameterize the x-value

  if (t >= 0 && t <= 1) {
    const y0 = 0;
    const y1 = controlPoint1.y;
    const y2 = controlPoint2.y;
    const y3 = 1;

    // Calculate the y-coordinate on the bezier curve using the cubic bezier formula
    const yCoordinate =
      y0 * Math.pow(1 - t, 3) +
      3 * y1 * t * Math.pow(1 - t, 2) +
      3 * y2 * Math.pow(t, 2) * (1 - t) +
      y3 * Math.pow(t, 3);

    return yCoordinate;
  }

  return null; // Return null if x is outside the range [0, 1]
}
