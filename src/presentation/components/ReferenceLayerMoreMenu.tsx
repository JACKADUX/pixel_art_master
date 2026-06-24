import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import type { MenuItem } from "./MenuDropdown";
import {
  buildReferenceLayerPanelMenuItems,
  type ReferenceLayerPanelMenuActions,
} from "../config/referenceLayerPanelMenu";
import { useAppStore } from "../stores/appStore";

export function ReferenceLayerMoreMenu() {
  const importReferenceLayerFromClipboardAction = useAppStore(
    (s) => s.importReferenceLayerFromClipboardAction,
  );

  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    setOpen(false);
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

  const actions = useMemo<ReferenceLayerPanelMenuActions>(
    () => ({
      importFromClipboard: () => void importReferenceLayerFromClipboardAction(),
    }),
    [importReferenceLayerFromClipboardAction],
  );

  const items = useMemo(
    () => buildReferenceLayerPanelMenuItems(actions),
    [actions],
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

  const handleItemClick = (onClick: () => void) => {
    onClick();
    closeMenu();
  };

  const renderMenuItem = (item: MenuItem, index: number) => {
    if (item.type === "separator") {
      return <div key={`sep-${index}`} className="my-1 border-t border-zinc-700" />;
    }

    if (item.type === "toggle" || item.type === "submenu") {
      return null;
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
        {item.shortcut && (
          <span className="shrink-0 text-[10px] text-zinc-500">{item.shortcut}</span>
        )}
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
            data-reference-layer-menu
            data-workspace-region="layers"
            className="fixed z-[60] min-w-[180px] rounded border border-zinc-600 bg-zinc-900 py-1 shadow-xl"
            style={{ top: position.top, right: position.right }}
          >
            {items.map(renderMenuItem)}
          </div>,
          document.body,
        )}
    </>
  );
}
