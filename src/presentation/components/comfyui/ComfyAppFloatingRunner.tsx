import { useEffect, useRef, type RefObject } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import {
  adaptPanelPositionOnResize,
  applyMagneticSnap,
  detectEdgeAnchor,
  type ContainerDimensions,
} from "@/domain/viewport/FloatingPanelAnchor";
import {
  computeNavigatorResizeFromCorner,
  NAVIGATOR_RESIZE_CURSORS,
  NAVIGATOR_RESIZE_HANDLE_SIZE,
  type NavigatorResizeCorner,
  type NavigatorResizeStart,
} from "@/domain/viewport/NavigatorPanelResize";
import type { RunnerScope } from "@/domain/comfyApp/RunnerScope";
import {
  RUNNER_HEADER_HEIGHT,
  resolveRunnerResizeConstraints,
} from "@/domain/comfyApp/RunnerPanelLayout";
import {
  computeFloatingPanelZIndex,
  type FloatingPanelId,
} from "@/domain/viewport/FloatingPanelStack";
import { useAppStore } from "@/presentation/stores/appStore";
import { useComfyAppStore } from "@/presentation/stores/comfyAppStore";
import { ComfyProgressBar } from "./ComfyProgressBar";
import { ComfyResultCarousel } from "./ComfyResultCarousel";
import { ParameterPresetBar } from "./components/ParameterPresetBar";
import { RunnerComponentField } from "./components/RunnerComponentField";
import { ComfyAppRunnerScopeProvider } from "./ComfyAppRunnerScopeContext";

const RESIZE_CORNERS: NavigatorResizeCorner[] = ["nw", "ne", "sw", "se"];

const RESIZE_HANDLE_POSITION: Record<NavigatorResizeCorner, string> = {
  nw: "left-0 top-0",
  ne: "right-0 top-0",
  sw: "bottom-0 left-0",
  se: "bottom-0 right-0",
};

interface ComfyAppFloatingRunnerProps {
  scope: RunnerScope;
  /** 定位与吸附的参考容器；画布场景默认用 viewportContainer */
  containerRef?: RefObject<HTMLElement | null>;
  /** 参与画布悬浮窗层级栈的 id；工作流页内不传 */
  floatingPanelId?: FloatingPanelId;
}

/**
 * 可拖动 ComfyUI 应用悬浮窗口（按 scope 独立实例，复用同一套运行组件）。
 * 采用与导航/取色器一致的浮窗：贴边磁吸 + 四角缩放；顶部结果图固定，参数区按窗口高度自动垂直滚动。
 */
export function ComfyAppFloatingRunner({
  scope,
  containerRef: externalContainerRef,
  floatingPanelId,
}: ComfyAppFloatingRunnerProps) {
  const runner = useComfyAppStore((s) => s.runners[scope]);
  const app = runner.app;
  const values = runner.values;
  const running = runner.running;
  const progress = runner.progress;
  const results = runner.results;
  const runnerWorkflow = runner.workflow;
  const error = runner.error;
  const editing = runner.editing;
  const panel = runner.panel;
  const setRunnerValue = useComfyAppStore((s) => s.setRunnerValue);
  const setRunnerEditing = useComfyAppStore((s) => s.setRunnerEditing);
  const toggleHidden = useComfyAppStore((s) => s.toggleRunnerComponentHidden);
  const runApp = useComfyAppStore((s) => s.runApp);
  const abortRunner = useComfyAppStore((s) => s.abortRunner);
  const closeRunner = useComfyAppStore((s) => s.closeRunner);
  const setRunnerPanelPosition = useComfyAppStore((s) => s.setRunnerPanelPosition);
  const setRunnerPanelBounds = useComfyAppStore((s) => s.setRunnerPanelBounds);
  const setRunnerPanelEdgeAnchor = useComfyAppStore((s) => s.setRunnerPanelEdgeAnchor);

  const viewportContainer = useAppStore((s) => s.viewportContainer);
  const floatingPanelStack = useAppStore((s) => s.floatingPanelStack);
  const bringFloatingPanelToFront = useAppStore((s) => s.bringFloatingPanelToFront);

  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const resizeStartRef = useRef<
    (NavigatorResizeStart & { corner: NavigatorResizeCorner }) | null
  >(null);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);

  const containerRef = useRef<HTMLElement | null>(null);
  containerRef.current =
    externalContainerRef?.current ?? viewportContainer ?? containerRef.current;

  const panelRef = useRef(panel);
  panelRef.current = panel;

  const getContainerSize = (): ContainerDimensions => {
    const container = containerRef.current;
    if (container) {
      return { width: container.clientWidth, height: container.clientHeight };
    }
    return { width: window.innerWidth, height: window.innerHeight };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const current = panelRef.current;
      if (isDraggingRef.current) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        const snapped = applyMagneticSnap(
          { x: dragStartRef.current.posX + dx, y: dragStartRef.current.posY + dy },
          current.size,
          getContainerSize(),
        );
        setRunnerPanelPosition(scope, snapped.position, snapped.anchor);
        return;
      }

      if (resizeStartRef.current) {
        isResizingRef.current = true;
        const start = resizeStartRef.current;
        const bounds = computeNavigatorResizeFromCorner(
          start.corner,
          start,
          e.clientX,
          e.clientY,
          resolveRunnerResizeConstraints(containerRef.current),
        );
        setRunnerPanelBounds(scope, bounds.x, bounds.y, bounds.width, bounds.height);
      }
    };

    const handleMouseUp = () => {
      const wasDragging = isDraggingRef.current;
      const wasResizing = isResizingRef.current;
      isDraggingRef.current = false;
      resizeStartRef.current = null;
      isResizingRef.current = false;
      if (wasDragging || wasResizing) {
        const current = panelRef.current;
        const anchor = detectEdgeAnchor(current.position, current.size, getContainerSize());
        setRunnerPanelEdgeAnchor(scope, anchor);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [scope, setRunnerPanelPosition, setRunnerPanelBounds, setRunnerPanelEdgeAnchor]);

  const fitPanelIntoContainer = () => {
    const current = panelRef.current;
    const containerSize = getContainerSize();
    const constraints = resolveRunnerResizeConstraints(containerRef.current);
    const width = Math.min(current.size.width, constraints.maxWidth);
    const height = Math.min(current.size.height, constraints.maxHeight);
    const position = adaptPanelPositionOnResize(
      current.position,
      { width, height },
      current.edgeAnchor,
      containerSize,
    );
    setRunnerPanelBounds(scope, position.x, position.y, width, height);
  };

  useEffect(() => {
    const handleResize = () => fitPanelIntoContainer();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [scope, setRunnerPanelBounds]);

  const appId = app?.id ?? null;
  useEffect(() => {
    if (!appId) return;
    if (floatingPanelId) {
      bringFloatingPanelToFront(floatingPanelId);
    }
    fitPanelIntoContainer();
  }, [appId, floatingPanelId, setRunnerPanelBounds, bringFloatingPanelToFront]);

  if (!app) return null;

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: panel.position.x,
      posY: panel.position.y,
    };
  };

  const handleResizeMouseDown = (corner: NavigatorResizeCorner, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    resizeStartRef.current = {
      corner,
      clientX: e.clientX,
      clientY: e.clientY,
      bounds: {
        x: panel.position.x,
        y: panel.position.y,
        width: panel.size.width,
        height: panel.size.height,
      },
    };
  };

  const hidden = new Set(app.hiddenComponentIds ?? []);
  const sortedComponents = [...app.components].sort((a, b) => a.order - b.order);
  const visibleComponents = editing
    ? sortedComponents
    : sortedComponents.filter((component) => !hidden.has(component.id));

  const zIndex = floatingPanelId
    ? computeFloatingPanelZIndex(floatingPanelStack, floatingPanelId)
    : 10;

  return (
    <ComfyAppRunnerScopeProvider scope={scope}>
      <div
        className="pointer-events-auto absolute flex flex-col overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl"
        style={{
          left: panel.position.x,
          top: panel.position.y,
          width: panel.size.width,
          height: panel.size.height,
          zIndex,
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          if (floatingPanelId) {
            bringFloatingPanelToFront(floatingPanelId);
          }
        }}
      >
        <header
          onMouseDown={handleHeaderMouseDown}
          className="flex shrink-0 cursor-move select-none items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-800/60 px-3"
          style={{ height: RUNNER_HEADER_HEIGHT }}
        >
          <div className="min-w-0">
            <h2 className="truncate text-xs font-medium text-zinc-100">{app.name}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setRunnerEditing(scope, !editing)}
              onMouseDown={(e) => e.stopPropagation()}
              title={editing ? "完成编辑" : "编辑：隐藏不需要的参数"}
              className={`rounded px-2 py-0.5 text-[11px] transition ${
                editing
                  ? "bg-blue-600 text-white hover:bg-blue-500"
                  : "text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
              }`}
            >
              {editing ? "完成" : "编辑"}
            </button>
            <button
              type="button"
              onClick={() => closeRunner(scope)}
              onMouseDown={(e) => e.stopPropagation()}
              title="关闭"
              className="rounded px-1.5 py-0.5 text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-200"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="shrink-0 border-b border-zinc-800 p-3">
          <ComfyResultCarousel results={results} workflow={runnerWorkflow} appId={app.id} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {(progress.status !== "idle" || running) && (
            <div className="border-b border-zinc-800 px-3 py-2">
              <ComfyProgressBar progress={progress} />
            </div>
          )}

          {error && (
            <div className="mx-3 mt-3 rounded border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="px-3 py-2">
            <ParameterPresetBar disabled={running} />
          </div>

          <div className="space-y-3 px-3 pb-3">
            {editing && (
              <p className="text-[11px] text-zinc-500">
                点击参数旁的眼睛图标可隐藏/显示，隐藏后窗口更简洁（仍会按当前取值参与生成）。
              </p>
            )}
            {visibleComponents.map((component) => {
              const isHidden = hidden.has(component.id);
              return (
                <div
                  key={component.id}
                  className={`space-y-1 ${editing && isHidden ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-medium text-zinc-300">{component.label}</label>
                    {editing && (
                      <button
                        type="button"
                        onClick={() => toggleHidden(scope, component.id)}
                        title={isHidden ? "显示该参数" : "隐藏该参数"}
                        className="shrink-0 rounded p-0.5 text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-200"
                      >
                        {isHidden ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                  <RunnerComponentField
                    appId={app.id}
                    component={component}
                    value={values[component.id]}
                    disabled={running}
                    onChange={(value) => setRunnerValue(scope, component.id, value)}
                  />
                </div>
              );
            })}
            {visibleComponents.length === 0 && (
              <p className="py-4 text-center text-[11px] text-zinc-600">
                全部参数已隐藏，点击「编辑」可重新显示。
              </p>
            )}
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-zinc-800 px-3 py-2">
          {running ? (
            <button
              type="button"
              onClick={() => abortRunner(scope)}
              className="rounded bg-red-700 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-red-600"
            >
              停止
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void runApp(scope)}
              className="rounded bg-blue-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500"
            >
              生成
            </button>
          )}
        </footer>

        {RESIZE_CORNERS.map((corner) => (
          <div
            key={corner}
            className={`absolute z-10 ${RESIZE_HANDLE_POSITION[corner]} ${NAVIGATOR_RESIZE_CURSORS[corner]}`}
            style={{
              width: NAVIGATOR_RESIZE_HANDLE_SIZE,
              height: NAVIGATOR_RESIZE_HANDLE_SIZE,
            }}
            onMouseDown={(e) => handleResizeMouseDown(corner, e)}
          />
        ))}
      </div>
    </ComfyAppRunnerScopeProvider>
  );
}
