import { formatCanvasSizeLabel } from "@/domain/canvas/CanvasSizePreset";
import { useAppStore } from "../stores/appStore";

interface BlankProjectCardProps {
  onCreate: () => void;
}

export function BlankProjectCard({ onCreate }: BlankProjectCardProps) {
  const defaultCanvasWidth = useAppStore((s) => s.appSettings.defaultCanvasWidth);
  const defaultCanvasHeight = useAppStore((s) => s.appSettings.defaultCanvasHeight);
  const defaultSizeLabel = formatCanvasSizeLabel(defaultCanvasWidth, defaultCanvasHeight);

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-dashed border-zinc-600 bg-zinc-800/30">
      <button
        type="button"
        onClick={onCreate}
        className="group flex flex-1 flex-col text-left"
      >
        <div className="flex aspect-square items-center justify-center bg-zinc-900 p-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-600 text-2xl text-zinc-500 group-hover:border-zinc-400 group-hover:text-zinc-300">
            +
          </span>
        </div>
        <div className="border-t border-zinc-700 p-2">
          <p className="truncate text-xs font-medium text-zinc-200 group-hover:text-white">
            空白项目
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-500">{defaultSizeLabel} · 新建画布</p>
        </div>
      </button>
      <div className="border-t border-zinc-700 p-2">
        <button
          type="button"
          onClick={onCreate}
          className="w-full rounded bg-blue-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-blue-700"
        >
          创建
        </button>
      </div>
    </div>
  );
}
