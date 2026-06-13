import { useCallback, useEffect, useRef, useState } from "react";

const ABSOLUTE_HIDE_MS = 3000;

export interface BrushSizeHintState {
  size: number;
  clientX: number;
  clientY: number;
}

export function useBrushSizeHint() {
  const [hint, setHint] = useState<BrushSizeHintState | null>(null);
  const hintActiveRef = useRef(false);
  const absoluteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (absoluteTimerRef.current !== null) {
      clearTimeout(absoluteTimerRef.current);
      absoluteTimerRef.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearTimers();
    hintActiveRef.current = false;
    setHint(null);
  }, [clearTimers]);

  const show = useCallback(
    (size: number, clientX: number, clientY: number) => {
      hintActiveRef.current = true;
      setHint({ size, clientX, clientY });

      if (absoluteTimerRef.current !== null) {
        clearTimeout(absoluteTimerRef.current);
      }
      absoluteTimerRef.current = setTimeout(hide, ABSOLUTE_HIDE_MS);
    },
    [hide],
  );

  const handleMouseMove = useCallback(() => {
    if (!hintActiveRef.current) return;
    hide();
  }, [hide]);

  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  return { hint, show, hide, handleMouseMove };
}
