import type { ReactNode } from "react";
import { useRef } from "react";
import type {
  BrushShape,
  SelectionMode,
  ShapeMode,
  ToolType,
} from "@/domain/tool/ToolType";
import {
  MAX_CANVAS_RESIZE_STEP,
  MIN_CANVAS_RESIZE_STEP,
  clampCanvasResizeStep,
} from "@/domain/tool/ToolType";
import { SELECTION_MODE_SHORTCUTS } from "../config/toolShortcuts";
import { getBrushShapeIcon, getSelectionModeIcon, getShapeIcon, SymmetryHorizontalIcon, SymmetryVerticalIcon } from "../icons/ToolIcons";
import { useAppStore } from "../stores/appStore";
import { BrushSizeInput } from "./BrushSizeInput";
import { PatternBrushScaleSlider } from "./PatternBrushScaleSlider";
import { PatternBrushPickerPopover } from "./patternBrush/PatternBrushPickerPopover";
import { CanvasBoardSizePresetMenu } from "./CanvasBoardSizePresetMenu";
import { formatPixelDimensions } from "@/domain/viewport/OverlayLabelLayout";
import { getActiveCanvas } from "@/domain/project/Project";
import { getPatternBrush } from "@/domain/patternBrush/PatternBrushLibrary";

const TOOL_LABELS: Record<ToolType, string> = {
  brush: "画笔",
  fill: "填充",
  eraser: "橡皮",
  shape: "形状",
  select: "选区",
  transform: "变换",
  repeatTile: "重复Tile",
  canvasResize: "画板",
};

const SHAPES: { mode: ShapeMode; label: string }[] = [
  { mode: "rectangle", label: "矩形" },
  { mode: "line", label: "直线" },
  { mode: "ellipse", label: "椭圆" },
];

const SELECTION_MODES: { mode: SelectionMode; label: string }[] = [
  { mode: "rectangle", label: "矩形选区" },
  { mode: "ellipse", label: "椭圆选区" },
  { mode: "lasso", label: "套索" },
  { mode: "magicWand", label: "魔棒" },
];

const BRUSH_SHAPES: { shape: BrushShape; label: string }[] = [
  { shape: "square", label: "方形" },
  { shape: "circle", label: "圆形" },
  { shape: "pattern", label: "图案" },
];

const ERASER_SHAPES: { shape: BrushShape; label: string }[] = [
  { shape: "square", label: "方形" },
  { shape: "circle", label: "圆形" },
];

function SegmentedButton({
  active,
  title,
  onClick,
  children,
}: {
  active: boolean;
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded transition ${
        active ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}

function StampToolProperties({
  size,
  shape,
  shapes,
  onSizeChange,
  onShapeChange,
}: {
  size: number;
  shape: BrushShape;
  shapes: { shape: BrushShape; label: string }[];
  onSizeChange: (size: number) => void;
  onShapeChange: (shape: BrushShape) => void;
}) {
  return (
    <>
      <label className="flex items-center gap-2 text-zinc-400">
        形状
        <span className="flex gap-1">
          {shapes.map((item) => (
            <SegmentedButton
              key={item.shape}
              active={shape === item.shape}
              title={item.label}
              onClick={() => onShapeChange(item.shape)}
            >
              {getBrushShapeIcon(item.shape)}
            </SegmentedButton>
          ))}
        </span>
      </label>
      <label className="flex items-center gap-2 text-zinc-400">
        尺寸
        <BrushSizeInput value={size} onChange={onSizeChange} />
      </label>
    </>
  );
}

function BrushToolProperties() {
  const toolSettings = useAppStore((s) => s.toolSettings);
  const setToolSettings = useAppStore((s) => s.setToolSettings);
  const patternBrushLibrary = useAppStore((s) => s.patternBrushLibrary);
  const activePatternBrushId = useAppStore((s) => s.activePatternBrushId);
  const patternBrushPickerOpen = useAppStore((s) => s.patternBrushPickerOpen);
  const openPatternBrushPicker = useAppStore((s) => s.openPatternBrushPicker);
  const closePatternBrushPicker = useAppStore((s) => s.closePatternBrushPicker);
  const pickerAnchorRef = useRef<HTMLButtonElement>(null);
  const isPattern = toolSettings.brushShape === "pattern";
  const activeBrush =
    patternBrushLibrary && activePatternBrushId
      ? getPatternBrush(patternBrushLibrary, activePatternBrushId)
      : null;

  const togglePicker = () => {
    if (patternBrushPickerOpen) {
      closePatternBrushPicker();
    } else {
      openPatternBrushPicker();
    }
  };

  return (
    <>
      <label className="flex items-center gap-2 text-zinc-400">
        形状
        <span className="flex gap-1">
          {BRUSH_SHAPES.map((item) => (
            <SegmentedButton
              key={item.shape}
              active={toolSettings.brushShape === item.shape}
              title={item.label}
              onClick={() => setToolSettings({ brushShape: item.shape })}
            >
              {getBrushShapeIcon(item.shape)}
            </SegmentedButton>
          ))}
        </span>
      </label>
      {isPattern ? (
        <>
          <label className="flex items-center gap-2 text-zinc-400">
            缩放
            <PatternBrushScaleSlider
              value={toolSettings.patternBrushScale}
              onChange={(patternBrushScale) => setToolSettings({ patternBrushScale })}
            />
          </label>
          <button
            ref={pickerAnchorRef}
            type="button"
            title="打开图案笔刷库"
            onClick={togglePicker}
            className={`rounded border px-2 py-1 text-zinc-300 transition hover:bg-zinc-800 ${
              patternBrushPickerOpen ? "border-blue-500 bg-zinc-800" : "border-zinc-600"
            }`}
          >
            图案库
          </button>
          {activeBrush && (
            <span className="text-zinc-500">
              {activeBrush.width}×{activeBrush.height}
            </span>
          )}
          <PatternBrushPickerPopover
            open={patternBrushPickerOpen}
            anchorRef={pickerAnchorRef}
            onClose={closePatternBrushPicker}
          />
        </>
      ) : (
        <>
          <label className="flex items-center gap-2 text-zinc-400">
            尺寸
            <BrushSizeInput
              value={toolSettings.brushSize}
              onChange={(brushSize) => setToolSettings({ brushSize })}
            />
          </label>
          <label className="flex items-center gap-2 text-zinc-400">
            <input
              type="checkbox"
              checked={toolSettings.brushPerfectPixel}
              disabled={toolSettings.brushSize !== 1}
              onChange={(e) => setToolSettings({ brushPerfectPixel: e.target.checked })}
            />
            完美像素
          </label>
          <span className="text-zinc-500">Shift 直线连线</span>
        </>
      )}
    </>
  );
}

export function ToolPropertiesBar() {
  const project = useAppStore((s) => s.project);
  const activeTool = useAppStore((s) => s.activeTool);
  const toolSettings = useAppStore((s) => s.toolSettings);
  const setToolSettings = useAppStore((s) => s.setToolSettings);
  const symmetry = useAppStore((s) => s.symmetry);
  const toggleSymmetryHorizontal = useAppStore((s) => s.toggleSymmetryHorizontal);
  const toggleSymmetryVertical = useAppStore((s) => s.toggleSymmetryVertical);
  const resetSymmetryToCenter = useAppStore((s) => s.resetSymmetryToCenter);
  const tileSession = useAppStore((s) => s.tileSession);
  const beginTileRegionCreate = useAppStore((s) => s.beginTileRegionCreate);
  const closeTileSession = useAppStore((s) => s.closeTileSession);
  const autoLayoutBoardCanvases = useAppStore((s) => s.autoLayoutBoardCanvases);

  if (!project) return null;

  return (
    <div className="flex shrink-0 items-center gap-6 border-b border-zinc-700 bg-zinc-900 px-4 py-2 text-xs">
      <span className="font-medium text-zinc-200">{TOOL_LABELS[activeTool]}</span>

      {activeTool === "brush" && <BrushToolProperties />}

      {activeTool === "eraser" && (
        <StampToolProperties
          size={toolSettings.eraserSize}
          shape={toolSettings.eraserShape}
          shapes={ERASER_SHAPES}
          onSizeChange={(eraserSize) => setToolSettings({ eraserSize })}
          onShapeChange={(eraserShape) => setToolSettings({ eraserShape })}
        />
      )}

      {activeTool === "shape" && (
        <>
          <label className="flex items-center gap-2 text-zinc-400">
            类型
            <span className="flex gap-1">
              {SHAPES.map((item) => (
                <SegmentedButton
                  key={item.mode}
                  active={toolSettings.shapeMode === item.mode}
                  title={item.label}
                  onClick={() => setToolSettings({ shapeMode: item.mode })}
                >
                  {getShapeIcon(item.mode)}
                </SegmentedButton>
              ))}
            </span>
          </label>
          <label className="flex items-center gap-2 text-zinc-400">
            <input
              type="checkbox"
              checked={toolSettings.shapeFilled}
              onChange={(e) => setToolSettings({ shapeFilled: e.target.checked })}
            />
            填充
          </label>
          <span className="text-zinc-500">Alt 拖拽从中心绘制</span>
        </>
      )}

      {activeTool === "fill" && (
        <>
          <label className="flex items-center gap-2 text-zinc-400">
            容差
            <input
              type="range"
              min={0}
              max={255}
              value={toolSettings.fillTolerance}
              onChange={(e) => setToolSettings({ fillTolerance: Number(e.target.value) })}
              className="w-24"
            />
            <span className="w-6">{toolSettings.fillTolerance}</span>
          </label>
          <label className="flex items-center gap-2 text-zinc-400">
            <input
              type="checkbox"
              checked={toolSettings.fillContiguous}
              onChange={(e) => setToolSettings({ fillContiguous: e.target.checked })}
            />
            连续区域
          </label>
          <span className="text-zinc-500">点击区域进行填充 · 透明区域视为同色</span>
        </>
      )}

      {activeTool === "select" && (
        <>
          <label className="flex items-center gap-2 text-zinc-400">
            模式
            <span className="flex gap-1">
              {SELECTION_MODES.map((item) => {
                const shortcut = SELECTION_MODE_SHORTCUTS[item.mode];
                return (
                <SegmentedButton
                  key={item.mode}
                  active={toolSettings.selectionMode === item.mode}
                  title={shortcut ? `${item.label} (${shortcut})` : item.label}
                  onClick={() => setToolSettings({ selectionMode: item.mode })}
                >
                  {getSelectionModeIcon(item.mode)}
                </SegmentedButton>
                );
              })}
            </span>
          </label>
          {toolSettings.selectionMode === "magicWand" && (
            <>
              <label className="flex items-center gap-2 text-zinc-400">
                容差
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={toolSettings.magicWandTolerance}
                  onChange={(e) =>
                    setToolSettings({ magicWandTolerance: Number(e.target.value) })
                  }
                  className="w-24"
                />
                <span className="w-6">{toolSettings.magicWandTolerance}</span>
              </label>
              <label className="flex items-center gap-2 text-zinc-400">
                <input
                  type="checkbox"
                  checked={toolSettings.magicWandContiguous}
                  onChange={(e) =>
                    setToolSettings({ magicWandContiguous: e.target.checked })
                  }
                />
                连续区域
              </label>
            </>
          )}
          <span className="text-zinc-500">
            Shift 加选 · Alt+Shift 减选 · Ctrl+Shift 交集
          </span>
        </>
      )}

      {activeTool === "repeatTile" && tileSession.phase === "idle" && (
        <button
          type="button"
          onClick={beginTileRegionCreate}
          className="rounded bg-blue-600 px-3 py-1 text-white transition hover:bg-blue-500"
        >
          创建区域
        </button>
      )}

      {activeTool === "repeatTile" && tileSession.phase === "creating" && (
        <span className="text-zinc-500">拖拽画布创建 tile 区域 · Esc 取消</span>
      )}

      {activeTool === "canvasResize" && (
        <>
          <span className="tabular-nums text-zinc-300">
            {formatPixelDimensions(getActiveCanvas(project).width, getActiveCanvas(project).height)}
          </span>
          <label className="flex items-center gap-2 text-zinc-400">
            步长
            <input
              type="number"
              min={MIN_CANVAS_RESIZE_STEP}
              max={MAX_CANVAS_RESIZE_STEP}
              value={toolSettings.canvasResizeStep}
              onChange={(e) => {
                const parsed = Number(e.target.value);
                if (Number.isFinite(parsed)) {
                  setToolSettings({ canvasResizeStep: clampCanvasResizeStep(parsed) });
                }
              }}
              className="h-7 w-14 rounded border border-zinc-600 bg-zinc-800 px-1.5 text-center text-zinc-200 outline-none focus:border-blue-500"
            />
          </label>
          <label className="flex items-center gap-2 text-zinc-400">
            <input
              type="checkbox"
              checked={toolSettings.canvasResizeFixedStep}
              onChange={(e) =>
                setToolSettings({ canvasResizeFixedStep: e.target.checked })
              }
            />
            保持固定
          </label>
          {project.board.canvases.length > 1 && (
            <button
              type="button"
              onClick={autoLayoutBoardCanvases}
              className="rounded bg-blue-600 px-3 py-1 text-white transition hover:bg-blue-500"
            >
              自动排布
            </button>
          )}
          <CanvasBoardSizePresetMenu />
          <span className="text-zinc-500">
            拖拽画板移动 · 拖拽边缘调整尺寸 · 点击标签切换画板
          </span>
        </>
      )}

      {tileSession.phase === "drawing" && (
        <>
          <button
            type="button"
            onClick={closeTileSession}
            className="rounded bg-zinc-700 px-3 py-1 text-zinc-200 transition hover:bg-zinc-600"
          >
            关闭区域
          </button>
          <span className="text-zinc-500">
            Tile {tileSession.region.width}×{tileSession.region.height} · 9 区同步绘制 · 可切换工具
          </span>
        </>
      )}

      <div className="ml-auto flex items-center gap-3 border-l border-zinc-700 pl-4">
        <label className="flex items-center gap-2 text-zinc-400">
          对称
          <span className="flex gap-1">
            <SegmentedButton
              active={symmetry.horizontal}
              title="水平对称（左右镜像）"
              onClick={toggleSymmetryHorizontal}
            >
              <SymmetryHorizontalIcon className="h-4 w-4" />
            </SegmentedButton>
            <SegmentedButton
              active={symmetry.vertical}
              title="垂直对称（上下镜像）"
              onClick={toggleSymmetryVertical}
            >
              <SymmetryVerticalIcon className="h-4 w-4" />
            </SegmentedButton>
          </span>
        </label>
        <button
          type="button"
          title="重置对称轴到画布中心"
          onClick={resetSymmetryToCenter}
          className="rounded px-2 py-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
        >
          重置轴
        </button>
      </div>
    </div>
  );
}
