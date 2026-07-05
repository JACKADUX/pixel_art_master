import { useEffect, useRef, useState } from "react";
import { loadProject } from "@/application/use-cases/LoadProject";
import { getCompositeGrid } from "@/domain/project/Project";
import type { ProjectSummary } from "@/domain/project/ProjectSummary";
import { renderPixelGrid1x } from "@/infrastructure/canvas/PixelGridCanvasRenderer";
import { projectRepository } from "@/infrastructure/storage/JsonProjectRepository";

interface ProjectCardProps {
  summary: ProjectSummary;
  onOpen: (filePath: string) => void;
  onDelete: (summary: ProjectSummary) => void;
  onRename: (filePath: string, newName: string) => Promise<void>;
}

function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "未知时间";
  }
  return date.toLocaleString();
}

export function ProjectCard({ summary, onOpen, onDelete, onRename }: ProjectCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(summary.name);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setEditName(summary.name);
    }
  }, [summary.name, isEditing]);

  useEffect(() => {
    let cancelled = false;

    async function loadThumbnail() {
      try {
        const project = await loadProject(projectRepository, summary.filePath, null);
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

  const handleStartRename = () => {
    setEditName(summary.name);
    setIsEditing(true);
  };

  const handleCancelRename = () => {
    setIsEditing(false);
    setEditName(summary.name);
  };

  const handleCommitRename = async () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === summary.name) {
      handleCancelRename();
      return;
    }

    setIsSaving(true);
    try {
      await onRename(summary.filePath, trimmed);
      setIsEditing(false);
    } catch {
      setEditName(summary.name);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

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
      </button>
      <div className="border-t border-zinc-700 p-2">
        {isEditing ? (
          <input
            type="text"
            value={editName}
            disabled={isSaving}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={() => void handleCommitRename()}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleCommitRename();
              if (e.key === "Escape") handleCancelRename();
            }}
            className="w-full rounded border border-zinc-600 bg-zinc-900 px-1 py-0.5 text-xs text-zinc-100 disabled:opacity-60"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <p
            className="truncate text-xs font-medium text-zinc-200 hover:text-white"
            title={summary.name}
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleStartRename();
            }}
          >
            {summary.name}
          </p>
        )}
        <p className="mt-0.5 text-[10px] text-zinc-500">
          {summary.width}×{summary.height}
        </p>
        <p className="mt-0.5 text-[10px] text-zinc-500">{formatUpdatedAt(summary.updatedAt)}</p>
      </div>
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
