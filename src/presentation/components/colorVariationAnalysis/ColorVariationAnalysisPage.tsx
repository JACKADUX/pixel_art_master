import { useEffect } from "react";
import { useColorVariationAnalysisStore } from "../../stores/colorVariationAnalysisStore";
import { ColorVariationListPanel } from "./ColorVariationListPanel";
import { ColorVariationChart } from "./ColorVariationChart";

export function ColorVariationAnalysisPage() {
  const openPage = useColorVariationAnalysisStore((s) => s.open);
  const series = useColorVariationAnalysisStore((s) => s.series);
  const closePage = useColorVariationAnalysisStore((s) => s.closePage);
  const importFromHexFile = useColorVariationAnalysisStore((s) => s.importFromHexFile);
  const loadFromCurrentPalette = useColorVariationAnalysisStore((s) => s.loadFromCurrentPalette);

  useEffect(() => {
    if (!openPage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closePage, openPage]);

  if (!openPage) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-zinc-100">
      <header className="flex shrink-0 items-center gap-3 border-b border-zinc-700 bg-zinc-900 px-4 py-2.5">
        <button
          type="button"
          onClick={closePage}
          className="rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        >
          ← 返回编辑器
        </button>
        <h1 className="text-sm font-medium text-zinc-200">颜色变化分析</h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => void importFromHexFile()}
            className="rounded bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
          >
            导入 .hex
          </button>
          <button
            type="button"
            onClick={loadFromCurrentPalette}
            className="rounded bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
          >
            从色板加载
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[24rem_minmax(0,1fr)] overflow-hidden">
        <aside className="flex min-h-0 flex-col border-r border-zinc-800 bg-zinc-900/40">
          <ColorVariationListPanel />
        </aside>
        <main className="flex min-h-0 flex-col overflow-hidden">
          <ColorVariationChart points={series?.points ?? []} />
        </main>
      </div>
    </div>
  );
}
