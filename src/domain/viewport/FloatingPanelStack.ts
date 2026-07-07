/** 画布上的悬浮窗口标识（参与统一的层级堆叠顺序） */
export type FloatingPanelId = "navigator" | "colorPicker" | "comfyRunner";

/**
 * 悬浮窗口层级基准。需高于画布内的覆盖层（z-20/区域边框 z-30），
 * 同时整体保持在弹窗/模态（最低 z-50）之下。
 */
export const FLOATING_PANEL_Z_BASE = 31;

/** 悬浮窗口层级上限：始终低于弹窗/模态，避免遮挡激活的对话框 */
export const FLOATING_PANEL_Z_MAX = 49;

/** 画布内工具 overlay（如尺寸调整手柄），高于图层 overlay，低于悬浮面板与弹窗 */
export const CANVAS_TOOL_OVERLAY_Z_INDEX = FLOATING_PANEL_Z_BASE - 1;

/** 把指定窗口移动到栈顶（最近激活者在数组末尾，即最上层） */
export function bringPanelToFront(
  stack: FloatingPanelId[],
  id: FloatingPanelId,
): FloatingPanelId[] {
  const next = stack.filter((item) => item !== id);
  next.push(id);
  return next;
}

/** 依据栈顺序计算窗口层级；越靠后越高，并夹取在 [base, max] 区间内 */
export function computeFloatingPanelZIndex(
  stack: FloatingPanelId[],
  id: FloatingPanelId,
): number {
  const index = stack.indexOf(id);
  if (index < 0) return FLOATING_PANEL_Z_BASE;
  return Math.min(FLOATING_PANEL_Z_BASE + index, FLOATING_PANEL_Z_MAX);
}
