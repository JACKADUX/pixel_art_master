import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

export interface PortalSelectOption {
  value: string;
  label: string;
}

interface PortalSelectProps {
  value: string;
  options: PortalSelectOption[];
  onChange: (value: string) => void;
  className?: string;
  menuClassName?: string;
  zIndex?: number;
  disabled?: boolean;
  placeholder?: string;
}

export function PortalSelect({
  value,
  options,
  onChange,
  className = "",
  menuClassName = "",
  zIndex = 260,
  disabled = false,
  placeholder,
}: PortalSelectProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => option.value === value);
  const displayLabel = selected?.label ?? placeholder ?? "请选择";

  const closeMenu = useCallback(() => setOpen(false), []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 2,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
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
  }, [closeMenu, open, updatePosition]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || options.length === 0}
        onClick={() => setOpen((current) => !current)}
        className={`flex items-center justify-between gap-1.5 rounded border border-zinc-700 bg-zinc-800 px-2 text-[11px] text-zinc-100 outline-none transition hover:border-zinc-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDownIcon className="h-3 w-3 shrink-0 text-zinc-400" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={`fixed max-h-48 overflow-y-auto rounded border border-zinc-600 bg-zinc-900 py-1 shadow-xl ${menuClassName}`}
            style={{
              top: position.top,
              left: position.left,
              width: Math.max(position.width, 160),
              zIndex,
            }}
          >
            {options.map((option) => {
              const isActive = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    closeMenu();
                  }}
                  className={`block w-full truncate px-2.5 py-1.5 text-left text-[11px] transition ${
                    isActive
                      ? "bg-blue-600/20 text-blue-300"
                      : "text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
