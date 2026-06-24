import { useCallback, useEffect, useMemo } from "react";

import type { WorkspaceRegion } from "@/domain/workspace/WorkspaceRegion";
import { useAppStore } from "@/presentation/stores/appStore";

/** 标记主区域容器的 data 属性，供全局点击命中检测使用。 */
const WORKSPACE_REGION_ATTR = "data-workspace-region";

export interface WorkspaceRegionProps {
  [WORKSPACE_REGION_ATTR]: WorkspaceRegion;
  onPointerDownCapture: () => void;
}

export interface UseWorkspaceRegionResult {
  isActive: boolean;
  regionProps: WorkspaceRegionProps;
}

/**
 * 把一个主区域容器接入「激活态」系统：
 * - `regionProps` 挂到容器上（标记 data 属性 + 点击即激活）
 * - `isActive` 用于渲染激活态边框（见 `WorkspaceRegionBorder`）
 *
 * 宿主容器需为 `relative` 定位以承载激活边框覆盖层。
 */
export function useWorkspaceRegion(
  region: WorkspaceRegion,
): UseWorkspaceRegionResult {
  const isActive = useAppStore((s) => s.activeRegion === region);
  const setActiveRegion = useAppStore((s) => s.setActiveRegion);

  const onPointerDownCapture = useCallback(() => {
    setActiveRegion(region);
  }, [setActiveRegion, region]);

  const regionProps = useMemo<WorkspaceRegionProps>(
    () => ({
      [WORKSPACE_REGION_ATTR]: region,
      onPointerDownCapture,
    }),
    [region, onPointerDownCapture],
  );

  return {
    isActive,
    regionProps,
  };
}

/**
 * 全局监听：点击落在所有主区域容器之外时清除激活态。
 * 在应用根组件调用一次即可。
 */
export function useWorkspaceRegionAutoClear(): void {
  const setActiveRegion = useAppStore((s) => s.setActiveRegion);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(`[${WORKSPACE_REGION_ATTR}]`)
      ) {
        return;
      }
      setActiveRegion(null);
    };

    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [setActiveRegion]);
}
