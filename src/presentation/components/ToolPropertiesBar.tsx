import type { ReactNode } from "react";
import type { BrushShape, ShapeMode, ToolType } from "@/domain/tool/ToolType";
import { getBrushShapeIcon, getShapeIcon } from "../icons/ToolIcons";
import { useAppStore } from "../stores/appStore";
import { BrushSizeInput } from "./BrushSizeInput";

const TOOL_LABELS: Record<ToolType, string> = {
  brush: "画笔",
  fill: "填充",
  eraser: "橡皮",
  shape: "形状",
};

const SHAPES: { mode: ShapeMode; label: string }[] = [
  { mode: "rectangle", label: "矩形" },
  { mode: "line", label: "直线" },
  { mode: "ellipse", label: "椭圆" },
];

const BRUSH_SHAPES: { shape: BrushShape; label: string }[] = [
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
  onSizeChange,
  onShapeChange,
}: {
  size: number;
  shape: BrushShape;
  onSizeChange: (size: number) => void;
  onShapeChange: (shape: BrushShape) => void;
}) {
  return (
    <>
      <label className="flex items-center gap-2 text-zinc-400">
        形状
        <span className="flex gap-1">
          {BRUSH_SHAPES.map((item) => (
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

export function ToolPropertiesBar() {
  const project = useAppStore((s) => s.project);
  const activeTool = useAppStore((s) => s.activeTool);
  const toolSettings = useAppStore((s) => s.toolSettings);
  const setToolSettings = useAppStore((s) => s.setToolSettings);

  if (!project) return null;

  return (
    <div className="flex shrink-0 items-center gap-6 border-b border-zinc-700 bg-zinc-900 px-4 py-2 text-xs">
      <span className="font-medium text-zinc-200">{TOOL_LABELS[activeTool]}</span>

      {activeTool === "brush" && (
        <StampToolProperties
          size={toolSettings.brushSize}
          shape={toolSettings.brushShape}
          onSizeChange={(brushSize) => setToolSettings({ brushSize })}
          onShapeChange={(brushShape) => setToolSettings({ brushShape })}
        />
      )}

      {activeTool === "eraser" && (
        <StampToolProperties
          size={toolSettings.eraserSize}
          shape={toolSettings.eraserShape}
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
        </>
      )}

      {activeTool === "fill" && (
        <span className="text-zinc-500">点击区域进行填充</span>
      )}
    </div>
  );
}
