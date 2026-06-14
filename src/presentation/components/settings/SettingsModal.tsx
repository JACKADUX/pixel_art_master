import { useState } from "react";
import { useAppStore } from "../../stores/appStore";
import {
  SETTINGS_SECTIONS,
  type SettingsSectionId,
} from "./settingsSections";

export function SettingsModal() {
  const open = useAppStore((s) => s.settingsModalOpen);
  const closeSettingsModal = useAppStore((s) => s.closeSettingsModal);

  const [activeSectionId, setActiveSectionId] = useState<SettingsSectionId>("general");

  if (!open) return null;

  const activeSection =
    SETTINGS_SECTIONS.find((section) => section.id === activeSectionId) ??
    SETTINGS_SECTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="flex h-[70vh] w-[90vw] max-w-3xl flex-col overflow-hidden rounded-lg border border-zinc-600 bg-zinc-900 shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-700 px-4 py-3">
          <h2 className="text-sm font-medium text-zinc-200">设置</h2>
          <button
            type="button"
            onClick={closeSettingsModal}
            className="rounded p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/60"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <nav className="flex w-40 shrink-0 flex-col border-r border-zinc-800 py-3">
            {SETTINGS_SECTIONS.map((section) => {
              const isActive = section.id === activeSectionId;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSectionId(section.id)}
                  className={`mx-2 rounded-md px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/60 ${
                    isActive
                      ? "border-l-2 border-blue-500 bg-zinc-800 pl-[10px] text-zinc-100 ring-1 ring-zinc-600/50"
                      : "border-l-2 border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  }`}
                >
                  <span className="text-xs font-medium">{section.label}</span>
                  <span className="mt-0.5 block text-[10px] leading-snug text-zinc-500">
                    {section.description}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="mx-auto max-w-2xl">
              <header className="mb-5">
                <h2 className="text-sm font-medium text-zinc-100">{activeSection.label}</h2>
                <p className="mt-1 text-xs text-zinc-500">{activeSection.description}</p>
              </header>
              <activeSection.component />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
