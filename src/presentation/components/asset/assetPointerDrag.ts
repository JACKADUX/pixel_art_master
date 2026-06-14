export const FOLDER_DROP_TARGET_ATTR = "data-folder-id";
export const DRAG_THRESHOLD_PX = 8;

export function hasDragMovement(
  dx: number,
  dy: number,
  threshold = DRAG_THRESHOLD_PX,
): boolean {
  return Math.hypot(dx, dy) >= threshold;
}

export function resolveFolderIdFromElement(el: Element | null): string | null {
  if (!el) return null;
  const row = el.closest(`[${FOLDER_DROP_TARGET_ATTR}]`);
  return row?.getAttribute(FOLDER_DROP_TARGET_ATTR) ?? null;
}

export function resolveFolderIdAtPoint(x: number, y: number): string | null {
  return resolveFolderIdFromElement(document.elementFromPoint(x, y));
}
