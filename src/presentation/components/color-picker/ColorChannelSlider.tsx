interface ColorChannelSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  displayValue: string;
  gradient: string;
  onChange: (value: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function ColorChannelSlider({
  label,
  value,
  min,
  max,
  step = 1,
  displayValue,
  gradient,
  onChange,
  onDragStart,
  onDragEnd,
}: ColorChannelSliderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[10px] text-zinc-400">
        <span>{label}</span>
        <span className="font-mono text-zinc-300">{displayValue}</span>
      </div>
      <div
        className="relative h-3 rounded border border-zinc-700"
        style={{ background: gradient }}
      >
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerDown={() => onDragStart?.()}
          onPointerUp={() => onDragEnd?.()}
          onPointerCancel={() => onDragEnd?.()}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-transparent [&::-webkit-slider-thumb]:shadow"
        />
      </div>
    </div>
  );
}
