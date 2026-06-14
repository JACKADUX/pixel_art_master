import { useEffect, useRef, useState } from "react";
import { focusCanvasKeyboard } from "@/presentation/utils/canvasKeyboardFocus";

const NUMERIC_WIDTH_CLASS = "w-[3ch]";

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
  parseInput?: (text: string) => number | null;
}

function splitDisplayValue(displayValue: string): { numeric: string; suffix: string } {
  if (displayValue.endsWith("°")) {
    return { numeric: displayValue.slice(0, -1), suffix: "°" };
  }
  if (displayValue.endsWith("%")) {
    return { numeric: displayValue.slice(0, -1), suffix: "%" };
  }
  return { numeric: displayValue, suffix: "" };
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
  parseInput,
}: ColorChannelSliderProps) {
  const { numeric, suffix } = splitDisplayValue(displayValue);
  const [editing, setEditing] = useState(false);
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commitInput = () => {
    setEditing(false);
    if (!parseInput) return;
    const parsed = parseInput(inputText.trim());
    if (parsed === null || !Number.isFinite(parsed)) return;
    onChange(Math.min(max, Math.max(min, parsed)));
    focusCanvasKeyboard();
  };

  const cancelEdit = () => {
    setEditing(false);
    focusCanvasKeyboard();
  };

  const beginEdit = () => {
    if (!parseInput) return;
    setInputText(numeric);
    setEditing(true);
  };

  const valueDisplay = parseInput ? (
    editing ? (
      <input
        ref={inputRef}
        type="text"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onBlur={commitInput}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitInput();
          if (e.key === "Escape") cancelEdit();
        }}
        className={`h-5 shrink-0 rounded border border-blue-500 bg-zinc-800 px-0 text-right font-mono text-[10px] tabular-nums text-zinc-200 outline-none ${NUMERIC_WIDTH_CLASS}`}
        spellCheck={false}
      />
    ) : (
      <button
        type="button"
        title="点击编辑"
        onClick={beginEdit}
        className={`h-5 shrink-0 rounded px-0 text-right font-mono text-[10px] tabular-nums text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100 ${NUMERIC_WIDTH_CLASS}`}
      >
        {numeric}
      </button>
    )
  ) : (
    <span
      className={`text-right font-mono text-[10px] tabular-nums text-zinc-300 ${NUMERIC_WIDTH_CLASS}`}
    >
      {numeric}
    </span>
  );

  return (
    <div className="grid grid-cols-[12px_minmax(0,1fr)_auto] items-center gap-1.5">
      <span className="text-center text-[10px] text-zinc-400">{label}</span>
      <div className="relative h-3 min-w-0 rounded border border-zinc-700" style={{ background: gradient }}>
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
      <div className="flex items-center justify-end">
        {valueDisplay}
        {suffix ? (
          <span className="w-[1ch] shrink-0 text-[10px] tabular-nums text-zinc-400">{suffix}</span>
        ) : null}
      </div>
    </div>
  );
}

function parseNumericInput(text: string): number | null {
  const parsed = Number.parseFloat(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseHueInput(text: string): number | null {
  return parseNumericInput(text);
}

export function parsePercentInput(text: string): number | null {
  return parseNumericInput(text);
}

export function parseOklabLightnessInput(text: string): number | null {
  const parsed = parseNumericInput(text);
  return parsed === null ? null : parsed / 100;
}

export function parseAlphaPercentInput(text: string): number | null {
  const parsed = parseNumericInput(text);
  return parsed === null ? null : Math.round((parsed / 100) * 255);
}
