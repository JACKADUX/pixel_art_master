import { clampPanelPosition } from "@/domain/viewport/FloatingPanelBounds";

export type PanelHorizontalAnchor = "none" | "left" | "right";
export type PanelVerticalAnchor = "none" | "top" | "bottom";

export interface PanelEdgeAnchor {
  horizontal: PanelHorizontalAnchor;
  vertical: PanelVerticalAnchor;
}

export interface PanelPosition {
  x: number;
  y: number;
}

export interface PanelDimensions {
  width: number;
  height: number;
}

export interface ContainerDimensions {
  width: number;
  height: number;
}

export const PANEL_EDGE_SNAP_THRESHOLD = 12;

export const DEFAULT_PANEL_EDGE_ANCHOR: PanelEdgeAnchor = {
  horizontal: "none",
  vertical: "none",
};

export function detectEdgeAnchor(
  position: PanelPosition,
  panelSize: PanelDimensions,
  containerSize: ContainerDimensions,
  threshold = PANEL_EDGE_SNAP_THRESHOLD,
): PanelEdgeAnchor {
  const maxX = Math.max(0, containerSize.width - panelSize.width);
  const maxY = Math.max(0, containerSize.height - panelSize.height);

  const nearLeft = position.x <= threshold;
  const nearRight = maxX - position.x <= threshold;
  const nearTop = position.y <= threshold;
  const nearBottom = maxY - position.y <= threshold;

  return {
    horizontal: nearLeft ? "left" : nearRight ? "right" : "none",
    vertical: nearTop ? "top" : nearBottom ? "bottom" : "none",
  };
}

export function applyMagneticSnap(
  rawPosition: PanelPosition,
  panelSize: PanelDimensions,
  containerSize: ContainerDimensions,
  threshold = PANEL_EDGE_SNAP_THRESHOLD,
): { position: PanelPosition; anchor: PanelEdgeAnchor } {
  const clamped = clampPanelPosition(
    rawPosition.x,
    rawPosition.y,
    panelSize.width,
    panelSize.height,
    containerSize.width,
    containerSize.height,
  );

  const maxX = Math.max(0, containerSize.width - panelSize.width);
  const maxY = Math.max(0, containerSize.height - panelSize.height);

  let x = clamped.x;
  let y = clamped.y;

  const nearLeft = x <= threshold;
  const nearRight = maxX - x <= threshold;
  const nearTop = y <= threshold;
  const nearBottom = maxY - y <= threshold;

  if (nearLeft) x = 0;
  else if (nearRight) x = maxX;

  if (nearTop) y = 0;
  else if (nearBottom) y = maxY;

  const position = { x, y };
  return {
    position,
    anchor: detectEdgeAnchor(position, panelSize, containerSize, threshold),
  };
}

export function adaptPanelPositionOnResize(
  position: PanelPosition,
  panelSize: PanelDimensions,
  anchor: PanelEdgeAnchor,
  containerSize: ContainerDimensions,
): PanelPosition {
  let x = position.x;
  let y = position.y;

  const maxX = Math.max(0, containerSize.width - panelSize.width);
  const maxY = Math.max(0, containerSize.height - panelSize.height);

  if (anchor.horizontal === "left") x = 0;
  else if (anchor.horizontal === "right") x = maxX;

  if (anchor.vertical === "top") y = 0;
  else if (anchor.vertical === "bottom") y = maxY;

  return clampPanelPosition(
    x,
    y,
    panelSize.width,
    panelSize.height,
    containerSize.width,
    containerSize.height,
  );
}

export function computePanelVisibleRatio(
  position: PanelPosition,
  panelSize: PanelDimensions,
  containerSize: ContainerDimensions,
): number {
  const panelArea = panelSize.width * panelSize.height;
  if (panelArea <= 0) return 0;

  const overlapLeft = Math.max(position.x, 0);
  const overlapTop = Math.max(position.y, 0);
  const overlapRight = Math.min(position.x + panelSize.width, containerSize.width);
  const overlapBottom = Math.min(position.y + panelSize.height, containerSize.height);

  const overlapWidth = Math.max(0, overlapRight - overlapLeft);
  const overlapHeight = Math.max(0, overlapBottom - overlapTop);
  const overlapArea = overlapWidth * overlapHeight;

  return overlapArea / panelArea;
}

export function isPanelMostlyOutsideViewport(
  position: PanelPosition,
  panelSize: PanelDimensions,
  containerSize: ContainerDimensions,
  minVisibleRatio = 0.5,
): boolean {
  return computePanelVisibleRatio(position, panelSize, containerSize) < minVisibleRatio;
}
