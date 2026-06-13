import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckIcon } from "@heroicons/react/24/outline";
import type { MenuItem } from "./MenuDropdown";

const MENU_MIN_WIDTH = 160;
const VIEWPORT_GAP = 8;

interface ContextMenuProps {
  position: { x: number; y: number };
  items: MenuItem[];
  onClose: () => void;
}

export function ContextMenu({ position, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [clampedPosition, setClampedPosition] = useState(position);

  const updatePosition = useCallback(() => {
    const menu = menuRef.current;
    if (!menu) {
      setClampedPosition(position);
      return;
    }

    const rect = menu.getBoundingClientRect();
    let left = position.x;
    let top = position.y;

    if (left + rect.width > window.innerWidth - VIEWPORT_GAP) {
      left = window.innerWidth - rect.width - VIEWPORT_GAP;
    }
    if (top + rect.height > window.innerHeight - VIEWPORT_GAP) {
      top = window.innerHeight - rect.height - VIEWPORT_GAP;
    }
    if (left < VIEWPORT_GAP) left = VIEWPORT_GAP;
    if (top < VIEWPORT_GAP) top = VIEWPORT_GAP;

    setClampedPosition({ x: left, y: top });
  }, [position]);

  useLayoutEffect(() => {
    updatePosition();
  }, [updatePosition]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      onClose();
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
  }, [onClose, updatePosition]);

  const handleItemClick = (onClick: () => void) => {
    onClick();
    onClose();
  };

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-[200] min-w-[160px] rounded border border-zinc-600 bg-zinc-900 py-1 shadow-xl"
      style={{
        left: clampedPosition.x,
        top: clampedPosition.y,
        minWidth: MENU_MIN_WIDTH,
      }}
    >
      {items.map((item, index) => {
        if (item.type === "separator") {
          return <div key={`sep-${index}`} className="my-1 border-t border-zinc-700" />;
        }

        if (item.type === "toggle") {
          const Icon = item.icon;
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
              {Icon && <Icon className="h-4 w-4 shrink-0 text-zinc-400" />}
              <span className="flex-1">{item.label}</span>
            </button>
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
            {item.shortcut && (
              <span className="ml-4 shrink-0 text-zinc-500">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
