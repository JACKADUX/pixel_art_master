import type { ComfyRunProgress } from "@/domain/comfyui/ComfyProgress";

const STATUS_LABELS: Record<ComfyRunProgress["status"], string> = {
  idle: "空闲",
  queued: "排队中…",
  running: "执行中",
  completed: "已完成",
  error: "出错",
};

const STATUS_COLORS: Record<ComfyRunProgress["status"], string> = {
  idle: "bg-zinc-700",
  queued: "bg-amber-500",
  running: "bg-blue-500",
  completed: "bg-emerald-500",
  error: "bg-red-500",
};

export function ComfyProgressBar({ progress }: { progress: ComfyRunProgress }) {
  if (progress.status === "idle") return null;

  const indeterminate = progress.status === "queued" || (progress.status === "running" && progress.max === 0);
  const width = progress.status === "completed" ? 100 : progress.percent;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-zinc-400">
        <span>
          {STATUS_LABELS[progress.status]}
          {progress.currentNode ? ` · 节点 #${progress.currentNode}` : ""}
        </span>
        <span>
          {progress.status === "running" && progress.max > 0
            ? `${progress.value}/${progress.max} (${progress.percent}%)`
            : ""}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded bg-zinc-800">
        <div
          className={`h-full rounded transition-all ${STATUS_COLORS[progress.status]} ${
            indeterminate ? "animate-pulse w-1/3" : ""
          }`}
          style={indeterminate ? undefined : { width: `${width}%` }}
        />
      </div>
    </div>
  );
}
