interface PaletteSaturationRingProps {
  saturation: number;
  diameter: number;
}

const RING_VIEW_SIZE = 100;
const RING_WHITE = "#ffffff";

export function PaletteSaturationRing({
  saturation,
  diameter,
}: PaletteSaturationRingProps) {
  if (diameter < 12) return null;

  const clampedSaturation = Math.min(100, Math.max(0, saturation));
  const strokeWidth = Math.max(1.2, diameter * 0.1);
  const normalizedStroke = (strokeWidth / diameter) * RING_VIEW_SIZE;
  const radius = RING_VIEW_SIZE / 2 - normalizedStroke * 0.55;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clampedSaturation / 100);

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      viewBox={`0 0 ${RING_VIEW_SIZE} ${RING_VIEW_SIZE}`}
      aria-hidden
    >
      <circle
        cx={RING_VIEW_SIZE / 2}
        cy={RING_VIEW_SIZE / 2}
        r={radius}
        fill="none"
        stroke={RING_WHITE}
        strokeOpacity={0.35}
        strokeWidth={normalizedStroke}
      />
      {clampedSaturation > 0 && (
        <circle
          cx={RING_VIEW_SIZE / 2}
          cy={RING_VIEW_SIZE / 2}
          r={radius}
          fill="none"
          stroke={RING_WHITE}
          strokeWidth={normalizedStroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${RING_VIEW_SIZE / 2} ${RING_VIEW_SIZE / 2})`}
        />
      )}
    </svg>
  );
}
