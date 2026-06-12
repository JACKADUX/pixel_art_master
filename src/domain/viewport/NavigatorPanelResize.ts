export const NAVIGATOR_MIN_WIDTH = 100;
export const NAVIGATOR_MIN_HEIGHT = 80;
export const NAVIGATOR_MAX_SIZE_RATIO = 0.6;

export type NavigatorResizeCorner = "nw" | "ne" | "sw" | "se";

export interface NavigatorPanelBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NavigatorResizeStart {
  clientX: number;
  clientY: number;
  bounds: NavigatorPanelBounds;
}

export interface NavigatorResizeConstraints {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function computeNavigatorResizeFromCorner(
  corner: NavigatorResizeCorner,
  start: NavigatorResizeStart,
  clientX: number,
  clientY: number,
  constraints: NavigatorResizeConstraints,
): NavigatorPanelBounds {
  const dx = clientX - start.clientX;
  const dy = clientY - start.clientY;
  const { x: startX, y: startY, width: startW, height: startH } = start.bounds;

  let x = startX;
  let y = startY;
  let width = startW;
  let height = startH;

  switch (corner) {
    case "se":
      width = startW + dx;
      height = startH + dy;
      break;
    case "sw":
      width = startW - dx;
      height = startH + dy;
      x = startX + dx;
      break;
    case "ne":
      width = startW + dx;
      height = startH - dy;
      y = startY + dy;
      break;
    case "nw":
      width = startW - dx;
      height = startH - dy;
      x = startX + dx;
      y = startY + dy;
      break;
  }

  const clampedWidth = clamp(
    width,
    constraints.minWidth,
    constraints.maxWidth,
  );
  if (corner === "sw" || corner === "nw") {
    x += width - clampedWidth;
  }
  width = clampedWidth;

  const clampedHeight = clamp(
    height,
    constraints.minHeight,
    constraints.maxHeight,
  );
  if (corner === "ne" || corner === "nw") {
    y += height - clampedHeight;
  }
  height = clampedHeight;

  return { x, y, width, height };
}

export const NAVIGATOR_RESIZE_HANDLE_SIZE = 12;

export const NAVIGATOR_RESIZE_CURSORS: Record<NavigatorResizeCorner, string> = {
  nw: "cursor-nw-resize",
  ne: "cursor-ne-resize",
  sw: "cursor-sw-resize",
  se: "cursor-se-resize",
};

export function resolveNavigatorResizeConstraints(
  container: { clientWidth: number; clientHeight: number } | null,
): NavigatorResizeConstraints {
  return {
    minWidth: NAVIGATOR_MIN_WIDTH,
    minHeight: NAVIGATOR_MIN_HEIGHT,
    maxWidth: container
      ? Math.max(NAVIGATOR_MIN_WIDTH, container.clientWidth * NAVIGATOR_MAX_SIZE_RATIO)
      : Number.MAX_SAFE_INTEGER,
    maxHeight: container
      ? Math.max(NAVIGATOR_MIN_HEIGHT, container.clientHeight * NAVIGATOR_MAX_SIZE_RATIO)
      : Number.MAX_SAFE_INTEGER,
  };
}
