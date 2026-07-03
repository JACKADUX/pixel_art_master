import {
  type NavigatorResizeConstraints,
} from "@/domain/viewport/NavigatorPanelResize";

/** 运行窗口标题栏高度（与导航/取色器一致的浮窗头部体量） */
export const RUNNER_HEADER_HEIGHT = 36;

export const RUNNER_MIN_WIDTH = 260;
export const RUNNER_MIN_HEIGHT = 220;

/** 默认窗口尺寸（与历史固定宽 340 保持观感一致） */
export const RUNNER_DEFAULT_WIDTH = 340;
export const RUNNER_DEFAULT_HEIGHT = 560;

/** 最大尺寸占容器比例，避免遮挡整个画布 */
export const RUNNER_MAX_SIZE_RATIO = 0.95;

/**
 * 根据容器尺寸解析运行窗口角拖拽缩放的约束。
 * 复用导航面板的 {@link NavigatorResizeConstraints} 结构，便于共享纯几何函数。
 */
export function resolveRunnerResizeConstraints(
  container: { clientWidth: number; clientHeight: number } | null,
): NavigatorResizeConstraints {
  return {
    minWidth: RUNNER_MIN_WIDTH,
    minHeight: RUNNER_MIN_HEIGHT,
    maxWidth: container
      ? Math.max(RUNNER_MIN_WIDTH, container.clientWidth * RUNNER_MAX_SIZE_RATIO)
      : Number.MAX_SAFE_INTEGER,
    maxHeight: container
      ? Math.max(RUNNER_MIN_HEIGHT, container.clientHeight * RUNNER_MAX_SIZE_RATIO)
      : Number.MAX_SAFE_INTEGER,
  };
}
