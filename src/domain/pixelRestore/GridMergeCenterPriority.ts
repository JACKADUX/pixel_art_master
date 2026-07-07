export interface GridMergeCenterPriority {
  enabled: boolean;
  excludeRingCount: number;
}

export const MIN_EXCLUDE_RING = 0;
export const MAX_EXCLUDE_RING = 5;

export const DEFAULT_GRID_MERGE_CENTER_PRIORITY: GridMergeCenterPriority = {
  enabled: false,
  excludeRingCount: 2,
};

export interface CenterPriorityInnerBounds {
  insetLeft: number;
  insetTop: number;
  innerWidth: number;
  innerHeight: number;
}

export function clampExcludeRingCount(value: unknown, fallback = DEFAULT_GRID_MERGE_CENTER_PRIORITY.excludeRingCount): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const rounded = Math.round(value);
  return Math.min(Math.max(rounded, MIN_EXCLUDE_RING), MAX_EXCLUDE_RING);
}

/** 保证内层至少保留 1 个像素的最大可剔除圈数。 */
export function computeMaxExcludeRing(width: number, height: number): number {
  if (width < 1 || height < 1) return 0;
  return Math.max(0, Math.floor((Math.min(width, height) - 1) / 2));
}

export function computeEffectiveExcludeRing(
  width: number,
  height: number,
  requestedRing: number,
): number {
  const clamped = clampExcludeRingCount(requestedRing, 0);
  return Math.min(clamped, computeMaxExcludeRing(width, height));
}

export function getCenterPriorityInnerBounds(
  cellWidth: number,
  cellHeight: number,
  requestedRing: number,
): CenterPriorityInnerBounds {
  const ring = computeEffectiveExcludeRing(cellWidth, cellHeight, requestedRing);
  return {
    insetLeft: ring,
    insetTop: ring,
    innerWidth: cellWidth - ring * 2,
    innerHeight: cellHeight - ring * 2,
  };
}

export function shouldApplyCenterPriority(centerPriority: GridMergeCenterPriority | undefined): boolean {
  return centerPriority?.enabled === true && centerPriority.excludeRingCount > 0;
}
