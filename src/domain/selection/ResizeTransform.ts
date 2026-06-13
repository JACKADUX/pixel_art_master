import type { Point } from "../tool/ITool";

export interface CanvasRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ResizeHandle =
  | "topLeft"
  | "top"
  | "topRight"
  | "right"
  | "bottomRight"
  | "bottom"
  | "bottomLeft"
  | "left";

export interface ResizeModifiers {
  shiftKey: boolean;
  altKey: boolean;
}

function rectRight(rect: CanvasRect): number {
  return rect.x + rect.width - 1;
}

function rectBottom(rect: CanvasRect): number {
  return rect.y + rect.height - 1;
}

function rectCenterX(rect: CanvasRect): number {
  return rect.x + rect.width / 2;
}

function rectCenterY(rect: CanvasRect): number {
  return rect.y + rect.height / 2;
}

function normalizeRectFromCorners(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): CanvasRect {
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  return {
    x,
    y,
    width: Math.max(1, Math.abs(x2 - x1) + 1),
    height: Math.max(1, Math.abs(y2 - y1) + 1),
  };
}

function resizeFree(handle: ResizeHandle, initial: CanvasRect, pointer: Point): CanvasRect {
  const left = initial.x;
  const top = initial.y;
  const right = rectRight(initial);
  const bottom = rectBottom(initial);

  switch (handle) {
    case "right":
      return {
        x: left,
        y: top,
        width: Math.max(1, pointer.x - left + 1),
        height: initial.height,
      };
    case "left": {
      const width = Math.max(1, right - pointer.x + 1);
      return { x: right - width + 1, y: top, width, height: initial.height };
    }
    case "bottom":
      return {
        x: left,
        y: top,
        width: initial.width,
        height: Math.max(1, pointer.y - top + 1),
      };
    case "top": {
      const height = Math.max(1, bottom - pointer.y + 1);
      return { x: left, y: bottom - height + 1, width: initial.width, height };
    }
    case "bottomRight":
      return normalizeRectFromCorners(left, top, pointer.x, pointer.y);
    case "bottomLeft":
      return normalizeRectFromCorners(pointer.x, top, right, pointer.y);
    case "topRight":
      return normalizeRectFromCorners(left, pointer.y, pointer.x, bottom);
    case "topLeft":
      return normalizeRectFromCorners(pointer.x, pointer.y, right, bottom);
  }
}

function resizeFromCenter(
  handle: ResizeHandle,
  initial: CanvasRect,
  pointer: Point,
  shiftKey: boolean,
): CanvasRect {
  const cx = rectCenterX(initial);
  const cy = rectCenterY(initial);

  const affectsX =
    handle === "left" ||
    handle === "right" ||
    handle === "topLeft" ||
    handle === "topRight" ||
    handle === "bottomLeft" ||
    handle === "bottomRight";
  const affectsY =
    handle === "top" ||
    handle === "bottom" ||
    handle === "topLeft" ||
    handle === "topRight" ||
    handle === "bottomLeft" ||
    handle === "bottomRight";

  let halfW = initial.width / 2;
  let halfH = initial.height / 2;

  if (affectsX) {
    halfW = Math.max(0.5, Math.abs(pointer.x - cx));
  }
  if (affectsY) {
    halfH = Math.max(0.5, Math.abs(pointer.y - cy));
  }

  if (shiftKey) {
    const scaleW = (2 * halfW) / initial.width;
    const scaleH = (2 * halfH) / initial.height;
    const scale = Math.max(scaleW, scaleH);
    halfW = (initial.width * scale) / 2;
    halfH = (initial.height * scale) / 2;
  }

  const width = Math.max(1, Math.round(2 * halfW));
  const height = Math.max(1, Math.round(2 * halfH));
  return {
    x: Math.round(cx - width / 2),
    y: Math.round(cy - height / 2),
    width,
    height,
  };
}

function resizeShiftCorner(handle: ResizeHandle, initial: CanvasRect, pointer: Point): CanvasRect {
  const left = initial.x;
  const top = initial.y;
  const right = rectRight(initial);
  const bottom = rectBottom(initial);

  let scaleX = 1;
  let scaleY = 1;

  switch (handle) {
    case "bottomRight":
      scaleX = (pointer.x - left + 1) / initial.width;
      scaleY = (pointer.y - top + 1) / initial.height;
      break;
    case "bottomLeft":
      scaleX = (right - pointer.x + 1) / initial.width;
      scaleY = (pointer.y - top + 1) / initial.height;
      break;
    case "topRight":
      scaleX = (pointer.x - left + 1) / initial.width;
      scaleY = (bottom - pointer.y + 1) / initial.height;
      break;
    case "topLeft":
      scaleX = (right - pointer.x + 1) / initial.width;
      scaleY = (bottom - pointer.y + 1) / initial.height;
      break;
    default:
      return resizeFree(handle, initial, pointer);
  }

  const scale = Math.max(scaleX, scaleY, 1 / initial.width, 1 / initial.height);
  const newWidth = Math.max(1, Math.round(initial.width * scale));
  const newHeight = Math.max(1, Math.round(initial.height * scale));

  switch (handle) {
    case "bottomRight":
      return { x: left, y: top, width: newWidth, height: newHeight };
    case "bottomLeft":
      return { x: right - newWidth + 1, y: top, width: newWidth, height: newHeight };
    case "topRight":
      return { x: left, y: bottom - newHeight + 1, width: newWidth, height: newHeight };
    case "topLeft":
      return {
        x: right - newWidth + 1,
        y: bottom - newHeight + 1,
        width: newWidth,
        height: newHeight,
      };
  }
}

function resizeShiftEdge(handle: ResizeHandle, initial: CanvasRect, pointer: Point): CanvasRect {
  const left = initial.x;
  const top = initial.y;
  const right = rectRight(initial);
  const bottom = rectBottom(initial);
  const aspect = initial.width / initial.height;
  const cx = rectCenterX(initial);
  const cy = rectCenterY(initial);

  switch (handle) {
    case "right": {
      const width = Math.max(1, pointer.x - left + 1);
      const height = Math.max(1, Math.round(width / aspect));
      return { x: left, y: Math.round(cy - height / 2), width, height };
    }
    case "left": {
      const width = Math.max(1, right - pointer.x + 1);
      const height = Math.max(1, Math.round(width / aspect));
      return { x: right - width + 1, y: Math.round(cy - height / 2), width, height };
    }
    case "bottom": {
      const height = Math.max(1, pointer.y - top + 1);
      const width = Math.max(1, Math.round(height * aspect));
      return { x: Math.round(cx - width / 2), y: top, width, height };
    }
    case "top": {
      const height = Math.max(1, bottom - pointer.y + 1);
      const width = Math.max(1, Math.round(height * aspect));
      return { x: Math.round(cx - width / 2), y: bottom - height + 1, width, height };
    }
    default:
      return resizeShiftCorner(handle, initial, pointer);
  }
}

function isCornerHandle(handle: ResizeHandle): boolean {
  return (
    handle === "topLeft" ||
    handle === "topRight" ||
    handle === "bottomLeft" ||
    handle === "bottomRight"
  );
}

export function computeResizeRectFromHandle(
  handle: ResizeHandle,
  initialRect: CanvasRect,
  pointer: Point,
  modifiers: ResizeModifiers,
): CanvasRect {
  const { shiftKey, altKey } = modifiers;

  if (altKey) {
    return resizeFromCenter(handle, initialRect, pointer, shiftKey);
  }

  if (shiftKey) {
    if (isCornerHandle(handle)) {
      return resizeShiftCorner(handle, initialRect, pointer);
    }
    return resizeShiftEdge(handle, initialRect, pointer);
  }

  return resizeFree(handle, initialRect, pointer);
}
