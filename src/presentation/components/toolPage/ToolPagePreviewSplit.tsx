import { useRef, type ReactNode } from "react";
import { usePreviewSplitDirection } from "../../hooks/usePreviewSplitDirection";

interface ToolPagePreviewSplitProps {
  source: ReactNode;
  result: ReactNode;
}

export function ToolPagePreviewSplit({ source, result }: ToolPagePreviewSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const direction = usePreviewSplitDirection(containerRef);

  const splitClass =
    direction === "horizontal"
      ? "grid-cols-2 divide-x divide-zinc-800"
      : "grid-rows-2 divide-y divide-zinc-800";

  return (
    <div
      ref={containerRef}
      className={`grid min-h-0 min-w-0 ${splitClass} border-r border-zinc-800`}
    >
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">{source}</div>
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">{result}</div>
    </div>
  );
}
