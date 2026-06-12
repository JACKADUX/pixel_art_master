export interface PanScrollDelta {
  deltaX: number;
  deltaY: number;
}

export interface ClientPoint {
  x: number;
  y: number;
}

export function computePanScrollDelta(
  from: ClientPoint,
  to: ClientPoint,
): PanScrollDelta {
  return {
    deltaX: from.x - to.x,
    deltaY: from.y - to.y,
  };
}

export function isMiddleMouseButton(button: number): boolean {
  return button === 1;
}

export function isMiddleMousePressed(buttons: number): boolean {
  return (buttons & 4) === 4;
}
