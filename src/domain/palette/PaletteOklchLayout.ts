export const PALETTE_OKLCH_MAP_MAX_COLORS = 256;

export interface PaletteOklchCircleInput {
  id: string;
  hue: number;
  lightness: number;
}

export interface PaletteOklchCircleLayout {
  id: string;
  x: number;
  y: number;
  radius: number;
}

const PADDING = 8;
const MIN_RADIUS = 4;
const MAX_RADIUS = 14;
const PACK_DENSITY = 2.8;
const SPRING_STRENGTH = 0.05;
const MAX_ITERATIONS = 120;

interface CircleState {
  id: string;
  x: number;
  y: number;
  anchorX: number;
  anchorY: number;
  radius: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mapToAnchor(
  hue: number,
  lightness: number,
  innerWidth: number,
  innerHeight: number,
): { x: number; y: number } {
  const normalizedHue = ((hue % 360) + 360) % 360;
  return {
    x: PADDING + (normalizedHue / 360) * innerWidth,
    y: PADDING + (1 - clamp(lightness, 0, 1)) * innerHeight,
  };
}

function estimateRadius(count: number, innerWidth: number, innerHeight: number): number {
  if (count <= 0) return MIN_RADIUS;
  const areaBased = Math.sqrt((innerWidth * innerHeight) / (count * PACK_DENSITY * Math.PI));
  return clamp(areaBased, MIN_RADIUS, MAX_RADIUS);
}

function clampCircleToBounds(circle: CircleState, width: number, height: number): void {
  circle.x = clamp(circle.x, circle.radius, width - circle.radius);
  circle.y = clamp(circle.y, circle.radius, height - circle.radius);
}

function resolveCollisions(circles: CircleState[], width: number, height: number): void {
  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    let moved = false;

    for (const circle of circles) {
      const dx = circle.anchorX - circle.x;
      const dy = circle.anchorY - circle.y;
      circle.x += dx * SPRING_STRENGTH;
      circle.y += dy * SPRING_STRENGTH;
    }

    for (let i = 0; i < circles.length; i++) {
      for (let j = i + 1; j < circles.length; j++) {
        const a = circles[i];
        const b = circles[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.hypot(dx, dy);
        const minDist = a.radius + b.radius;

        if (dist === 0) {
          const angle = ((i * 7 + j * 13) % 360) * (Math.PI / 180);
          dx = Math.cos(angle) * 0.001;
          dy = Math.sin(angle) * 0.001;
          dist = Math.hypot(dx, dy);
        }

        if (dist < minDist) {
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x -= (nx * overlap) / 2;
          a.y -= (ny * overlap) / 2;
          b.x += (nx * overlap) / 2;
          b.y += (ny * overlap) / 2;
          moved = true;
        }
      }
    }

    for (const circle of circles) {
      clampCircleToBounds(circle, width, height);
    }

    if (!moved) break;
  }
}

export function computePaletteOklchLayout(
  inputs: PaletteOklchCircleInput[],
  width: number,
  height: number,
): PaletteOklchCircleLayout[] {
  if (inputs.length === 0 || width <= 0 || height <= 0) {
    return [];
  }

  const innerWidth = Math.max(width - PADDING * 2, 1);
  const innerHeight = Math.max(height - PADDING * 2, 1);
  const radius = estimateRadius(inputs.length, innerWidth, innerHeight);

  const circles: CircleState[] = inputs.map((input, index) => {
    const anchor = mapToAnchor(input.hue, input.lightness, innerWidth, innerHeight);
    const jitterAngle = (index * 37) % 360;
    const jitter = inputs.filter(
      (other, otherIndex) =>
        otherIndex < index &&
        other.hue === input.hue &&
        other.lightness === input.lightness,
    ).length;

    return {
      id: input.id,
      x: anchor.x + Math.cos((jitterAngle * Math.PI) / 180) * jitter * 0.5,
      y: anchor.y + Math.sin((jitterAngle * Math.PI) / 180) * jitter * 0.5,
      anchorX: anchor.x,
      anchorY: anchor.y,
      radius,
    };
  });

  for (const circle of circles) {
    clampCircleToBounds(circle, width, height);
  }

  resolveCollisions(circles, width, height);

  return circles.map((circle) => ({
    id: circle.id,
    x: Math.round(circle.x * 100) / 100,
    y: Math.round(circle.y * 100) / 100,
    radius: circle.radius,
  }));
}
