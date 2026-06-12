import { useEffect, useRef } from "react";
import { loadProject } from "@/application/use-cases/LoadProject";
import { getCompositeGrid } from "@/domain/project/Project";
import type { ProjectSummary } from "@/domain/project/ProjectSummary";
import { renderPixelGrid1x } from "@/infrastructure/canvas/PixelGridCanvasRenderer";
import { projectRepository } from "@/infrastructure/storage/JsonProjectRepository";

interface ProjectCardProps {
  summary: ProjectSummary;
  onOpen: (filePath: string) => void;
  onDelete: (summary: ProjectSummary) => void;
}

function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "未知时间";
  }
  return date.toLocaleString();
}

export function ProjectCard({ summary, onOpen, onDelete }: ProjectCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadThumbnail() {
      try {
        const project = await loadProject(projectRepository, summary.filePath);
        if (cancelled) return;

        const composite = getCompositeGrid(project);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.imageSmoothingEnabled = false;
        const offscreen = document.createElement("canvas");
        offscreen.width = composite.width;
        offscreen.height = composite.height;
        const offCtx = offscreen.getContext("2d");
        if (!offCtx) return;

        renderPixelGrid1x(offCtx, composite);
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = "#27272a";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(offscreen, 0, 0, size, size);
      } catch {
        // keep placeholder background
      }
    }

    void loadThumbnail();
    return () => {
      cancelled = true;
    };
  }, [summary.filePath]);

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800/50">
      <button
        type="button"
        onClick={() => onOpen(summary.filePath)}
        className="group flex flex-col text-left"
      >
        <div className="flex aspect-square items-center justify-center bg-zinc-900 p-2">
          <canvas
            ref={canvasRef}
            className="max-h-full max-w-full"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
        <div className="border-t border-zinc-700 p-2">
          <p className="truncate text-xs font-medium text-zinc-200 group-hover:text-white">
            {summary.name}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-500">
            {summary.width}×{summary.height}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-500">{formatUpdatedAt(summary.updatedAt)}</p>
        </div>
      </button>
      <div className="flex gap-1 border-t border-zinc-700 p-2">
        <button
          type="button"
          onClick={() => onOpen(summary.filePath)}
          className="flex-1 rounded bg-blue-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-blue-700"
        >
          打开
        </button>
        <button
          type="button"
          onClick={() => onDelete(summary)}
          className="rounded px-2 py-1 text-[10px] font-medium text-red-400 hover:bg-zinc-700"
        >
          删除
        </button>
      </div>
    </div>
  );
}
