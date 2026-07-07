import { useEffect } from "react";
import { SHORTCUT_REFERENCE_SECTIONS } from "@/domain/help/ShortcutReference";
import { useBackdropDismiss } from "@/presentation/hooks/useBackdropDismiss";
import { useAppStore } from "@/presentation/stores/appStore";

export function ShortcutReferenceModal() {
  const open = useAppStore((s) => s.shortcutReferenceModalOpen);
  const closeShortcutReferenceModal = useAppStore((s) => s.closeShortcutReferenceModal);
  const backdropProps = useBackdropDismiss<HTMLDivElement>(closeShortcutReferenceModal);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeShortcutReferenceModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, closeShortcutReferenceModal]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
      {...backdropProps}
    >
      <div className="flex max-h-[80vh] w-[520px] flex-col rounded-lg border border-zinc-600 bg-zinc-900 shadow-xl">
        <div className="border-b border-zinc-700 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-100">快捷键参考</h2>
          <p className="mt-1 text-xs text-zinc-500">主编辑器全局快捷键，按分组列出。</p>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {SHORTCUT_REFERENCE_SECTIONS.map((section) => (
            <section key={section.title} className="mb-5 last:mb-0">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.entries.map((entry) => (
                  <div
                    key={`${section.title}-${entry.shortcut}-${entry.description}`}
                    className="grid grid-cols-[9rem_1fr] gap-3 rounded px-2 py-1.5 hover:bg-zinc-800/50"
                  >
                    <span className="font-mono text-xs text-zinc-300">{entry.shortcut}</span>
                    <span className="text-xs text-zinc-400">{entry.description}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="flex justify-end border-t border-zinc-700 px-5 py-3">
          <button
            type="button"
            onClick={closeShortcutReferenceModal}
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
