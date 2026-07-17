import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckIcon, ChevronRightIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import type { MenuItem } from "./MenuDropdown";
import {
  buildPalettePanelMenuItems,
  type PalettePanelMenuActions,
  type PalettePanelMenuPreset,
} from "../config/palettePanelMenu";
import { listPalettePresets } from "@/domain/palette/PalettePresetLibrary";
import { listLuminancePalettePresets } from "@/domain/luminancePalette/LuminancePalettePresetLibrary";
import { useAppStore } from "../stores/appStore";

interface PaletteMoreMenuProps {
  colorsCount: number;
  removeMode: boolean;
  onEnterRemoveMode: () => void;
  onRequestClearPalette: () => void;
}

export function PaletteMoreMenu({
  colorsCount,
  removeMode,
  onEnterRemoveMode,
  onRequestClearPalette,
}: PaletteMoreMenuProps) {
  const paletteViewMode = useAppStore((s) => s.paletteViewMode);
  const setPaletteViewMode = useAppStore((s) => s.setPaletteViewMode);
  const palettePresetLibrary = useAppStore((s) => s.palettePresetLibrary);
  const luminancePalettePresetLibrary = useAppStore((s) => s.luminancePalettePresetLibrary);
  const luminancePalettePanelVisible = useAppStore((s) => s.luminancePalettePanel.visible);
  const saveCurrentPaletteAsPreset = useAppStore((s) => s.saveCurrentPaletteAsPreset);
  const importPresetToPalette = useAppStore((s) => s.importPresetToPalette);
  const openPalettePresetManager = useAppStore((s) => s.openPalettePresetManager);
  const toggleLuminancePalettePanel = useAppStore((s) => s.toggleLuminancePalettePanel);
  const saveCurrentLuminancePaletteAsPreset = useAppStore(
    (s) => s.saveCurrentLuminancePaletteAsPreset,
  );
  const importLuminancePalettePresetToProject = useAppStore(
    (s) => s.importLuminancePalettePresetToProject,
  );
  const openLuminancePalettePresetManager = useAppStore(
    (s) => s.openLuminancePalettePresetManager,
  );

  const [open, setOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    setOpen(false);
    setOpenSubmenu(null);
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 2,
      right: Math.max(4, window.innerWidth - rect.right),
    });
  }, []);

  const presets = useMemo<PalettePanelMenuPreset[]>(
    () => listPalettePresets(palettePresetLibrary).map((p) => ({ id: p.id, name: p.name })),
    [palettePresetLibrary],
  );

  const luminancePalettePresets = useMemo<PalettePanelMenuPreset[]>(
    () =>
      listLuminancePalettePresets(luminancePalettePresetLibrary).map((p) => ({
        id: p.id,
        name: p.name,
      })),
    [luminancePalettePresetLibrary],
  );

  const actions = useMemo<PalettePanelMenuActions>(
    () => ({
      setPaletteViewMode,
      enterRemoveMode: onEnterRemoveMode,
      requestClearPalette: onRequestClearPalette,
      saveAsPreset: () => saveCurrentPaletteAsPreset(),
      importPresetMerge: (id: string) => importPresetToPalette(id, "merge"),
      openPresetManager: openPalettePresetManager,
      toggleLuminancePalettePanel,
      saveLuminancePaletteAsPreset: () => void saveCurrentLuminancePaletteAsPreset(),
      importLuminancePalettePreset: importLuminancePalettePresetToProject,
      openLuminancePalettePresetManager,
    }),
    [
      setPaletteViewMode,
      onEnterRemoveMode,
      onRequestClearPalette,
      saveCurrentPaletteAsPreset,
      importPresetToPalette,
      openPalettePresetManager,
      toggleLuminancePalettePanel,
      saveCurrentLuminancePaletteAsPreset,
      importLuminancePalettePresetToProject,
      openLuminancePalettePresetManager,
    ],
  );

  const items = useMemo(
    () =>
      buildPalettePanelMenuItems(
        {
          paletteViewMode,
          colorsCount,
          removeMode,
          presets,
          luminancePalettePresets,
          luminancePalettePanelVisible,
        },
        actions,
      ),
    [
      paletteViewMode,
      colorsCount,
      removeMode,
      presets,
      luminancePalettePresets,
      luminancePalettePanelVisible,
      actions,
    ],
  );

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      closeMenu();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, closeMenu, updatePosition]);

  if (items.length === 0) return null;

  const handleItemClick = (onClick: () => void) => {
    onClick();
    closeMenu();
  };

  const renderMenuItem = (item: MenuItem, index: number) => {
    if (item.type === "separator") {
      return <div key={`sep-${index}`} className="my-1 border-t border-zinc-700" />;
    }

    if (item.type === "toggle") {
      return (
        <button
          key={item.label}
          type="button"
          role="menuitemcheckbox"
          aria-checked={item.checked}
          onClick={() => handleItemClick(item.onClick)}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
        >
          <span className="flex h-4 w-4 shrink-0 items-center justify-center">
            {item.checked && <CheckIcon className="h-3.5 w-3.5" />}
          </span>
          <span className="flex-1">{item.label}</span>
        </button>
      );
    }

    if (item.type === "submenu") {
      const Icon = item.icon;
      const isSubOpen = openSubmenu === item.label;

      return (
        <div
          key={item.label}
          className="relative"
          onMouseEnter={() => setOpenSubmenu(item.label)}
          onMouseLeave={() => setOpenSubmenu(null)}
        >
          <button
            type="button"
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={isSubOpen}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition ${
              isSubOpen
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            }`}
          >
            {Icon ? (
              <Icon className="h-4 w-4 shrink-0 text-zinc-400" />
            ) : (
              <span className="w-4 shrink-0" />
            )}
            <span className="flex-1">{item.label}</span>
            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
          </button>

          {isSubOpen && (
            <div
              role="menu"
              className="absolute right-full top-0 z-50 mr-0.5 min-w-[140px] rounded border border-zinc-600 bg-zinc-900 py-1 shadow-xl"
            >
              {item.items.map((subItem) => (
                <button
                  key={subItem.label}
                  type="button"
                  role="menuitem"
                  disabled={subItem.disabled}
                  onClick={() => handleItemClick(subItem.onClick)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="flex-1">{subItem.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    const Icon = item.icon;
    return (
      <button
        key={item.label}
        type="button"
        role="menuitem"
        disabled={item.disabled}
        onClick={() => handleItemClick(item.onClick)}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {Icon ? (
          <Icon className="h-4 w-4 shrink-0 text-zinc-400" />
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <span className="flex-1">{item.label}</span>
      </button>
    );
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        title="更多操作"
        aria-label="更多操作"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center justify-center rounded border p-0.5 transition ${
          open
            ? "border-zinc-500 bg-zinc-800 text-zinc-100"
            : "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800"
        }`}
      >
        <EllipsisVerticalIcon className="h-4 w-4" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[60] min-w-[160px] rounded border border-zinc-600 bg-zinc-900 py-1 shadow-xl"
            style={{ top: position.top, right: position.right }}
          >
            {items.map(renderMenuItem)}
          </div>,
          document.body,
        )}
    </>
  );
}
