import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  clampPatternScale,
  MAX_PATTERN_SCALE,
  MIN_PATTERN_SCALE,
} from "@/domain/tool/ToolType";
import { focusCanvasKeyboard } from "../utils/canvasKeyboardFocus";

interface PatternBrushScaleSliderProps {
  value: number;
  onChange: (scale: number) => void;
}

const PANEL_WIDTH = 200;
const GAP = 4;

function parseDraftInput(raw: string): number | null {
  const trimmed = raw.trim().replace(/%$/, "");
  if (!/^\d+$/.test(trimmed)) return null;
  return clampPatternScale(Number(trimmed));
}

function ScalePopover({
  open,
  anchorRef,
  value,
  onChange,
  onClose,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  value: number;
  onChange: (scale: number) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    let left = rect.left;
    let top = rect.bottom + GAP;

    if (left + PANEL_WIDTH > window.innerWidth - GAP) {
      left = window.innerWidth - PANEL_WIDTH - GAP;
    }
    if (top + 48 > window.innerHeight - GAP) {
      top = rect.top - 48 - GAP;
    }
    if (left < GAP) left = GAP;
    if (top < GAP) top = GAP;

    setPosition({ top, left });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, onClose, open, updatePosition]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="图案缩放"
      className="fixed z-50 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-xl"
      style={{ top: position.top, left: position.left, width: PANEL_WIDTH }}
    >
      <input
        type="range"
        min={MIN_PATTERN_SCALE}
        max={MAX_PATTERN_SCALE}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>,
    document.body,
  );
}

export function PatternBrushScaleSlider({ value, onChange }: PatternBrushScaleSliderProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(`${value}%`);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setDraft(`${value}%`);
    }
  }, [value, isEditing]);

  const commitDraft = useCallback(() => {
    const parsed = parseDraftInput(draft);
    if (parsed !== null) {
      onChange(parsed);
      setDraft(`${parsed}%`);
    } else {
      setDraft(`${value}%`);
    }
    setIsEditing(false);
    focusCanvasKeyboard();
  }, [draft, onChange, value]);

  const handleInputChange = (raw: string) => {
    setDraft(raw);
    const parsed = parseDraftInput(raw);
    if (parsed !== null) {
      onChange(parsed);
    }
  };

  return (
    <>
      <div ref={anchorRef} className="inline-flex">
        <input
          type="text"
          inputMode="numeric"
          aria-label="图案缩放"
          value={draft}
          onFocus={() => {
            setIsEditing(true);
            setOpen(true);
          }}
          onClick={() => setOpen(true)}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commitDraft();
              setOpen(false);
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="h-7 w-14 rounded border border-zinc-600 bg-zinc-800 px-1.5 text-center text-zinc-200 outline-none focus:border-blue-500"
        />
      </div>
      <ScalePopover
        open={open}
        anchorRef={anchorRef}
        value={value}
        onChange={onChange}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
