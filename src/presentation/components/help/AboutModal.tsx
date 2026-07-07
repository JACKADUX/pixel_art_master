import { useEffect } from "react";
import { APP_INFO } from "@/domain/help/AppInfo";
import { useBackdropDismiss } from "@/presentation/hooks/useBackdropDismiss";
import { useAppStore } from "@/presentation/stores/appStore";

export function AboutModal() {
  const open = useAppStore((s) => s.aboutModalOpen);
  const closeAboutModal = useAppStore((s) => s.closeAboutModal);
  const backdropProps = useBackdropDismiss<HTMLDivElement>(closeAboutModal);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeAboutModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, closeAboutModal]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
      {...backdropProps}
    >
      <div className="w-96 rounded-lg border border-zinc-600 bg-zinc-900 p-5 shadow-xl">
        <h2 className="text-base font-semibold text-zinc-100">
          {APP_INFO.name}
          <span className="ml-2 text-xs font-normal text-zinc-500">v{APP_INFO.version}</span>
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{APP_INFO.description}</p>

        <p className="mt-3 text-xs leading-relaxed text-zinc-500">{APP_INFO.repositoryHint}</p>

        <p className="mt-4 border-t border-zinc-700 pt-3 text-xs text-zinc-500">
          {APP_INFO.author} · {APP_INFO.copyright}
          <br />
          {APP_INFO.license} License
        </p>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={closeAboutModal}
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
