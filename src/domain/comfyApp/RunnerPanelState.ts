import {
  DEFAULT_PANEL_EDGE_ANCHOR,
  type PanelEdgeAnchor,
} from "@/domain/viewport/FloatingPanelAnchor";
import {
  RUNNER_DEFAULT_HEIGHT,
  RUNNER_DEFAULT_WIDTH,
} from "@/domain/comfyApp/RunnerPanelLayout";

/** 运行浮窗几何状态：位置、尺寸（含标题栏）与贴边锚点 */
export interface RunnerPanelState {
  position: { x: number; y: number };
  size: { width: number; height: number };
  edgeAnchor: PanelEdgeAnchor;
}

export function createInitialRunnerPanel(): RunnerPanelState {
  const fallbackWidth = typeof window !== "undefined" ? window.innerWidth : 1280;
  return {
    position: {
      x: Math.max(12, fallbackWidth - RUNNER_DEFAULT_WIDTH - 24),
      y: 72,
    },
    size: { width: RUNNER_DEFAULT_WIDTH, height: RUNNER_DEFAULT_HEIGHT },
    edgeAnchor: DEFAULT_PANEL_EDGE_ANCHOR,
  };
}
