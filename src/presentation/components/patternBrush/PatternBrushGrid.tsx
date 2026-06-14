import { listPatternBrushes, type PatternBrushLibrary } from "@/domain/patternBrush/PatternBrushLibrary";
import type { PatternBrushRecord } from "@/domain/patternBrush/PatternBrushRecord";
import { usePatternBrushImageUrl } from "@/presentation/hooks/usePatternBrushImageUrl";

interface PatternBrushGridProps {
  library: PatternBrushLibrary;
  workspacePath: string;
  activePatternBrushId: string | null;
  onSelectBrush: (id: string) => void;
  onRequestDeleteBrush: (id: string) => void;
  onRenameBrush?: (id: string, title: string) => void;
}

function PatternBrushThumbnail({
  workspacePath,
  brush,
}: {
  workspacePath: string;
  brush: PatternBrushRecord;
}) {
  const src = usePatternBrushImageUrl(workspacePath, brush.imageFile);

  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-[10px] text-zinc-600">
        ...
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={brush.title}
      draggable={false}
      className="h-full w-full object-contain"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

export function PatternBrushGrid({
  library,
  workspacePath,
  activePatternBrushId,
  onSelectBrush,
  onRequestDeleteBrush,
  onRenameBrush,
}: PatternBrushGridProps) {
  const brushes = listPatternBrushes(library);

  return (
    <div className="min-h-0 flex-1 overflow-auto p-2">
      {brushes.length === 0 ? (
        <p className="text-xs text-zinc-500">暂无图案笔刷，使用 Ctrl+B 从选区创建</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-2">
          {brushes.map((brush) => (
            <div
              key={brush.id}
              className={`group relative flex flex-col overflow-hidden rounded border ${
                activePatternBrushId === brush.id
                  ? "border-blue-500 bg-zinc-800"
                  : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
              }`}
            >
              <button
                type="button"
                title={brush.title}
                onClick={() => onSelectBrush(brush.id)}
                className="aspect-square w-full p-1"
              >
                <PatternBrushThumbnail workspacePath={workspacePath} brush={brush} />
              </button>
              <button
                type="button"
                title="删除"
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestDeleteBrush(brush.id);
                }}
                className="absolute right-0.5 top-0.5 hidden h-5 w-5 items-center justify-center rounded bg-zinc-900/90 text-xs text-zinc-300 hover:bg-red-600 hover:text-white group-hover:flex"
              >
                ×
              </button>
              <span
                className="truncate px-1 pb-1 text-[10px] text-zinc-400"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onRenameBrush?.(brush.id, brush.title);
                }}
                title="双击重命名"
              >
                {brush.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
