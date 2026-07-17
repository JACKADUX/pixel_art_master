import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import {
  buildLuminancePalettePanelMenuEntries,
  type LuminancePalettePanelMenuEntry,
} from "@/presentation/config/luminancePalettePanelMenu";

interface LuminancePaletteMoreMenuProps {
  editMode: boolean;
  onToggleEditMode: () => void;
  onClosePanel: () => void;
}

export function LuminancePaletteMoreMenu({
  editMode,
  onToggleEditMode,
  onClosePanel,
}: LuminancePaletteMoreMenuProps) {
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

  const menuEntries = useMemo(
    () =>
      buildLuminancePalettePanelMenuEntries(
        { editMode },
        {
          toggleEditMode: onToggleEditMode,
          closePanel: onClosePanel,
        },
      ),
    [editMode, onToggleEditMode, onClosePanel],
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

  const renderMenuEntry = (item: LuminancePalettePanelMenuEntry) => {
    if (item.type === "separator") {
      return <div key={item.id} className="my-1 border-t border-zinc-700" />;
    }

    if (item.type === "toggle") {
      return (
        <button
          key={item.id}
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

    const Icon = item.icon;
    return (
      <button
        key={item.id}
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
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        onMouseDown={(event) => event.stopPropagation()}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded p-0.5 transition ${
          open
            ? "bg-zinc-700 text-zinc-100"
            : "text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
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
            {menuEntries.map(renderMenuEntry)}

            <div className="my-1 border-t border-zinc-700" />

            <button
              type="button"
              role="menuitem"
              onClick={() => handleItemClick(onClosePanel)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
            >
              <span className="w-4 shrink-0" />
              <span className="flex-1">关闭浮窗</span>
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
